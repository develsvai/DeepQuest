**업데이트 날짜:** 2026-02-14  
**작성자:** DeepQuest Team Haru2

---

# Task 1-1 사전 점검 결과 (1단계)

상위 문서: [Task1 공통 문서](./Task1_공통_문서.md) (Day 1 전체 진행 상황은 해당 문서에 갱신)

## 점검 일시

2026-02-14 실행.

## 1. Prometheus / Grafana 상태

| 항목 | 결과 |
|------|------|
| Prometheus Pod | `prometheus-prometheus-kube-prometheus-prometheus-0` (monitoring NS) 정상 |
| Grafana Pod | `prometheus-grafana-8ddd6cdd-sdsdb` (monitoring NS) 정상 |
| Node Exporter | DaemonSet 배포됨 (노드당 1개) |

## 2. deep-quest 네임스페이스 Pod 및 라벨

| Pod 패턴 | 라벨 (구분용) | 비고 |
|----------|----------------|------|
| ai-server-* | `app.kubernetes.io/component=ai` | AI 서버 |
| web-server-* | `app.kubernetes.io/component=web` | Web 서버 |
| postgres-0 | `app.kubernetes.io/component=postgres` | DB |
| tailscale-funnel-* | tailscale | 제외 가능 |

AI vs Web 구분: PromQL에서 `pod=~"ai-server.*"` / `pod=~"web-server.*"` 또는 라벨 `label_join` 등으로 구분 가능.  
기존 메트릭에는 `pod` 라벨 있음. `app.kubernetes.io/component`는 Pod 메트릭에 없을 수 있으므로 **pod 이름 패턴**으로 구분 권장.

## 3. 메트릭 수집 여부

### 3.1 Container CPU (Pod별)

- **쿼리**: `container_cpu_usage_seconds_total{namespace="deep-quest"}`
- **결과**: 수집됨. `pod`, `container`, `namespace` 라벨 있음.
- **비고**: `container!=""`, `container!="POD"` 로 필터 시 파드별 합계에 유리.

### 3.2 Container Memory (Pod별)

- **쿼리**: `container_memory_working_set_bytes{namespace="deep-quest"}`
- **결과**: 수집됨. `pod` 라벨 있음.

### 3.3 Node Network

- **쿼리**: `node_network_receive_bytes_total`
- **결과**: 수집됨. `instance`, `device` 등 있음.  
- **Stress Test용**: `rate(node_network_receive_bytes_total[1m])` 사용 가능.

### 3.4 Ingress Nginx (RPS / Latency)

- **쿼리**: `nginx_ingress_controller_requests_total`
- **결과**: 조회 시점 **빈 결과** (result: []).
- **인프라**: `ingress-nginx` NS에 `ingress-nginx-controller-metrics` 서비스(10254) 있음. ServiceMonitor(monitoring NS) 적용됨, `release: prometheus` 라벨 일치.
- **조치**: 트래픽 발생 후 메트릭 생길 수 있음. 대시보드는 `nginx_ingress_controller_requests_total`, `nginx_ingress_controller_request_duration_seconds_bucket` 기준으로 구성하고, 무트래픽 시 "No data" 가능함을 인지.

## 4. 확인 체크리스트

- [x] `container_cpu_usage_seconds_total` 에 `pod` 라벨 있음
- [x] AI/Web 구분 가능 (Pod 이름: ai-server-* / web-server-*)
- [x] `container_memory_working_set_bytes` 수집됨
- [x] `node_network_receive_bytes_total` 수집됨
- [ ] `nginx_ingress_controller_requests_total` 데이터 있음 (현재 없음, 트래픽 후 재확인)

## 5. Stress Test 대시보드 적용 시 참고

- **네임스페이스**: 모든 쿼리에서 `namespace="deep-quest"` 사용 (문서의 deepquest 아님).
- **Ingress 패널**: RPS/Latency는 Ingress 메트릭 수집 후 채워짐. 동일 부하 테스트 시 트래픽을 주면 그래프 확인 가능.
- **Pod CPU/Memory**: 1m rate/working_set 쿼리 그대로 사용 가능.
