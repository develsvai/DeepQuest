# 문서 허브

루트 작업 영역의 활성 운영 문서는 이 디렉터리를 기준으로 관리한다.

기본 확인 순서:

1. `status/README.md`
2. `architecture.md`
3. `tasks/README.md`
4. `troubleshooting/`

운영 원칙:

- `status/`는 날짜별 상태 파일을 쌓는 디렉터리이며, 가장 최신 파일이 현재 의도와 진행 상황의 기준 문서다
- `architecture.md`는 애플리케이션 작업의 구조 경계와 제약을 정의한다
- `tasks/`는 날짜별 작업 계획 파일을 쌓는 디렉터리다
- `runbooks/`는 애플리케이션 운영에서 반복 실행하는 절차 문서를 둔다
- `reference/`는 배경 설명, 비교표, 작업 요약 같은 상시 참고 문서를 둔다

권장 작업 흐름:

1. `new-status`로 `status/status-YYYY-MM-DD.md` 파일을 만들거나 연다
2. `new-status`는 전날 `status`와 최신 `task`를 바탕으로 오늘 시작 시점의 `의도`, `현재 상태`, `알려진 이슈`, `다음 작업`을 정리한다
3. `plan-task`로 `tasks/task-YYYY-MM-DD.md` 파일에 `계획` 초안을 만든다
4. 실제 작업 후 `update-task`로 `진행`과 `보류 / 다음 액션`을 갱신한다
5. 작업 중 변경, 중단 지점, 실제 실행 결과는 최신 작업 파일에 반영한다
6. 단위 작업이 끝나면 `evaluate-implementation`으로 검증한다
7. 재발 가능 장애면 `troubleshooting/` 문서를 만든다
8. 구조가 바뀌면 최신 상태 파일 반영 후 `update-architecture`를 실행한다
9. 다음 작업일 시작 시 `new-status`가 전날 상태와 작업 기록을 바탕으로 새 상태 파일을 만든다

문서 영역:

- `status/`
  - 날짜별 상태 기록
- `tasks/`
  - 날짜별 작업 계획
- `runbooks/`
  - 애플리케이션 운영 반복 절차
- `reference/`
  - 배경 설명, 비교표, 요약
- `troubleshooting/`
  - 재사용 가능한 문제 해결 문서

새 문서를 만들기 전에는 `status/`와 `reference/`, `troubleshooting/`의 현재 구성을 먼저 확인한다.
문서 생성이나 이동 전에 `reference/document-writing-rules.md`를 먼저 확인한다.

추가 규칙:

- 모든 task 업데이트는 현재 `docs/tasks/task-YYYY-MM-DD.md` 구조를 유지한다
- task 파일에는 항상 `계획`, `진행`, `보류 / 다음 액션`을 유지한다
- `plan-task`는 `계획` 중심으로 작성하고, `진행`은 실제 작업 후 `update-task`에서 갱신한다
- `계획`은 방향 문서이고, `진행`은 실제 실행 기록이다
- 새 문서는 현재 `docs/` 문서 구성을 따르고, 기존 문서 톤과 섹션 구조를 우선 맞춘다
