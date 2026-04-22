# 문서 허브

`현재 저장소`의 활성 문서는 이 디렉터리를 기준으로 관리한다.

기본 확인 순서:

1. `status/README.md`
2. `infrastructure.md`
3. `tasks/README.md`
4. `troubleshooting/`
5. `infra_state/`

운영 원칙:

- `status/`는 날짜별 상태 파일을 쌓는 디렉터리이며, 가장 최신 파일이 현재 의도와 진행 상황의 기준 문서다
- `infrastructure.md`는 구조 경계와 제약을 정의한다
- `tasks/`는 날짜별 작업 계획 파일을 쌓는 디렉터리다
- 상태 스냅샷은 `infra_state/`에 날짜별로 누적한다

source of truth 우선순위:

1. 실제 명령 결과와 라이브 관측
2. `infra_state/YYYY-MM-DD-live.md` 중 가장 최신 스냅샷
3. 가장 최신 `status/status-YYYY-MM-DD.md`
4. 가장 최신 `tasks/task-YYYY-MM-DD.md`
5. `infrastructure.md`
6. `runbooks/`, `troubleshooting/`, `reference/`
7. 루트 `README.md`와 과거/legacy 문서

문서끼리 충돌하면 위 순서를 기준으로 판단한다. 오래된 reference나 README는 배경으로만 보고, 현재 운영 판단은 최신 실측 상태와 최신 status/task를 우선한다.

권장 작업 흐름:

상세한 작업자 관점 workflow는 `reference/infra-workflow-from-idea-to-operation.md`를 따른다.

일반 배포는 구조 변경과 구분한다.
일반 배포는 Jenkins 실행, Harbor `${BUILD_TAG}` 확인, `deploy` 브랜치 overlay 확인, ArgoCD sync, `verify-deploy` 순서로 검증하며, 배포 구조 자체를 바꾸지 않는 한 설계 문서까지 만들지 않는다.

1. `new-status`로 `status/status-YYYY-MM-DD.md` 파일을 만들거나 연다
2. `new-status`는 전날 `status`와 최신 `task`를 바탕으로 오늘 시작 시점의 `의도`, `현재 상태`, `알려진 이슈`, `다음 작업`을 정리한다
3. 현재 운영 상태가 필요하면 `collect-live-state`와 `update-infra-state`로 실측 상태를 먼저 고정한다
4. 의도적인 구조 변경이면 `design-infra-change`로 `reference/` 설계 문서를 만든다
5. `plan-task`로 `tasks/task-YYYY-MM-DD.md` 파일에 `계획` 초안을 만든다
6. 실제 작업 후 `update-task`로 `진행`과 `보류 / 다음 액션`을 갱신한다
7. 작업 중 변경, 중단 지점, 실제 실행 결과는 최신 작업 파일에 반영한다
8. 단위 작업이 끝나면 `evaluate-implementation`으로 검증한다
9. 실제로 수행한 반복 절차를 남겨야 하면 `create-runbook`으로 `runbooks/` 문서를 만든다
10. 재발 가능 장애면 `troubleshooting/` 문서를 만든다
11. 작업 경계나 기준 문서 링크가 바뀌면 `update-infrastructure`를 실행한다
12. 다음 작업일 시작 시 `new-status`가 전날 상태와 작업 기록을 바탕으로 새 상태 파일을 만든다

문서 영역:

- `runbooks/`
  - 반복 실행 절차와 운영 가이드
- `reference/`
  - 비교표, 배경 설명, 운영 메모, 의도적인 구조 변경 설계
- `performance/`
  - 성능/용량/운영 벤치마크 요약
- `troubleshooting/`
  - 재사용 가능한 장애 대응 문서
- `infra_state/`
  - 검증된 현재 상태 스냅샷
- `docs-infra/`
  - 과거 원본 문서와 마이그레이션 보관소

새 문서를 만들기 전에는 `reference/document-writing-rules.md`를 먼저 확인한다.
