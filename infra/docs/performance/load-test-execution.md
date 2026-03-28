# Load Test Execution Guide

## 목적

현재 저장소에서 K6/Locust 부하 테스트 스크립트가 어디에 있고, 어떤 문서를 먼저 봐야 하는지 빠르게 안내한다.

## K6

- 스크립트: `infra/docs/performance/tools/k6/load_test.js`
- 배경 요약: `infra/docs/performance/k6-day1-summary.md`

## Locust

- 스크립트: `infra/docs/performance/tools/locust/locustfile.py`
- 의존성: `infra/docs/performance/tools/locust/requirements.txt`
- 배경 요약: `infra/docs/performance/locust-day2-summary.md`

## 실행 전 확인

1. 테스트 대상 ingress / host가 현재 유효한지 확인
2. Grafana / Prometheus / ingress metrics가 수집되는지 확인
3. AI/Web 파드 로그와 `kubectl top`을 동시에 볼 준비

## 원본 문서

- `docs/docs-infra/legacy/DeepQuest_Traffic_Test/LOCUST_TEST_TASK_2/Locust_실행_가이드.md`
