# Agent Template

다른 프로젝트에 그대로 복사해서 사용할 수 있는 Codex 운영 템플릿이다.

## 구성

- `root/`: 애플리케이션 또는 일반 프로젝트용 루트 운영 레이어
- `infra/`: 인프라 전용 작업 영역 템플릿

## 사용 방법

1. `root/` 내용을 새 프로젝트 루트에 복사한다
2. 인프라를 분리 운영할 경우 `infra/` 내용도 함께 복사한다
3. 루트는 `docs/status/`, `docs/tasks/`, `docs/architecture.md`, 인프라는 `docs/status/`, `docs/tasks/`, `docs/infrastructure.md`부터 프로젝트 상황에 맞게 수정한다
4. 날짜별 상태 파일과 작업 파일은 `status-YYYY-MM-DD.md`, `task-YYYY-MM-DD.md` 형식으로 계속 누적한다
5. 과거 문서 보관이 필요하면 `lagacy/`, `docs-lagacy/` 정책을 같은 방식으로 적용한다

## 원칙

- 활성 문서는 한국어로 유지한다
- 루트와 인프라 흐름을 섞지 않는다
- 스킬은 `SKILL.md` 단위로 그대로 복사해 재사용한다
- 루트와 인프라 모두 `docs/` 중심 구조를 사용한다
- `new-status`, `plan-task`, `update-task`, `update-status`를 기본 흐름으로 삼는다
