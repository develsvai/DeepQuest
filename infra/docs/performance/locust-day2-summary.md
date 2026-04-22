# Locust Day2 Summary

확인 시점: `2026-04-20 KST`
대상 환경: `deep-quest` AI/LangGraph 경로, Locust, Redis/Postgres

## 목적

Day2 Locust 실험은 AI 전체 경로의 실제 처리량을 확인하기 위한 실험이다.

Day1 K6가 Web `/api/health` 중심이었다면, Day2는 `POST /api/langgraph/threads`와 `POST /api/langgraph/threads/{id}/runs`를 통해 LangGraph resume parser 경로를 부하시켰다.

## 실험 전제

- 기본 스크립트: [tools/locust/locustfile.py](tools/locust/locustfile.py)
- 주요 경로:
  - `POST /api/langgraph/threads`
  - `POST /api/langgraph/threads/{id}/runs`
  - `GET /api/langgraph/ok`
  - `GET /api/health`
- AI 작업은 HTTP 응답과 실제 그래프 완료가 분리될 수 있다.
- 따라서 Locust 성공률만으로 AI 처리 성공을 판단하지 않는다.

## 실험 순서와 결과

| 순서 | 실험 | 관측값 | 결론 |
| --- | --- | --- | --- |
| 1 | Soft failure 검증 | 50 users, 약 `85-90 RPS`, 약 2분. Locust는 총 요청 약 `10,200`, 성공 `7,680`으로 봤지만 AI pod에서 실제 처리된 고유 `run_id`는 5개 수준. 평균 응답 시간 `10-15ms`. | HTTP 200은 실제 AI 완료가 아니다. LangGraph run 생성 API는 빠르게 반환하고 백그라운드 처리가 뒤따를 수 있다. |
| 2 | in-memory 런타임 큐 병목 확인 | 로그에 `Starting 1 background workers`, `Worker stats ... max=1` 계열 관측. CPU는 낮지만 run queue가 쌓였다. | CPU가 낮다고 여유가 있는 것이 아니다. 큐/worker 구조가 병목이면 HPA CPU 기준은 잘 반응하지 않는다. |
| 3 | session affinity 보정 | AI Service `ClientIP`, Web ingress cookie affinity 적용 뒤 thread/run 라우팅 404가 완화됐다. | in-memory thread/run 상태가 pod-local이면 affinity가 필요하다. 단, production 구조에서는 Redis/Postgres로 상태를 외부화하는 쪽이 더 낫다. |
| 4 | `N_JOBS_PER_WORKER` 검증 | env 값은 `40`이어도 구버전/in-memory/dev 경로에서는 실질 동시성이 1~3 수준으로 보일 수 있었다. | env 숫자와 실제 동시성은 다를 수 있다. 시작 로그와 worker stats로 확인해야 한다. |
| 5 | LangGraph production image 전환 | `langgraph build` 기반 이미지로 전환. `redis-service:6379`, `postgres-service:5432/langgraph`, port `8000` 사용. 로그에서 `Starting 40 background workers`, `available=40`, `max=40` 확인. | production runtime 전환 뒤 파드당 40 worker가 관측됐다. 2 pod면 이론상 80 worker지만 실제 처리량은 그래프 구현과 외부 API에 묶인다. |
| 6 | Redis/Postgres 전환 뒤 Locust 재실험 | 약 `90.7 RPS` 도달, 실패율 약 `24%`, 요청 수 약 40개 구간에서 성공률 급락과 `504 Gateway Timeout` 관측. | 큐/worker만 늘려도 끝이 아니다. Gemini quota, ingress/proxy timeout, AI scaling, sync node/GIL 가능성을 같이 봐야 한다. |
| 7 | 후속 rate limiter + KEDA 재실험 | 전역 limiter `60 RPS`, `desired=10`, `available=10`, worker `400`, `Jobs Completed/sec` 약 `20`, backlog 감소 전환 | 후속 실험은 별도 문서 [ai-rate-limit-and-keda-summary.md](ai-rate-limit-and-keda-summary.md)에 정리한다. |

## Soft Failure 해석

초기 Locust 결과에서 가장 중요한 발견은 "성공처럼 보이는 실패"였다.

Locust는 HTTP 200을 성공으로 볼 수 있지만, AI 파드 로그의 고유 `run_id`, Gemini 호출 수, PDF 다운로드 수가 그만큼 증가하지 않았다. 특히 평균 응답 시간이 `10-15ms`이면 LLM 기반 resume parsing이 실제로 끝났다고 볼 수 없다.

현재 Locust 스크립트는 너무 빠른 응답을 실패로 잡는 검사를 포함한다. 그래도 최종 판단은 아래 값을 같이 봐야 한다.

- Locust success/failure
- AI pod 고유 `run_id`
- LangGraph worker stats
- `run_queue_ms`
- ingress 504
- Gemini quota/rate limit
- 실제 결과 저장 여부

## 큐와 워커 분석

`N_JOBS_PER_WORKER=40` 같은 설정은 단독으로 처리량을 보장하지 않는다.

구버전 in-memory/dev 경로에서는 CLI나 runtime이 값을 덮어쓰거나, worker 수와 worker당 concurrency 의미가 다르게 해석될 수 있었다. production image 전환 뒤에는 `Starting 40 background workers`가 관측됐지만, 그래프 node가 동기 `def` 중심이면 GIL, blocking I/O, 외부 API latency 때문에 숫자만큼 병렬성이 나오지 않을 수 있다.

따라서 AI 처리량 검증은 "설정값"이 아니라 "실제 완료된 run 수" 기준으로 해야 한다.

## 현재 운영에 남는 결론

- AI 경로 부하 테스트는 Locust와 AI 로그를 동시에 봐야 한다.
- Redis/Postgres 외부화는 in-memory 라우팅 문제와 큐 관측성을 줄이는 방향으로 맞다.
- production image 전환은 현재 표준으로 본다.
- `N_JOBS_PER_WORKER` 또는 worker 수 조정은 시작 로그와 실제 completion rate로 검증해야 한다.
- KEDA/queue 기반 scaling은 CPU HPA보다 AI 경로에 더 적합하지만, live에서 pause 상태와 metric threshold를 반드시 확인해야 한다.
- Gemini 같은 외부 API quota가 다음 병목이 될 수 있다. 1000 RPM 계획에서는 이 한계를 별도로 다룬다.
- 후속 rate limiter/KEDA 실험에서는 실제 `desired=10`, `available=10`, worker `400`, `20 ops/s` 개선이 확인됐다. 이 단계는 [ai-rate-limit-and-keda-summary.md](ai-rate-limit-and-keda-summary.md)에서 별도로 다룬다.

## 재실행 체크리스트

1. deploy branch의 실제 image tag와 ArgoCD sync 상태를 확인한다.
2. sample PDF URL이 AI pod에서 접근 가능한지 확인한다.
3. Redis/Postgres 연결 로그와 LangGraph worker 시작 로그를 확인한다.
4. Locust 실행 전 queue가 비어 있는지 확인한다.
5. Locust success/failure와 AI pod 고유 `run_id` 수를 같이 기록한다.
6. `504`, `429`, `RateLimitError`, `run_queue_ms`, worker stats를 같은 시간대에서 본다.
7. 테스트 후 queue drain 또는 AI deployment restart 여부를 기록한다.

## 관련 문서

- [load-test-execution.md](load-test-execution.md)
- [ai-rate-limit-and-keda-summary.md](ai-rate-limit-and-keda-summary.md)
- [capacity-plan-1000-rpm.md](capacity-plan-1000-rpm.md)
- [k6-day1-summary.md](k6-day1-summary.md)
