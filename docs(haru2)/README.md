# 문서 허브

`docs(haru2)/`는 루트 애플리케이션 작업의 canonical 문서 디렉터리다.

기본 확인 순서:

1. `status/README.md`
2. `architecture.md`
3. `tasks/README.md`
4. `troubleshooting/`

운영 원칙:

- `status/`는 날짜별 상태 파일을 쌓는 디렉터리이며, 가장 최신 파일이 현재 의도와 진행 상황의 기준 문서다
- `architecture.md`는 루트 애플리케이션 작업의 구조 경계와 실행 제약을 정의한다
- `tasks/`는 날짜별 작업 계획과 진행 기록 파일을 쌓는 디렉터리다
- `runbooks/`는 반복 실행하는 애플리케이션 절차를 둔다
- `reference/`는 배경 설명, source of truth, 작업 메모, 상위 workflow 기준을 둔다

source of truth 우선순위:

1. 실제 코드, 설정, 검증된 실행 결과
2. 가장 최신 `status/status-YYYY-MM-DD.md`
3. 가장 최신 `tasks/task-YYYY-MM-DD.md`
4. `architecture.md`
5. 관련 `web/docs/`, `ai/docs/`
6. `reference/`, `runbooks/`, `troubleshooting/`
7. 루트 `README.md`와 legacy 문서

문서끼리 충돌하면 위 순서를 기준으로 판단한다. 오래된 reference나 README는 배경으로만 보고, 현재 작업 판단은 최신 status/task와 실제 코드 상태를 우선한다.

권장 작업 흐름:

상세한 작업자 관점 workflow는 `reference/application-workflow-from-idea-to-operation.md`를 따른다.

일반 애플리케이션 구현은 구조 변경과 구분한다.
일반 구현은 최신 status 확인, 관련 `web/`·`ai/` 코드와 대응 하위 문서 확인, `plan-task`, 구현, 검증, `update-task` 순서로 진행하며, 작업 경계 자체를 바꾸지 않는 한 `architecture.md`까지 바로 수정하지 않는다.

1. `new-status`로 `status/status-YYYY-MM-DD.md` 파일을 만들거나 연다
2. `new-status`는 전날 `status`와 최신 `task`를 바탕으로 오늘 시작 시점의 `의도`, `현재 상태`, `알려진 이슈`, `다음 작업`을 정리한다
3. 현재 작업에 직접 관련된 `web/`, `ai/`, `reference/`를 먼저 확인한다
4. `web/`를 건드리거나 `web/` 구현 사실을 판단해야 하면 관련 `web/docs/`를 반드시 먼저 확인한다
5. `ai/`를 건드리거나 `ai/` 구현 사실을 판단해야 하면 관련 `ai/docs/`를 반드시 먼저 확인한다
6. `ai/` 세부 작업이면 `ai/README.md`와 관련 `ai/docs/`를 함께 확인한다
7. 구조 경계나 상위 문서 링크가 바뀌면 `reference/`에 관련 기준 문서를 먼저 보강하고 필요 시 `update-architecture`를 실행한다
8. `plan-task`로 `tasks/task-YYYY-MM-DD.md` 파일에 `계획` 초안을 만든다
9. 실제 작업 후 `update-task`로 `진행`과 `보류 / 다음 액션`을 갱신한다
10. 작업 중 변경, 중단 지점, 실제 실행 결과는 최신 작업 파일에 반영한다
11. 단위 작업이 끝나면 `evaluate-implementation`으로 검증한다
12. `web/` 코드 변경이면 `pnpm check-all` 실행 여부를 확인하고, 생략 시 이유를 남긴다
13. `ai/` 코드 변경이면 `uv run make lint` 실행 여부를 확인하고, 생략 시 이유를 남긴다
14. 문서만 수정한 경우에는 코드 검증을 생략할 수 있지만, 생략 이유를 분명히 한다
15. 실제로 반복 가능한 절차가 생기면 `create-runbook`으로 `runbooks/` 문서를 만든다
16. 재발 가능 장애면 `troubleshooting/` 문서를 만든다
17. 다음 작업일 시작 시 `new-status`가 전날 상태와 작업 기록을 바탕으로 새 상태 파일을 만든다

문서 영역:

- `status/`
  - 날짜별 상태 기록
- `tasks/`
  - 날짜별 작업 계획과 진행 기록
- `runbooks/`
  - 반복 실행 절차와 운영 가이드
- `reference/`
  - 비교표, 배경 설명, source of truth, 작업 메모
- `troubleshooting/`
  - 재사용 가능한 문제 해결 문서

새 문서를 만들기 전에는 `reference/document-writing-rules.md`를 먼저 확인한다.

추가 규칙:

- 모든 task 업데이트는 현재 `tasks/task-YYYY-MM-DD.md` 구조를 유지한다
- task 파일에는 항상 `계획`, `진행`, `보류 / 다음 액션`을 유지한다
- `plan-task`는 `계획` 중심으로 작성하고, `진행`은 실제 작업 후 `update-task`에서 갱신한다
- `계획`은 방향 문서이고, `진행`은 실제 실행 기록이다
- 새 문서는 현재 `docs(haru2)/` 문서 구성을 따르고, 기존 문서 톤과 섹션 구조를 우선 맞춘다
