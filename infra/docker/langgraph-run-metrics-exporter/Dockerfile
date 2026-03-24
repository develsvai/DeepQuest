FROM python:3.11-slim

LABEL maintainer="deepquest"
LABEL description="LangGraph run metrics exporter for Deep Quest"

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

COPY infra/docker/langgraph-run-metrics-exporter/app/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY infra/docker/langgraph-run-metrics-exporter/app/exporter.py ./exporter.py

EXPOSE 9108

CMD ["python", "/app/exporter.py"]
