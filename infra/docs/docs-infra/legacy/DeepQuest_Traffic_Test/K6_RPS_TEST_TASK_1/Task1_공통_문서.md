**업데이트 날짜:** 2026-02-15  
**작성자:** DeepQuest Team Haru2

---

# Task 1 공통 문서 (Day 1: 관측 & 확장)

SRE 포트폴리오 3일 스프린트 중 **Day 1** 작업의 공통 기준 문서다.  
Task 1-1, 1-2, 1-3 진행에 따라 아래 각 섹션의 상태·결과를 갱신한다.

## 목차

1. [Day 1 목표 및 산출물](#1-day-1-목표-및-산출물)
2. [Task 1-1: Grafana Stress Test 대시보드](#2-task-1-1-grafana-stress-test-대시보드)
3. [Task 1-2: HPA 미적용 Breaking Point 측정](#3-task-1-2-hpa-미적용-breaking-point-측정)
4. [Task 1-3: HPA 적용 후 확장성 검증](#4-task-1-3-hpa-적용-후-확장성-검증)
5. [산출물 체크리스트 및 증거](#5-산출물-체크리스트-및-증거)
6. [참고 자료](#6-참고-자료)

---

## 1. Day 1 목표 및 산출물

**목표:** 서버 한계(Baseline)를 확인하고, HPA로 그 한계를 돌파함을 증명한다.

**산출물:**

- Grafana "Stress Test" 대시보드 (부하 테스트 중 병목 확인용)
- [Before] HPA 미적용 시 Breaking Point 측정 기록 및 그래프
- [After] HPA 적용 후 Scale-out·Latency 안정화 기록 및 그래프
- 최종: "Baseline vs HPA" 비교 그래프 (죽던 서버가 HPA로 살아나는 모습)

---

## 2. Task 1-1: Grafana Stress Test 대시보드

**목표:** 부하 테스트 중 한눈에 병목을 찾기 위한 대시보드 4패널 구성.

### 2.1 요구 패널 및 PromQL

| 패널 | 용도 | PromQL |
|------|------|--------|
| Pod CPU Usage | AI vs Web 비교 | `sum(rate(container_cpu_usage_seconds_total{namespace="deep-quest", container!="", container!="POD"}[1m])) by (pod)` |
| Pod Memory Usage | OOM 감시 | `sum(container_memory_working_set_bytes{namespace="deep-quest", container!="", container!="POD"}) by (pod)` |
| Network I/O | 1G/2.5G 대역폭 병목 | `rate(node_network_receive_bytes_total[1m])` |
| Ingress RPS & Latency | 서비스 처리량·P95 | RPS: `sum(rate(nginx_ingress_controller_requests_total[1m]))` / P95: `histogram_quantile(0.95, sum(rate(nginx_ingress_controller_request_duration_seconds_bucket[1m])) by (le))` |

### 2.2 적용 경로 및 적용 방법

- **대시보드 JSON:** `infra/k8s/monitoring/dashboards/stress-test.json`
- **적용:** `infra/k8s/monitoring/dashboards/apply-stress-test-dashboard.sh` 실행  
  또는 Grafana UI에서 Import → `stress-test.json` 업로드
- **대시보드 UID:** `deep-quest-stress-test-v1`  
- **문서:** [Task1-1 사전점검 결과](./Task1-1_사전점검_결과.md)

### 2.3 진행 상황 및 적용 결과

| 항목 | 상태 | 비고 |
|------|------|------|
| 사전 점검 (Prometheus/메트릭/Pod 라벨) | 완료 | 2026-02-14. Container/Node 메트릭 수집됨. Ingress 메트릭은 트래픽 후 확인 |
| Stress Test 대시보드 JSON 생성 | 완료 | 4패널, refresh 10s |
| ConfigMap 적용 (클러스터 반영) | 완료 | |
| Grafana에서 표시·데이터 확인 | 완료 | "Deep Quest - Stress Test" 대시보드 표시 확인됨 |

### 2.4 부하 테스트 시 모니터링 체크리스트 (300 / 3000 VU 등)

테스트 **직전** 한 번, **테스트 중** 주기적으로 확인할 항목.

| 확인 항목 | 방법 |
|-----------|------|
| **Grafana** | 대시보드 **"Deep Quest - Stress Test"** (UID: `deep-quest-stress-test-v1`) 열고 Refresh **10s** 로 두기. Pod CPU·Memory·Network I/O·Ingress RPS 패널 확인. |
| **Web/AI Pod 개수** | `kubectl get pods -n deep-quest -l app.kubernetes.io/component=web` / `...=ai` |
| **HPA 현재 복제 수** | `kubectl get hpa -n deep-quest` (REPLICAS, TARGETS 확인) |
| **한 번에 보기** | `kubectl get pods,hpa -n deep-quest` |
| **실시간 반복** | `watch -n 5 'kubectl get pods,hpa -n deep-quest'` (5초마다 갱신) |

K6 실행 예 (내부 도메인, TLS 스킵):

```bash
export K6_INSECURE_SKIP_TLS_VERIFY=true
k6 run --vus 100 --duration 30s script.js  # 예: 300 VU 단계별는 스크립트 내 옵션
# 대상 URL 예: https://deepquest.192.168.0.110.nip.io/api/health
```

---

## 3. Task 1-2: HPA 미적용 Breaking Point 측정

**목표:** HPA 없이 파드 1개 고정일 때 서버가 어디서 죽는지(Breaking Point) 기록한다.

### 3.1 설정 요약

- HPA 제거: `kubectl delete hpa web-server-hpa -n deep-quest` (AI HPA는 유지)
- 파드 1개 고정: `kubectl scale deployment web-server -n deep-quest --replicas=1`
- 부하: HPA 적용 시와 동일한 `load_test.js` (30s 150 → 1m 500 → 1m 1500 → 1m 3000, timeout 35s), 대상 `/api/health`

### 3.2 진행 상황 및 적용 결과

| 항목 | 상태 | 비고 |
|------|------|------|
| HPA 제거 및 replicas=1 확인 | 완료 | 2026-02-15 수행 |
| load_test.js 작성/배치 | 완료 | [load_test.js](./load_test.js), BASE_URL 치환 또는 env 사용 |
| K6 실행 및 Grafana Stress Test 동시 모니터링 | 완료 | 동일 스크립트로 실행 |
| 증거: Latency 폭발·실패율 시점 그래프 캡처 | 완료 | [HPA_미적용/](./HPA_미적용/) 폴더에 스크린샷·결과 요약 |

**Baseline 수치 (2026-02-15, HPA 미적용):**

| 런 | http_req_failed | 총 요청 | RPS | vus_max | 비고 |
|------|-----|------|-----|------|------|
| **3000 VU (timeout 35s)** | **51.88%** (35,042/67,540) | 67,540 | 약 281 | 2,992/3,000 | 단일 파드 CPU 100% 포화, 타임아웃 다수 |
| 3000 VU (timeout 20s) | 39.45% (22,994/58,274) | 58,274 | 약 266 | 2,992/3,000 | 동일 조건, timeout만 20s |
| **1000 VU (한계 구간)** | **4.51%** (1,072/23,733) | 23,733 | **약 152.5** | 999/1,000 | 단일 파드로 실패율 최대한 줄인 구간, Web CPU ~80% |

**증거:** [HPA_미적용/README.md](./HPA_미적용/README.md), [Baseline_K6_51.88퍼_실패_3000VU.png](./HPA_미적용/Baseline_K6_51.88퍼_실패_3000VU.png), [Baseline_K6_1000VU_4.51퍼_실패.png](./HPA_미적용/Baseline_K6_1000VU_4.51퍼_실패.png), [Baseline_Grafana_Web파드1개_CPU100_09-29.png](./HPA_미적용/Baseline_Grafana_Web파드1개_CPU100_09-29.png), [Baseline_Grafana_Web파드1개_CPU80_1000VU.png](./HPA_미적용/Baseline_Grafana_Web파드1개_CPU80_1000VU.png)

### 3.3 K6 스크립트 수치 보정

동일 스크립트로 Baseline(파드 1개) vs HPA 비교 시 아래를 참고한다.

| 항목 | 현재 값 | 보정 제안 | 비고 |
|------|---------|-----------|------|
| **timeout** | 35s | **30s** (선택) | fail을 조금 더 빨리 감지. 35s 유지해도 비교에는 무방 |
| **stages** | 30s 150 → 1m 500 → 1m 1500 → 1m 3000 | **비교용은 동일 유지** | Baseline과 HPA 런을 같은 조건으로 돌려야 51.88% vs 3.10% 같은 비교 가능 |
| **Breaking Point만 보고 싶을 때** | — | 30s 100 → 1m 300 → 1m 800 → 1m 1500 (3000 생략 또는 추가 1m) | 실패율이 가장 적어지는 구간의 상한이 “1 pod가 버틸 수 있는 최대”에 가깝다. 1500에서 끊으면 1 pod 한계 구간을 더 잘 구분 가능 |
| **sleep** | 1 | 1 유지 | 0.5면 RPS 더 올라가서 더 빨리 한계, 2면 부하 완화 |

- **WARN [0238] Request Failed … request timeout:** 35s(또는 30s) 안에 응답이 안 와서 실패한 요청. 파드 1개일 때 3000 VU 구간에서 다수 발생 → 51.88% 실패로 이어짐.
- **참고 스크립트:** [load_test.js](./load_test.js) (동일 stages·35s 기준).

---

## 4. Task 1-3: HPA 적용 후 확장성 검증

**목표:** 동일 부하에서 HPA로 Replicas가 늘어나며 Latency가 안정화되는 모습을 기록한다.

### 4.1 설정 요약

- HPA 적용: min=1, max=10, cpu-percent=50 (Web 등 대상)
- 동일 `load_test.js` 재실행
- 확인: CPU 50% 초과 시 Replicas 증가, Latency 안정화 여부

### 4.2 진행 상황 및 적용 결과

| 항목 | 상태 | 비고 |
|------|------|------|
| HPA 설정 적용 (min=2, max=5, cpu=70%, memory=80%) | 완료 | 기존 web-server-hpa 유지 |
| 동일 load_test.js 실행 (내부 도메인) | 완료 | 2026-02-13 실행 |
| 증거: RPS 증가 그래프 + Replicas 증가 그래프 겹쳐 캡처 | 대기 | 필요 시 추가 캡처 |

### 4.3 결과 (Task 1-3 선행 수행, 2026-02-13)

Task 1-2(Baseline) 없이 **1-3(HPA 적용 상태)** 를 먼저 수행한 결과. 나중에 1-2 수행 후 Baseline vs HPA 비교 시 이 수치를 After 기준으로 사용하면 됨.

| 항목 | 값 |
|------|-----|
| 테스트 일시 | 2026-02-13 |
| 부하 경로 | 내부 도메인 (deepquest.192.168.0.110.nip.io), Funnel 미경유 |
| K6 설정 | 30s 50 VU → 1m 500 VU → 1m 1000 VU, 대상 `/api/health`, TLS 검증 스킵 |
| **http_req_failed** | **0.00%** (0 / 32,507) |
| **총 요청 수** | 32,507 |
| **RPS (평균)** | 약 **209 req/s** |
| **http_req_duration** | avg 976ms, med 338ms, p95 3.5s, max 30.97s |
| **Web Pod (테스트 전)** | 2개 |
| **Web Pod (테스트 후)** | **4개** (HPA 스케일업) |
| **web-server-hpa** | REPLICAS 4, TARGETS 24%/70% (테스트 종료 후 CPU 24%) |

요약: HPA 적용 상태에서 내부 도메인으로 부하 시 **실패 0%**, **약 209 RPS** 처리, Web 2→4 스케일업 확인. 이후 1-2 수행 시 단일 파드 Baseline과 비교용으로 사용.

### 4.4 한계치 테스트 (3000 VU, 2026-02-13)

동일 HPA 설정(min=2, max=5)에서 VU만 3000으로 올려 한계 구간 측정.

| 항목 | 값 |
|------|-----|
| 테스트 일시 | 2026-02-13 |
| K6 설정 | 30s 100 VU → 1m 1500 VU → 1m 3000 VU, 대상 `/api/health`, 내부 도메인 |
| **http_req_failed** | **24.74%** (14,416 / 58,254) |
| 실패 원인 | request timeout (응답 60초 초과) |
| **총 요청 수** | 58,254 |
| **RPS (평균)** | 약 **338 req/s** |
| **http_req_duration** | avg 2.51s, med 432ms, p90 8.88s, p95 15.37s, **max 1m0s** (타임아웃) |
| **Web Pod (테스트 후)** | 4개 유지 (HPA max=5, 4에서 유지). 1 Pod RESTART 1회 발생 |
| **web-server-hpa** | REPLICAS 4, TARGETS 0%/70%, 21%/80% (테스트 종료 후) |

요약: **3000 VU 구간에서 한계 도달.** RPS는 약 338까지 올라갔으나 타임아웃으로 24.74% 실패, p95 15초·max 1분. 1000 VU(0% 실패) 대비 약 3배 VU에서 처리 한계. 네트워크 피크 약 2MB/s로 여유 있었음 → 애플리케이션/연결 처리 한계로 판단.

#### 4.4.1 확장성 대안 (파드 리소스 축소 + HPA 증가)

CPU 사용률이 낮아도 동시 연결/이벤트 루프 한계로 타임아웃이 발생하므로, **파드당 리소스를 줄이고 HPA max를 올려** 파드 수를 늘리는 방안을 적용함.

| 구분 | 변경 전 | 변경 후 | 비고 |
|------|---------|---------|------|
| Web CPU request / limit | 500m / 2 | **250m / 1** | 파드당 부담 감소, 스케일아웃 유리 |
| Web Memory request / limit | 512Mi / 2Gi | **256Mi / 512Mi** (base) 또는 256Mi/1Gi (dev 패치) | OOM 방지 하한 유지 |
| Web HPA maxReplicas | 5 | **10** | 동시 처리량 상향 |

적용 위치: `infra/k8s/base/web/deployment.yaml`, `infra/k8s/base/web/hpa.yaml`.  
Overlay(dev) Web 메모리 limit 512Mi로 통일 (`overlays/dev/kustomization.yaml` 패치).

**클러스터 반영 (2026-02-14):**  
- HPA: `kubectl apply -f infra/k8s/base/web/hpa.yaml` → maxReplicas 10 적용됨.  
- Deployment: selector 불변으로 전체 apply 불가 → `kubectl patch deployment web-server -n deep-quest` 로 리소스만 반영 (requests 250m/256Mi, limits 1/512Mi).  
- ArgoCD 등으로 배포하는 경우 Git push 후 동기화하면 base/overlay 값이 반영됨.

### 4.5 재테스트 (2026-02-14, HPA max=10)

§4.4.1 적용 후(Web 리소스 축소, HPA max=10) 동일 3000 VU 스테이지로 재실행.

| 항목 | 값 |
|------|-----|
| 테스트 일시 | 2026-02-14 |
| K6 설정 | 30s 100 VU → 1m 1500 VU → 1m 3000 VU, 대상 `/api/health`, 내부 도메인 |
| **http_req_failed** | **44.59%** (23,190 / 52,003) |
| 실패 원인 | request timeout (60초 초과) |
| **총 요청 수** | 52,003 |
| **RPS (평균)** | 약 **298.5 req/s** |
| **http_req_duration** | avg 2.9s, med 232ms, p90 2.12s, **p95 19.45s**, max 1m0s |
| **Web Pod (테스트 후)** | **6개** (HPA 1→6 스케일업 정상) |
| **web-server-hpa** | REPLICAS 6/10, TARGETS 31%/80% (memory) |

**Grafana 관측:** Web Pod CPU에서 **한 파드(8ngps)만 100% 근처로 포화**, 나머지 Web 파드들은 거의 0%에 가깝게 유지됨. 네트워크 I/O는 피크 ~1MB/s 수준으로 여유 있음.

**정리:** HPA는 정상 동작(1→6 스케일)했으나, **부하가 일부 파드에만 집중**되어 해당 파드에서 응답 지연·타임아웃이 발생. 44.59% 실패와 높은 p95(19.45s)는 “응답 속도 문제”로 이어짐. 원인 후보: (1) 로드밸런싱/연결 분산 불균형, (2) 부하 상승 속도에 비해 스케일업이 늦어 일시적으로 한 파드가 과부하, (3) Node.js 단일 스레드·이벤트 루프 포화.

#### 4.5.1 응답 속도 개선 방향 (참고)

- **minReplicas 상향:** 부하 전부터 Web 2~4개 유지해 “처음부터” 분산 (현재 1에서 시작하면 램프업 구간에 한 파드만 받음).
- **HPA scale-up 속도:** `behavior.scaleUp` 에서 `stabilizationWindowSeconds` 축소·`policies` 로 폭증 시 더 빠르게 스케일업 검토.
- **Service/Ingress:** 기본은 round-robin이지만, 세션 어피니티 등으로 한쪽으로 쏠리지 않았는지 확인.
- **앱 레벨:** `/api/health` 외 무거운 핸들러·동기 I/O·DB 풀 부족 여부 점검.

#### 4.5.2 부하 시 에러: "다른 파드 리소스 올라간 뒤 타임아웃" (2026-02-14)

**관측:** K6 stages 완만화(150→500→1500→3000) + timeout 35s 적용 후에도, 부하가 올라가며 **다른 파드(또는 네트워크) 리소스가 올라가기 시작한 뒤 얼마 안 되어** 타임아웃 에러가 발생.

**원인 정리:**

- **Web Pod CPU는 낮은데 응답이 느려지는 이유:** 동시 연결 수가 많아지면 Node.js는 CPU를 크게 쓰지 않아도 **이벤트 루프·연결 처리**에서 지연이 생김. 그래서 “리소스(CPU)가 올라간다”보다 **연결/트래픽이 늘어나는 시점**과 에러 발생이 맞물림.
- **스케일 타이밍:** 파드가 늘어나기 전에 부하가 먼저 몰리면, 적은 수의 Web 파드가 많은 연결을 받다가 응답 지연 → 타임아웃.

**대응 (prod overlay 적용 권장):**

- **minReplicas 4 + replicas 4:** 테스트 시작 시부터 Web 4개로 두어, 램프업 구간에 파드 수 부족으로 인한 지연 완화.
- **scaleUp 4 pods / 45s:** 부하가 올라갈 때 파드가 더 빨리 늘어나도록 해, “리소스 올라가기 시작한 직후” 구간에서의 격차를 줄임.

위 설정은 `infra/k8s/overlays/prod/kustomization.yaml` 에 반영해 두었음. 적용 후 동일 K6 스크립트로 재테스트하면 타임아웃이 줄어들거나 더 높은 VU 구간에서나 발생할 가능성이 큼.

#### 4.5.3 3000 VU 최종 런 정리 (2026-02-15, prod minReplicas 4·scaleUp 적용 후)

**설정:** stages 30s 150 → 1m 500 → 1m 1500 → 1m 3000, timeout 35s, prod overlay(minReplicas 4, scaleUp 4 pods/45s) 적용.

**결과:**

| 항목 | 값 |
|------|-----|
| **http_req_failed** | **3.10%** (1,357 / 43,688) — 지금까지 로스 가장 적음 |
| 총 요청 수 | 43,688 |
| RPS (평균) | 약 185 req/s |
| http_req_duration | avg 4.54s, med 626ms, p95 31.73s, max 34.99s |
| vus_max | 2,993 / 3,000 도달, 테스트 완주 |

**관측:**

- **중간에 파드 하나가 잠깐 에러 나는 시점부터 에러가 뜨다가, 정상화되면서 다시 정상 응답**하는 패턴. Grafana에서 **AI 서버 파드 한 대가 CPU 100%(1)로 포화**되는 구간과 에러 발생 시점이 맞음. 해당 파드가 풀리거나 부하가 분산된 뒤 복구.

**증거:**

- [HPA_적용_후/3000vu_test/3000vu_K6_35s_3.10퍼_로스_완주_2993VU.png](./HPA_적용_후/3000vu_test/3000vu_K6_35s_3.10퍼_로스_완주_2993VU.png) — K6 총결과 (HPA 적용, 3.10% 실패)
- [HPA_적용_후/3000vu_test/README.md](./HPA_적용_후/3000vu_test/README.md) — 결과 요약·파일 목록

---

## 5. 산출물 체크리스트 및 증거

Day 1 최종 제출용. 완료 시 O 표시 및 경로/링크 기입.

| # | 산출물 | 완료 | 경로 또는 설명 |
|---|--------|------|----------------|
| 1 | [그래프] Baseline vs HPA: 죽던 서버가 HPA로 살아나는 비교 | 완료 | **수치·증거로 비교 완료.** 파드 1개: 51.88% 실패 (§3.2, [HPA_미적용/](./HPA_미적용/)). HPA 적용: 3.10% 실패 (§4.5.3, [HPA_적용_후/3000vu_test/](./HPA_적용_후/3000vu_test/)). 동일 스크립트·3000 VU. 비교 그래프 이미지 별도 제작 시 위 수치·스크린샷 활용 가능. |
| 2 | [수치] 단일 파드 Breaking Point (RPS 또는 Latency 폭발 시점) | 완료 | **3000 VU:** 51.88% 실패, p95 12.29s. **1000 VU 한계 구간:** 4.51% 실패, RPS 약 152.5, Web CPU ~80%. §3.2, [HPA_미적용/README.md](./HPA_미적용/README.md) |
| 3 | [수치] HPA 적용 후 최대 처리량(Max RPS) OOO 달성 | 완료 | 1000 VU: 약 209 RPS·0% 실패 (§4.3). 3000 VU: §4.4 338 RPS·24.74% 실패 → §4.5.3 **185 RPS·3.10% 실패, 2993 VU 완주** (minReplicas 4·scaleUp 적용 후) |
| 4 | Stress Test 대시보드 적용 완료 (Grafana에서 확인 가능) | 완료 | 대시보드 표시 확인됨 |

**현재 상태:** Task 1-1(대시보드), **Task 1-2(Baseline)**, Task 1-3(HPA 적용) 모두 수행 완료. Baseline(파드 1개): 3000 VU에서 51.88% 실패, 1000 VU에서 4.51% 실패·RPS 약 152.5(단일 파드 실패율 한계). HPA 적용 시 3000 VU 3.10% 실패. HPA 복구는 `kubectl apply -k infra/k8s/overlays/prod` 또는 ArgoCD 동기화로 적용.

---

## 6. 참고 자료

- **모니터링 README:** [infra/k8s/monitoring/README.md](../k8s/monitoring/README.md)
- **기존 대시보드 설계:** [infra/k8s/docs/GRAFANA_DEEP_QUEST_DASHBOARD.md](../k8s/docs/GRAFANA_DEEP_QUEST_DASHBOARD.md)
- **사전점검 상세:** [Task1-1_사전점검_결과](./Task1-1_사전점검_결과.md)
