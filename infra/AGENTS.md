# AGENTS.md

## 핵심 원칙

인프라 변경은 상태 의존적이며 영향 범위가 크다.
추정이 아니라 검증된 상태를 기준으로 작업한다.

---

## 필수 확인 순서

인프라 작업 전 반드시 아래 순서로 확인한다:

1. `docs/status/README.md`
2. `docs/infrastructure.md`
3. `docs/tasks/README.md`
4. `docs/troubleshooting/` if relevant
5. `docs/infra_state/` if current state matters

---

## 범위 통제

- 최신 `docs/status/status-YYYY-MM-DD.md`의 `의도` 범위를 벗어나지 않는다
- 인프라 작업에서 명시적으로 요구하지 않는 한 다른 애플리케이션 레포 코드를 수정하지 않는다
- 이 디렉터리를 별도 저장소처럼 취급한다

---

## 상태 규칙

- 인프라 의사결정은 매니페스트, 설정, 스크립트, 관측 증거를 기준으로 한다
- 의미 있는 인프라 상태 파악이 끝나면 `docs/infra_state/`를 갱신한다
- 현재 상태가 불명확하면 먼저 수집하고 나서 진행한다

---

## 트러블슈팅 규칙

문제가 단순하지 않고, 처음에 명확하지 않았고, 재발 가능성이 있을 때만 트러블슈팅 문서를 만든다.

새 문서를 만들기 전에 기존 인프라 트러블슈팅 문서를 먼저 검색한다.
기존 사례에 합칠 수 있으면 기존 문서를 더 구체화하고, 기존 범주로 설명되지 않을 때만 새 문서를 만든다.

---

## 워크플로 규칙

- 새 작업일 시작 시 `new-status`로 오늘 상태 파일을 연다
- `new-status`는 전날 `status`와 가장 최신 `task`를 바탕으로 오늘의 `현재 상태`, `알려진 이슈`, `다음 작업`을 작성한다
- `plan-task`는 가장 최신 상태 파일을 기준으로 가장 최신 작업 파일의 `계획` 초안을 만든다
- `update-task`는 가장 최신 작업 파일의 `진행`과 `보류 / 다음 액션`을 갱신한다
- `new-status`, `plan-task`, `update-task`, `update-troubleshooting`, `create-runbook`를 수행할 때는 먼저 대응하는 `scripts/commands/` 래퍼로 `bkit` 초안을 시도한다
- `bkit` 초안은 입력 정리와 초안 생성 보조용이며, 실제 `docs/` 반영 전에는 반드시 내용을 검토한다
- `bkit` 초안이 실패하거나 품질이 낮으면 기존 skill 절차대로 수동 작성 흐름으로 즉시 fallback 한다
- 날짜가 바뀌어도 `status -> task -> 다음날 status`의 큰 작업 축이 갑자기 바뀌지 않게 유지한다
- 같은 날 `status`의 `다음 작업`과 `task`의 `계획`은 같은 내용을 다른 해상도로 보여줘야 한다
- 다음날 `status`의 `현재 상태`는 전날 `task`의 `진행`에서 실제 완료된 내용만 승격하고, 전날 `task`의 `보류 / 다음 액션`은 다음날 `다음 작업`의 주 입력으로 사용한다
- 당일 진행 상황, 판단, 중단 지점, 실제 실행 결과는 `status`보다 `task`에 남긴다
- `status`의 `현재 상태`는 하루 시작 기준으로 한 번 정리한 뒤 당일 진행 때문에 계속 덮어쓰지 않는다
- 중요한 인프라 변경을 제안하기 전에 `update-infra-state`를 사용한다
- 처음부터 새로 진단하기 전에 `check-troubleshooting`을 사용한다
- 현재 운영 상태를 수집할 때는 `collect-live-state`를 사용한다
- 배포 직후 운영 검증은 `verify-deploy`를 사용한다
- 실제로 수행한 반복 절차를 문서화할 때는 `create-runbook`을 사용한다
- `docs/status/`에는 `status-YYYY-MM-DD.md` 파일을 계속 누적하고, 항상 가장 최신 파일을 기준으로 본다
- `docs/tasks/`에는 `task-YYYY-MM-DD.md` 파일을 계속 누적하고, 현재 작업은 항상 가장 최신 파일을 우선 본다
- task 업데이트와 새 문서 생성은 항상 현재 `docs/` 문서 구조를 따른다

---

## 문서화 규칙

- 인프라 문서를 새로 만들거나 옮기기 전에 `docs/reference/document-writing-rules.md`를 먼저 확인한다
- 문서 성격에 맞는 디렉터리를 선택한다
  - 반복 절차: `docs/runbooks/`
  - 비교표/배경 설명: `docs/reference/`
  - 재사용 가능한 장애 대응: `docs/troubleshooting/`
  - 검증된 상태 스냅샷: `docs/infra_state/`
  - 과거 원본 보관: `docs/docs-infra/legacy/`
- `docs/docs-infra/`에는 새 기준 문서를 직접 쌓지 않고, 원본 보관과 마이그레이션 인덱스 역할만 유지한다
- 애플리케이션 동작 설명이나 앱 코드 변경 요약은 인프라 문서가 아니라 상위 레포 `reference/`로 보낸다

---

## 최종 규칙

인프라 의도가 불명확하면 `docs/status/README.md`와 가장 최신 상태 파일을 다시 읽는다.
