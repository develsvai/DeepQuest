#!/usr/bin/env bash
# ServiceMonitor 라벨을 Prometheus의 serviceMonitorSelector에 맞춰서
# ingress-nginx 10254 타겟이 스크랩되도록 함.
# 권장: kustomization.yaml 의 commonLabels.release 를 클러스터 Prometheus 값과 맞추면
#       kubectl apply -k . 만으로 동작하므로 이 스크립트는 불필요.
# 사용: ./fix-servicemonitor-for-prometheus.sh

set -e
MONITOR_NS="${MONITOR_NS:-monitoring}"
SM_NAME="ingress-nginx-controller-metrics"

# Prometheus CR이 있는 네임스페이스 (보통 monitoring)
PROM_NS="${PROM_NS:-monitoring}"

echo "[1] Prometheus serviceMonitorSelector 확인 중..."
SELECTOR=$(kubectl get prometheus -n "$PROM_NS" -o jsonpath='{.items[0].spec.serviceMonitorSelector.matchLabels}' 2>/dev/null || true)
if [ -z "$SELECTOR" ]; then
  echo "    Prometheus 리소스를 찾을 수 없습니다. PROM_NS=$PROM_NS 확인."
  exit 1
fi
echo "    selector: $SELECTOR"

RELEASE=$(kubectl get prometheus -n "$PROM_NS" -o jsonpath='{.items[0].spec.serviceMonitorSelector.matchLabels.release}' 2>/dev/null || true)
if [ -z "$RELEASE" ]; then
  echo "    matchLabels.release 값을 읽지 못했습니다. 수동으로 패치하세요."
  echo "    예: kubectl patch servicemonitor -n $MONITOR_NS $SM_NAME --type=merge -p '{\"metadata\":{\"labels\":{\"release\":\"prometheus\"}}}'"
  exit 1
fi

echo "[2] ServiceMonitor 현재 라벨..."
kubectl get servicemonitor -n "$MONITOR_NS" "$SM_NAME" -o jsonpath='{.metadata.labels}' 2>/dev/null | tr ',' '\n' || true
echo ""

CURRENT=$(kubectl get servicemonitor -n "$MONITOR_NS" "$SM_NAME" -o jsonpath='{.metadata.labels.release}' 2>/dev/null || true)
if [ "$CURRENT" = "$RELEASE" ]; then
  echo "[3] 이미 release=$RELEASE 로 일치합니다. Prometheus UI → Status → Targets 에서 ingress-nginx 타겟이 있는지 확인하세요."
  exit 0
fi

echo "[3] ServiceMonitor 라벨 패치 (release=$RELEASE)..."
kubectl patch servicemonitor -n "$MONITOR_NS" "$SM_NAME" --type=merge -p "{\"metadata\":{\"labels\":{\"release\":\"$RELEASE\"}}}"
echo "    완료. 1~2분 후 Prometheus Status → Targets 에 ingress-nginx 관련 타겟이 생기고, Explore에서 nginx_ingress_controller_* 메트릭을 조회해 보세요."
