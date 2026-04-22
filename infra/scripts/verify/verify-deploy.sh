#!/usr/bin/env bash

set -euo pipefail

NAMESPACE="${1:-deep-quest}"
DEPLOY_ENV="${DEPLOY_ENV:-prod}"
ARGOCD_NAMESPACE="${ARGOCD_NAMESPACE:-argocd}"
ARGOCD_APP="${ARGOCD_APP:-deep-quest-${DEPLOY_ENV}}"
WEB_DEPLOYMENT="${WEB_DEPLOYMENT:-web-server}"
AI_DEPLOYMENT="${AI_DEPLOYMENT:-ai-server}"
METRICS_DEPLOYMENT="${METRICS_DEPLOYMENT:-langgraph-run-metrics-exporter}"
WEB_SERVICE="${WEB_SERVICE:-web-service}"
AI_SERVICE="${AI_SERVICE:-ai-service}"
WEB_HEALTH_PATH="${WEB_HEALTH_PATH:-/api/health}"
AI_HEALTH_PORT="${AI_HEALTH_PORT:-8000}"
AI_HEALTH_PATH="${AI_HEALTH_PATH:-/ok}"
INGRESS_URL="${INGRESS_URL:-}"
DEBUG_ON_FAILURE="${DEBUG_ON_FAILURE:-1}"
CHECK_ARGOCD="${CHECK_ARGOCD:-1}"
EXPECTED_TAG="${EXPECTED_TAG:-}"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/../.." && pwd)"
KUSTOMIZATION_FILE="${KUSTOMIZATION_FILE:-$REPO_ROOT/k8s/overlays/$DEPLOY_ENV/kustomization.yaml}"
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

deployment_exists() {
  local deployment="$1"
  kubectl get deployment "$deployment" -n "$NAMESPACE" >/dev/null 2>&1
}

overlay_tag_for_image() {
  local image_name="$1"

  awk -v image="$image_name" '
    /^[[:space:]]*-[[:space:]]*name:[[:space:]]*/ {
      current=$0
      sub(/^[[:space:]]*-[[:space:]]*name:[[:space:]]*/, "", current)
      sub(/[[:space:]]+$/, "", current)
    }
    current == image && /^[[:space:]]*newTag:/ {
      tag=$0
      sub(/^[[:space:]]*newTag:[[:space:]]*/, "", tag)
      sub(/[[:space:]]*#.*/, "", tag)
      gsub(/["'\'']/, "", tag)
      print tag
      exit
    }
  ' "$KUSTOMIZATION_FILE"
}

live_image_for_container() {
  local deployment="$1"
  local container="$2"

  kubectl get deployment "$deployment" -n "$NAMESPACE" \
    -o jsonpath='{range .spec.template.spec.containers[*]}{.name}{" "}{.image}{"\n"}{end}' \
    | awk -v container="$container" '$1 == container { print $2; exit }'
}

image_tag_from_ref() {
  local image_ref="$1"
  printf '%s\n' "${image_ref##*:}"
}

check_overlay_tag() {
  local label="$1"
  local image_name="$2"
  local expected="$3"
  local actual

  actual="$(overlay_tag_for_image "$image_name")"
  if [[ -z "$actual" ]]; then
    printf 'ERROR: %s overlay tag not found for %s in %s\n' "$label" "$image_name" "$KUSTOMIZATION_FILE" >&2
    return 1
  fi

  printf '%s overlay tag: %s\n' "$label" "$actual"
  if [[ -n "$expected" && "$actual" != "$expected" ]]; then
    printf 'ERROR: %s overlay tag mismatch: expected=%s actual=%s\n' "$label" "$expected" "$actual" >&2
    return 1
  fi
}

check_live_image_tag() {
  local label="$1"
  local deployment="$2"
  local container="$3"
  local expected="$4"
  local image_ref
  local actual

  image_ref="$(live_image_for_container "$deployment" "$container")"
  if [[ -z "$image_ref" ]]; then
    printf 'ERROR: %s live image not found: deployment=%s container=%s\n' "$label" "$deployment" "$container" >&2
    return 1
  fi

  actual="$(image_tag_from_ref "$image_ref")"
  printf '%s live image: %s\n' "$label" "$image_ref"
  if [[ -n "$expected" && "$actual" != "$expected" ]]; then
    printf 'ERROR: %s live tag mismatch: expected=%s actual=%s\n' "$label" "$expected" "$actual" >&2
    return 1
  fi
}

check_release_images() {
  local ai_image="harbor.192.168.0.110.nip.io/deep-quest/ai"
  local web_image="harbor.192.168.0.110.nip.io/deep-quest/web"
  local metrics_image="harbor.192.168.0.110.nip.io/deep-quest/langgraph-run-metrics-exporter"
  local release_tag="$EXPECTED_TAG"

  if [[ -z "$release_tag" ]]; then
    release_tag="$(overlay_tag_for_image "$web_image")"
  fi

  if [[ -z "$release_tag" ]]; then
    printf 'ERROR: release tag could not be inferred from %s\n' "$KUSTOMIZATION_FILE" >&2
    return 1
  fi

  printf 'release_tag=%s\n' "$release_tag"
  check_overlay_tag "web" "$web_image" "$release_tag"
  check_overlay_tag "ai" "$ai_image" "$release_tag"
  check_overlay_tag "metrics" "$metrics_image" "$release_tag"
  check_live_image_tag "web" "$WEB_DEPLOYMENT" "web" "$release_tag"
  check_live_image_tag "ai" "$AI_DEPLOYMENT" "ai" "$release_tag"

  if deployment_exists "$METRICS_DEPLOYMENT"; then
    check_live_image_tag "metrics" "$METRICS_DEPLOYMENT" "exporter" "$release_tag"
  else
    printf 'WARN: metrics deployment not found, skipping live metrics image check: %s\n' "$METRICS_DEPLOYMENT" >&2
  fi
}

check_argocd_status() {
  local sync_status
  local health_status
  local revision
  local reconciled_at

  sync_status="$(kubectl get application "$ARGOCD_APP" -n "$ARGOCD_NAMESPACE" -o jsonpath='{.status.sync.status}')"
  health_status="$(kubectl get application "$ARGOCD_APP" -n "$ARGOCD_NAMESPACE" -o jsonpath='{.status.health.status}')"
  revision="$(kubectl get application "$ARGOCD_APP" -n "$ARGOCD_NAMESPACE" -o jsonpath='{.status.sync.revision}')"
  reconciled_at="$(kubectl get application "$ARGOCD_APP" -n "$ARGOCD_NAMESPACE" -o jsonpath='{.status.reconciledAt}')"

  printf 'sync=%s health=%s revision=%s reconciledAt=%s\n' "$sync_status" "$health_status" "$revision" "$reconciled_at"
  if [[ "$sync_status" != "Synced" ]]; then
    printf 'ERROR: ArgoCD sync status is not Synced: %s\n' "$sync_status" >&2
    return 1
  fi
  if [[ "$health_status" != "Healthy" ]]; then
    printf 'ERROR: ArgoCD health status is not Healthy: %s\n' "$health_status" >&2
    return 1
  fi
}

print_section "검증 시작"
printf 'namespace=%s\n' "$NAMESPACE"
printf 'deploy_env=%s\n' "$DEPLOY_ENV"
printf 'argocd_app=%s/%s\n' "$ARGOCD_NAMESPACE" "$ARGOCD_APP"
printf 'kustomization_file=%s\n' "$KUSTOMIZATION_FILE"
printf 'web_deployment=%s\n' "$WEB_DEPLOYMENT"
printf 'ai_deployment=%s\n' "$AI_DEPLOYMENT"

if [[ "$CHECK_ARGOCD" == "1" ]]; then
  check_cmd "ArgoCD Application 상태" kubectl get application "$ARGOCD_APP" -n "$ARGOCD_NAMESPACE" -o wide
  check_cmd "ArgoCD sync/health/revision" check_argocd_status
fi

check_cmd "web rollout" kubectl rollout status "deployment/$WEB_DEPLOYMENT" -n "$NAMESPACE" --timeout=180s
check_cmd "ai rollout" kubectl rollout status "deployment/$AI_DEPLOYMENT" -n "$NAMESPACE" --timeout=180s
if deployment_exists "$METRICS_DEPLOYMENT"; then
  check_cmd "metrics rollout" kubectl rollout status "deployment/$METRICS_DEPLOYMENT" -n "$NAMESPACE" --timeout=180s
fi

check_cmd "워크로드 상태" kubectl get all -n "$NAMESPACE" -o wide
check_cmd "Ingress HPA PVC CronJob" kubectl get ingress,hpa,pvc,cronjob -n "$NAMESPACE"
check_cmd "Pod 상태" kubectl get pods -n "$NAMESPACE"
check_cmd "Service 상태" kubectl get svc -n "$NAMESPACE"
check_cmd "배포 이미지 태그 정합성" check_release_images

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
