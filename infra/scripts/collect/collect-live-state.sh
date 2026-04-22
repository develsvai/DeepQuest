#!/usr/bin/env bash

set -euo pipefail

NAMESPACE="${1:-deep-quest}"
INCLUDE_STATION="${INCLUDE_STATION:-1}"
STATION_HOST="${STATION_HOST:-station}"
DEPLOY_ENV="${DEPLOY_ENV:-prod}"
ARGOCD_NAMESPACE="${ARGOCD_NAMESPACE:-argocd}"
ARGOCD_APP="${ARGOCD_APP:-deep-quest-${DEPLOY_ENV}}"
WEB_DEPLOYMENT="${WEB_DEPLOYMENT:-web-server}"
AI_DEPLOYMENT="${AI_DEPLOYMENT:-ai-server}"
METRICS_DEPLOYMENT="${METRICS_DEPLOYMENT:-langgraph-run-metrics-exporter}"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/../.." && pwd)"
KUSTOMIZATION_FILE="${KUSTOMIZATION_FILE:-$REPO_ROOT/k8s/overlays/$DEPLOY_ENV/kustomization.yaml}"

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

run_optional_cmd() {
  local label="$1"
  shift

  if ! run_cmd "$label" "$@"; then
    printf 'WARN: optional command failed: %s\n' "$label" >&2
  fi
}

run_station_cmd() {
  local label="$1"
  local remote_cmd="$2"

  run_optional_cmd "$label" ssh "$STATION_HOST" "$remote_cmd"
}

print_section "수집 시작"
printf 'namespace=%s\n' "$NAMESPACE"
printf 'deploy_env=%s\n' "$DEPLOY_ENV"
printf 'argocd_app=%s/%s\n' "$ARGOCD_NAMESPACE" "$ARGOCD_APP"
printf 'kustomization_file=%s\n' "$KUSTOMIZATION_FILE"
printf 'include_station=%s\n' "$INCLUDE_STATION"
printf 'station_host=%s\n' "$STATION_HOST"

run_optional_cmd "Git source" git -C "$REPO_ROOT" status --short
run_optional_cmd "Git HEAD" git -C "$REPO_ROOT" log -1 --oneline
run_optional_cmd "Overlay image tags" awk '
  /^images:/ { in_images=1; print; next }
  in_images && /^[^[:space:]-]/ { in_images=0 }
  in_images { print }
' "$KUSTOMIZATION_FILE"

run_cmd "Kubernetes context" kubectl config current-context
run_cmd "Namespace 목록" kubectl get ns
run_cmd "노드 상태" kubectl get nodes -o wide
run_optional_cmd "노드 리소스 사용량" kubectl top nodes
run_cmd "전체 CronJob" kubectl get cronjob -A
run_cmd "전체 Service" kubectl get svc -A

run_cmd "Namespace 전체 워크로드" kubectl get all -n "$NAMESPACE" -o wide
run_cmd "Ingress HPA PVC CronJob" kubectl get ingress,hpa,pvc,cronjob -n "$NAMESPACE"
run_optional_cmd "Pod 리소스 사용량" kubectl top pods -n "$NAMESPACE"
run_optional_cmd "ConfigMap Secret" kubectl get configmap,secret -n "$NAMESPACE"
run_optional_cmd "최근 이벤트" kubectl get events -n "$NAMESPACE" --sort-by=.lastTimestamp

run_optional_cmd "ArgoCD Application 상태" kubectl get application "$ARGOCD_APP" -n "$ARGOCD_NAMESPACE" -o wide
run_optional_cmd "ArgoCD sync/health/revision" kubectl get application "$ARGOCD_APP" -n "$ARGOCD_NAMESPACE" -o jsonpath='{.status.sync.status}{" health="}{.status.health.status}{" revision="}{.status.sync.revision}{" reconciledAt="}{.status.reconciledAt}{"\n"}'
run_optional_cmd "핵심 Deployment live image" kubectl get deployment "$WEB_DEPLOYMENT" "$AI_DEPLOYMENT" "$METRICS_DEPLOYMENT" -n "$NAMESPACE" -o jsonpath='{range .items[*]}{.metadata.name}{": "}{range .spec.template.spec.containers[*]}{.name}{"="}{.image}{" "}{end}{"\n"}{end}'
run_optional_cmd "핵심 Pod live imageID" kubectl get pod -n "$NAMESPACE" -l app.kubernetes.io/name=deep-quest -o jsonpath='{range .items[*]}{.metadata.name}{": "}{range .status.containerStatuses[*]}{.name}{"="}{.imageID}{" "}{end}{"\n"}{end}'

if [[ "$INCLUDE_STATION" == "1" ]]; then
  run_station_cmd "station 시간대" "timedatectl | sed -n '1,8p'"
  run_station_cmd "station prune cron" "sed -n '1,120p' /etc/cron.d/station-image-prune"
  run_station_cmd "station prune script" "sed -n '1,220p' /usr/local/sbin/station-image-prune.sh"
  run_station_cmd "station prune 최근 로그" "tail -n 20 /var/log/station-image-prune.log 2>/dev/null || true"
fi

print_section "수집 완료"
