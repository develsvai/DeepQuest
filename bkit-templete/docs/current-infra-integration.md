# 현재 infra bkit 적용안

기준 시점: `2026-03-28`

## 목적

현재 `infra/`의 `bkit` 적용은 문서 중심 워크플로를 대체하는 것이 아니라, 기존 skill 흐름 앞단에서 입력을 표준화하고 초안을 만드는 보조 계층으로 설계돼 있다.

## 적용 대상

- `new-status`
- `plan-task`
- `update-task`
- `update-troubleshooting`

## 동작 방식

1. 사용자는 기존 skill 흐름대로 작업한다
2. skill은 먼저 대응하는 `scripts/commands/*` 래퍼로 `bkit` 초안을 시도한다
3. 래퍼는 `scripts/bkit/prepare-workflow-context.sh`로 입력 번들을 만든다
4. `scripts/bkit/run-workflow.sh`가 `bkit` 실행기 또는 로컬 fallback `bin/bkit`으로 초안을 생성한다
5. 초안은 `/tmp/<workflow>-<date>/draft.md`에만 생성된다
6. 사람이 초안을 검토한 뒤 실제 `docs/` 문서에 반영한다

## 핵심 원칙

- `bkit`은 초안만 만든다
- 실제 파일은 자동 수정하지 않는다
- 입력은 최신 `status`, 최신 `task`, 관련 skill, 문서 규칙을 함께 묶는다
- `status -> task -> 다음날 status`의 큰 작업 축을 바꾸지 않는다
- 확인되지 않은 사실을 `현재 상태`나 `진행`으로 올리지 않는다
- 초안 품질이 낮으면 즉시 기존 skill 절차로 fallback 한다

## 현재 장점

- 입력 계약이 고정돼 있어 초안 품질 편차를 줄일 수 있다
- 사람이 매번 같은 문맥 파일을 모으는 부담이 줄어든다
- `new-status`, `plan-task`, `update-task`처럼 변환 규칙이 명확한 작업에 특히 잘 맞는다
- 외부 AI가 없어도 `bin/bkit` fallback으로 최소 초안 생성은 가능하다

## 현재 한계

- 현재 스크립트는 `infra` 문서 구조를 전제로 한다
- `update-task`는 실제 채팅 로그 대신 별도 `--log-file`을 넣어야 해서 입력 연결이 아직 반수동이다
- `update-infrastructure`, `evaluate-implementation`처럼 판단 비중이 큰 skill에는 아직 직접 연결하지 않았다

## 백업 대상 파일

- `.bkit.env.example`
- `.bkit.env`
- `bin/bkit`
- `scripts/bkit/README.md`
- `scripts/bkit/prepare-workflow-context.sh`
- `scripts/bkit/run-workflow.sh`
- `scripts/commands/new-status`
- `scripts/commands/plan-task`
- `scripts/commands/update-task`
- `scripts/commands/update-troubleshooting`
- `docs/reference/bkit-workflow-integration.md`
