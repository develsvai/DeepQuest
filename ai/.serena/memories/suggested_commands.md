# Essential Development Commands

## IMPORTANT: Command Prefix
**All commands must be prefixed with `uv run`** - the project uses `uv` as the package manager.

## Running the LangGraph Server

```bash
# Start development server with hot reload
uv run langgraph dev

# Run specific graph
uv run langgraph dev --graph <graph_name>
```

The server starts at `http://localhost:8123` with LangGraph Studio UI for visual debugging.

## Testing

```bash
# Run all unit tests
uv run make test

# Run specific test file
uv run make test TEST_FILE=tests/unit_tests/test_specific.py

# Run integration tests
uv run make integration_tests

# Run tests in watch mode (auto-rerun on changes)
uv run make test_watch

# Run extended tests (tests marked with @pytest.mark.extended)
uv run make extended_tests

# Direct pytest commands (alternative)
uv run python -m pytest tests/unit_tests/
uv run python -m pytest tests/integration_tests/
```

## Code Quality (MUST RUN BEFORE COMMIT)

```bash
# Run linting (ruff + mypy)
uv run make lint

# Format code (ruff format + isort)
uv run make format

# Lint specific package
uv run make lint_package  # Lints src/ directory
uv run make lint_tests    # Lints tests/ directory

# Check spelling
uv run make spell_check

# Fix spelling errors
uv run make spell_fix

# Direct commands (if needed)
uv run python -m ruff check .
uv run python -m ruff format .
uv run python -m mypy --strict src/
```

## Package Management

```bash
# Install dependencies
uv add

# Add new dependency
uv add <package-name>

# Add dev dependency
uv add --dev <package-name>

# Sync dependencies (after changes)
uv sync
```

## System Commands (macOS Darwin)

Standard Unix commands work on macOS:
- `ls`, `cd`, `pwd` - Navigation
- `grep`, `find` - Search
- `git` - Version control
- `cat`, `less` - File viewing
- `mkdir`, `rm`, `mv`, `cp` - File operations

## Help

```bash
# Show available make targets
uv run make help
```
