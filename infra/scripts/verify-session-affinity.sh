#!/bin/bash
# Session affinity 적용 여부 확인 (deep-quest 네임스페이스)
set -e
NS="${NAMESPACE:-deep-quest}"

echo "=== 1. AI Service - sessionAffinity (ClientIP) ==="
kubectl get svc ai-service -n "$NS" -o jsonpath='{.spec.sessionAffinity}' 2>/dev/null && echo ""
kubectl get svc ai-service -n "$NS" -o jsonpath='{.spec.sessionAffinityConfig.clientIP.timeoutSeconds}' 2>/dev/null && echo " (timeoutSeconds)"

echo ""
echo "=== 2. Web Ingress - nginx cookie affinity annotations ==="
kubectl get ingress web-ingress -n "$NS" -o jsonpath='{.metadata.annotations}' 2>/dev/null | jq -r 'to_entries[] | select(.key | test("affinity|cookie"; "i")) | "\(.key): \(.value)"' 2>/dev/null || \
kubectl get ingress web-ingress -n "$NS" -o yaml 2>/dev/null | grep -E "affinity|cookie"

echo ""
echo "=== 3. 요약 (YAML 일부) ==="
echo "--- AI Service spec ---"
kubectl get svc ai-service -n "$NS" -o yaml 2>/dev/null | grep -A5 "sessionAffinity" || true
echo "--- Ingress annotations (affinity 관련) ---"
kubectl get ingress web-ingress -n "$NS" -o yaml 2>/dev/null | grep -E "affinity|cookie" || true
