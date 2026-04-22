# Performance Docs

확인 시점: `2026-04-20 KST`
대상 환경: `deep-quest` 배포 성능 실험 문서

## 목적

`docs/performance/`는 Deep Quest 부하 실험의 운영 기준 문서다.

과거 원본 실험 폴더는 보관 대상일 뿐이고, 현재 작업자는 이 디렉터리만 읽어도 실험 순서, 결과값, 해석, 다음 검증 방향을 파악할 수 있어야 한다.

문서 형식은 [document-writing-rules.md](../reference/document-writing-rules.md)를 따른다.

## 문서 목록

- [k6-day1-summary.md](k6-day1-summary.md)
  - Web `/api/health` 계층의 K6 실험, baseline, HPA 적용 전후 결과.
- [locust-day2-summary.md](locust-day2-summary.md)
  - AI/LangGraph 경로의 Locust 실험, soft failure, 큐/워커/Redis/Postgres 전환 결과.
- [ai-rate-limit-and-keda-summary.md](ai-rate-limit-and-keda-summary.md)
  - Gemini limiter, queue metric, KEDA scale-out, `4 ops -> 20 ops` 처리량 개선 결과.
- [capacity-plan-1000-rpm.md](capacity-plan-1000-rpm.md)
  - 1000 RPM 목표를 현재 관측 결과 기준으로 다시 해석한 용량 계획.
- [load-test-execution.md](load-test-execution.md)
  - 현재 레포의 K6/Locust 스크립트를 사용해 실험을 재실행하는 절차.

## 시나리오 파일

- [tools/k6/load_test.js](tools/k6/load_test.js)
- [tools/locust/locustfile.py](tools/locust/locustfile.py)
- [tools/locust/requirements.txt](tools/locust/requirements.txt)

## 실험 순서

1. K6 사전 점검
   - Prometheus, Grafana, ingress-nginx metrics, pod/node metrics 수집 가능 여부를 확인했다.
2. K6 baseline
   - Web pod 1개, HPA 미적용 상태에서 `/api/health`의 단일 pod 한계를 측정했다.
3. K6 HPA 적용
   - min/max replica와 scaleUp 정책을 조정하며 3000 VU 시나리오를 반복했다.
4. Locust soft failure 검증
   - HTTP 200과 실제 AI 처리 완료가 다를 수 있음을 확인했다.
5. Locust AI 큐/워커 병목 확인
   - in-memory LangGraph 런타임에서는 CPU가 낮아도 큐/워커 병목으로 처리가 밀릴 수 있음을 확인했다.
6. LangGraph production 전환
   - `langgraph build` 기반 production image, Redis, Postgres 연결 뒤 worker 관측값이 달라졌다.
7. Gemini limiter + queue metric + KEDA 실험
   - `60 RPS` limiter, backlog metric, `ai-server desired=10/available=10`, worker `400`, `20 ops/s` 개선을 확인했다.
8. 1000 RPM 계획 재정의
   - 단순 RPS가 아니라 실제 완료 run 수, 외부 API quota, 큐 대기, 504를 함께 보는 계획으로 바꿨다.

## 문서화 원칙

- 이 디렉터리의 문서는 보관 원본 링크에 의존하지 않는다.
- 긴 실험 로그와 체크포인트는 필요한 수치와 판단만 흡수한다.
- 실행 절차는 [load-test-execution.md](load-test-execution.md)에 둔다.
- 장애 대응으로 재사용할 가치가 생긴 항목은 `docs/troubleshooting/`으로 분리한다.
- live 상태나 현재 deploy tag는 성능 문서에 고정하지 않고 [../infra_state/](../infra_state/) 또는 최신 작업 문서에서 확인한다.
