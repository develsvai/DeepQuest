# Kubernetes 모니터링 설정

클러스터 모니터링을 위한 추가 리소스 (kube-prometheus-stack과 함께 사용)

## ingress-nginx-metrics

Ingress Nginx Controller의 Prometheus 메트릭을 수집합니다.

- **HTTP RPS**, 응답 코드 분포, 지연 시간
- `nginx_ingress_controller_requests_total` 등 메트릭 사용 가능

### 적용

```bash
kubectl apply -k ingress-nginx-metrics/
```

### 구성

| 리소스 | 네임스페이스 | 설명 |
|--------|-------------|------|
| Service `ingress-nginx-controller-metrics` | ingress-nginx | Controller Pod 10254 포트 노출 |
| ServiceMonitor `ingress-nginx-controller-metrics` | monitoring | Prometheus 스크랩 (30s 주기) |

메트릭이 Prometheus에 안 뜨거나, 10254 노출·ServiceMonitor 라벨·Grafana No data 등은 [트러블슈팅](./트러블슈팅.md) 문서에서 점검·해결 절차를 확인한다.

---

## dashboards/deep-quest

Deep Quest 전용 Grafana 대시보드 (리소스, 트래픽, HPA, 네트워크)

### 패널 구성

| 섹션 | 패널 |
|------|------|
| **리소스** | CPU/Memory (Pod별), 노드 CPU, 디스크 사용률 |
| **트래픽** | HTTP RPS, 응답 코드 분포, P50/P95 지연, Pod별 네트워크 |
| **HA/HPA** | HPA 현재/목표 Replica, Ready Pod 수, Pod Restart |
| **네트워크** | 1Gbps 회선 사용률(%), 전체 대역폭 Mbps |

### 적용

```bash
./dashboards/apply-deep-quest-dashboard.sh
```

또는 수동 import: Grafana → Dashboards → Import → `dashboards/deep-quest.json` 업로드

### deep-quest.json 기준 구성 (추가)

- **데이터소스:** 상단 변수 `Data source`에서 Prometheus 선택. UID는 `${datasource}`로 설정되어 있음.
- **적용 스크립트:** `apply-deep-quest-dashboard.sh`는 `dashboards/deep-quest.json`을 ConfigMap `deep-quest-dashboard`로 생성하고 `grafana_dashboard=1` 라벨을 붙여 Grafana sidecar가 자동 로드하도록 함. 실행 위치: `infra/k8s/monitoring/dashboards/`.
- **행(Row) 및 패널:** Service Health & Stability (Ready Pods, Pod Restarts, HPA Current/Target, Total Pods Status), Resource Usage (Rank) (CPU/Memory Pod별 순위), Traffic & Network (Ingress RPS, HTTP Status Codes), Node Infrastructure (Node CPU, Disk, Network Traffic).
- **주요 메트릭:** `namespace="deep-quest"` (Deployment/Pod/HPA), `kube_*` (kube-state-metrics), `nginx_ingress_controller_requests_total` (Ingress). Ingress·트래픽 패널이 비어 있으면 [트러블슈팅](./트러블슈팅.md)의 Ingress 메트릭 절차와 9번을 참고.

---

## dashboards/stress-test

부하 테스트(K6/Locust) 시 병목 확인용 전용 대시보드 (Task 1-1)

### 패널 구성

| 패널 | PromQL 요약 |
|------|-------------|
| Pod CPU Usage (AI vs Web) | `sum(rate(container_cpu_usage_seconds_total{namespace="deep-quest"}[1m])) by (pod)` |
| Pod Memory Usage (OOM 감시) | `sum(container_memory_working_set_bytes{namespace="deep-quest"}) by (pod)` |
| Network I/O | `rate(node_network_receive_bytes_total[1m])` |
| Ingress RPS & P95 Latency | `rate(nginx_ingress_controller_requests_total[1m])`, `histogram_quantile(0.95, ...)` |

### 적용

```bash
./dashboards/apply-stress-test-dashboard.sh
```

또는 수동 import: Grafana → Dashboards → Import → `dashboards/stress-test.json` 업로드

Day 1 작업 전체 진행 상황·산출물 체크리스트: [Task1 공통 문서](../../docs-infra/K6_RPS_TEST_TASK_1/Task1_공통_문서.md)

Ingress RPS & P95 패널이 No data일 때는 [트러블슈팅](./트러블슈팅.md) 문서의 1~5번·7번 절차를 참고한다.
