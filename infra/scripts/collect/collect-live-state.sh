#!/usr/bin/env bash

set -euo pipefail

NAMESPACE="${1:-deep-quest}"
INCLUDE_STATION="${INCLUDE_STATION:-1}"
STATION_HOST="${STATION_HOST:-station}"

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
printf 'include_station=%s\n' "$INCLUDE_STATION"
printf 'station_host=%s\n' "$STATION_HOST"

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

if [[ "$INCLUDE_STATION" == "1" ]]; then
  run_station_cmd "station 시간대" "timedatectl | sed -n '1,8p'"
  run_station_cmd "station prune cron" "sed -n '1,120p' /etc/cron.d/station-image-prune"
  run_station_cmd "station prune script" "sed -n '1,220p' /usr/local/sbin/station-image-prune.sh"
  run_station_cmd "station prune 최근 로그" "tail -n 20 /var/log/station-image-prune.log 2>/dev/null || true"
fi

print_section "수집 완료"
