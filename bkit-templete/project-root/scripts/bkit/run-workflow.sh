#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PREPARE_SCRIPT="$ROOT_DIR/scripts/bkit/prepare-workflow-context.sh"
TODAY="${TODAY:-$(date +%F)}"
DEFAULT_RUNNER_TEMPLATE='bkit run --prompt-file "__PROMPT_FILE__" --context-file "__CONTEXT_FILE__" --output-file "__OUTPUT_FILE__"'
PROJECT_CONFIG_FILE="$ROOT_DIR/.bkit.env"

usage() {
  cat <<'EOF'
Usage:
  scripts/bkit/run-workflow.sh <workflow> [options]

This script generates a workflow bundle and then runs bkit using a command
template. By default it uses:

  bkit run --prompt-file "__PROMPT_FILE__" --context-file "__CONTEXT_FILE__" --output-file "__OUTPUT_FILE__"

If your local bkit CLI uses another syntax, override it with --runner or the
BKIT_RUNNER environment variable.

Required placeholders supported in the runner template:
  __PROMPT_FILE__
  __CONTEXT_FILE__
  __SOURCES_FILE__
  __OUTPUT_FILE__
  __WORKFLOW__
  __TARGET_DATE__
  __BUNDLE_DIR__
  __ROOT_DIR__

Options:
  --date YYYY-MM-DD        Target date. Defaults to today.
  --issue-file PATH        Forwarded to prepare-workflow-context.sh.
  --log-file PATH          Forwarded to prepare-workflow-context.sh.
  --out-dir PATH           Bundle output directory. Defaults to /tmp/<workflow>-<date>.
  --output-file PATH       bkit result file. Defaults to <out-dir>/draft.md.
  --config PATH            Optional config file to load before running.
  --runner STRING          Command template used to run bkit.
  --print-command          Print the resolved runner command.
  --print-output           Print the generated draft after execution.
  --dry-run                Generate bundle and print the command without running it.
  -h, --help               Show this help.

Example:
  scripts/bkit/run-workflow.sh new-status --date 2026-03-28 --print-command
EOF
}

die() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

escape_sed_replacement() {
  printf '%s' "$1" | sed 's/[\\/&]/\\&/g'
}

resolve_template() {
  local template="$1"
  local resolved

  resolved="$template"
  resolved="$(printf '%s' "$resolved" | sed "s/__PROMPT_FILE__/$(escape_sed_replacement "$PROMPT_FILE")/g")"
  resolved="$(printf '%s' "$resolved" | sed "s/__CONTEXT_FILE__/$(escape_sed_replacement "$CONTEXT_FILE")/g")"
  resolved="$(printf '%s' "$resolved" | sed "s/__SOURCES_FILE__/$(escape_sed_replacement "$SOURCES_FILE")/g")"
  resolved="$(printf '%s' "$resolved" | sed "s/__OUTPUT_FILE__/$(escape_sed_replacement "$OUTPUT_FILE")/g")"
  resolved="$(printf '%s' "$resolved" | sed "s/__WORKFLOW__/$(escape_sed_replacement "$WORKFLOW")/g")"
  resolved="$(printf '%s' "$resolved" | sed "s/__TARGET_DATE__/$(escape_sed_replacement "$TARGET_DATE")/g")"
  resolved="$(printf '%s' "$resolved" | sed "s/__BUNDLE_DIR__/$(escape_sed_replacement "$BUNDLE_DIR")/g")"
  resolved="$(printf '%s' "$resolved" | sed "s/__ROOT_DIR__/$(escape_sed_replacement "$ROOT_DIR")/g")"
  printf '%s\n' "$resolved"
}

TARGET_DATE="$TODAY"
ISSUE_FILE=""
LOG_FILE=""
OUT_DIR=""
OUTPUT_FILE=""
CONFIG_FILE="$PROJECT_CONFIG_FILE"
RUNNER_TEMPLATE=""
PRINT_COMMAND=0
PRINT_OUTPUT=0
DRY_RUN=0

if [[ $# -lt 1 ]]; then
  usage
  exit 1
fi

case "${1:-}" in
  -h|--help)
    usage
    exit 0
    ;;
esac

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
    --output-file)
      OUTPUT_FILE="${2:-}"
      shift 2
      ;;
    --config)
      CONFIG_FILE="${2:-}"
      shift 2
      ;;
    --runner)
      RUNNER_TEMPLATE="${2:-}"
      shift 2
      ;;
    --print-command)
      PRINT_COMMAND=1
      shift
      ;;
    --print-output)
      PRINT_OUTPUT=1
      shift
      ;;
    --dry-run)
      DRY_RUN=1
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

if [[ -n "$CONFIG_FILE" && -f "$CONFIG_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$CONFIG_FILE"
fi

if [[ -z "$RUNNER_TEMPLATE" ]]; then
  RUNNER_TEMPLATE="${BKIT_RUNNER:-$DEFAULT_RUNNER_TEMPLATE}"
fi

[[ -x "$PREPARE_SCRIPT" ]] || die "prepare script is not executable: $PREPARE_SCRIPT"

if [[ -z "$OUT_DIR" ]]; then
  OUT_DIR="/tmp/${WORKFLOW}-${TARGET_DATE}"
fi

PREPARE_ARGS=("$WORKFLOW" "--date" "$TARGET_DATE" "--out-dir" "$OUT_DIR")

if [[ -n "$ISSUE_FILE" ]]; then
  PREPARE_ARGS+=("--issue-file" "$ISSUE_FILE")
fi

if [[ -n "$LOG_FILE" ]]; then
  PREPARE_ARGS+=("--log-file" "$LOG_FILE")
fi

"$PREPARE_SCRIPT" "${PREPARE_ARGS[@]}"

BUNDLE_DIR="$OUT_DIR"
PROMPT_FILE="$BUNDLE_DIR/prompt.md"
CONTEXT_FILE="$BUNDLE_DIR/context.md"
SOURCES_FILE="$BUNDLE_DIR/sources.txt"

[[ -f "$PROMPT_FILE" ]] || die "missing prompt file: $PROMPT_FILE"
[[ -f "$CONTEXT_FILE" ]] || die "missing context file: $CONTEXT_FILE"
[[ -f "$SOURCES_FILE" ]] || die "missing sources file: $SOURCES_FILE"

if [[ -z "$OUTPUT_FILE" ]]; then
  OUTPUT_FILE="$BUNDLE_DIR/draft.md"
fi

mkdir -p "$(dirname "$OUTPUT_FILE")"

RESOLVED_RUNNER="$(resolve_template "$RUNNER_TEMPLATE")"

if [[ "$PRINT_COMMAND" == "1" || "$DRY_RUN" == "1" ]]; then
  printf 'Resolved runner command:\n%s\n' "$RESOLVED_RUNNER"
fi

if [[ "$DRY_RUN" == "1" ]]; then
  exit 0
fi

if ! command -v bkit >/dev/null 2>&1; then
  if [[ "$RUNNER_TEMPLATE" == "$DEFAULT_RUNNER_TEMPLATE" ]]; then
    die "default runner uses 'bkit', but the command is not installed. Install bkit or override the runner with --runner/BKIT_RUNNER."
  fi
fi

bash -lc "$RESOLVED_RUNNER"

[[ -f "$OUTPUT_FILE" ]] || die "runner finished but output file was not created: $OUTPUT_FILE"

printf 'bkit draft generated:\n'
printf '  bundle: %s\n' "$BUNDLE_DIR"
printf '  output: %s\n' "$OUTPUT_FILE"

if [[ "$PRINT_OUTPUT" == "1" ]]; then
  printf '\n'
  sed -n '1,260p' "$OUTPUT_FILE"
fi
