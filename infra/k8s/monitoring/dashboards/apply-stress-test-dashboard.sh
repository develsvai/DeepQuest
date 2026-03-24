#!/usr/bin/env bash
# Deep Quest Stress Test Grafana 대시보드 ConfigMap 생성 및 적용
# Grafana sidecar(grafana_dashboard=1)가 자동으로 대시보드를 로드합니다.
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
kubectl create configmap deep-quest-stress-test-dashboard \
  --from-file=stress-test.json="${SCRIPT_DIR}/stress-test.json" \
  -n monitoring \
  --dry-run=client -o yaml | \
  kubectl label --local -f - grafana_dashboard=1 -o yaml | \
  kubectl apply -f -
