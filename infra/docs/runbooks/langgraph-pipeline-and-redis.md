# LangGraph Pipeline And Redis Runbook

확인 시점: `2026-04-20 KST`  
대상 환경: `deep-quest` AI runtime, LangGraph, Redis, Postgres

## 목적

AI 런타임의 `langgraph build` 전환, Redis/Postgres 연동, 이후 검증 포인트를 한 곳에 모은다.

## 현재 기준 상태

- AI 이미지는 `langgraph build` 결과물 기준으로 운영
- Jenkins는 `ai/`에서 `uv run langgraph build`를 사용
- AI 서비스 포트는 `8000` 기준
- Redis와 LangGraph 전용 Postgres DB를 사용한다
- prod overlay는 AI autoscaling을 HPA가 아니라 KEDA `ScaledObject`와 PDB 기준으로 다룬다
- KEDA가 pause 상태인지 여부는 live에서 별도 확인한다

## 빌드 에이전트 요구사항

대상: `docker-build` 라벨 Jenkins SSH 에이전트 (`ssh station`)

필수:
- Python 3.11+
- `uv`
- Docker

확인 명령:

```bash
python3 --version
uv --version
docker --version
```

## Jenkins AI 빌드 흐름

1. `cd ai`
2. `uv run langgraph build -t <harbor>/ai:${BUILD_TAG}`
3. Harbor push
4. overlay 이미지 태그 갱신

## Redis / DB 연결 체크

필수 값:
- `REDIS_URI`
- `DATABASE_URI` 또는 `LANGGRAPH_DATABASE_URI`

확인 대상:
- `ai-secret`
- `k8s/base/ai/deployment.yaml`
- `k8s/base/configmap.yaml`

## 단계별 검증 포인트

1. LangGraph prod image
   - `langgraph build` 이미지 사용 여부
   - AI service / probe / port `8000`
2. Redis 연결
   - `redis-service:6379`
   - AI pod env 반영 여부
3. 동시성
   - `N_JOBS_PER_WORKER` 값 확인
   - 실제 노드 함수가 `async def`인지 별도 확인
4. 메모리
   - AI requests/limits와 실제 `kubectl top` 비교
5. HPA/KEDA
   - web은 CPU/Memory HPA 기준
   - ai는 prod overlay에서 KEDA `ScaledObject` 기준
   - KEDA pause 여부와 queue metric 수집 상태를 live에서 확인

## 운영 해석

- `langgraph build` 전환은 완료된 빌드/배포 표준으로 간주
- Redis 연동은 적용 완료로 보되, queue metric 기반 KEDA가 실제 운영 의도대로 켜져 있는지는 live 확인 대상이다
- `N_JOBS_PER_WORKER`만 올려서는 충분하지 않고, 그래프 노드 구현 형태까지 함께 봐야 한다

## 원본 문서

- `docs/docs-infra/legacy/DeepQuest_Traffic_Test/LOCUST_TEST_TASK_2/langgraph_build_전환_계획.md`
- `docs/docs-infra/legacy/DeepQuest_Traffic_Test/LOCUST_TEST_TASK_2/2단계_Redis_적용_가이드.md`
- `docs/docs-infra/legacy/DeepQuest_Traffic_Test/LOCUST_TEST_TASK_2/단계별_실행_가이드_검증.md`
