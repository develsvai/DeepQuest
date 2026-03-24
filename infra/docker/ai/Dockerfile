# Multi-stage build for Deep Quest AI Server
FROM python:3.11-slim AS base

LABEL maintainer="deepquest"
LABEL description="LangGraph AI Server for Deep Quest"

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# 환경 모드: development 또는 production (기본값: development)
ARG ENVIRONMENT=development
ENV ENVIRONMENT=${ENVIRONMENT}

WORKDIR /app

# 시스템 의존성 설치
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    git \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install uv (fast Python package manager)
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:$PATH"

# Copy dependency files
COPY ai/pyproject.toml ai/langgraph.json ./

# Install Python dependencies
RUN uv pip install --system -r pyproject.toml || uv pip install --system .

# Copy application code
COPY ai/src ./src

# 개발 모드 파일 복사 (조건부)
COPY ai/tests ./tests
COPY ai/Makefile ./Makefile
COPY ai/README.md ./README.md

# 프로젝트 패키지 설치
RUN if [ "$ENVIRONMENT" = "development" ]; then \
        uv pip install --system -e .; \
    else \
        uv pip install --system .; \
    fi

# 사용자 생성 (항상 생성하되, 사용은 선택)
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

# Create necessary directories & permissions
RUN mkdir -p /app/data /app/logs && \
    chown -R appuser:appuser /app/data /app/logs

# Healthcheck (LangGraph 서버는 /ok 엔드포인트 사용, k8s/docker-compose와 동일)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8123/ok || exit 1

# Expose port
EXPOSE 8123

# 1단계(체크포인트1): langgraph dev 탈출 — 프로덕션에 가깝게 동작
# - --no-reload: 핫리로드 비활성화(프로덕션 권장)
# - N_JOBS_PER_WORKER는 CLI 인자로 전달(인자 없으면 env를 1로 덮어쓰므로 필수)
# 참고: 완전한 프로덕션은 langgraph build 산출 이미지 또는 Redis/Postgres 연동 시 langgraph up 방식
CMD ["sh", "-c", "exec langgraph dev --host 0.0.0.0 --port 8123 --allow-blocking --no-reload --n-jobs-per-worker ${N_JOBS_PER_WORKER:-10}"]


