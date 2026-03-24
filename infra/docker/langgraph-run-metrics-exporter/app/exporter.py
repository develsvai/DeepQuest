#!/usr/bin/env python3
"""Prometheus exporter for LangGraph run-queue metrics.

Reads the `langgraph.run` table and exposes queue/backlog metrics that are
more accurate for the current Deep Quest architecture than Redis key counts.
"""

from __future__ import annotations

import logging
import os
import time
from typing import Iterable

import psycopg
from prometheus_client import REGISTRY, start_http_server
from prometheus_client.core import CounterMetricFamily, GaugeMetricFamily, HistogramMetricFamily

LOGGER = logging.getLogger("langgraph_run_metrics_exporter")

DEFAULT_PORT = 9108
DEFAULT_SCRAPE_TIMEOUT = 10
TERMINAL_SUCCESS_STATUS = "success"
NON_FAILURE_STATUSES = {"pending", "running", TERMINAL_SUCCESS_STATUS}
DURATION_BUCKETS = (0.5, 1, 2, 5, 10, 30, 60, 120, 300)


def _env_int(name: str, default: int) -> int:
    value = os.getenv(name)
    if value is None:
        return default
    try:
        return int(value)
    except ValueError:
        LOGGER.warning("Invalid int for %s=%r, using default=%s", name, value, default)
        return default


def _empty_duration_histogram() -> HistogramMetricFamily:
    buckets = [(str(bucket), 0.0) for bucket in DURATION_BUCKETS]
    buckets.append(("+Inf", 0.0))
    return HistogramMetricFamily(
        "ai_job_duration_seconds",
        "Duration of terminal LangGraph runs based on updated_at - created_at.",
        buckets=buckets,
        sum_value=0.0,
    )


class LangGraphRunCollector:
    """Collect metrics from the LangGraph Postgres run table."""

    def __init__(self, dsn: str, scrape_timeout_seconds: int = DEFAULT_SCRAPE_TIMEOUT) -> None:
        self._dsn = dsn
        self._scrape_timeout_seconds = scrape_timeout_seconds

    def collect(self) -> Iterable[object]:
        pending = GaugeMetricFamily(
            "ai_job_queue_pending",
            "Number of pending LangGraph runs waiting to be processed.",
        )
        processing = GaugeMetricFamily(
            "ai_job_queue_processing",
            "Number of running LangGraph runs currently being processed.",
        )
        worker_busy = GaugeMetricFamily(
            "ai_worker_busy",
            "Approximation of busy workers based on running LangGraph runs.",
        )
        oldest_pending = GaugeMetricFamily(
            "ai_job_oldest_pending_seconds",
            "Age in seconds of the oldest pending LangGraph run.",
        )
        completed = CounterMetricFamily(
            "ai_jobs_completed_total",
            "Total completed LangGraph runs.",
        )
        failed = CounterMetricFamily(
            "ai_jobs_failed_total",
            "Total failed LangGraph runs by terminal status.",
            labels=["reason"],
        )
        duration = _empty_duration_histogram()

        try:
            with psycopg.connect(
                self._dsn,
                connect_timeout=self._scrape_timeout_seconds,
                autocommit=True,
            ) as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        SELECT
                            COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
                            COUNT(*) FILTER (WHERE status = 'running') AS running_count,
                            COUNT(*) FILTER (WHERE status = 'success') AS success_count,
                            COALESCE(
                                EXTRACT(
                                    EPOCH FROM (
                                        NOW() - MIN(created_at) FILTER (WHERE status = 'pending')
                                    )
                                ),
                                0
                            ) AS oldest_pending_seconds
                        FROM run
                        """
                    )
                    pending_count, running_count, success_count, oldest_pending_seconds = cur.fetchone()

                    pending.add_metric([], float(pending_count or 0))
                    processing.add_metric([], float(running_count or 0))
                    worker_busy.add_metric([], float(running_count or 0))
                    oldest_pending.add_metric([], float(oldest_pending_seconds or 0))
                    completed.add_metric([], float(success_count or 0))

                    cur.execute(
                        """
                        SELECT status, COUNT(*)
                        FROM run
                        WHERE status NOT IN ('pending', 'running', 'success')
                        GROUP BY status
                        ORDER BY status
                        """
                    )
                    for status, count in cur.fetchall():
                        failed.add_metric([status], float(count or 0))

                    cur.execute(
                        """
                        WITH durations AS (
                            SELECT EXTRACT(EPOCH FROM (updated_at - created_at))::double precision AS duration_seconds
                            FROM run
                            WHERE status NOT IN ('pending', 'running')
                        )
                        SELECT
                            COUNT(*)::double precision AS total_count,
                            COALESCE(SUM(duration_seconds), 0)::double precision AS total_sum,
                            COALESCE(SUM(CASE WHEN duration_seconds <= 0.5 THEN 1 ELSE 0 END), 0)::double precision AS le_0_5,
                            COALESCE(SUM(CASE WHEN duration_seconds <= 1 THEN 1 ELSE 0 END), 0)::double precision AS le_1,
                            COALESCE(SUM(CASE WHEN duration_seconds <= 2 THEN 1 ELSE 0 END), 0)::double precision AS le_2,
                            COALESCE(SUM(CASE WHEN duration_seconds <= 5 THEN 1 ELSE 0 END), 0)::double precision AS le_5,
                            COALESCE(SUM(CASE WHEN duration_seconds <= 10 THEN 1 ELSE 0 END), 0)::double precision AS le_10,
                            COALESCE(SUM(CASE WHEN duration_seconds <= 30 THEN 1 ELSE 0 END), 0)::double precision AS le_30,
                            COALESCE(SUM(CASE WHEN duration_seconds <= 60 THEN 1 ELSE 0 END), 0)::double precision AS le_60,
                            COALESCE(SUM(CASE WHEN duration_seconds <= 120 THEN 1 ELSE 0 END), 0)::double precision AS le_120,
                            COALESCE(SUM(CASE WHEN duration_seconds <= 300 THEN 1 ELSE 0 END), 0)::double precision AS le_300
                        FROM durations
                        """
                    )
                    row = cur.fetchone()
                    if row:
                        total_count = float(row[0] or 0)
                        total_sum = float(row[1] or 0)
                        bucket_counts = [float(value or 0) for value in row[2:]]
                        bucket_list = [(str(bucket), count) for bucket, count in zip(DURATION_BUCKETS, bucket_counts, strict=True)]
                        bucket_list.append(("+Inf", total_count))
                        duration = HistogramMetricFamily(
                            "ai_job_duration_seconds",
                            "Duration of terminal LangGraph runs based on updated_at - created_at.",
                            buckets=bucket_list,
                            sum_value=total_sum,
                        )
        except Exception:
            LOGGER.exception("Failed to collect metrics from LangGraph Postgres database")

        yield pending
        yield processing
        yield worker_busy
        yield oldest_pending
        yield completed
        yield failed
        yield duration


def main() -> None:
    logging.basicConfig(
        level=os.getenv("LOG_LEVEL", "INFO").upper(),
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    dsn = os.getenv("LANGGRAPH_DATABASE_URI") or os.getenv("DATABASE_URI")
    if not dsn:
        raise SystemExit("LANGGRAPH_DATABASE_URI or DATABASE_URI must be set")

    port = _env_int("METRICS_PORT", DEFAULT_PORT)
    collector = LangGraphRunCollector(
        dsn=dsn,
        scrape_timeout_seconds=_env_int("DB_CONNECT_TIMEOUT_SECONDS", DEFAULT_SCRAPE_TIMEOUT),
    )
    REGISTRY.register(collector)
    start_http_server(port)
    LOGGER.info("LangGraph run metrics exporter listening on :%s/metrics", port)

    while True:
        time.sleep(3600)


if __name__ == "__main__":
    main()
