# Autoscaling And Throughput Issues

## 발생 조건

- KEDA를 backlog 기준으로 붙인 직후 scale-out이 기대만큼 처리량으로 이어지지 않을 때
- AI 파드는 늘어나는데 backlog가 줄지 않거나, 외부 LLM 호출량 제어가 필요할 때
- 부하 실험에서 `desired replica`, `available replica`, `worker busy`, `completed/sec`가 서로 다르게 움직일 때

## 대표 증상

- KEDA HPA의 `desired`는 늘어나는데 실제 `available` pod는 잘 늘지 않음
- 파드는 늘었는데 backlog는 계속 증가하고 처리율은 낮음
- 클러스터 전체 외부 Gemini 호출량을 제어하지 못해 quota 위험이 있음

## 판단 과정

- `desired replica`와 실제 `available replica`를 분리해서 확인한다
- 스케줄링 실패가 CPU request 때문인지, DB connection ceiling 때문인지, 앱 처리 구조 때문인지 나눠서 본다
- `concurrent_max`가 내부 동시성만 제한하는지, 전역 외부 호출량까지 제한하는지 구분한다
- `Worker Busy`, `Queue Backlog`, `Jobs Completed/sec`, `LLM 호출량`을 함께 본다

## 근본 원인

- KEDA 자체보다 `ai-server cpu request=1` 같은 스케줄링 제약 때문에 실제 scale-out이 막힐 수 있다
- 전역 rate limiter가 없으면 분산 파드 환경에서 외부 API 호출량이 uncontrolled 상태가 된다
- 처리량 병목은 단일 원인이 아니라 `cpu request`, `DB connection ceiling`, `동기 처리 경로`가 겹쳐 나타날 수 있다

## 해결 방법

- Redis token bucket 기반 전역 rate limiter를 두고 `RPS`, `burst`, `wait timeout`을 함께 조정한다
- `ai-server` CPU request를 실제 스케줄링 가능한 수준으로 조정한다
- KEDA 적용 후에는 `desired replica`가 아니라 실제 `available`, `Worker Busy`, `Jobs Completed/sec`, `Queue Backlog 감소`까지 확인한다
- 초기 scale만으로 backlog가 줄지 않으면 DB와 애플리케이션 처리 구조까지 함께 본다

## 확인 방법

```bash
kubectl get hpa -n deep-quest
kubectl get pods -n deep-quest -o wide | rg ai-server
kubectl top pods -n deep-quest | rg ai-server
kubectl logs -n deep-quest deploy/ai-server --tail=200 | rg 'worker|busy|queue'
```

## 검색 키워드

- keda desired available mismatch
- ai-server cpu request too high
- global rate limiter redis token bucket
- backlog not draining after scale out
- completed per sec low after keda

## 원본 판단 로그

- 전역 rate limiter 적용 전 외부 API 보호 부재
- KEDA 적용 후 scale-out이 desired만 늘고 실제 pod는 안 늘어남
- 초기 KEDA 결과는 scale됐지만 backlog를 못 줄임
