# AI Runtime And LangGraph Issues

## 발생 조건

- AI 이미지를 새로 빌드하거나 LangGraph 런타임을 바꿀 때
- 부하 테스트에서 AI 처리량이 기대보다 낮을 때

## 대표 증상

- `uv` 명령어 없음
- 모듈 import 실패
- AI healthcheck 실패
- LangGraph 캐시/권한 문제
- `N_JOBS_PER_WORKER`를 올려도 동시 처리 수가 거의 늘지 않음
- 요청은 많이 들어오는데 실제 run 처리 수는 매우 적음
- worker는 바쁜데 CPU는 낮고 `Jobs Completed/sec`가 낮음
- scale-out 이후에도 queue가 매우 천천히만 줄어듦

## 판단 과정

- 빌드 에이전트의 Python / uv / Docker 확인
- AI 이미지가 `langgraph build` 기준인지 확인
- AI 노드 함수가 `async def`인지 확인
- AI pod 로그의 background worker 수 확인
- run 생성 수와 실제 처리 수를 분리해서 확인
- worker 점유 시간의 대부분이 CPU 연산인지, 외부 대기/동기 I/O인지 구분한다
- `requests.get`, retry sleep, `.invoke()` 호출, 동기 stream 루프 같은 경로를 우선 본다

## 근본 원인

- 런타임 준비 부족
- LangGraph in-memory worker 구조
- 동기 그래프 구현으로 인한 GIL 제한
- 세션/스레드 라우팅 문제
- 다운로드, LLM 호출, stream 처리 경로가 동기 방식이면 worker를 오래 붙잡아 실제 처리율이 낮아진다

## 해결 방법

- `langgraph build` 기반 빌드/배포 표준 유지
- Redis / DATABASE_URI 연결 상태를 먼저 고정
- `N_JOBS_PER_WORKER`만 보지 말고 실제 동시성 구조를 검증
- 필요 시 그래프 노드를 비동기 방식으로 전환
- `resume_parser`, `question_feedback_gen`, `question_gen`, `jd_structuring`, `jd_to_text`처럼 병목 경로를 async 기반으로 전환한다
- `.invoke()` 위주의 동기 호출보다 `.ainvoke()`와 async I/O를 우선 적용한다

## 확인 방법

```bash
kubectl logs -n deep-quest deploy/ai-server --tail=200
kubectl get deploy,svc -n deep-quest ai-server ai-service
kubectl exec -n deep-quest deploy/ai-server -- env | rg 'N_JOBS|REDIS|DATABASE'
```

## 검색 키워드

- langgraph build
- ai queue low cpu
- n_jobs_per_worker not working
- starting 1 background workers
- worker busy high but cpu low
- invoke to ainvoke
- async throughput improvement

## 원본 문서

- `docs/docs-infra/legacy/트러블슈팅.md` 3장
- `docs/docs-infra/legacy/DeepQuest_Traffic_Test/LOCUST_TEST_TASK_2/AI_동시요청_대기열_원인_정리.md`
- `docs/docs-infra/legacy/DeepQuest_Traffic_Test/LOCUST_TEST_TASK_2/N_JOBS_PER_WORKER_3개만_동작_원인.md`

## 원본 판단 로그

- 애플리케이션 처리율이 낮고 worker가 오래 점유됨
