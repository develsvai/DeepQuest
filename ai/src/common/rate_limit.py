"""Redis-backed distributed rate limiting utilities."""

from __future__ import annotations

import asyncio
import logging
import os
import threading
import time
from typing import Final

from redis import Redis
from redis.exceptions import RedisError

LOGGER = logging.getLogger(__name__)

_DEFAULT_RPS: Final[float] = 60.0
_DEFAULT_WAIT_TIMEOUT_SECONDS: Final[float] = 15.0
_DEFAULT_KEY: Final[str] = "rate_limit:gemini_global"

_client: Redis | None = None
_client_lock = threading.Lock()
_warned_disabled = False

_TOKEN_BUCKET_LUA = """
local rate = tonumber(ARGV[1])
local capacity = tonumber(ARGV[2])
local now_ms = tonumber(ARGV[3])
local requested = tonumber(ARGV[4])

local values = redis.call('HMGET', KEYS[1], 'tokens', 'ts')
local tokens = tonumber(values[1])
local ts = tonumber(values[2])

if tokens == nil then
  tokens = capacity
end

if ts == nil then
  ts = now_ms
end

local elapsed_ms = math.max(0, now_ms - ts)
local refill = (elapsed_ms / 1000.0) * rate
tokens = math.min(capacity, tokens + refill)

local allowed = 0
local retry_ms = 0

if tokens >= requested then
  tokens = tokens - requested
  allowed = 1
else
  retry_ms = math.ceil(((requested - tokens) / rate) * 1000.0)
end

redis.call('HMSET', KEYS[1], 'tokens', tokens, 'ts', now_ms)
redis.call('PEXPIRE', KEYS[1], math.ceil((capacity / rate) * 2000.0))

return {allowed, retry_ms, tokens}
"""


def _env_float(name: str, default: float) -> float:
    value = os.getenv(name)
    if value is None:
        return default
    try:
        return float(value)
    except ValueError:
        LOGGER.warning("Invalid float for %s=%r, using default=%s", name, value, default)
        return default


def _is_enabled() -> bool:
    return os.getenv("GEMINI_GLOBAL_RATE_LIMIT_ENABLED", "true").lower() not in {
        "0",
        "false",
        "no",
    }


def _get_client() -> Redis | None:
    global _client, _warned_disabled

    if not _is_enabled():
        if not _warned_disabled:
            LOGGER.info("Gemini global rate limiter disabled by env")
            _warned_disabled = True
        return None

    if _client is not None:
        return _client

    redis_uri = os.getenv("REDIS_URI")
    if not redis_uri:
        if not _warned_disabled:
            LOGGER.warning("REDIS_URI not set; skipping Gemini global rate limit")
            _warned_disabled = True
        return None

    with _client_lock:
        if _client is None:
            _client = Redis.from_url(redis_uri, decode_responses=True)
        return _client


def acquire_gemini_slot() -> None:
    """Block until a global Gemini request token is available."""

    client = _get_client()
    if client is None:
        return

    rate = _env_float("GEMINI_GLOBAL_RATE_LIMIT_RPS", _DEFAULT_RPS)
    capacity = _env_float("GEMINI_GLOBAL_RATE_LIMIT_BURST", rate)
    wait_timeout_seconds = _env_float(
        "GEMINI_GLOBAL_RATE_LIMIT_WAIT_TIMEOUT_SECONDS",
        _DEFAULT_WAIT_TIMEOUT_SECONDS,
    )
    key = os.getenv("GEMINI_GLOBAL_RATE_LIMIT_KEY", _DEFAULT_KEY)

    started = time.monotonic()

    while True:
        now_ms = int(time.time() * 1000)
        try:
            allowed, retry_ms, _tokens_left = client.eval(
                _TOKEN_BUCKET_LUA,
                1,
                key,
                rate,
                capacity,
                now_ms,
                1,
            )
        except RedisError:
            LOGGER.exception("Gemini global rate limiter Redis call failed")
            raise

        if int(allowed) == 1:
            return

        sleep_seconds = max(float(retry_ms) / 1000.0, 0.01)
        if time.monotonic() - started + sleep_seconds > wait_timeout_seconds:
            raise TimeoutError(
                "Timed out waiting for Gemini global rate limiter token"
            )
        time.sleep(sleep_seconds)


async def acquire_gemini_slot_async() -> None:
    """Async variant of the global Gemini rate limiter."""

    client = _get_client()
    if client is None:
        return

    rate = _env_float("GEMINI_GLOBAL_RATE_LIMIT_RPS", _DEFAULT_RPS)
    capacity = _env_float("GEMINI_GLOBAL_RATE_LIMIT_BURST", rate)
    wait_timeout_seconds = _env_float(
        "GEMINI_GLOBAL_RATE_LIMIT_WAIT_TIMEOUT_SECONDS",
        _DEFAULT_WAIT_TIMEOUT_SECONDS,
    )
    key = os.getenv("GEMINI_GLOBAL_RATE_LIMIT_KEY", _DEFAULT_KEY)

    started = time.monotonic()

    while True:
        now_ms = int(time.time() * 1000)
        try:
            allowed, retry_ms, _tokens_left = await asyncio.to_thread(
                client.eval,
                _TOKEN_BUCKET_LUA,
                1,
                key,
                rate,
                capacity,
                now_ms,
                1,
            )
        except RedisError:
            LOGGER.exception("Gemini global rate limiter Redis call failed")
            raise

        if int(allowed) == 1:
            return

        sleep_seconds = max(float(retry_ms) / 1000.0, 0.01)
        if time.monotonic() - started + sleep_seconds > wait_timeout_seconds:
            raise TimeoutError(
                "Timed out waiting for Gemini global rate limiter token"
            )
        await asyncio.sleep(sleep_seconds)
