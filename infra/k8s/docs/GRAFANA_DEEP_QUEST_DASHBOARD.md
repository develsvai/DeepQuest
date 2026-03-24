**업데이트 날짜:** 2026-02-08  
**작성자:** DeepQuest Team Haru2

---

# Deep Quest Grafana 대시보드 설계

> Grafana에서 deep-quest 서비스 상태를 지속 모니터링하기 위한 대시보드 문서입니다.  
> 적용 파일: `infra/k8s/monitoring/dashboards/deep-quest.json` (kube-prometheus-stack 기준)

---

## 0. 모니터링 스택 현황 (2026-02 확인)

| 구성요소 | 상태 | 비고 |
|----------|------|------|
| **Prometheus** | 정상 | `prometheus-kube-prometheus-prometheus-0` (monitoring NS) |
| **Node Exporter** | 정상 | DaemonSet (노드당 1개) |
| **kube-state-metrics** | 정상 | HPA, Deployment, Pod 메트릭 |
| **Container (cAdvisor)** | 정상 | kubelet ServiceMonitor로 deep-quest Pod 메트릭 수집 |
| **Ingress Nginx 메트릭** | 적용 완료 | `infra/k8s/monitoring/ingress-nginx-metrics/` → Service + ServiceMonitor |

---

## 1. 현재 적용된 대시보드 패널 (deep-quest.json 기준)

대시보드 UID: `deep-quest-monitoring-v3`, 제목: "Deep Quest - Monitoring (Names Fixed)", 새로고침 30초, 템플릿 변수: `datasource` (Prometheus).

### 1.1 Service Health & Stability (Row)

| 패널 제목 | 타입 | PromQL |
|-----------|------|--------|
| **Ready Pods (현재)** | stat | `kube_deployment_status_replicas_ready{namespace="deep-quest"}` |
| **Pod Restarts (문제 파드 확인)** | bargauge | `sort_desc(sum(kube_pod_container_status_restarts_total{namespace="deep-quest"}) by (pod))` |
| **HPA Replicas (Current)** | stat | `kube_horizontalpodautoscaler_status_current_replicas{namespace="deep-quest"}` |
| **HPA Replicas (Target)** | stat | `kube_horizontalpodautoscaler_status_desired_replicas{namespace="deep-quest"}` |
| **Total Pods Status** | stat | Running: `sum(kube_pod_status_phase{namespace="deep-quest", phase="Running"})` / Issues: `sum(kube_pod_status_phase{namespace="deep-quest", phase!="Running"})` |

### 1.2 Resource Usage (Rank) (Row)

| 패널 제목 | 타입 | PromQL |
|-----------|------|--------|
| **CPU Usage (Pod별 순위)** | bargauge (%, 0–100, red ≥80) | `sort_desc(sum(rate(container_cpu_usage_seconds_total{namespace="deep-quest", container!="", container!="POD"}[5m])) by (pod) * 100)` |
| **Memory Usage (Pod별 순위)** | bargauge (bytes, red ≥80) | `sort_desc(sum(container_memory_working_set_bytes{namespace="deep-quest", container!="", container!="POD"}) by (pod))` |

### 1.3 Traffic & Network (Row)

| 패널 제목 | 타입 | PromQL |
|-----------|------|--------|
| **Ingress RPS (Traffic Volume)** | timeseries (bars) | `sum(rate(nginx_ingress_controller_requests_total{ingress=~"web-ingress\|.*"}[5m])) by (ingress)` |
| **HTTP Status Codes** | timeseries (bars, 2xx=green, 4xx=orange, 5xx=red) | `sum(rate(nginx_ingress_controller_requests_total[5m])) by (status)` |

### 1.4 Node Infrastructure (Bar Gauge) (Row)

| 패널 제목 | 타입 | PromQL |
|-----------|------|--------|
| **Node CPU Usage** | bargauge (%, 0–100, red ≥80) | `(1 - avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) by (instance)) * 100` |
| **Node Disk Usage** | bargauge (%, 0–100, red ≥80) | `(1 - (node_filesystem_avail_bytes{mountpoint="/",fstype!~"tmpfs\|overlay"} / node_filesystem_size_bytes{mountpoint="/",fstype!~"tmpfs\|overlay"})) * 100` |
| **Network Traffic (Instant)** | bargauge (bps) | `(sum(rate(container_network_receive_bytes_total{namespace="deep-quest"}[5m])) + sum(rate(container_network_transmit_bytes_total{namespace="deep-quest"}[5m]))) * 8` |

---

## 2. 적용 방법

- **JSON 경로**: `infra/k8s/monitoring/dashboards/deep-quest.json`
- **ConfigMap 적용 스크립트**: `infra/k8s/monitoring/dashboards/apply-dashboard.sh`  
  (Grafana가 ConfigMap으로 대시보드를 로드하는 환경에서 사용)
- **수동 Import**: Grafana → Dashboards → Import → JSON 업로드 또는 붙여넣기
- **데이터소스**: 템플릿 변수 `datasource`에 Prometheus 지정

---

## 3. 추가 권장 패널 (미적용)

| 영역 | 패널 | PromQL/메트릭 |
|------|------|----------------|
| 지연 | 요청 대기 시간 P95 | `histogram_quantile(0.95, sum(rate(nginx_ingress_controller_request_duration_seconds_bucket{namespace="ingress-nginx"}[5m])) by (le))` |
| HA | Pod Anti-Affinity / Rolling Update | `kube_pod_info`, `kube_deployment_status_replicas_unavailable` |
| DB | PostgreSQL 연결 수 / 디스크 | postgres_exporter 배포 시 |
| 알람 | Pod Not Ready, HPA Maxed, 5xx 비율, 메모리·디스크 80%+ | Alertmanager 규칙 추가 시 |

---

## 4. 알람 권장 설정

| 알람 | 조건 | 심각도 |
|------|------|--------|
| Pod Not Ready | `kube_deployment_status_replicas_ready < 1` (web/ai) | Critical |
| HPA Maxed Out | `current_replicas == max_replicas` 지속 5분 | Warning |
| 메모리 80%+ | Pod/노드 메모리 | Warning |
| 5xx 비율 5% 초과 | Ingress 5xx / total > 0.05 | Warning |
| 디스크 85% 초과 | 노드/PVC | Warning |

---

## 5. 사전 점검 (2026-02)

| 항목 | 확인 명령어 |
|------|-------------|
| Prometheus | `kubectl get pods -n monitoring -l app.kubernetes.io/name=prometheus` |
| node-exporter | `kubectl get daemonset -n monitoring prometheus-prometheus-node-exporter` |
| kube-state-metrics | `kubectl get pods -n monitoring \| grep kube-state` |
| Ingress Nginx 메트릭 | `kubectl apply -k infra/k8s/monitoring/ingress-nginx-metrics/` 적용 후 `nginx_ingress_controller_*` 메트릭 확인 |

### 5.1 Ingress 메트릭

- **Service** `ingress-nginx-controller-metrics` (ingress-nginx NS) — Controller 10254 포트
- **ServiceMonitor** (monitoring NS) — Prometheus 30초 스크랩
