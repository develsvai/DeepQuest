# bkit templete

이 디렉터리는 현재 `infra/`에 적용된 `bkit` 워크플로 보조 구조를 다른 프로젝트로 옮길 수 있게 백업한 템플릿이다.

목적은 세 가지다.

1. 현재 `infra` 적용안을 그대로 보관한다
2. 다른 프로젝트에 바로 복사할 수 있는 실행 파일 세트를 둔다
3. 루트 애플리케이션 레이어로 확장할 때의 개선 방향을 함께 남긴다

## 구성

- `project-root/`
  - 다른 저장소 루트에 그대로 복사할 수 있는 파일 세트
- `docs/current-infra-integration.md`
  - 현재 `infra` 적용안 요약
- `docs/file-map.md`
  - 어떤 파일을 어디에 복사해야 하는지 정리
- `docs/root-application-expansion.md`
  - 애플리케이션 레이어에서 더 좋게 확장하는 방향

## 바로 이식하는 방법

현재 `project-root/` 아래 파일은 `infra/`에서 검증된 `bkit` 보조 구조를 그대로 복사한 것이다.

다른 프로젝트에서 같은 문서 워크플로를 쓴다면 아래처럼 옮기면 된다.

1. `project-root/` 아래 내용을 대상 저장소 루트로 복사한다
2. `.bkit.env.example`를 참고해 `.bkit.env`를 맞춘다
3. 대상 저장소의 skill 문서와 `AGENTS.md`에 `scripts/commands/*` 진입점을 연결한다
4. 실제 문서 반영 전에는 항상 `/tmp/<workflow>-<date>/draft.md` 초안을 검토한다

## 현재 범위

이 템플릿은 현재 `infra/`에 적용된 아래 워크플로를 기준으로 한다.

- `new-status`
- `plan-task`
- `update-task`
- `update-troubleshooting`

`bkit`은 판단 엔진이 아니라 초안 생성 보조 계층으로만 사용한다.
실제 `docs/` 반영은 항상 검토 후 진행한다.

## 주의

- `project-root/scripts/bkit/prepare-workflow-context.sh`는 현재 `infra` 구조를 기준으로 복사돼 있다
- 즉 기본 전제는 `docs/status/`, `docs/tasks/`, `docs/troubleshooting/`, `docs/infrastructure.md`가 있는 저장소다
- 루트 애플리케이션 레이어처럼 `docs/architecture.md`를 쓰는 프로젝트는 `docs/root-application-expansion.md`를 보고 조정하는 것이 맞다
