# 파일 맵

이 문서는 `bkit-templete/` 안 파일을 다른 프로젝트에 옮길 때의 기준 경로를 정리한다.

## 그대로 복사할 파일

아래 파일은 `bkit-templete/project-root/` 아래에서 대상 저장소 루트로 그대로 복사하면 된다.

- `.bkit.env.example`
- `.bkit.env.template`
- `bin/bkit`
- `scripts/bkit/README.md`
- `scripts/bkit/prepare-workflow-context.sh`
- `scripts/bkit/run-workflow.sh`
- `scripts/commands/new-status`
- `scripts/commands/plan-task`
- `scripts/commands/update-task`
- `scripts/commands/update-troubleshooting`

## 대상 저장소에서 추가로 맞춰야 할 것

- `AGENTS.md`
  - `new-status`, `plan-task`, `update-task`, `update-troubleshooting` 앞단에서 `scripts/commands/*`를 먼저 시도한다는 규칙 추가
- skill 문서
  - 각 skill이 `bkit` 초안을 참고하되, 품질이 낮으면 기존 절차로 fallback 한다는 규칙 추가
- 문서 허브 README
  - `bkit`은 초안 생성 보조 계층이며 최종 반영 전 검토가 필요하다는 규칙 추가

## 현재 스크립트가 전제하는 문서 구조

- `docs/status/`
- `docs/tasks/`
- `docs/troubleshooting/`
- `docs/reference/document-writing-rules.md`

그리고 구조 문서 하나가 필요하다.

- 인프라 레이어: `docs/infrastructure.md`
- 애플리케이션 레이어: `docs/architecture.md`

현재 `project-root/` 안 스크립트는 `infra` 기준으로 복사돼 있으므로, 애플리케이션 레이어 프로젝트에 넣을 때는 구조 문서 경로와 설명 문구를 루트형으로 맞춰야 한다.

## 추천 이식 순서

1. 파일 세트 복사
2. `.bkit.env.template`를 `.bkit.env`로 복사
3. 대상 프로젝트의 문서 구조 확인
4. `prepare-workflow-context.sh`의 구조 문서 경로 확인
5. skill 문서와 `AGENTS.md` 연결
6. `--dry-run` 또는 `--print-command`로 먼저 번들 생성 확인

## 보수적 운영 원칙

- 이식 후에도 바로 자동 반영하지 않는다
- `/tmp` 초안 출력 확인 후 문서 반영한다
- 대상 프로젝트의 `status`/`task` 구조와 다르면 먼저 구조를 맞추고 붙인다
