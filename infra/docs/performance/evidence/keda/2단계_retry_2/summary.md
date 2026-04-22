# 2단계 Retry 2 요약

## 실험 목적
- `KEDA`가 backlog 기반으로 `ai-server`를 실제로 scale-out 하는지 확인
- 이전 튜닝(`ai-server cpu request=200m`, `Postgres max_connections=500`, 주요 AI 경로 async 전환) 이후 처리율이 실제로 개선됐는지 확인

## 핵심 결과
- `ai-server desired = 10`, `available = 10`까지 도달
- `Worker Busy`가 약 `80 -> 400`으로 증가
- `Queue Backlog`가 약 `10K -> 7K`로 감소 전환
- `Jobs Completed/sec`가 약 `3~4 -> 20` 수준까지 상승
- `Jobs Failed/sec = 0`, `Worker Success Rate = 100%`

## Locust 결과
- Aggregate
  - `# reqs = 23,714`
  - `# fails = 9 (0.04%)`
  - `avg = 534 ms`
  - `median = 460 ms`
  - `max = 2,275 ms`
  - `req/s = 131.81`
- `AI /runs (enqueue)`
  - `10,787 reqs`
  - `5 fails (0.05%)`
  - `59.96 req/s`
- `AI /threads`
  - `10,831 reqs`
  - `4 fails (0.04%)`
  - `60.20 req/s`
- `Web /api/health`
  - `1,533 reqs`
  - `0 fails`
  - `8.52 req/s`

## Grafana 해석
- `HPA Replicas`
  - `ai-server-keda-hpa desired=10`
  - 실제 `ai-server available`이 `2 -> 10`으로 따라붙음
- `Worker & Queue`
  - worker 수가 `400` 근처까지 올라가며 KEDA scale-out이 실제 처리 인력 증가로 연결됨
  - backlog는 누적이 아니라 감소로 바뀜
  - 완료 처리율이 `20 ops/s` 수준까지 증가
- `Pod Resource`
  - AI 파드 CPU는 대체로 낮거나 중간 수준이었고, 메모리는 대략 `450~520MiB` 범위
  - 즉 남은 병목은 순수 CPU 연산보다 외부 API 대기/애플리케이션 처리 구조 쪽일 가능성이 높음
- `Ingress Latency`
  - 처리율은 개선됐지만 tail latency(`P95/P99`)는 여전히 높음
  - scale-out만으로 완전히 해결되지 않은 애플리케이션 지연이 남아 있음

## 결론
이번 `2단계_retry_2`는 포트폴리오 관점에서 매우 중요한 전환점이다.

- 이전에는 `desired=10`이어도 실제 `available`이 충분히 따라오지 못했다.
- 하지만 이번에는 `ai-server`가 실제로 `10개`까지 올라왔고, worker 수가 `400` 수준까지 증가했다.
- 그 결과 `Jobs Completed/sec`가 `20` 수준까지 상승했고, queue backlog도 실제 감소로 전환됐다.

즉 이번 결과는 다음을 보여준다.

1. `KEDA`는 backlog 기반으로 정상 동작했다.
2. `cpu request`와 `DB connection ceiling`이 실제 scale-out의 핵심 제약이었다.
3. 해당 제약을 완화하자 scale-out이 실제 처리량 개선으로 이어졌다.
4. 다만 tail latency와 애플리케이션 내부 처리 구조는 여전히 추가 최적화 대상이다.
