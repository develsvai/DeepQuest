# AI Rate Limit And KEDA Summary

확인 시점: `2026-04-23 KST`
대상 환경: `deep-quest` AI queue, Gemini limiter, KEDA, Locust

## 목적

이 문서는 `concurrent_max=40` 이후 이어진 AI 처리량 개선 실험을 하나의 축으로 정리한다.

핵심 질문은 네 가지였다.

1. 외부 `Gemini 2.5 flash-lite` 호출을 quota보다 낮은 안정 구간으로 고정할 수 있는가
2. worker `40` 상한이 실제 backlog 신호로 관찰되는가
3. queue metric을 기반으로 `ai-server`를 실제 scale-out할 수 있는가
4. scale-out이 단순 desired replica 증가가 아니라 실제 처리량 개선으로 이어지는가

## 실험 전제

- Google quota headroom은 `4000 RPM`, 약 `66 RPS` 수준까지 올려 두었다
- 실제 클러스터 실험은 Redis 기반 전역 limiter `60 RPS`를 기준으로 진행했다
- AI pod 내부 동시 처리 상한은 `concurrent_max=40`이다
- backlog 관측 metric과 `Jobs Completed/sec` / `Jobs Failed/sec`가 exporter로 노출된다
- autoscaling은 Prometheus query `sum(ai_job_queue_pending)`를 읽는 `KEDA ScaledObject`로 수행한다

즉 외부 quota는 headroom 역할이고, 실제 운영 보호 장치는 클러스터 내부 limiter `60 RPS`와 backlog 기반 KEDA였다.

## 실험 순서와 결과

| 단계 | 조건 | 핵심 관측값 | 해석 |
| --- | --- | --- | --- |
| 1 | `concurrent_max=40` + Redis Gemini limiter `60 RPS` | `Worker stats active=40 available=0 max=40`, `Jobs Completed/sec` 약 `0~1.2/s`, `run_wait_time_ms`가 `627~761s` 수준까지 관측 | worker 40 상한은 실제로 포화됐고, 초과 부하는 실패보다 backlog 적체로 흡수됐다 |
| 2 | queue metric / throughput metric exporter 적용 | `Queue Backlog`, `Worker Busy`, `Jobs Completed/sec`, `Jobs Failed/sec`, success rate를 한 화면에서 관찰 가능 | CPU/HPA 대신 queue를 스케일 신호로 삼을 근거가 확보됐다 |
| 3 | KEDA 1차 재실험 + `Postgres max_connections=200` | `desired=10`, 실제 `available=4`, worker busy 약 `160`, backlog `0 -> 18K`, `Jobs Completed/sec` 약 `1.8~2.0/s`, `Insufficient cpu` | KEDA는 반응했지만 실제 pod 가용 수가 부족해 처리량 개선이 제한됐다 |
| 4 | KEDA 2차 재실험 + `cpu request=200m` + `Postgres max_connections=500` + async 개선 | `desired=10`, `available=10`, worker busy 약 `400`, backlog `10K -> 7K`, `Jobs Completed/sec` 약 `3~4 -> 20`, 실패율 `0.04%` | scale-out이 실제 pod 증가와 처리량 개선으로 이어졌고, backlog도 감소 전환됐다 |

## 외부 quota와 rate limiter 해석

이번 축에서 중요한 건 "quota를 올렸다"와 "실험이 실제로 그 값으로 돌았다"를 구분하는 것이다.

- operator 변경: Google quota를 `4000 RPM`, 약 `66 RPS` 수준으로 상향
- 실제 클러스터 설정: `GEMINI_GLOBAL_RATE_LIMIT_RPS=60`
- evidence 메모: "`66 RPS`가 아니라 `60 RPS` 제한으로 적는 것이 정확하다"

즉 이번 실험의 근거 문장은 이렇게 쓰는 게 맞다.

> 외부 quota headroom은 `4000 RPM`으로 늘렸지만, 실제 클러스터는 Redis 기반 전역 limiter `60 RPS`로 보호한 상태에서 검증했다.

## 1차 보호 효과: worker 40 포화와 backlog 적체

`concurrent_max=40` evidence에서 아래 로그가 반복됐다.

```text
2026-03-23T05:00:57.225787Z Worker stats active=40 available=0 max=40
2026-03-23T05:02:06.040667Z Worker stats active=40 available=0 max=40
2026-03-23T05:03:08.149193Z Worker stats active=40 available=0 max=40
```

그리고 완료 로그에는 실행 시간보다 대기 시간이 더 긴 작업이 보였다.

```text
run_completed_in_ms=794574 run_exec_ms=167031 run_wait_time_ms=627529
run_completed_in_ms=793883 run_exec_ms=32559 run_wait_time_ms=761309
```

이 단계의 의미는 명확하다.

- worker는 실제로 `40`에서 포화됐다
- 추가 작업은 바로 실패하지 않고 queue에 적체됐다
- 외부 Gemini 호출은 limiter 아래에서 정상 `200 OK`로 관찰됐다

즉 이 단계는 "무한 동시 처리"가 아니라 "40개까지만 처리하고 나머지는 backlog로 누적"하는 보호 구조를 증명했다.

## 2차 보호 효과: queue metric을 scaling 신호로 전환

backlog와 처리율 metric을 노출한 뒤부터는 AI 확장을 CPU가 아니라 queue 상태로 판단할 수 있게 됐다.

이 구조에서 KEDA 설정은 다음 의미를 가진다.

- target: `Deployment/ai-server`
- min replicas: `1`
- max replicas: `10`
- trigger query: `sum(ai_job_queue_pending)`
- threshold: `40`

threshold `40`은 "파드 1개가 감당하는 worker 상한 40이 꽉 찼다"는 신호와 대응한다.

## KEDA 1차 재실험: desired는 10, available은 4

`Postgres max_connections=200` 재실험에서는 KEDA가 backlog를 감지해 `desired=10`까지 올렸다.

하지만 실제 가용 pod는 `4` 수준에 머물렀고, events에는 `Insufficient cpu`가 남았다.

이 단계의 핵심 수치:

- aggregate req/s 약 `217.56`
- 실패 `2건 (0.01%)`
- worker busy 약 `160`
- backlog `0 -> 18K`
- `Jobs Completed/sec` 약 `1.8~2.0/s`

즉 KEDA 자체는 동작했지만, cluster CPU 수용량이 scale-out의 실제 상한이었다.

## KEDA 2차 재실험: desired 10, available 10, worker 400

후속 재실험에서는 다음 튜닝이 함께 들어갔다.

- `ai-server cpu request=200m`
- `Postgres max_connections=500`
- 주요 AI 경로 async 개선

이 단계의 evidence는 지금까지 중 가장 좋다.

### Locust

- aggregate `23,714 requests`
- 실패 `9건 (0.04%)`
- aggregate `131.81 req/s`
- `POST /threads` 약 `60.20 req/s`
- `POST /runs` 약 `59.96 req/s`

### KEDA / Pod

- `ai-server-keda-hpa desired=10`
- `ai-server available 2 -> 4 -> 8 -> 10`
- worker busy 약 `80 -> 400`

### Queue / Throughput

- backlog `10K -> 7K`로 감소 전환
- `Jobs Completed/sec` 약 `3~4 -> 20`
- `Jobs Failed/sec = 0`
- `Worker Success Rate = 100%`

이 결과는 단순히 "desired replica가 올라갔다"가 아니다.

실제 pod가 10개까지 올라왔고, pod당 worker 40 기준으로 총 처리 인력이 약 `400`까지 늘었다. 그리고 backlog가 누적이 아니라 감소로 바뀌었다.

## 처리량 개선 해석

이 축에서 가장 중요한 숫자는 `4 ops -> 20 ops`다.

- 초기 단계: `Jobs Completed/sec`가 `0~1.2/s`
- KEDA 1차 재실험: 약 `1.8~2.0/s`
- KEDA retry: 약 `5/s`
- KEDA retry 2: 약 `20/s`

보수적으로 보면 `4 ops/s` 수준에서 `20 ops/s` 수준으로 올라온 셈이라, 대략 `400%` 개선이라고 볼 수 있다.

이 개선은 하나의 설정으로 생긴 게 아니다.

1. 외부 API를 limiter `60 RPS` 아래로 보호
2. worker 상한 `40`으로 pod당 처리량을 제어
3. queue metric으로 backlog를 관찰
4. KEDA로 backlog를 replica 증가로 변환
5. CPU request / Postgres ceiling / async path를 맞춰 실제 pod 가용 수를 늘림

즉 "scale signal", "scheduling 가능성", "DB ceiling", "app path"가 같이 맞아야 처리량 개선이 나온다는 걸 보여준다.

## 아직 남은 문제

처리량이 좋아졌다고 끝난 건 아니다.

- `P95/P99` tail latency는 여전히 높다
- 남은 병목은 순수 CPU보다는 외부 API 대기, app path, 초기 scale-up 지연 쪽에 가깝다
- `4000 RPM` quota headroom을 모두 쓰는 실험은 아직 main summary에 승격되지 않았다

즉 지금 구조는 "무너지지 않도록 보호 + scale-out으로 backlog를 줄일 수 있는 상태"까지 왔고, 다음 최적화는 tail latency와 내부 app path 쪽이다.

## 최종 결론

이번 후속 실험으로 메인 문서에 남겨야 하는 결론은 이거다.

1. Google quota는 `4000 RPM`까지 올렸지만, 실제 검증은 cluster limiter `60 RPS` 아래에서 수행했다
2. `concurrent_max=40`은 실제 worker 포화와 backlog 적체로 검증됐다
3. queue metric exporter를 붙인 뒤 KEDA는 backlog를 실제 scale-out으로 변환했다
4. 최종 재실험에서는 `ai-server desired=10`, `available=10`, worker `400`, `Jobs Completed/sec` 약 `20`, backlog 감소 전환이 확인됐다
5. 처리량은 대략 `4 ops -> 20 ops`, 약 `400%` 개선됐다
6. 다만 `P95/P99`와 app 내부 처리 구조는 여전히 후속 최적화 대상이다

## 관련 문서

- [locust-day2-summary.md](locust-day2-summary.md)
- [capacity-plan-1000-rpm.md](capacity-plan-1000-rpm.md)
- [load-test-execution.md](load-test-execution.md)
- [evidence/concurrent_max=40/README.md](evidence/concurrent_max=40/README.md)
- [evidence/keda/README.md](evidence/keda/README.md)
- [evidence/keda/2단계_retry_2/summary.md](evidence/keda/2단계_retry_2/summary.md)
