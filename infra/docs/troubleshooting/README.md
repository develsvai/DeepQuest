# 인프라 트러블슈팅

재사용 가능한 인프라 장애 대응 문서는 이곳에 저장한다.

문서 작성 시 `../reference/document-writing-rules.md`를 따른다.

## 권장 섹션

- 발생 조건
- 증상
- 판단 과정
- 근본 원인
- 해결 방법
- 확인 방법
- 검색 키워드

## 문서 목록

- `ai-runtime-and-langgraph.md`: AI runtime, LangGraph build/runtime, async 처리 병목
- `autoscaling-and-throughput.md`: web HPA, AI KEDA, queue/backlog 처리량
- `database-and-prisma.md`: Postgres, Prisma, connection ceiling
- `jenkins-and-build-agents.md`: Jenkins agent, Harbor push, partial build/re-tag
- `kubernetes-and-secrets.md`: overlay, Secret, ArgoCD sync, image pull
- `load-test-soft-failure.md`: 부하 테스트 soft failure, 재배포 직후 측정 오염
- `observability-and-metrics.md`: metrics exporter, Prometheus, Grafana
- `tailscale-funnel-and-session-affinity.md`: Funnel, session affinity, state secret
- `web-runtime-auth-and-webhooks.md`: Web runtime, Clerk, webhook

새 인프라 트러블슈팅 작업 전에는 이곳을 먼저 검색한다.
기존 사례에 자연스럽게 들어가면 새 파일을 만들지 말고 기존 문서를 더 구체화한다.
기존 범주로 설명되지 않을 때만 새 문서를 만든다.
Markdown 링크 대상은 작성 중인 문서 위치 기준 상대경로로 쓴다.
서로 다른 장애군, 서로 다른 원인, 서로 다른 운영 영역이 섞이면 기존 문서에 계속 append하지 말고 별도 문서로 분리한다.

트러블슈팅으로 올리지 않는 기준:
- 단순 절차 설명은 `../runbooks/`
- 배경 설명이나 비교표는 `../reference/`
- 일회성 상태 기록은 `../infra_state/`
