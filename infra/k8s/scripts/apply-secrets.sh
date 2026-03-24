#!/bin/bash
# secrets.yaml의 REPLACE 값을 로컬 .env에서 불러와 적용
# 사용: ./apply-secrets.sh (infra/k8s/scripts에서 실행) 또는
#       ./infra/k8s/scripts/apply-secrets.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
K8S_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
INFRA_DIR="$(cd "$K8S_DIR/.." && pwd)"

# Prod .env 준비 (K8s 배포용)
[ -f "$INFRA_DIR/docker/web/.env.prod" ] && cp "$INFRA_DIR/docker/web/.env.prod" "$INFRA_DIR/docker/web/.env" && echo ">> Copied web/.env.prod → web/.env"
[ -f "$INFRA_DIR/docker/ai/.env.prod" ] && cp "$INFRA_DIR/docker/ai/.env.prod" "$INFRA_DIR/docker/ai/.env" && echo ">> Copied ai/.env.prod → ai/.env"

WEB_ENV="$INFRA_DIR/docker/web/.env"
AI_ENV="$INFRA_DIR/docker/ai/.env"

[ -f "$WEB_ENV" ] || { echo "Missing $WEB_ENV"; exit 1; }
[ -f "$AI_ENV" ] || { echo "Missing $AI_ENV"; exit 1; }

# WEB 먼저, AI 나중에 source → ai-secret용 변수(LANGSMITH_API_KEY, LANGGRAPH_DATABASE_URI 등)는 AI 값 사용
set -a
[ -f "$WEB_ENV" ] && . "$WEB_ENV"
[ -f "$AI_ENV" ] && . "$AI_ENV"
set +a

# DATABASE_URL 비밀번호 인코딩 (@ -> %40)
PG_PASS_ENC="${POSTGRES_PASSWORD//@/%40}"

# LANGGRAPH_DATABASE_URI: ai/.env.prod 에 있으면 사용, 없으면 POSTGRES_USER/PASSWORD 로 생성 (LangGraph 전용 DB)
LANGGRAPH_DATABASE_URI="${LANGGRAPH_DATABASE_URI:-postgres://${POSTGRES_USER:-deepquest}:${PG_PASS_ENC:-CHANGE_ME_STRONG_PASSWORD}@postgres-service:5432/langgraph?sslmode=disable}"

TMP=$(mktemp)
trap "rm -f $TMP" EXIT

sed -e "s|REPLACE_WITH_BASE64_ENCODED_DOCKER_CONFIG|${DOCKER_CONFIG_B64:-REPLACE_WITH_BASE64_ENCODED_DOCKER_CONFIG}|g" \
    -e "s|CHANGE_ME_STRONG_PASSWORD|${PG_PASS_ENC:-CHANGE_ME_STRONG_PASSWORD}|g" \
    -e "s|REPLACE_WITH_LANGGRAPH_DATABASE_URI|${LANGGRAPH_DATABASE_URI}|g" \
    -e "s|REPLACE_WITH_GOOGLE_API_KEY|${GOOGLE_API_KEY:-REPLACE_WITH_GOOGLE_API_KEY}|g" \
    -e "s|REPLACE_WITH_LANGSMITH_API_KEY|${LANGSMITH_API_KEY:-REPLACE_WITH_LANGSMITH_API_KEY}|g" \
    -e "s|REPLACE_WITH_CLERK_PUBLISHABLE_KEY|${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:-REPLACE_WITH_CLERK_PUBLISHABLE_KEY}|g" \
    -e "s|REPLACE_WITH_CLERK_SECRET_KEY|${CLERK_SECRET_KEY:-REPLACE_WITH_CLERK_SECRET_KEY}|g" \
    -e "s|REPLACE_WITH_CLERK_WEBHOOK_SIGNING_SECRET|${CLERK_WEBHOOK_SIGNING_SECRET:-REPLACE_WITH_CLERK_WEBHOOK_SIGNING_SECRET}|g" \
    -e "s|REPLACE_WITH_SUPABASE_URL|${NEXT_PUBLIC_SUPABASE_URL:-REPLACE_WITH_SUPABASE_URL}|g" \
    -e "s|REPLACE_WITH_SUPABASE_ANON_KEY|${NEXT_PUBLIC_SUPABASE_ANON_KEY:-REPLACE_WITH_SUPABASE_ANON_KEY}|g" \
    -e "s|REPLACE_WITH_SUPABASE_SERVICE_ROLE_KEY|${SUPABASE_SERVICE_ROLE_KEY:-REPLACE_WITH_SUPABASE_SERVICE_ROLE_KEY}|g" \
    -e "s|REPLACE_WITH_AI_WEBHOOK_SECRET|${AI_WEBHOOK_SECRET:-REPLACE_WITH_AI_WEBHOOK_SECRET}|g" \
    -e "s|REPLACE_WITH_TAILSCALE_AUTH_KEY|${TS_AUTHKEY:-REPLACE_WITH_TAILSCALE_AUTH_KEY}|g" \
    "$K8S_DIR/base/secrets.yaml" > "$TMP"

echo "Applying secrets to deep-quest namespace..."
kubectl apply -f "$TMP" || {
  echo "harbor-pull-secret 실패 시 무시됨 (별도 생성: kubectl create secret docker-registry ...)"
}
