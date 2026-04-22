# Load Test Execution Guide

확인 시점: `2026-04-20 KST`
대상 환경: `deep-quest` K6/Locust 재실행 절차

## 목적

현재 레포에 있는 성능 테스트 스크립트를 재실행할 때 필요한 최소 절차를 정리한다.

이 문서는 배경 분석 문서가 아니라 실행 runbook이다. 실험 해석은 [k6-day1-summary.md](k6-day1-summary.md), [locust-day2-summary.md](locust-day2-summary.md), [capacity-plan-1000-rpm.md](capacity-plan-1000-rpm.md)를 본다.

## 실행 전 공통 확인

1. 현재 checkout이 의도한 브랜치인지 확인한다.
2. deploy branch의 image tag와 ArgoCD Application sync 상태를 확인한다.
3. 테스트 대상 host가 현재 ingress/service와 맞는지 확인한다.
4. Grafana와 Prometheus가 테스트 시간대 metrics를 수집하는지 확인한다.
5. `kubectl top pods -n deep-quest`가 동작하는지 확인한다.
6. 테스트 시작 전 AI/Web pod restart count를 기록한다.

## K6 Web Health Test

K6 실험은 Web `/api/health` 경로를 기준으로 Web 계층과 HPA 거동을 본다.

스크립트:

```bash
docs/performance/tools/k6/load_test.js
```

기본 실행:

```bash
BASE_URL=https://deepquest.192.168.0.110.nip.io k6 run docs/performance/tools/k6/load_test.js
```

실행 중 확인:

```bash
kubectl get hpa -n deep-quest -w
kubectl get pods -n deep-quest -l app.kubernetes.io/component=web -w
kubectl top pods -n deep-quest
```

결과 기록:

- K6 total requests
- `http_req_failed`
- RPS
- p95/max duration
- `vus_max`
- Web pod 수 변화
- Web pod CPU/memory
- ingress 5xx

## Locust AI Flow Test

Locust 실험은 AI/LangGraph 경로를 기준으로 실제 처리량을 본다.

스크립트:

```bash
docs/performance/tools/locust/locustfile.py
```

의존성:

```bash
pip install -r docs/performance/tools/locust/requirements.txt
```

기본 실행:

```bash
locust -f docs/performance/tools/locust/locustfile.py --host=https://deepquest.192.168.0.110.nip.io
```

헤드리스 예시:

```bash
locust -f docs/performance/tools/locust/locustfile.py \
  --host=https://deepquest.192.168.0.110.nip.io \
  --headless -u 50 -r 5 -t 3m
```

빠른 부하 모드:

```bash
DEEPQUEST_LOCUST_FASTER=1 locust -f docs/performance/tools/locust/locustfile.py \
  --host=https://deepquest.192.168.0.110.nip.io \
  --headless -u 50 -r 5 -t 3m
```

별도 PDF를 사용할 때:

```bash
DEEPQUEST_RESUME_PDF_URL=https://example.com/resume.pdf locust -f docs/performance/tools/locust/locustfile.py \
  --host=https://deepquest.192.168.0.110.nip.io
```

## Locust 실행 중 확인

AI 로그:

```bash
kubectl logs -n deep-quest -l app.kubernetes.io/component=ai -c ai --tail=300 -f
```

worker/queue 중심 로그:

```bash
kubectl logs -n deep-quest -l app.kubernetes.io/component=ai -c ai --since=10m \
  | grep -E "Starting [0-9]+ background workers|Worker stats|Queue stats|run_queue_ms|resume_parsing|RateLimit|504|429"
```

고유 run 수 확인:

```bash
kubectl logs -n deep-quest -l app.kubernetes.io/component=ai -c ai --since=10m \
  | grep -oE "run_id[^0-9a-f]*[0-9a-f-]{36}" \
  | sort -u \
  | wc -l
```

리소스 확인:

```bash
kubectl top pods -n deep-quest
kubectl get pods -n deep-quest -o wide
kubectl get hpa -n deep-quest
```

## 결과 해석 규칙

- Locust HTTP 200은 AI 처리 완료가 아니다.
- `10-15ms`처럼 너무 빠른 AI run 응답은 soft failure 후보로 본다.
- 실제 처리량은 고유 `run_id`, 완료 로그, 저장 결과를 같이 봐야 한다.
- CPU가 낮아도 queue가 쌓이면 병목이다.
- `N_JOBS_PER_WORKER` 값보다 LangGraph 시작 로그와 worker stats를 우선한다.
- ingress 504가 있으면 Web/AI timeout chain과 외부 API quota를 함께 본다.

## 테스트 후 정리

AI queue나 in-flight run이 남아 있으면 다음 실험을 오염시킬 수 있다.

일반 정리:

```bash
kubectl rollout restart deployment/ai-server -n deep-quest
kubectl rollout status deployment/ai-server -n deep-quest
```

Web 계층도 같이 초기화해야 할 때:

```bash
kubectl rollout restart deployment/web-server -n deep-quest
kubectl rollout status deployment/web-server -n deep-quest
```

검증:

```bash
kubectl get pods -n deep-quest
kubectl get hpa -n deep-quest
```

## 결과 기록 템플릿

```md
## 실험

- 날짜:
- deploy commit:
- image tag:
- host:
- script:
- users/stages:
- duration:

## 결과

- total requests:
- failure rate:
- RPS:
- p95/max:
- unique run_id:
- completed run:
- ingress 504/429:
- Web pod count:
- AI pod count:
- AI worker stats:
- CPU/memory:

## 판단

- 병목:
- 다음 실험:
```

## 관련 문서

- [k6-day1-summary.md](k6-day1-summary.md)
- [locust-day2-summary.md](locust-day2-summary.md)
- [capacity-plan-1000-rpm.md](capacity-plan-1000-rpm.md)
