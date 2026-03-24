# Task Completion Checklist

## Before Marking Any Task as Complete

### 1. Code Quality Checks

```bash
cd web

# Run all quality checks
pnpm check-all

# This runs:
# - pnpm type-check (TypeScript compilation)
# - pnpm lint (ESLint)
# - pnpm format:check (Prettier)
```

All checks must pass without errors.

### 2. Testing Requirements

```bash
cd web

# Run tests
pnpm test:run
```

- All existing tests must pass
- New functionality should have tests
- No skipped or disabled tests

### 3. Build Verification

```bash
cd web

# Verify production build works
pnpm build
```

Build must complete successfully without errors.

### 4. Code Review Checklist

#### TypeScript

- [ ] No `any` types (or explicitly justified)
- [ ] Proper type annotations for public APIs
- [ ] No unused variables (unless prefixed with `_`)

#### Styling

- [ ] No hardcoded colors - only `designTokens.colors.*`
- [ ] No raw `<div>` tags - use design system components
- [ ] Consistent use of design system

#### Components

- [ ] No "use client" in page.tsx files
- [ ] Client components separated when needed
- [ ] Proper loading states implemented
- [ ] Error handling in place
- [ ] i18n support (Korean/English)

#### Code Organization

- [ ] Files follow kebab-case naming
- [ ] Components use PascalCase
- [ ] Absolute imports with `@/` prefix
- [ ] Components properly componentized (not too long)
- [ ] Existing components reused where possible

#### Documentation

- [ ] JSDoc comments for public APIs
- [ ] Complex logic explained
- [ ] README updated if needed

### 5. Database Changes (if applicable)

```bash
cd web

# After schema changes
pnpm db:generate
pnpm db:migrate

# Verify migration works
pnpm db:migrate:reset  # WARNING: deletes data
pnpm db:seed
```

- [ ] Prisma schema updated
- [ ] Migration created and tested
- [ ] Seed data updated if needed

### 6. Git Workflow

```bash
# Verify changes
git status
git diff

# Stage changes
git add .

# Commit with descriptive message
git commit -m "type: description"

# Common types: feat, fix, refactor, docs, test, chore
```

- [ ] Commit message follows convention
- [ ] Commits are atomic and logical
- [ ] No sensitive data in commits

## Pre-Commit Hooks

If pre-commit hooks are configured, they will automatically run:

- ESLint
- Prettier
- Type checking

**NEVER** bypass hooks with `--no-verify`.

## Final Verification

Before pushing:

```bash
# One final check
cd web && pnpm check-all && pnpm test:run && pnpm build
```

All three must pass:

1. ✅ check-all (linting, formatting, types)
2. ✅ test:run (all tests)
3. ✅ build (production build)

## AI Server Task Completion

If changes were made to AI server:

```bash
cd ai

# Run linting
uv run lint .

# Run type checking
uv run mypy .

# Run tests
uv run pytest
```

## Summary

**NEVER mark a task complete unless:**

1. All quality checks pass
2. All tests pass
3. Build succeeds
4. Code follows project conventions
5. Changes are properly committed
