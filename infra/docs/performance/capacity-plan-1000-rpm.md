# Capacity Plan For 1000 RPM

확인 시점: `2026-04-20 KST`
대상 환경: `deep-quest` 1000 RPM 목표, Web/AI 배포 경로

## 목적

이 문서는 1000 RPM 목표를 현재 실험 결과 기준으로 다시 정의한다.

과거 계산은 `N_JOBS_PER_WORKER * pod count`를 곧 처리량으로 보는 경향이 있었지만, Day2 실험 결과상 그것만으로는 부족하다. 이제 기준은 실제 완료 run 수, queue 대기, 504, 외부 API quota를 함께 보는 방식이어야 한다.

## 목표 해석

1000 RPM은 평균 약 `16.7 RPS`다.

하지만 AI resume parsing은 요청 하나가 즉시 끝나는 API가 아니다. 요청당 처리 시간이 2분이면, steady state에서 약 1000개의 작업이 동시에 진행되거나 대기해야 한다. 따라서 목표는 단순 ingress RPS가 아니라 아래 항목으로 나눠야 한다.

- 요청 접수율: 분당 1000개를 받는가
- 실제 시작률: LangGraph worker가 run을 실제로 집어가는가
- 완료율: 일정 시간 안에 완료된 run이 분당 1000개 수준인가
- 실패율: 504, 429, timeout, app error가 허용 범위인가
- 대기열: queue wait이 계속 증가하지 않는가

## 현재 검증된 사실

| 영역 | 관측값 | 의미 |
| --- | --- | --- |
| Web `/api/health` | HPA 조정 후 3000 VU 실험에서 실패율 `3.10%` | Web 계층은 HPA로 크게 개선됐다. 단, AI 전체 플로우 검증은 아니다. |
| Web 단일 pod | 3000 VU에서 실패율 `51.88%`, 1000 VU에서 실패율 `4.51%` | baseline은 명확히 한계가 있었다. |
| AI soft failure | Locust 성공 `7,680` vs 실제 `run_id` 약 5개 | HTTP 성공은 AI 처리 완료가 아니다. |
| AI production runtime | `Starting 40 background workers`, Redis/Postgres 연결 확인 | worker 40 기반 보호 구조는 검증됐다. |
| AI limiter 단계 | cluster limiter `60 RPS`, worker `40`, `Jobs Completed/sec` 약 `0~1.2/s`, backlog 적체 | 외부 API 보호와 내부 backlog 적체 구조는 증명됐다. |
| AI KEDA 최종 재실험 | `desired=10`, `available=10`, worker `400`, backlog `10K -> 7K`, `Jobs Completed/sec` 약 `20` | backlog 기반 scale-out이 실제 처리량 개선으로 이어졌다. |
| 외부 API | Google quota headroom `4000 RPM`, cluster limiter `60 RPS` | quota headroom은 넓어졌지만 실제 운영 보호 장치는 limiter다. |

## 주요 병목 후보

1. 외부 API quota
   - Gemini 호출이 request당 1회 이상이면 1000 RPM은 외부 quota에 바로 닿을 수 있다.
   - Locust에서 504/실패가 늘어난 구간은 외부 API rate limit, proxy timeout, scaling 부족을 함께 의심해야 한다.

2. LangGraph worker와 queue
   - worker 수가 늘어도 실제 완료율은 graph node 구현, blocking I/O, GIL, DB/Redis latency에 묶일 수 있다.
   - `N_JOBS_PER_WORKER`는 시작 로그와 completion rate로 검증해야 한다.
   - 다만 최신 evidence에서는 worker `400`과 backlog 감소가 함께 관찰돼, scale-out 자체는 더 이상 가설이 아니라 검증된 사실이다.

3. timeout chain
   - ingress, Web proxy, AI runtime, PDF download, LLM timeout이 서로 맞지 않으면 504가 먼저 보인다.
   - timeout을 늘리는 것만으로는 queue 증가를 해결하지 못한다.

4. database/redis capacity
   - Redis queue, Postgres connection pool, LangGraph checkpoint/write path가 병목이 될 수 있다.
   - worker 수를 올리면 DB connection도 같이 확인해야 한다.

5. autoscaling signal
   - AI 경로는 CPU가 낮아도 queue가 쌓일 수 있다.
   - CPU HPA보다 queue depth, queue wait, pending run 같은 지표가 scaling signal에 가깝다.
   - 최신 KEDA 재실험은 이 가설을 뒷받침한다. backlog 신호가 `desired=10`, `available=10`, `20 ops/s` 개선으로 연결됐다.

## 권장 단계

### 1단계: 측정 기준 고정

- Locust 성공률만 보지 않는다.
- `actual completed run`, `unique run_id`, `run_queue_ms`, `worker active/available/max`, ingress 504를 같은 표에 기록한다.
- sample PDF와 테스트 payload를 고정한다.

### 2단계: 안정 목표부터 잡기

- 먼저 1000 RPM이 아니라 낮은 RPS에서 실패율과 queue 증가가 0에 가까운 구간을 찾는다.
- 그 구간에서 외부 API 호출 수와 completion rate를 계산한다.
- 이 값이 1000 RPM으로 선형 확장 가능한지 확인한다.

### 3단계: 외부 API 보호

- Gemini 호출에 global rate limit 또는 queue backpressure를 둔다.
- quota 초과를 504로 흘려보내지 말고 명시적인 retry/backoff/429 정책으로 분리한다.
- 테스트 중 quota를 넘는지 로그와 metric으로 확인한다.

### 4단계: AI runtime 병렬성 검증

- production image의 worker 시작 로그를 확인한다.
- graph node가 동기 `def` 중심이면 async 전환 또는 blocking I/O 격리를 검토한다.
- worker 수를 올릴 때 DB/Redis connection과 memory를 같이 본다.

### 5단계: queue 기반 autoscaling

- KEDA가 live에서 pause 상태인지 확인한다.
- queue metric threshold가 실제 queue wait과 맞는지 검증한다.
- CPU HPA와 queue scaling이 충돌하지 않게 기준을 정리한다.

### 6단계: 클러스터 확장 판단

- 위 단계를 거친 뒤에도 pod 수나 worker 수가 물리 리소스에 막히면 worker node 확장을 판단한다.
- 클러스터 확장은 병목 제거 이후 마지막에 결정한다.

## 하지 말아야 할 해석

- `N_JOBS_PER_WORKER=40`이므로 pod 25개면 1000 concurrent가 된다고 단정하지 않는다.
- Locust HTTP 200 수를 실제 AI 처리 완료 수로 보지 않는다.
- CPU가 낮다는 이유만으로 AI 계층에 여유가 있다고 판단하지 않는다.
- K6 `/api/health` 결과를 AI 전체 플로우의 용량으로 대체하지 않는다.
- quota headroom `4000 RPM`이 있으니 실제 운영도 자동으로 `66 RPS`로 흘러간다고 가정하지 않는다. 실험 기준은 cluster limiter `60 RPS`였다.

## 다음 검증 산출물

다음 1000 RPM 검증을 할 때는 최소한 아래 값을 남긴다.

| 항목 | 기록해야 하는 값 |
| --- | --- |
| 배포 버전 | deploy branch commit, image tag, ArgoCD sync 상태 |
| Locust 조건 | users, spawn rate, duration, host, payload |
| 접수 결과 | total requests, RPS, HTTP failure rate |
| 실제 처리 | unique run_id, completed run, failed run |
| queue | queue depth, `run_queue_ms`, worker active/available/max |
| 외부 API | Gemini request count, 429/rate limit 여부 |
| timeout | ingress 504, Web proxy error, AI app error |
| 리소스 | AI/Web CPU, memory, pod count, restart |

## 관련 문서

- [locust-day2-summary.md](locust-day2-summary.md)
- [ai-rate-limit-and-keda-summary.md](ai-rate-limit-and-keda-summary.md)
- [k6-day1-summary.md](k6-day1-summary.md)
- [load-test-execution.md](load-test-execution.md)
