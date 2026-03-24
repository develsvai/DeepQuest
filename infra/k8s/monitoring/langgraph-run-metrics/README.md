# LangGraph Run Metrics Exporter

Deep Quest 현재 AI 런타임은 `LANGGRAPH_RUNTIME_EDITION=postgres` 이므로,
실제 backlog source of truth 는 Redis key 수가 아니라 `langgraph.run` 테이블입니다.

이 exporter 는 아래 메트릭을 `/metrics` 로 노출합니다.

- `ai_job_queue_pending`
- `ai_job_queue_processing`
- `ai_worker_busy`
- `ai_job_oldest_pending_seconds`
- `ai_jobs_completed_total`
- `ai_jobs_failed_total{reason=...}`
- `ai_job_duration_seconds_bucket`

## 동작 방식

- `pending`: `run.status = 'pending'`
- `processing`: `run.status = 'running'`
- `completed`: `run.status = 'success'`
- `failed`: `pending/running/success` 외 terminal status 집계
- `duration`: `updated_at - created_at`

`ai_worker_busy` 는 1차 버전에서는 `running` run 수를 busy worker 근사치로 사용합니다.
추후 AI 로그의 `Worker stats active/available/max` 를 Loki 또는 별도 exporter 로 붙이면 더 정확한 worker 메트릭으로 확장할 수 있습니다.

## 파일 위치

- Exporter code: `infra/docker/langgraph-run-metrics-exporter/app/exporter.py`
- Exporter requirements: `infra/docker/langgraph-run-metrics-exporter/app/requirements.txt`
- Docker image: `infra/docker/langgraph-run-metrics-exporter/Dockerfile`
- K8s manifests: `infra/k8s/monitoring/langgraph-run-metrics/`

## 적용

1. 이미지를 빌드해서 Harbor 에 push
2. `deployment.yaml` 의 image tag 확인
3. 아래 실행

```bash
kubectl apply -k infra/k8s/monitoring/langgraph-run-metrics/
```

## 대시보드 예시 PromQL

```promql
ai_job_queue_pending
```

```promql
ai_job_queue_processing
```

```promql
rate(ai_jobs_completed_total[5m])
```

```promql
rate(ai_jobs_failed_total[5m])
```

```promql
histogram_quantile(0.95, sum(rate(ai_job_duration_seconds_bucket[5m])) by (le))
```
