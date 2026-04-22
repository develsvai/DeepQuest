---
name: design-infra-change
description: 의도적으로 deep-quest 인프라 구조를 바꾸기 전에 현재 구조, 목표 구조, 변경 범위, 비범위, 검증 기준을 docs/reference/ 설계 문서로 정리한다.
---

# 인프라 변경 설계

## 목표

실제 매니페스트나 운영 호스트를 바꾸기 전에, 현재 구조와 목표 구조를 분리해서 `docs/reference/` 아래 설계 문서로 남긴다.
이 skill은 장애 대응 기록이 아니라 의도적인 구조 변경의 설계 단계를 담당한다.

## 사용 조건

- Tailscale 접근 구조, 서비스 노출 방식, 배포 경계, autoscaling, storage, observability처럼 deep-quest 운영 구조를 의도적으로 바꾸려는 경우
- `plan-task` 전에 변경 범위와 검증 기준을 먼저 고정해야 하는 경우
- Kubernetes namespace, Secret/RBAC, ingress/service, host cron, CI/CD 경로가 함께 영향을 받는 경우

## 작업 순서

1. `docs/reference/document-writing-rules.md`를 읽는다
2. `docs/status/README.md`와 최신 `status-YYYY-MM-DD.md`를 읽는다
3. `docs/infrastructure.md`를 읽어 저장소 작업 경계를 확인한다
4. 최신 `docs/tasks/task-YYYY-MM-DD.md`와 최신 `docs/infra_state/YYYY-MM-DD-live.md`를 확인한다
5. 관련 `docs/reference/`, `docs/runbooks/`, `docs/troubleshooting/` 문서를 검색한다
6. 현재 상태가 불명확하면 `collect-live-state`와 `update-infra-state`를 먼저 사용한다
7. 기존 reference 설계 문서에 자연스럽게 이어지면 그 문서를 갱신하고, 없으면 `docs/reference/<topic>-design.md`를 만든다
8. 설계 문서 작성 뒤 `plan-task`가 실행 작업으로 쪼갤 수 있도록 적용 순서와 검증 기준을 명확히 남긴다

## 출력 형식

```md
# <Topic> Design

- 확인 시점: YYYY-MM-DD KST
- 대상 환경: ...
- 상태: draft | accepted | superseded

## 현재 구조
## 변경 동기
## 목표 구조
## 변경 범위
## 비범위
## 영향과 위험
## 적용 순서
## 검증 기준
## 문서화 계획
## 관련 문서
```

## 규칙

- 설계 문서는 미래 목표 구조를 다루므로 `docs/infra_state/`에 쓰지 않는다
- 확인된 현재 구조와 제안하는 목표 구조를 명확히 분리한다
- 추정이 필요한 부분은 `가정` 또는 `확인 필요`로 표시한다
- 변경 범위와 비범위를 반드시 함께 쓴다
- 검증 기준은 `verify-deploy`, `collect-live-state`, `update-infra-state`, `evaluate-implementation`이 확인할 수 있는 형태로 쓴다
- 반복 가능한 절차는 설계 문서에 길게 쓰지 말고 `create-runbook` 후보로 남긴다
- 재발 가능한 장애나 실패 모드는 `update-troubleshooting` 후보로 남긴다
- 하나의 설계 문서는 하나의 구조 변경 주제만 다룬다
- Markdown 링크 대상은 작성 중인 reference 설계 문서 위치 기준 상대경로로 쓴다
- 같은 디렉터리 문서는 `file.md`, 다른 문서 디렉터리는 `../runbooks/file.md`처럼 작성한다
- `/Users/...`, `/home/...`, `file://...` 같은 로컬 절대경로를 링크 대상으로 쓰지 않는다
- 실제 매니페스트나 운영 리소스 변경은 이 skill의 범위가 아니며, 설계 뒤 `plan-task`와 실제 작업 단계에서 진행한다
