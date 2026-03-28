#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DOCS_DIR="$ROOT_DIR/docs"
STATUS_DIR="$DOCS_DIR/status"
TASKS_DIR="$DOCS_DIR/tasks"
TROUBLESHOOTING_DIR="$DOCS_DIR/troubleshooting"
SKILLS_DIR="$ROOT_DIR/.codex/skills"
TODAY="${TODAY:-$(date +%F)}"

usage() {
  cat <<'EOF'
Usage:
  scripts/bkit/prepare-workflow-context.sh <workflow> [options]

Workflows:
  new-status
  plan-task
  update-task
  update-troubleshooting

Options:
  --date YYYY-MM-DD        Target date. Defaults to today.
  --issue-file PATH        Required for update-troubleshooting.
  --log-file PATH          Optional extra log/context file for update-task.
  --out-dir PATH           Output directory. Defaults to /tmp/<workflow>-<date>.
  --include-troubleshooting
                           Include troubleshooting document bodies in the bundle.
  --print-prompt           Print prompt.md after generating the bundle.
  -h, --help               Show this help.
EOF
}

die() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

require_file() {
  local path="$1"
  [[ -f "$path" ]] || die "missing required file: $path"
}

latest_file() {
  local dir="$1"
  local pattern="$2"
  local result

  result="$(find "$dir" -maxdepth 1 -type f -name "$pattern" | sort | tail -n 1)"
  [[ -n "$result" ]] || die "no file found for pattern $pattern in $dir"
  printf '%s\n' "$result"
}

previous_status_file() {
  find "$STATUS_DIR" -maxdepth 1 -type f -name 'status-*.md' | sort | grep -v "status-$TARGET_DATE.md" | tail -n 1
}

append_file_block() {
  local output="$1"
  local path="$2"

  require_file "$path"
  {
    printf '\n## File: %s\n\n' "${path#$ROOT_DIR/}"
    sed -n '1,260p' "$path"
    printf '\n'
  } >>"$output"
}

append_troubleshooting_blocks() {
  local output="$1"
  local file

  while IFS= read -r file; do
    append_file_block "$output" "$file"
  done < <(find "$TROUBLESHOOTING_DIR" -maxdepth 1 -type f -name '*.md' | sort)
}

append_sources_list() {
  local output="$1"
  shift
  printf '%s\n' "$@" >"$output"
}

TARGET_DATE="$TODAY"
ISSUE_FILE=""
LOG_FILE=""
OUT_DIR=""
INCLUDE_TROUBLESHOOTING=0
PRINT_PROMPT=0

if [[ $# -lt 1 ]]; then
  usage
  exit 1
fi

WORKFLOW="$1"
shift

while [[ $# -gt 0 ]]; do
  case "$1" in
    --date)
      TARGET_DATE="${2:-}"
      shift 2
      ;;
    --issue-file)
      ISSUE_FILE="${2:-}"
      shift 2
      ;;
    --log-file)
      LOG_FILE="${2:-}"
      shift 2
      ;;
    --out-dir)
      OUT_DIR="${2:-}"
      shift 2
      ;;
    --include-troubleshooting)
      INCLUDE_TROUBLESHOOTING=1
      shift
      ;;
    --print-prompt)
      PRINT_PROMPT=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      die "unknown option: $1"
      ;;
  esac
done

case "$WORKFLOW" in
  new-status|plan-task|update-task|update-troubleshooting)
    ;;
  *)
    die "unsupported workflow: $WORKFLOW"
    ;;
esac

if [[ -z "$OUT_DIR" ]]; then
  OUT_DIR="/tmp/${WORKFLOW}-${TARGET_DATE}"
fi

mkdir -p "$OUT_DIR"

README_DOC="$DOCS_DIR/README.md"
STATUS_README="$STATUS_DIR/README.md"
TASKS_README="$TASKS_DIR/README.md"
INFRA_DOC="$DOCS_DIR/infrastructure.md"
DOC_RULES="$DOCS_DIR/reference/document-writing-rules.md"
TROUBLESHOOTING_README="$TROUBLESHOOTING_DIR/README.md"

PROMPT_FILE="$OUT_DIR/prompt.md"
CONTEXT_FILE="$OUT_DIR/context.md"
SOURCES_FILE="$OUT_DIR/sources.txt"

LATEST_STATUS="$(latest_file "$STATUS_DIR" 'status-*.md')"
LATEST_TASK="$(latest_file "$TASKS_DIR" 'task-*.md')"
PREVIOUS_STATUS="$(previous_status_file || true)"

if [[ -n "$PREVIOUS_STATUS" && "$PREVIOUS_STATUS" == "$LATEST_STATUS" ]]; then
  PREVIOUS_STATUS=""
fi

TARGET_STATUS="$STATUS_DIR/status-$TARGET_DATE.md"
TARGET_TASK="$TASKS_DIR/task-$TARGET_DATE.md"

case "$WORKFLOW" in
  new-status)
    SKILL_FILE="$SKILLS_DIR/new-status/SKILL.md"
    TARGET_PATH="$TARGET_STATUS"
    ;;
  plan-task)
    SKILL_FILE="$SKILLS_DIR/plan-task/SKILL.md"
    TARGET_PATH="$TARGET_TASK"
    ;;
  update-task)
    SKILL_FILE="$SKILLS_DIR/update-task/SKILL.md"
    TARGET_PATH="$LATEST_TASK"
    ;;
  update-troubleshooting)
    SKILL_FILE="$SKILLS_DIR/update-troubleshooting/SKILL.md"
    TARGET_PATH="$TROUBLESHOOTING_DIR"
    [[ -n "$ISSUE_FILE" ]] || die "--issue-file is required for update-troubleshooting"
    require_file "$ISSUE_FILE"
    ;;
esac

require_file "$README_DOC"
require_file "$STATUS_README"
require_file "$TASKS_README"
require_file "$INFRA_DOC"
require_file "$DOC_RULES"
require_file "$SKILL_FILE"
require_file "$LATEST_STATUS"
require_file "$LATEST_TASK"

{
  printf '# bkit Prompt Bundle\n\n'
  printf -- '- workflow: `%s`\n' "$WORKFLOW"
  printf -- '- generated_at: `%s`\n' "$(date '+%Y-%m-%d %H:%M:%S %Z')"
  printf -- '- root: `%s`\n' "$ROOT_DIR"
  printf -- '- target_date: `%s`\n' "$TARGET_DATE"
  printf -- '- target_path: `%s`\n' "${TARGET_PATH#$ROOT_DIR/}"
  printf '\n## Goal\n\n'
  case "$WORKFLOW" in
    new-status)
      printf '전날 `status`와 최신 `task`를 바탕으로 오늘 시작 시점의 `status-%s.md` 초안을 만든다.\n' "$TARGET_DATE"
      ;;
    plan-task)
      printf '가장 최신 `status`의 `다음 작업`을 실행 가능한 `task-%s.md` 계획 초안으로 변환한다.\n' "$TARGET_DATE"
      ;;
    update-task)
      printf '최신 `task`의 `진행`과 `보류 / 다음 액션`을 실제 작업 결과 기준으로 갱신한다.\n'
      ;;
    update-troubleshooting)
      printf '이슈 메모를 기존 troubleshooting 문서에 흡수할지 판단하고, 필요하면 문서 초안을 만든다.\n'
      ;;
  esac
  printf '\n## Guardrails\n\n'
  printf -- '- 추정이 아니라 제공된 문서와 작업 로그에 근거해 작성한다.\n'
  printf -- '- `status`와 `task`의 작업 축을 임의로 바꾸지 않는다.\n'
  printf -- '- 확인되지 않은 사실을 `현재 상태`나 `진행`에 승격하지 않는다.\n'
  printf -- '- 출력은 초안이다. 실제 파일 반영 전 사람이 확인한다.\n'
  printf '\n## Expected Output\n\n'
  case "$WORKFLOW" in
    new-status)
      printf -- '- `의도`, `현재 상태`, `알려진 이슈`, `다음 작업` 섹션을 가진 Markdown 초안\n'
      ;;
    plan-task)
      printf -- '- `계획`, `진행`, `보류 / 다음 액션` 섹션을 가진 Markdown 초안\n'
      ;;
    update-task)
      printf -- '- 현재 task 파일에 그대로 붙일 수 있는 `진행` / `보류 / 다음 액션` 갱신 초안\n'
      ;;
    update-troubleshooting)
      printf -- '- 기존 문서 흡수 판단과, 필요 시 정해진 섹션 구조의 troubleshooting 초안\n'
      ;;
  esac
  printf '\n## Source Files\n\n'
  printf -- '- `%s`\n' "${README_DOC#$ROOT_DIR/}"
  printf -- '- `%s`\n' "${STATUS_README#$ROOT_DIR/}"
  printf -- '- `%s`\n' "${INFRA_DOC#$ROOT_DIR/}"
  printf -- '- `%s`\n' "${TASKS_README#$ROOT_DIR/}"
  printf -- '- `%s`\n' "${SKILL_FILE#$ROOT_DIR/}"
  printf -- '- `%s`\n' "${LATEST_STATUS#$ROOT_DIR/}"
  printf -- '- `%s`\n' "${LATEST_TASK#$ROOT_DIR/}"
  if [[ -n "$PREVIOUS_STATUS" ]]; then
    printf -- '- `%s`\n' "${PREVIOUS_STATUS#$ROOT_DIR/}"
  fi
  if [[ -n "$LOG_FILE" ]]; then
    printf -- '- `%s`\n' "$LOG_FILE"
  fi
  if [[ -n "$ISSUE_FILE" ]]; then
    printf -- '- `%s`\n' "$ISSUE_FILE"
  fi
  if [[ "$INCLUDE_TROUBLESHOOTING" == "1" || "$WORKFLOW" == "update-troubleshooting" ]]; then
    printf -- '- `%s/*.md`\n' "${TROUBLESHOOTING_DIR#$ROOT_DIR/}"
  fi
  printf '\n## Context\n\n'
  printf '세부 문맥은 같은 디렉터리의 `context.md`를 함께 사용한다.\n'
} >"$PROMPT_FILE"

{
  printf '# bkit Context\n'
  printf '\n- workflow: `%s`\n' "$WORKFLOW"
  printf -- '- target_date: `%s`\n' "$TARGET_DATE"
  printf -- '- target_path: `%s`\n' "${TARGET_PATH#$ROOT_DIR/}"
  printf '\n'
} >"$CONTEXT_FILE"

append_file_block "$CONTEXT_FILE" "$README_DOC"
append_file_block "$CONTEXT_FILE" "$STATUS_README"
append_file_block "$CONTEXT_FILE" "$INFRA_DOC"
append_file_block "$CONTEXT_FILE" "$TASKS_README"
append_file_block "$CONTEXT_FILE" "$DOC_RULES"
append_file_block "$CONTEXT_FILE" "$SKILL_FILE"
append_file_block "$CONTEXT_FILE" "$LATEST_STATUS"
append_file_block "$CONTEXT_FILE" "$LATEST_TASK"

if [[ -n "$PREVIOUS_STATUS" ]]; then
  append_file_block "$CONTEXT_FILE" "$PREVIOUS_STATUS"
fi

if [[ -n "$LOG_FILE" ]]; then
  append_file_block "$CONTEXT_FILE" "$LOG_FILE"
fi

if [[ -n "$ISSUE_FILE" ]]; then
  append_file_block "$CONTEXT_FILE" "$ISSUE_FILE"
  append_file_block "$CONTEXT_FILE" "$TROUBLESHOOTING_README"
fi

if [[ "$INCLUDE_TROUBLESHOOTING" == "1" || "$WORKFLOW" == "update-troubleshooting" ]]; then
  append_troubleshooting_blocks "$CONTEXT_FILE"
fi

SOURCE_ITEMS=(
  "${README_DOC#$ROOT_DIR/}"
  "${STATUS_README#$ROOT_DIR/}"
  "${INFRA_DOC#$ROOT_DIR/}"
  "${TASKS_README#$ROOT_DIR/}"
  "${DOC_RULES#$ROOT_DIR/}"
  "${SKILL_FILE#$ROOT_DIR/}"
  "${LATEST_STATUS#$ROOT_DIR/}"
  "${LATEST_TASK#$ROOT_DIR/}"
)

if [[ -n "$PREVIOUS_STATUS" ]]; then
  SOURCE_ITEMS+=("${PREVIOUS_STATUS#$ROOT_DIR/}")
fi
if [[ -n "$LOG_FILE" ]]; then
  SOURCE_ITEMS+=("$LOG_FILE")
fi
if [[ -n "$ISSUE_FILE" ]]; then
  SOURCE_ITEMS+=("$ISSUE_FILE")
  SOURCE_ITEMS+=("${TROUBLESHOOTING_README#$ROOT_DIR/}")
fi
if [[ "$INCLUDE_TROUBLESHOOTING" == "1" || "$WORKFLOW" == "update-troubleshooting" ]]; then
  while IFS= read -r item; do
    SOURCE_ITEMS+=("${item#$ROOT_DIR/}")
  done < <(find "$TROUBLESHOOTING_DIR" -maxdepth 1 -type f -name '*.md' | sort)
fi

append_sources_list "$SOURCES_FILE" "${SOURCE_ITEMS[@]}"

printf 'Bundle generated:\n'
printf '  prompt: %s\n' "$PROMPT_FILE"
printf '  context: %s\n' "$CONTEXT_FILE"
printf '  sources: %s\n' "$SOURCES_FILE"

if [[ "$PRINT_PROMPT" == "1" ]]; then
  printf '\n'
  sed -n '1,260p' "$PROMPT_FILE"
fi
