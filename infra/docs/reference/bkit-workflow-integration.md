# bkit Workflow Integration

확인 시점: `2026-03-28`  
대상 환경: `infra/` 작업 워크플로

## 목적

이 문서는 `infra/`의 문서 중심 작업 흐름에 `bkit`을 붙일 때의 적용 경계와 입력/출력 계약을 정리한다.

핵심은 `bkit`을 판단 주체가 아니라 초안 생성 보조 계층으로 제한하는 것이다.  
이 저장소의 기준은 항상 매니페스트, 스크립트, 관측 결과, 그리고 이미 검증된 `status`/`task` 문서다.

## 적용 원칙

- `bkit`은 기본적으로 초안만 만든다
- 실제 파일 반영은 사람이 확인한 뒤 진행한다
- 입력은 항상 최신 `status`, 최신 `task`, 관련 skill 문서, 문서 규칙을 함께 묶는다
- `status -> task -> 다음날 status`의 작업 축을 임의로 바꾸지 않는다
- 확인되지 않은 사실을 `현재 상태`나 `진행`으로 승격하지 않는다
- 현재 기본 구현은 프로젝트 로컬 fallback `bin/bkit`이며, 외부 AI 호출 없이 보수적인 Markdown 초안을 만든다

## 우선 적용 대상

### 1. `new-status`

- 이유: 전날 `status`와 최신 `task`를 오늘 시작 기준 상태로 다시 정리하는 규칙이 명확하다
- 입력:
  - `docs/status/README.md`
  - 가장 최신 전날 `status`
  - 가장 최신 `task`
  - `.codex/skills/new-status/SKILL.md`
- 출력:
  - `status-YYYY-MM-DD.md` 초안
- 금지:
  - 전날 `현재 상태`를 그대로 복사
  - `task`의 `진행`에 없는 사실을 새 `현재 상태`에 추가

### 2. `plan-task`

- 이유: 최신 `status`의 `다음 작업`을 번호 붙은 실행 항목으로 분해하는 변환 규칙이 안정적이다
- 입력:
  - `docs/status/README.md`
  - 가장 최신 `status`
  - `.codex/skills/plan-task/SKILL.md`
- 출력:
  - `task-YYYY-MM-DD.md`의 `계획`과 초기 `보류 / 다음 액션` 초안
- 금지:
  - `status`의 작업 축 변경
  - 조회 대상 없이 추정 기반 재설계

### 3. `update-task`

- 이유: 실제 작업 로그를 `진행`과 `보류 / 다음 액션`으로 요약하는 후처리 성격이 강하다
- 입력:
  - 가장 최신 `task`
  - 필요 시 가장 최신 `status`
  - 실제 작업 로그 또는 명령 결과
  - `.codex/skills/update-task/SKILL.md`
- 출력:
  - `진행` / `보류 / 다음 액션` 갱신 초안
- 금지:
  - 아직 하지 않은 일을 `진행`에 기록
  - 완료된 항목을 `보류 / 다음 액션`에 남김

### 4. `update-troubleshooting`

- 이유: 기존 문서 흡수 여부 판단과 섹션 형식 정리가 반복 가능하다
- 입력:
  - 이슈 메모
  - `docs/troubleshooting/README.md`
  - 기존 troubleshooting 문서들
  - `.codex/skills/update-troubleshooting/SKILL.md`
- 출력:
  - 기존 문서 갱신 초안 또는 새 문서 초안
- 금지:
  - 기존 범주에 들어가는 이슈인데 새 파일 생성
  - 원시 로그 덤프 위주 문서화

## 적용 보류 대상

- `evaluate-implementation`
  - 인프라 변경 타당성 판단 비중이 커서 완전 자동화보다 리뷰 보조가 적합하다
- `update-infrastructure`
  - 구조 문서는 잘못 자동화하면 drift가 생기기 쉬워, 초안 보조 이상으로 넘기지 않는다

## 번들 생성 스크립트

`scripts/bkit/prepare-workflow-context.sh`는 각 워크플로에 필요한 입력을 묶어 아래 파일을 만든다.

- `prompt.md`
  - `bkit`에 바로 넘길 수 있는 목표, 가드레일, 출력 형식 요약
- `context.md`
  - 관련 허브 문서, 최신 `status`/`task`, 해당 skill 문서 본문
- `sources.txt`
  - 번들에 포함된 파일 목록

## 실행 러너

`scripts/bkit/run-workflow.sh`는 번들을 만든 뒤 실제 `bkit` 호출까지 이어준다.

- 기본 템플릿은 프로젝트 로컬 `./bin/bkit`을 사용한다
- 실제 `bkit` CLI 형식이 다르면 `BKIT_RUNNER` 또는 `--runner`로 실행 템플릿을 덮어쓴다
- 프로젝트 루트의 `.bkit.env`가 있으면 먼저 읽어 로컬 설정을 반영한다
- 따라서 실제 `bkit` 명령 형식이 바뀌어도 저장소 스크립트는 유지하고 템플릿만 바꿔 끼우면 된다

지원 플레이스홀더:

- `__PROMPT_FILE__`
- `__CONTEXT_FILE__`
- `__SOURCES_FILE__`
- `__OUTPUT_FILE__`
- `__WORKFLOW__`
- `__TARGET_DATE__`
- `__BUNDLE_DIR__`
- `__ROOT_DIR__`

## 프로젝트 명령

실제 사용은 아래 래퍼 명령으로 시작하는 것을 기준으로 둔다.

- `scripts/commands/new-status`
- `scripts/commands/plan-task`
- `scripts/commands/update-task`
- `scripts/commands/update-troubleshooting`

이 래퍼들은 각각 대응하는 워크플로 이름을 고정해 `run-workflow.sh`를 호출한다.

설정이 필요하면 프로젝트 루트의 `.bkit.env`를 사용한다. 저장소에는 기본 설정 파일 `.bkit.env`와 예시 파일 `.bkit.env.example`를 함께 둔다.

## skill 연동 방식

- 현재 인프라 skill 문서와 `AGENTS.md`는 `new-status`, `plan-task`, `update-task`, `update-troubleshooting` 수행 시 먼저 대응하는 `scripts/commands/*` 래퍼로 `bkit` 초안을 시도하도록 정리돼 있다
- 초안이 유용하면 참고해 실제 문서를 작성하고, 초안이 부정확하거나 품질이 낮으면 기존 skill 절차대로 직접 작성한다
- 따라서 현재 구조는 `bkit`이 기존 skill 흐름을 대체하는 것이 아니라, 같은 흐름 앞단에서 입력과 초안 생성을 표준화하는 보조 계층에 가깝다

## 로컬 설치 상태

- 현재 저장소에는 프로젝트 로컬 `bkit` 실행 파일 `bin/bkit`이 포함되어 있다
- 이 구현은 외부 AI 호출 없이도 오프라인 초안 파일을 만들 수 있는 fallback 용도다
- 더 강한 생성 품질이 필요하면 나중에 실제 외부 `bkit` CLI를 설치하고 `.bkit.env`의 `BKIT_RUNNER`만 교체하면 된다

## 예시 흐름

### `new-status`

```bash
infra/scripts/bkit/prepare-workflow-context.sh new-status --date 2026-03-28
```

생성물:

- `/tmp/new-status-2026-03-28/prompt.md`
- `/tmp/new-status-2026-03-28/context.md`
- `/tmp/new-status-2026-03-28/sources.txt`

실행 예시:

```bash
infra/scripts/commands/new-status --date 2026-03-28 --print-command
```

### `plan-task`

```bash
infra/scripts/bkit/prepare-workflow-context.sh plan-task --date 2026-03-28 --print-prompt
```

실행 예시:

```bash
infra/scripts/commands/plan-task --date 2026-03-28 --print-output
```

### `update-task`

```bash
infra/scripts/bkit/prepare-workflow-context.sh update-task --log-file /tmp/worklog.md
```

실행 예시:

```bash
infra/scripts/commands/update-task --log-file /tmp/worklog.md --print-output
```

### `update-troubleshooting`

```bash
infra/scripts/bkit/prepare-workflow-context.sh update-troubleshooting --issue-file /tmp/incident.md
```

실행 예시:

```bash
infra/scripts/commands/update-troubleshooting --issue-file /tmp/incident.md --print-output
```

## 운영 경계

- `prepare-workflow-context.sh`는 `bkit` 자체를 호출하지 않는다
- `run-workflow.sh`는 번들 생성과 실제 `bkit` 호출을 연결하되, 결과 파일 반영은 자동으로 하지 않는다
- `scripts/commands/*`는 프로젝트 안에서 반복 사용하는 진입점일 뿐이며, 여전히 결과 검토와 파일 반영은 사람 책임이다
- 따라서 현재 단계의 목적은 “자동 확정”이 아니라 “같은 입력 계약으로 초안을 일관되게 생성하고, 기존 skill 흐름을 보존한 채 초안 품질을 보조”하는 것이다
