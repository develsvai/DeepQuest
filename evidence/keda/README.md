# KEDA 실험 초안 정리

## 1. 실험 목적

이번 단계의 목적은 `concurrent_max=40` 실험에서 확인한 backlog 적체를 기준으로, `ai-server`를 `KEDA`로 자동 확장시키는 것이다.

이전 실험에서 이미 확인한 사실은 아래와 같다.

1. AI worker는 `40`에서 포화된다.
2. 초과 부하는 즉시 실패하지 않고 `queue backlog`로 적체된다.
3. 외부 Gemini API 호출은 전역 rate limiter로 통제된다.

즉, 이제 검증하고 싶은 핵심 가설은 다음과 같다.

1. backlog가 일정 수준 이상 쌓이면 `KEDA`가 이를 감지해 `ai-server replica`를 늘린다.
2. replica가 늘어난 뒤 backlog 증가 속도가 둔화되거나 backlog가 감소한다.
3. 같은 부하에서 `Jobs Completed/sec`는 개선되고, `P95/P99 latency`는 완화된다.

---

## 2. 왜 KEDA가 필요한가

현재 구조에서는 AI 부하가 `CPU`보다 `queue backlog`에서 먼저 드러난다.

실제 실험에서도 확인된 흐름은 아래와 같았다.

- 앞단 enqueue 부하는 높음
- worker는 `40`에서 포화
- `Queue Backlog` 급증
- 하지만 CPU/Memory만으로는 확장 타이밍을 잘 잡지 못함

즉, AI 서버는 아래 기준으로 확장하는 것이 더 자연스럽다.

> `CPU`가 아니라 `queue backlog`가 실제 부하 지표다.

그래서 이번 단계에서는 기존 `ai-server-hpa` 대신, `Prometheus scaler` 기반 `KEDA ScaledObject`를 사용해 `sum(ai_job_queue_pending)`을 직접 읽고 확장하도록 설계했다.

---

## 3. 현재 설계안

### 3-1. 스케일 기준

KEDA는 아래 Prometheus 쿼리를 기준으로 `ai-server`를 확장한다.

```promql
sum(ai_job_queue_pending)
```

### 3-2. 스케일 대상

- target: `Deployment/ai-server`

### 3-3. 주요 설정값

- `pollingInterval: 15`
- `cooldownPeriod: 300`
- `minReplicaCount: 1`
- `maxReplicaCount: 10`
- `threshold: 40`
- `activationThreshold: 1`

### 3-4. threshold=40 의미

이 값은 이전 실험에서 검증한 worker 상한과 연결된다.

- 파드 1개는 최대 `40`개 동시 처리
- backlog가 `40` 이상 쌓이면, 이미 파드 1개 분량이 꽉 찼다는 뜻

즉:

> backlog `40`은 `AI pod 1개가 이미 포화되었다`는 신호로 해석할 수 있다.

---

## 4. 가용성 관점에서 같이 반영한 내용

KEDA만 넣는 것이 아니라, `ai-server`의 운영상 안전장치도 함께 정리했다.

반영 내용:

- 기존 `ai-server-hpa` 제거
- `ai-server`를 KEDA가 관리하도록 전환
- `ai-server-pdb` 추가
  - `minAvailable: 1`

의미:

- 기존 CPU/Memory HPA와 KEDA가 동시에 같은 Deployment를 관리하면 충돌한다.
- 따라서 `ai-server-hpa`는 제거되어야 한다.
- 동시에 voluntary disruption에 대한 최소 보호를 위해 `PDB`를 추가했다.

---

## 5. 현재 상태 메모

현재까지 확인된 상태:

- `KEDA` 컨트롤러 설치 완료
- `CRD` 생성 완료
- `external.metrics.k8s.io` APIService 정상
- `ScaledObject` 매니페스트 작성 완료
- `ai-server-hpa`와 충돌 없이 전환하려면 기존 HPA가 먼저 prune 또는 삭제되어야 함

즉, 현재 구조상 핵심 전제는 이것이다.

> `ai-server-hpa`가 제거된 상태에서만 `ai-server-keda`가 정상 생성된다.

---

## 6. 실험 시나리오

### 6-1. baseline

평상시 기대 상태:

- `ai-server` replica = `1`
- `Queue Backlog` 거의 없음
- `ai-server-keda-hpa`가 생성되어 있으나 desired는 `1`

### 6-2. 부하 유입

Locust로 이전과 동일한 enqueue 부하를 준다.

주요 요청:

- `POST AI /threads`
- `POST AI /runs (enqueue)`
- `GET AI /ok`
- `GET Web /api/health`

### 6-3. 기대 흐름

1. 초기에는 `ai-server=1`
2. `Worker Busy`가 `40` 근처에서 포화
3. `Queue Backlog` 증가
4. KEDA가 backlog를 감지
5. `ai-server replica` 증가
6. 이후 backlog 증가 속도 둔화 또는 backlog 감소
7. `Jobs Completed/sec` 증가 또는 안정화

즉 최종적으로 보여주고 싶은 흐름은 이것이다.

> `backlog 증가 -> KEDA scale out -> 처리량 개선`

---

## 7. 확보해야 할 증거

이번 KEDA 실험에서 가장 중요한 건 “확장 전후 흐름”을 한 눈에 보여주는 것이다.

필수 증거는 아래 7개다.

### 7-1. KEDA 리소스 존재 증거

필요한 것:

- `kubectl get scaledobject -n deep-quest`
- `kubectl describe scaledobject ai-server-keda -n deep-quest`
- `kubectl get hpa -n deep-quest`

보여줄 메시지:

- 기존 `ai-server-hpa`는 사라졌다
- 대신 `ai-server-keda`와 `ai-server-keda-hpa`가 생성되었다

### 7-2. backlog 증가 그래프

필요한 패널:

- `Queue Backlog`

보여줄 메시지:

- 부하 직후 backlog가 실제로 쌓이기 시작했다

### 7-3. worker 포화 그래프

필요한 패널:

- `Worker Busy`

보여줄 메시지:

- worker는 여전히 `40`에서 먼저 포화된다
- 즉 scale trigger의 출발점은 worker saturation + queue 적체다

### 7-4. replica 증가 그래프

필요한 패널:

- `HPA Replicas`

보여줄 메시지:

- backlog가 쌓인 이후 `ai-server desired/available replicas`가 실제로 증가했다

### 7-5. 처리량 개선 그래프

필요한 패널:

- `Jobs Completed/sec`
- 가능하면 `Jobs Failed/sec`

보여줄 메시지:

- scale 전후 처리 완료율이 증가했는지
- 실패율이 폭주하지 않는지

### 7-6. latency 완화 그래프

필요한 패널:

- `Ingress RPS`
- `P95 latency`
- `P99 latency`

보여줄 메시지:

- 같은 부하에서 scale 이후 tail latency가 완화되었는지

### 7-7. KEDA operator 로그

필요한 로그:

```bash
kubectl logs -n keda deploy/keda-operator --tail=200
```

또는

```bash
kubectl describe scaledobject -n deep-quest ai-server-keda
```

보여줄 메시지:

- KEDA가 Prometheus metric을 읽고 replica 계산을 시도했다

---

## 8. 있으면 더 좋은 추가 증거

### 8-1. Locust 결과 화면

보여줄 메시지:

- 앞단 enqueue 부하는 충분히 높았다
- scale 전후 동일한 강도의 부하를 비교할 수 있다

### 8-2. Gemini 사용량 콘솔

보여줄 메시지:

- KEDA로 pod 수가 늘어나도 외부 Gemini API 사용량은 전역 rate limiter 아래에서 통제된다

### 8-3. ai-server 성공 로그

예:

```text
Background run succeeded ... run_wait_time_ms=...
```

보여줄 메시지:

- scale 전에는 wait time이 매우 크고
- scale 후에는 wait time이 줄어드는지 비교 가능

---

## 9. 성공 기준

이번 실험은 아래 조건을 만족하면 성공으로 볼 수 있다.

1. `Queue Backlog` 증가 후 `ai-server replica`가 증가한다.
2. `ai-server-keda-hpa`가 실제 desired replica를 올린다.
3. scale 이후 backlog 증가 속도가 둔화되거나 감소한다.
4. `Jobs Completed/sec`가 개선된다.
5. `5xx` 또는 실패율이 폭주하지 않는다.

즉 핵심 메시지는 다음과 같다.

> `CPU`가 아니라 `backlog`를 기준으로 확장했더니,  
> AI 시스템이 실제 병목 신호에 더 잘 반응하게 되었다.

---

## 10. 실패 기준

아래 경우는 재해석이 필요하다.

1. backlog가 커져도 replica가 늘지 않음
2. replica는 늘었지만 backlog가 전혀 줄지 않음
3. replica 증가 전에 이미 5xx가 폭주함
4. `ScaledObject` 상태에 metric read 오류가 남음
5. KEDA와 기존 HPA가 충돌함

이 경우엔 threshold, polling interval, Prometheus query, replica 정책 중 하나를 다시 조정해야 한다.

---

## 11. 최종 목표 문장

이번 KEDA 단계에서 최종적으로 만들고 싶은 문장은 아래와 같다.

> `concurrent_max=40`으로 내부 동시 처리량을 통제한 뒤,  
> backlog 기반 KEDA를 적용해 실제 적체 신호에 따라 `ai-server`를 자동 확장시켰다.  
> 그 결과 기존 CPU 기반 HPA보다 실제 병목에 더 직접적으로 반응하는 오토스케일링 구조를 구현했다.
