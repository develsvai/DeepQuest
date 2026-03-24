# Development Commands

**IMPORTANT**: All commands must be prefixed with `uv run`

## Environment Setup

```bash
# Install dependencies with uv
uv sync
```

## Running the LangGraph Server

```bash
# Start development server with hot reload
uv run langgraph dev

# Run specific graph
uv run langgraph dev --graph <graph_name>
```

## Testing

```bash
# Run all unit tests
uv run make test

# Run specific test file
uv run make test TEST_FILE=tests/unit_tests/test_specific.py

# Run integration tests
uv run make integration_tests

# Run tests in watch mode
uv run make test_watch

# Run extended tests
uv run make extended_tests

# Direct pytest commands
uv run python -m pytest tests/unit_tests/
uv run python -m pytest tests/integration_tests/
```

## Code Quality

```bash
# Run linting (ruff + mypy)
uv run make lint

# Format code
uv run make format

# Lint specific package
uv run make lint_package  # lints src/
uv run make lint_tests    # lints tests/

# Check and fix spelling
uv run make spell_check
uv run make spell_fix

# Direct commands
uv run python -m ruff check .
uv run python -m ruff format .
uv run python -m mypy --strict src/
```

## Pre-Commit Checklist

After completing development, always run code quality checks:

```bash
# Run linting to check code quality
uv run make lint

# Format code automatically
uv run make format
```

**Never commit code without running these checks first!**

## Debugging

### LangGraph Studio

1. Start server with `uv run langgraph dev`
2. Access Studio UI at http://localhost:8123
3. Use visual debugger to step through graph execution
4. Modify state and rerun from checkpoints

### Logging

- Use `structlog` for structured logging
- Set log level via environment variables
- Trace LLM calls with LangSmith when configured
