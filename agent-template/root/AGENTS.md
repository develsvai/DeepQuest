# AGENTS.md

## 핵심 원칙

AI는 실행 엔진이다.
인간은 의사결정 엔진이다.
생성하거나 업데이트하는 문서는 모두 한국어로 작성한다.

---

## 필수 확인 순서

작업 전 반드시 아래 순서로 확인한다:

1. `docs/status/README.md`
2. `docs/architecture.md`
3. `docs/tasks/README.md` if implementation work is involved
4. `docs/troubleshooting/` if there is a relevant incident or recurring failure

작업 대상이 `infra/` 내부라면, 루트 규칙 대신 `infra/AGENTS.md`로 전환해서 infra 전용 흐름을 따른다.

---

## 범위 통제

- 최신 `docs/status/status-YYYY-MM-DD.md`의 `의도` 범위를 벗어나지 않는다
- 관련 없는 영역을 리팩터링하지 않는다
- 명시적 요청이 없다면 새 기능을 추가하지 않는다

---

## 상태 문서 규칙

- 가장 최신 `docs/status/status-YYYY-MM-DD.md`는 현재 작업 상태를 반영해야 한다
- 간결하고 의사결정 중심으로 유지한다
- 의미 있는 진전이 있으면 갱신한다

---

## 아키텍처 규칙

- `docs/architecture.md`를 실행 제약으로 취급한다
- 문서화된 경계를 위반하지 않는다
- 요청 사항이 아키텍처와 충돌하면 멈추고 충돌 내용을 보고한다

---

## 트러블슈팅 규칙

아래 조건을 모두 만족할 때만 트러블슈팅 문서를 만든다:

- 문제가 단순하지 않다
- 원인이 처음부터 명확하지 않았다
- 다시 발생할 가능성이 있다

새 문서를 만들기 전에 기존 `docs/troubleshooting/` 문서를 먼저 검색한다.
기존 사례에 합칠 수 있으면 기존 문서를 더 구체화하고, 기존 범주로 설명되지 않을 때만 새 문서를 만든다.

---

## 저장소 운영 모델

- 이 파일은 루트 애플리케이션 작업용 Codex 흐름을 제어한다
- `infra/`는 자체 `AGENTS.md`, 상태 문서, 아키텍처, 작업 목록, 트러블슈팅, skills를 가진 별도 작업 영역으로 취급한다
- 과거 문서는 `lagacy/`와 `docs-lagacy/`에 보관한다
- 현재 활성 운영 문서는 `docs/` 아래에 둔다
- 재사용 가능한 작업 흐름은 `.codex/skills/`에 둔다

---

## 문서화 규칙

- 루트 문서를 새로 만들거나 옮기기 전에 `docs/reference/document-writing-rules.md`를 먼저 확인한다
- 문서 성격에 맞는 디렉터리를 선택한다
  - 상태 기록: `docs/status/`
  - 작업 계획과 진행 기록: `docs/tasks/`
  - 비교표/배경 설명: `docs/reference/`
  - 재사용 가능한 장애 대응: `docs/troubleshooting/`
- 인프라 운영 절차나 운영 상태 스냅샷은 루트 문서가 아니라 `infra/`로 보낸다
- `lagacy/`와 `docs-lagacy/`는 새 기준 문서를 쌓는 위치가 아니라 과거 보관소로 유지한다

---

## 작업 영역 구분

- UI, 프론트엔드, API, 데이터베이스, 서비스 계층 작업은 주로 `web/`에서 수행한다
- AI 처리, LangGraph 그래프, 질문 생성, 파싱 로직 작업은 `ai/`에서 수행한다
- 루트 애플리케이션 플로우는 `web/`와 `ai/`를 함께 다루는 상위 작업 조정 레이어다
- `ai/` 세부 작업이 필요하면 `ai/CLAUDE.md`를 추가로 확인한다

---

## 워크플로 규칙

- 새 작업일 시작 시 `new-status`로 오늘 상태 파일을 연다
- `new-status`는 전날 `status`와 가장 최신 `task`를 바탕으로 오늘의 `현재 상태`, `알려진 이슈`, `다음 작업`을 작성한다
- `plan-task`는 가장 최신 상태 파일을 기준으로 `docs/tasks/task-YYYY-MM-DD.md`의 `계획` 초안을 만든다
- `update-task`는 가장 최신 작업 파일의 `진행`과 `보류 / 다음 액션`을 갱신한다
- 당일 진행 상황, 판단, 중단 지점, 실제 실행 결과는 `status`보다 `task`에 남긴다
- `status`의 `현재 상태`는 하루 시작 기준으로 한 번 정리한 뒤 당일 진행 때문에 계속 덮어쓰지 않는다
- `evaluate-implementation`은 `docs/architecture.md`와 가장 최신 상태 파일 기준으로 판단한다
- task 업데이트와 새 문서 생성은 항상 현재 `docs/` 문서 구조를 따른다

---

## 품질 게이트

- `web/` 코드 변경 전후에는 가능한 한 `pnpm check-all` 기준을 염두에 둔다
- `ai/` 코드 변경 전후에는 가능한 한 `uv run make lint` 기준을 염두에 둔다
- 문서만 수정한 경우에는 코드 품질 검증을 생략할 수 있다
- 기존 테스트가 깨지는 방향의 변경은 피한다
- 디버그 로그나 임시 출력은 남기지 않는다

---

## 출력 규칙

- 간결하게 작성한다
- 구조적으로 정리한다
- 바로 실행 가능해야 한다

---

## 최종 규칙

현재 의도가 불명확하면 `docs/status/README.md`와 가장 최신 상태 파일을 다시 읽는다.
