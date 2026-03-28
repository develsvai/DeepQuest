# bkit 워크플로 보조 스크립트

`infra/`의 상태 문서 흐름에 `bkit`을 붙일 때 필요한 입력 수집과 프롬프트 번들 생성을 이 디렉터리에서 관리한다.

원칙:

- `bkit`은 기본적으로 초안 생성에만 사용한다
- 실제 파일 반영 전에는 사람이 결과를 확인한다
- 입력은 항상 최신 `status`, 최신 `task`, 관련 skill 문서, 문서 규칙을 함께 묶는다
- 자동화가 작업 축을 바꾸지 않도록, 변환 대상은 `new-status`, `plan-task`, `update-task`, `update-troubleshooting`으로 제한한다
- 현재 기본 실행기는 프로젝트 로컬 `bin/bkit`이며, 외부 AI 호출 없이 보수적인 fallback 초안을 만든다

프로젝트 명령:

- `scripts/commands/new-status`
- `scripts/commands/plan-task`
- `scripts/commands/update-task`
- `scripts/commands/update-troubleshooting`

이 명령들은 각각 같은 이름의 워크플로를 바로 실행한다.
현재 인프라 skill 흐름도 이 명령들을 먼저 시도한 뒤, 결과를 검토해 실제 문서 반영 여부를 판단하는 방식으로 연결돼 있다.

주요 스크립트:

- `prepare-workflow-context.sh`
  - `new-status`, `plan-task`, `update-task`, `update-troubleshooting`용 `prompt.md`, `context.md`, `sources.txt` 번들을 만든다
  - 기본 출력 경로는 `/tmp/<workflow>-<date>/`다
  - 예시: `infra/scripts/bkit/prepare-workflow-context.sh new-status --date 2026-03-28`
  - 예시: `infra/scripts/bkit/prepare-workflow-context.sh plan-task --date 2026-03-28 --print-prompt`
  - 예시: `infra/scripts/bkit/prepare-workflow-context.sh update-task --log-file /tmp/worklog.md`
  - 예시: `infra/scripts/bkit/prepare-workflow-context.sh update-troubleshooting --issue-file /tmp/incident.md`
- `run-workflow.sh`
  - 번들을 만든 뒤 `bkit` 실행 템플릿에 파일 경로를 주입해 실제 초안 생성을 수행한다
  - 기본 실행 템플릿은 프로젝트 로컬 `./bin/bkit`을 사용한다
  - 실제 `bkit` CLI 형식이 다르면 `BKIT_RUNNER` 또는 `--runner`로 명령 템플릿을 덮어쓴다
  - 프로젝트 루트의 `.bkit.env`가 있으면 먼저 읽는다
  - 기본 초안 출력 경로는 `/tmp/<workflow>-<date>/draft.md`다
  - 기본적으로는 `/tmp`에만 초안을 만들며 `docs/` 파일을 자동 수정하지 않는다
  - 지원 플레이스홀더:
    - `__PROMPT_FILE__`
    - `__CONTEXT_FILE__`
    - `__SOURCES_FILE__`
    - `__OUTPUT_FILE__`
    - `__WORKFLOW__`
    - `__TARGET_DATE__`
    - `__BUNDLE_DIR__`
    - `__ROOT_DIR__`
  - 예시: `infra/scripts/bkit/run-workflow.sh new-status --date 2026-03-28 --print-command`
  - 예시: `infra/scripts/bkit/run-workflow.sh plan-task --date 2026-03-28 --print-output`
  - 예시: `BKIT_RUNNER='bkit draft --input "__CONTEXT_FILE__" --prompt "__PROMPT_FILE__" --save "__OUTPUT_FILE__"' infra/scripts/bkit/run-workflow.sh update-task --log-file /tmp/worklog.md`

- `../bin/bkit`
  - 프로젝트 로컬 `bkit` 커맨드다
  - 현재는 오프라인 fallback 구현으로, 워크플로별 보수적인 Markdown 초안을 생성한다
  - 지원 형식: `run --prompt-file ... --context-file ... --output-file ... --workflow ...`

설정 파일:

- `.bkit.env`
  - 현재 저장소에서 실제로 사용하는 기본 러너 설정 파일이다
  - 기본값은 프로젝트 로컬 `bin/bkit`을 가리킨다
- `.bkit.env.example`
  - 로컬 환경에 맞게 `.bkit.env`로 복사해서 사용한다
  - 기본 템플릿과 다른 CLI 형식이 필요할 때 `BKIT_RUNNER`를 여기에 둔다

프로젝트 안에서 바로 쓰는 예시:

- `bash infra/scripts/commands/new-status --date 2026-03-28 --dry-run`
- `bash infra/scripts/commands/plan-task --date 2026-03-28 --print-command`
- `bash infra/scripts/commands/update-task --log-file /tmp/worklog.md --dry-run`
- `bash infra/scripts/commands/update-troubleshooting --issue-file /tmp/incident.md --print-output`
