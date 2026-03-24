# Task Completion Checklist

When completing any development task, follow this checklist:

## 1. Code Quality (MANDATORY)

### Run Linting
```bash
uv run make lint
```
This runs:
- `ruff check` - Code style and error checking
- `ruff format --diff` - Format verification
- `mypy --strict` - Type checking

### Fix Issues
If linting fails:
```bash
# Auto-format code
uv run make format

# Then re-run lint
uv run make lint
```

**NEVER commit without passing lint checks!**

## 2. Testing

### Run Relevant Tests
```bash
# For new features or bug fixes
uv run make test

# For integration changes
uv run make integration_tests

# For specific test file
uv run make test TEST_FILE=tests/unit_tests/test_my_feature.py
```

### Test Requirements
- All existing tests must pass
- Add new tests for new functionality
- Use existing test fixtures from `conftest.py`
- Tests should be deterministic (no random/time-dependent behavior)

## 3. Type Safety Verification

Ensure all code has proper type hints:
- Function parameters typed
- Return types specified
- No `# type: ignore` comments unless absolutely necessary
- Passes `mypy --strict`

## 4. Import Verification

Check that all imports are:
- **Absolute** (using package names from `pyproject.toml`)
- **Not relative** (avoid `from .module import ...`)
- Properly organized (isort will handle this)

## 5. Documentation

### Update if needed:
- Docstrings for complex functions (Google style)
- README.md if adding new graph or major feature
- CLAUDE.md if changing development patterns

## 6. Git Commit

### Commit Message Format
Use descriptive commit messages:
```
<type>: <subject>

<body>
```

Types: feat, fix, docs, refactor, test, chore

Example:
```
feat: add importance evaluation to resume parser

Implemented LLM-based importance scoring for career and project
experiences based on JD match using 3-criteria scoring system.
```

### Before Commit
- [ ] `uv run make lint` passes
- [ ] `uv run make test` passes
- [ ] No debug print statements
- [ ] No commented-out code
- [ ] All type hints in place

## 7. LangGraph-Specific Checks

If modifying graphs:
- [ ] Graph compiles without errors
- [ ] State schema properly defined
- [ ] Nodes return dict (not full state)
- [ ] Configuration schema updated if needed
- [ ] Graph registered in `langgraph.json`
- [ ] Test graph in LangGraph Studio (`uv run langgraph dev`)

## 8. Common Mistakes to Avoid

❌ Using relative imports
❌ Missing type hints
❌ Committing without running lint
❌ Skipping tests
❌ Leaving print() statements
❌ Using implicit `Any` types
❌ Bypassing pre-commit hooks

## Quick Pre-Commit Command

```bash
# Run this before every commit
uv run make lint && uv run make test
```

If both pass, you're ready to commit! ✅
