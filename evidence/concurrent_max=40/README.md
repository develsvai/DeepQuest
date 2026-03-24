# concurrent_max=40 실험 총정리

## 1. 실험 목적

이 실험의 목적은 `AI worker`에 동시 처리 상한을 두었을 때 시스템이 어떻게 반응하는지 검증하는 것이었다.

검증하고 싶었던 핵심 가설은 아래 3가지다.

1. `concurrent_max=40`을 적용하면 AI 파드는 한 번에 40개까지만 작업을 처리한다.
2. 초과 부하는 즉시 실패하지 않고 `queue backlog`로 적체된다.
3. 외부 Gemini API 호출은 전역 rate limiter에 의해 통제되며, quota 초과 없이 처리된다.

---

## 2. 설계 과정

### 2-1. 왜 `concurrent_max=40`인가

현재 구조는 `Web -> LangGraph run enqueue -> AI worker -> Gemini API` 흐름이다.

앞단 Web은 높은 RPS를 받아도, 실제 AI 처리는 오래 걸리는 비동기 작업이라 뒷단 worker가 병목이 된다.  
따라서 "들어온 요청을 다 즉시 처리하려는 구조"보다, "파드가 감당 가능한 만큼만 처리하고 나머지는 큐에 적체"시키는 구조가 더 안전하다.

이번 실험에서는 파드 내부 동시 처리 상한을 다음과 같이 두었다.

- `N_JOBS_PER_WORKER=40`

즉, 한 AI 파드는 동시에 최대 40개 작업까지만 실행하고, 나머지는 backlog로 대기시키는 방향으로 보호 로직을 검증했다.

### 2-2. 외부 API 보호

내부 동시성 제한과 별개로 Gemini 호출은 Redis 기반 전역 rate limiter로 제한했다.

라이브 설정값:

- `GEMINI_GLOBAL_RATE_LIMIT_ENABLED=true`
- `GEMINI_GLOBAL_RATE_LIMIT_RPS=60`
- `GEMINI_GLOBAL_RATE_LIMIT_BURST=60`
- `GEMINI_GLOBAL_RATE_LIMIT_WAIT_TIMEOUT_SECONDS=15`

주의:

- 이 실험의 라이브 값은 `66 RPS`가 아니라 `60 RPS`였다.
- 문서와 발표 자료에도 `60 RPS 제한`으로 적는 것이 정확하다.

---

## 3. 실험 환경

### 3-1. 라이브 배포 상태

- AI 이미지: `harbor.192.168.0.110.nip.io/deep-quest/ai:156-7d10ae6`
- Redis 연결: `redis://redis-service:6379`
- Worker 동시성: `40`
- Gemini 전역 제한: `60 RPS`

### 3-2. 부하 생성 방식

Locust 시나리오는 "실제 완료 대기"가 아니라 "enqueue 부하 생성" 중심으로 구성했다.

주요 요청:

- `POST AI /threads`
- `POST AI /runs (enqueue)`
- `GET AI /ok`
- `GET Web /api/health`

실험 중 Locust 관측값:

- `AI /runs (enqueue)`: 약 `118~138 req/s`
- `AI /threads`: 약 `118~138 req/s`
- 전체 집계: 약 `255~297 req/s`
- 실패: 매우 낮음 (`0.00%` 수준, 일부 `502`만 관찰)

즉, 앞단은 초당 수백 건에 가까운 접수 부하를 만들었고, 이 부하가 실제 worker saturation과 backlog를 유발하는지 확인했다.

---

## 4. 핵심 실험 결과

### 4-1. Worker는 실제로 40에서 포화되었다

Grafana와 런타임 로그에서 모두 확인되었다.

대표 로그:

```text
2026-03-23T05:00:57.225787Z Worker stats active=40 available=0 max=40
2026-03-23T05:02:06.040667Z Worker stats active=40 available=0 max=40
2026-03-23T05:03:08.149193Z Worker stats active=40 available=0 max=40
```

해석:

- 실제 worker는 `40`개까지 꽉 찼다.
- `available=0`이므로 추가 작업을 즉시 실행할 여유가 없었다.
- `concurrent_max=40` 보호 로직은 의도대로 동작했다.

### 4-2. 초과 부하는 실패보다 backlog로 쌓였다

Grafana에서 `Queue Backlog`는 빠르게 증가했다.

관측 흐름:

- 초기에는 backlog가 거의 없음
- worker가 40에서 포화된 이후 backlog가 수천 단위로 증가
- 이후 더 큰 캡처에서는 backlog가 `2만~3만` 단위까지 상승

해석:

- 들어온 요청을 모두 즉시 처리하려 하지 않고
- worker가 감당할 수 없는 초과분은 큐에서 대기했다
- 즉, 시스템은 "즉시 붕괴"보다 "통제된 적체"를 선택했다

### 4-3. 완료 처리량은 낮지만 유지되었다

`Jobs Completed/sec`는 대략 `0~1.2/s` 수준으로 관찰되었다.

해석:

- 이 실험은 enqueue 부하가 매우 높았고
- 각 AI 작업 시간이 길어서
- 실제 완료율은 낮게 보이는 것이 자연스럽다
- 중요한 점은 worker가 포화된 상태에서도 처리 완료가 계속 발생했다는 것이다

### 4-4. 실패율은 폭주하지 않았다

관측 결과:

- `Jobs Failed/sec`: 거의 `0`
- `Worker Success Rate`: 후반부 `100%`
- Locust 실패율: 매우 낮음

Locust 에러 보고:

- 일부 `502 Bad Gateway`가 있었지만 전체 대비 극히 적었다

해석:

- 초과 부하가 즉시 대량 실패로 이어지지는 않았다
- 이번 구조는 "에러 폭주"보다 "대기열 적체"로 부하를 흡수했다

### 4-5. backlog는 런타임 로그에서도 확인되었다

대표 성공 로그:

```text
2026-03-23T05:02:06.069929Z Background run succeeded run_completed_in_ms=794574 run_exec_ms=167031 run_wait_time_ms=627529
2026-03-23T05:02:06.116674Z Background run succeeded run_completed_in_ms=794441 run_exec_ms=149459 run_wait_time_ms=644968
2026-03-23T05:02:06.116915Z Background run succeeded run_completed_in_ms=793922 run_exec_ms=38732 run_wait_time_ms=755176
2026-03-23T05:02:06.117254Z Background run succeeded run_completed_in_ms=793883 run_exec_ms=32559 run_wait_time_ms=761309
```

해석:

- `run_exec_ms`보다 `run_wait_time_ms`가 훨씬 큰 작업이 존재했다
- 이는 작업 자체 실행보다 "큐에서 대기한 시간"이 더 길었다는 뜻이다
- 따라서 backlog 적체는 대시보드뿐 아니라 실제 런타임 로그로도 확인된다

### 4-6. 외부 Gemini API 사용량은 통제되었다

클러스터 로그상 Gemini 호출은 정상 `200 OK`가 관찰되었고, 샘플링 로그 기준 `429`는 확인되지 않았다.

Gemini 사용량 화면에서도:

- 외부 API 요청 수는 제한된 규모로만 증가
- 성공률은 약 `98.62%`
- 하루 기준 요청 수 `217`

해석:

- 앞단 enqueue 부하는 매우 높았지만
- 실제 외부 Gemini 호출은 제한된 속도로만 소모되었다
- 즉, Redis 기반 전역 rate limiter는 실효성이 있었다

주의:

- 이 숫자는 앞단 request rate와 직접 1:1 비교하면 안 된다
- `run 1개 = Gemini 호출 1번`이 아닐 수 있고
- 앞단은 "접수 처리량", Gemini 콘솔은 "실제 외부 호출량"이기 때문이다

---

## 5. 최종 결론

이번 실험으로 확인된 사실은 아래와 같다.

1. `concurrent_max=40`은 실제로 동작했다.
2. worker는 `40`에서 포화되었고, 초과 요청은 backlog로 적체되었다.
3. 완료율은 낮지만 유지되었고, 실패율은 폭주하지 않았다.
4. 외부 Gemini API 호출은 통제된 속도로만 빠져나갔다.

즉, 현재 구조는 다음과 같이 설명할 수 있다.

> 높은 enqueue 부하가 들어와도, AI worker는 `40`개까지만 동시에 처리하고 초과 작업은 queue에 적체시킨다.  
> 이 과정에서 시스템은 즉시 붕괴하지 않고, backlog를 통해 부하를 흡수한다.  
> 동시에 외부 Gemini API 호출은 전역 rate limiter로 보호되어 quota 초과를 피한다.

---

## 6. 이번 실험의 한계

이번 실험으로는 아래 항목까지는 확정하지 않았다.

- `60 RPS` limiter가 실제 최대치까지 정확히 맞닿아 동작했는지
- `66 RPS` 설정 실험 결과
- backlog 기반 자동 scale-out 결과

즉 이번 실험은 어디까지나:

> `concurrent_max=40` 보호 로직과 backlog 적체 구조를 증명한 1차 실험

으로 보는 것이 맞다.

---

## 7. 다음 단계

다음 단계는 `KEDA` 기반 backlog scaling 검증이다.

이어질 질문은 아래와 같다.

1. backlog가 일정 수준 이상 쌓이면 replica를 늘릴 수 있는가
2. scale-out 이후 backlog 증가 속도가 둔화되거나 감소하는가
3. 같은 부하에서 latency와 completion rate가 개선되는가

즉 다음 실험은:

> `worker 40 포화 -> backlog 증가 -> KEDA scale-out -> backlog 완화`

이 흐름을 증명하는 단계가 된다.

---

## 8. 이 폴더의 증거 파일

- `ai-load-test-important-logs.txt`
  - worker 포화
  - backlog wait time
  - Gemini 호출 성공 로그
  - 라이브 env 설정값

- 스크린샷들
  - Worker Busy
  - Queue Backlog
  - Jobs Completed/sec
  - Success Rate
  - Ingress RPS / P95 / P99
  - HPA Replicas
  - Gemini 사용량 화면
  - Locust 결과 화면
