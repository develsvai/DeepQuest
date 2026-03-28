#!/usr/bin/env bash

set -euo pipefail

NAMESPACE="${1:-deep-quest}"
WEB_DEPLOYMENT="${WEB_DEPLOYMENT:-web-server}"
AI_DEPLOYMENT="${AI_DEPLOYMENT:-ai-server}"
WEB_SERVICE="${WEB_SERVICE:-web-service}"
AI_SERVICE="${AI_SERVICE:-ai-service}"
WEB_HEALTH_PATH="${WEB_HEALTH_PATH:-/api/health}"
AI_HEALTH_PORT="${AI_HEALTH_PORT:-8000}"
AI_HEALTH_PATH="${AI_HEALTH_PATH:-/ok}"
INGRESS_URL="${INGRESS_URL:-}"
DEBUG_ON_FAILURE="${DEBUG_ON_FAILURE:-1}"
FAILED=0

print_section() {
  printf '\n[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S %Z')" "$1"
}

run_cmd() {
  local label="$1"
  shift

  print_section "$label"
  printf '+'
  for arg in "$@"; do
    printf ' %q' "$arg"
  done
  printf '\n'

  "$@"
}

check_cmd() {
  local label="$1"
  shift

  if ! run_cmd "$label" "$@"; then
    FAILED=1
    printf 'ERROR: check failed: %s\n' "$label" >&2
  fi
}

run_debug_bundle() {
  print_section "추가 진단"
  kubectl get pods -n "$NAMESPACE" || true
  kubectl get events -n "$NAMESPACE" --sort-by=.lastTimestamp || true
  kubectl logs -n "$NAMESPACE" "deploy/$WEB_DEPLOYMENT" --tail=100 || true
  kubectl logs -n "$NAMESPACE" "deploy/$AI_DEPLOYMENT" --tail=100 || true
}

run_health_with_curl_pod() {
  local prefix="$1"
  local url="$2"
  local name="${prefix}-$$"

  kubectl run "$name" \
    -n "$NAMESPACE" \
    --attach=true \
    --rm \
    --restart=Never \
    --image=curlimages/curl \
    --command -- curl -fsS "$url"
}

print_section "검증 시작"
printf 'namespace=%s\n' "$NAMESPACE"
printf 'web_deployment=%s\n' "$WEB_DEPLOYMENT"
printf 'ai_deployment=%s\n' "$AI_DEPLOYMENT"

check_cmd "web rollout" kubectl rollout status "deployment/$WEB_DEPLOYMENT" -n "$NAMESPACE" --timeout=180s
check_cmd "ai rollout" kubectl rollout status "deployment/$AI_DEPLOYMENT" -n "$NAMESPACE" --timeout=180s

check_cmd "워크로드 상태" kubectl get all -n "$NAMESPACE" -o wide
check_cmd "Ingress HPA PVC CronJob" kubectl get ingress,hpa,pvc,cronjob -n "$NAMESPACE"
check_cmd "Pod 상태" kubectl get pods -n "$NAMESPACE"
check_cmd "Service 상태" kubectl get svc -n "$NAMESPACE"

check_cmd "web 내부 health" run_health_with_curl_pod deploy-check-web "http://$WEB_SERVICE$WEB_HEALTH_PATH"
check_cmd "ai 내부 health" run_health_with_curl_pod deploy-check-ai "http://$AI_SERVICE:$AI_HEALTH_PORT$AI_HEALTH_PATH"

if [[ -n "$INGRESS_URL" ]]; then
  check_cmd "외부 ingress health" curl -fsS "$INGRESS_URL"
else
  print_section "외부 ingress health"
  printf 'SKIP: INGRESS_URL 이 비어 있어 외부 health check를 건너뜁니다.\n'
fi

if [[ "$FAILED" -ne 0 ]]; then
  if [[ "$DEBUG_ON_FAILURE" == "1" ]]; then
    run_debug_bundle
  fi
  exit 1
fi

print_section "검증 완료"
