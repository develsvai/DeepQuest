# Repo Workflow Parity

## 목적

`deep-quest` 루트, `deep-quest/infra`, `INFRA-MANIFEST` 사이에서 어떤 워크플로와 문서 축을 같게 유지하고, 어떤 부분은 의도적으로 다르게 유지하는지 정리한다.

## 같아야 하는 것

- 날짜 기반 `status -> task -> 다음날 status` 작업 흐름
- `check-troubleshooting`, `update-troubleshooting`, `new-status`, `plan-task`, `update-task`, `evaluate-implementation` 같은 기본 협업 skill 축
- `document-writing-rules.md`, `troubleshooting/README.md`, `runbooks/README.md`를 기준으로 문서 형식을 먼저 맞추는 원칙
- 트러블슈팅은 기존 문서 우선 흡수, 필요한 경우에만 새 파일 생성 원칙
- runbook은 반복 가능한 절차만 남기고 장애 서사는 `troubleshooting/`로 보내는 분리 원칙
- `create-runbook`, `update-troubleshooting` 같은 공통 skill의 출력 형식과 메타 헤더 기준

## 의도적으로 다른 것

- 루트 `deep-quest`는 앱 작업용 레이어라 `collect-live-state`, `update-infra-state`, `update-infrastructure`, `verify-deploy` 같은 인프라 운영 skill을 두지 않는다
- `deep-quest/infra`와 `INFRA-MANIFEST`는 인프라 작업용 레이어라 `infra_state/`, 배포 검증, 실측 수집, 인프라 구조 갱신 skill을 유지한다
- 루트 문서는 `web/`, `ai/`를 함께 조율하는 상위 문맥을 다루고, 인프라 운영 절차와 상태 스냅샷은 `infra/` 또는 `INFRA-MANIFEST`로 보낸다
- 인프라 레포는 `runbooks/`, `troubleshooting/`, `infra_state/` 밀도가 높아야 하지만, 루트는 앱 협업 문맥과 reference 중심 문서 밀도가 더 중요하다

## 저장소별 역할

### `deep-quest`

- 앱 협업 허브
- `web/`, `ai/` 작업 조정
- 앱용 상태/작업/트러블슈팅/reference 문서 유지

### `deep-quest/infra`

- 현재 운영 중인 DeepQuest 인프라 작업 레이어
- 배포, 실측 상태, 운영 장애 대응, runbook 유지
- 앱 루트와 연결되지만 별도 저장소처럼 취급

### `INFRA-MANIFEST`

- 인프라 운영 기준과 워크플로를 일반화해 두는 별도 인프라 레포
- `deep-quest/infra`와 높은 parity를 유지하는 기준본 역할

## 운영 메모

- `deep-quest/infra`와 `INFRA-MANIFEST`는 가능한 한 같은 skill 이름, 같은 문서 헤더, 같은 workflow 설명을 유지한다
- 루트 `deep-quest`는 인프라 전용 skill을 그대로 복제하지 않고, 앱용 대응 skill만 유지한다
- 세 저장소에 공통 변경이 필요할 때는 `sync-repo-workflows` skill로 공통 축을 먼저 점검한다
- 인프라 공통 skill이 `bkit` 초안을 전제로 하면, `deep-quest/infra`와 `INFRA-MANIFEST`의 `scripts/commands/`, `scripts/bkit/README.md`, `scripts/bkit/prepare-workflow-context.sh`도 같이 맞춘다
- 루트 `deep-quest`는 현재 `bkit` 운영 계층이 없으므로 `bkit` 업데이트 대상에서 제외한다
- `sync-repo-workflows`는 전체 디렉터리 diff가 아니라 whitelist 경로 비교를 기본으로 한다
- `status`, `task`, 개별 runbook, 개별 troubleshooting 본문, `infra_state` 같은 운영 기록성 문서는 자동 동기화 대상에서 제외한다
