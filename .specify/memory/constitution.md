<!--
SYNC IMPACT REPORT
==================
Version Change: INITIAL → 1.0.0 → 1.1.0
Date: 2025-10-10 (initial) → 2025-10-10 (amended)

Constitution Updates:
- Version: 1.1.0 (amended for MVP phase)
- Ratification Date: 2025-10-10
- Last Amended Date: 2025-10-10

Amendment Summary (v1.0.0 → v1.1.0):
- MINOR version bump: Principle I expanded with MVP-aware guidance
- Changed "Test-Driven Development (NON-NEGOTIABLE)" → "Pragmatic Testing (MVP-Aware)"
- Made testing optional during MVP phase for non-critical features
- Maintained strict testing for critical paths, high-risk areas, and stable APIs
- Updated pre-commit requirements to reflect optional testing during MVP
- Updated code review checklist to align with MVP testing strategy

Principles Added (Cross-Project):
1. Pragmatic Testing (MVP-Aware)
2. Type Safety First
3. Component/Module Reusability
4. Performance by Default
5. Code Quality Automation

Principles Added (Full-Stack Server-Specific):
6. Design System Supremacy
7. Server-First Rendering
8. Internationalization First

Principles Added (AI Server-Specific):
9. Graph Structure Consistency
10. LangGraph Best Practices

Sections Added:
- Core Principles (Cross-Project)
- Full-Stack Server-Specific Principles (/web)
- AI Server-Specific Principles (/ai)
- UX Consistency Standards (Full-Stack)
- Code Quality Gates (Cross-Project)
- Governance

Templates Status:
- ✅ plan-template.md: Constitution Check gate present, aligns with principles
- ✅ spec-template.md: User story structure supports testable requirements
- ✅ tasks-template.md: TDD workflow enforced (tests first, then implement)
- ⚠️ Commands: Should reference this constitution for quality gates

Follow-up Actions:
- None - all placeholders filled

Suggested Commit Message:
docs: establish constitution v1.0.0 (cross-project + full-stack + ai server principles)
-->

# Deep Quest Constitution

This constitution governs both the **AI Server (`/ai`)** and **Full-Stack Server (`/web`)** projects in the Deep Quest monorepo.

**Project Structure**:

- `/web` - Next.js 15 Full-Stack application (Frontend + Backend API with tRPC)
- `/ai` - Python LangGraph AI processing server

---

## Core Principles (Cross-Project)

These principles apply to **BOTH** `/ai` (Python LangGraph) and `/web` (Next.js Full-Stack) projects.

### I. Pragmatic Testing (MVP-Aware)

**Rule**: Write tests strategically based on risk and value. During MVP development, prioritize shipping over comprehensive test coverage.

**Testing Strategy**:

- **Critical paths ONLY**: Test core business logic, payment flows, authentication, data integrity
- **High-risk areas**: Complex algorithms, edge cases that could cause data loss or security issues
- **Stable APIs**: Public APIs and interfaces that other systems depend on
- **Skip during MVP**: UI components, styling, simple CRUD operations, rapid prototypes

**When to Write Tests**:

1. **Before refactoring**: Add tests to legacy code before making changes
2. **Bug fixes**: Write test that reproduces the bug, then fix it
3. **Complex logic**: Algorithms with multiple branches or edge cases
4. **Integration points**: External API calls, database interactions, AI model integrations

**Testing Requirements**:

- `/web`: Use Vitest with Testing Library (command: `pnpm test`)
- `/ai`: Use pytest with fixtures (command: `uv run make test`)
- Test behavior, not implementation details
- Tests MUST be deterministic (no flaky tests)
- All existing tests MUST pass before committing
- NEVER disable or skip tests without justification
- Mock external services (LLMs, databases, APIs) for deterministic testing

**MVP Exception**:
During MVP development phase, tests are **OPTIONAL** for:

- New features without critical business impact
- Rapid prototyping and experimental code
- UI/UX iterations that change frequently
- Features that will be validated with users first

**Post-MVP Transition**:
Once product-market fit is achieved, gradually increase test coverage for stable features.

**Rationale**: In MVP stage, speed of iteration and user feedback are more valuable than comprehensive test coverage. Tests should protect critical functionality without slowing down development. Focus on shipping, learning, and iterating quickly.

**Enforcement**: Pre-commit hooks MUST verify all existing tests pass. New tests are encouraged for high-risk code but not mandatory during MVP phase.

---

### II. Type Safety First

**Rule**: Type systems MUST be used to maximum extent. All public APIs MUST have explicit type annotations.

**TypeScript Requirements (`/web`)**:

- TypeScript strict mode enabled (no implicit any)
- Explicit return types for all functions and methods
- Type all public APIs, utilities, component props, and tRPC procedures
- Use Zod schemas for runtime validation at boundaries (API inputs, form data, external data)
- Prefer `unknown` over `any` when type is truly unknown
- Unused variables MUST start with `_` if intentional

**Python Requirements (`/ai`)**:

- Type hints for all function signatures
- Use Pydantic models for data validation (LangGraph states, schemas, API contracts)
- Run mypy in strict mode for type checking
- Prefer explicit types over implicit Any
- Use TypedDict or dataclasses for structured data

**Rationale**: Type safety catches errors at compile/check time, serves as documentation, enables IDE autocomplete, and makes refactoring safe. In Deep Quest with tRPC (full-stack server) and Pydantic (AI server), end-to-end type safety eliminates entire classes of bugs.

**Enforcement**:

- `/web`: TypeScript compiler errors MUST be resolved before commit. ESLint warns on `any` usage.
- `/ai`: mypy checks MUST pass. ruff enforces type hint presence.

---

### III. Component/Module Reusability

**Rule**: Search for existing components/modules before creating new ones. Maximize reusability and minimize duplication.

**Requirements**:

- Search codebase for similar implementations using semantic search before creating new ones
- Extract reusable logic into shared modules/components
- Keep files focused and modular (<300 lines ideal)
- Generalize with parameters/props rather than creating similar variants
- Document public APIs with JSDoc (TypeScript) or docstrings (Python)

**Full-Stack Server (`/web`)**:

- Shared UI components: `src/components/ui/`
- Feature-specific components: Route `_components/` folders
- Shared utilities: `src/lib/` and `src/utils/`
- tRPC routers: `src/server/api/routers/`
- Database utilities: `src/server/db/`

**AI Server (`/ai`)**:

- Shared utilities: `src/common/` and `src/utils/`
- Graph-specific code: `src/graphs/<graph_name>/`
- Reusable nodes/functions: Consider extracting to common modules

**Rationale**: Reduces code duplication, improves consistency, accelerates development, and simplifies maintenance. A well-modularized codebase is easier to understand, test, and modify.

**Enforcement**: Code review MUST verify reuse was considered. Linting enforces file length limits where applicable.

---

### IV. Performance by Default

**Rule**: Applications MUST be performant by default. Performance is a feature, not an optimization.

**Full-Stack Server Performance (`/web`)**:

- Frontend: Implement loading states for all async operations (skeleton loaders, spinners)
- Frontend: Use React Suspense boundaries to handle async rendering
- Frontend: Lazy load heavy components with `next/dynamic`
- Frontend: Optimize images with Next.js Image component
- Backend: Implement proper caching strategies with React Query (via tRPC)
- Backend: Optimize database queries (use Prisma query optimization)
- Backend: Implement response streaming for large payloads when appropriate
- Monitor Core Web Vitals (LCP < 2.5s, FID < 100ms, CLS < 0.1)

**AI Server Performance (`/ai`)**:

- Target 5-second response time for feedback generation
- Implement caching for expensive LLM operations
- Use async operations (`async/await`) for I/O-bound tasks
- Batch LLM calls when processing multiple items
- Consider token limits and costs for LLM providers
- Implement proper retry strategies with exponential backoff
- Stream responses when possible for better UX
- Use LangGraph checkpointing for long-running workflows

**Performance Targets**:

- **Frontend**: Initial page load < 3s on 3G, Time to Interactive < 5s
- **Backend API**: Response time < 500ms p95 for non-AI endpoints
- **AI Server**: Resume parsing < 10s, Question generation < 15s, Feedback generation < 5s

**Rationale**: Users abandon slow applications. Performance directly impacts user satisfaction, conversion rates, and SEO rankings. Building performance in from the start is far cheaper than optimizing later.

**Enforcement**:

- Performance budgets monitored in CI
- Code review MUST verify loading states and caching strategies
- Load testing for AI server endpoints

---

### V. Code Quality Automation (NON-NEGOTIABLE)

**Rule**: Automated code quality checks MUST pass before ANY commit or PR. Manual enforcement is insufficient.

**Full-Stack Server (`/web`) - Command: `pnpm check-all`**:

This command runs:

1. `pnpm type-check` - TypeScript compilation with zero errors
2. `pnpm lint` - ESLint with zero errors (warnings acceptable with justification)
3. `pnpm format:check` - Prettier formatting verification

**When to run**:

- BEFORE every commit
- BEFORE creating a PR
- After completing any code changes

**AI Server (`/ai`) - Command: `uv run make lint`**:

This command runs:

1. `ruff check .` - Linting with zero errors
2. `ruff format . --diff` - Format checking
3. `ruff check --select I .` - Import sorting verification
4. `mypy --strict src/` - Type checking with strict mode

**When to run**:

- BEFORE every commit
- BEFORE creating a PR
- After completing any code changes

**Additional Commands**:

- `/web`: `pnpm format` to auto-fix formatting issues
- `/ai`: `uv run make format` to auto-fix formatting and import issues

**Rationale**: Manual code quality checks are error-prone and inconsistent. Automated checks ensure every commit meets minimum quality standards, prevent technical debt accumulation, and catch issues before code review. Consistency across the team is only possible with automation.

**Enforcement**:

- Pre-commit hooks MUST run quality checks
- CI MUST fail if quality checks don't pass
- PRs MUST NOT be merged if quality checks fail
- Developers MUST run checks locally before pushing
- NEVER use `--no-verify` to bypass hooks

---

## Full-Stack Server-Specific Principles (`/web`)

### VI. Design System Supremacy

**Rule**: All UI components MUST use centralized design tokens from the design system. Direct styling values are PROHIBITED.

**Requirements**:

- Import and use `designTokens` from `/web/src/components/design-system/core.ts` for ALL styling
- NO hardcoded colors, spacing, typography, or other design values
- NO raw HTML elements (`<div>`, `<button>`, etc.) - use design system components (PageContainer, Card, Button, etc.)
- All component variants MUST be defined within the design system

**Rationale**: Ensures visual consistency, enables theme changes without code modifications, and prevents design debt. A centralized design system eliminates "magic values" scattered throughout the codebase.

**Enforcement**: Code review MUST reject any PR containing hardcoded design values or raw HTML elements.

---

### VII. Server-First Rendering

**Rule**: Maximize Server-Side Rendering (SSR). Client-side rendering MUST be justified and minimized.

**Requirements**:

- Page components (`page.tsx`) MUST be Server Components (NO "use client" directive)
- Create separate client components ONLY when interactivity requires it (event handlers, hooks, browser APIs)
- Use React Suspense boundaries for async data fetching in Server Components
- Pass serializable props from Server Components to Client Components
- tRPC procedures run on the server by default - leverage this for data fetching

**Rationale**: SSR improves initial page load performance, SEO, and reduces JavaScript bundle size. In Next.js 15, Server Components are the default and most performant pattern. The full-stack architecture allows seamless server-side data fetching with tRPC.

**Enforcement**: ESLint rules warn on "use client" in page files. Code review MUST verify client components have clear justification.

---

### VIII. Internationalization First

**Rule**: All user-facing text MUST be internationalized. No hardcoded strings in components.

**Requirements**:

- Use `next-intl` for all user-facing text
- Store translations in `/web/locales/{ko,en}/` directories
- Support Korean (default) and English languages
- Use semantic translation keys (e.g., `common.submit`, not `button1`)
- Format dates, numbers, and currencies according to locale
- Test UI in both languages before committing

**Rationale**: Internationalization cannot be retrofitted easily. Building it in from the start enables global reach and follows web standards. Deep Quest targets Korean users primarily but must support English.

**Enforcement**: ESLint plugin detects hardcoded strings in JSX. Code review MUST verify all UI text uses translation keys.

---

## AI Server-Specific Principles (`/ai`)

### IX. Graph Structure Consistency

**Rule**: All LangGraph workflows MUST follow the standardized file structure pattern. No ad-hoc graph organization.

**Required File Structure**:

```
src/graphs/<graph_name>/
├── graph.py          # REQUIRED: Graph definition and workflow compilation
├── state.py          # REQUIRED: Pydantic state schema
├── nodes.py          # REQUIRED: Node implementations
├── schema.py         # OPTIONAL: Additional data models
├── prompts.py        # OPTIONAL: LLM prompt templates
└── configuration.py  # OPTIONAL: Graph-specific configuration
```

**Requirements**:

- Each graph MUST have `graph.py`, `state.py`, and `nodes.py`
- State MUST be defined using Pydantic models
- Nodes MUST be async functions that accept state and return state updates (dict)
- Register all graphs in `langgraph.json`
- Update package configuration in `pyproject.toml` when adding new graphs
- Use absolute imports with package names from `pyproject.toml` (NO relative imports)

**Rationale**: Consistent structure makes graphs discoverable, maintainable, and easier to understand. New developers can navigate any graph without guessing file locations. Standardization enables tooling and automation.

**Enforcement**: Code review MUST verify new graphs follow this structure exactly. CI checks for missing required files.

---

### X. LangGraph Best Practices

**Rule**: Follow LangGraph framework conventions and best practices. Always consult official documentation before implementation.

**Documentation-First Development**:

- **ALWAYS** use context7 MCP to fetch latest LangGraph/LangChain docs before implementing:
  ```bash
  mcp__context7__get-library-docs library: langgraph
  mcp__context7__get-library-docs library: langchain
  ```
- LangGraph APIs evolve rapidly - never assume patterns from old code are current

**Node Implementation Best Practices**:

- Nodes are pure functions that accept state and return state updates (dict)
- Use async/await for all LLM calls and I/O operations
- Implement error handling within nodes - return errors in state, don't throw
- Keep nodes focused - one responsibility per node
- Use descriptive node names that explain their purpose

**State Management Best Practices**:

- Define state schema with Pydantic models for validation
- Use Optional fields for intermediate state that may not exist
- Include error tracking in state (e.g., `errors: list[str]`)
- Avoid deeply nested state structures - keep flat when possible

**Error Handling Pattern**:

```python
async def safe_node(state: GraphState) -> dict:
    try:
        result = await risky_operation(state.input)
        return {"output": result}
    except Exception as e:
        return {"errors": [f"Node failed: {str(e)}"]}
```

**LLM Usage Best Practices**:

- Mock LLM calls in tests for deterministic results
- Implement retry logic with exponential backoff
- Set appropriate timeouts for LLM calls
- Consider token limits and costs
- Log prompts and responses for debugging (use LangSmith when available)

**Rationale**: LangGraph has specific patterns for state management, graph composition, and error handling. Following these patterns ensures graphs are debuggable, maintainable, and compatible with LangGraph Studio.

**Enforcement**:

- Code review MUST verify documentation was consulted
- All graphs MUST be testable in LangGraph Studio
- Integration tests MUST pass before merging

---

## UX Consistency Standards (`/web`)

### Error Handling

- Display user-friendly error messages (no stack traces to users)
- Provide actionable guidance for error recovery
- Use toast notifications for transient errors (sonner)
- Use error pages for fatal errors
- Log detailed errors server-side for debugging

### Loading States

- Show skeleton loaders for content areas
- Use spinners for short operations (< 2 seconds)
- Show progress indicators for long operations (AI processing)
- Never block UI entirely - allow cancellation when possible

### Forms

- Use `react-hook-form` with Zod validation
- Show validation errors inline as user types
- Disable submit button until form is valid
- Show loading state during submission
- Provide clear success/failure feedback

### Navigation

- Breadcrumbs for nested pages
- Active state indicators in navigation
- Keyboard navigation support (Tab, Enter, Escape)
- Focus management for accessibility

### Responsive Design

- Mobile-first approach
- Test on mobile, tablet, desktop viewports
- Use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`)
- Ensure touch targets are ≥ 44×44 pixels

---

## Code Quality Gates (Cross-Project)

### Pre-Commit Requirements

**Every commit MUST satisfy**:

**Full-Stack Server (`/web`)**:

1. ✅ Run `pnpm check-all` with zero errors
   - TypeScript compilation succeeds
   - ESLint runs with zero errors
   - Prettier formatting is correct
2. ✅ All existing tests pass: `pnpm test:run` (if tests exist)
3. ✅ No `any` types without explicit justification
4. ⚠️ Test coverage for new functionality (OPTIONAL during MVP, encouraged for critical paths)
5. ✅ Constitution compliance

**AI Server (`/ai`)**:

1. ✅ Run `uv run make lint` with zero errors
   - ruff linting passes
   - ruff format checking passes
   - Import sorting is correct
   - mypy type checking passes (strict mode)
2. ✅ All existing tests pass: `uv run make test` (if tests exist)
3. ✅ Google-style docstrings for public APIs
4. ⚠️ Test coverage for new graphs/nodes (OPTIONAL during MVP, encouraged for complex logic)
5. ✅ Constitution compliance

### Pre-PR Requirements

**Before creating a pull request**:

1. ✅ Self-review all changes
2. ✅ Run full test suite locally
   - `/web`: `pnpm test:run`
   - `/ai`: `uv run make test` and `uv run make integration_tests`
3. ✅ Run code quality checks
   - `/web`: `pnpm check-all`
   - `/ai`: `uv run make lint`
4. ✅ Update documentation if APIs changed
5. ✅ Verify no debug statements remain (`console.log`, `print()`)
6. ✅ Check bundle size impact (if frontend changes)
7. ✅ Test in both Korean and English locales (if frontend changes)
8. ✅ Test in LangGraph Studio (if AI server changes)
9. ✅ Write descriptive commit messages explaining "why"

### Code Review Checklist

**Reviewers MUST verify**:

**Cross-Project**:

- [ ] All core principles (I-V) are followed
- [ ] Code quality automation checks passed (`pnpm check-all` or `uv run make lint`)
- [ ] Tests exist for critical paths (optional for MVP features)
- [ ] Types are explicit and correct
- [ ] Code is reusable and modular
- [ ] Performance considerations addressed
- [ ] Error handling is appropriate
- [ ] Code is self-documenting

**Full-Stack Server-Specific**:

- [ ] No hardcoded design values or raw HTML elements
- [ ] Server Components used where possible
- [ ] All text is internationalized
- [ ] tRPC procedures are type-safe

**AI Server-Specific**:

- [ ] Graph structure follows standard pattern
- [ ] LangGraph best practices followed
- [ ] Documentation was consulted (if new LangGraph features used)
- [ ] Graph is testable in LangGraph Studio

---

## Governance

### Git Safety (NON-NEGOTIABLE)

**Rule**: The assistant MUST NOT run the following commands under any circumstance unless the user has **explicitly** requested them:

- `git reset` (any form: `--soft`, `--mixed`, `--hard`)
- `git revert`
- `git push --force` or `git push --force-with-lease`

**Rationale**: These operations rewrite or overwrite history and can cause irreversible data loss or break shared branches. They must only be performed by explicit user decision.

**Enforcement**: No exception. If in doubt, do not run these commands. Suggest alternatives (e.g. new commit, normal push) instead.

---

### Constitution Authority

This Constitution supersedes all other development practices, style guides, and conventions for **BOTH** `/ai` and `/web` projects. When conflicts arise, Constitution principles take precedence.

### Amendment Process

Constitution changes require:

1. **Documentation**: Detailed rationale for the change
2. **Impact Analysis**: Assessment of affected code and templates in BOTH projects
3. **Team Approval**: Consensus among core maintainers
4. **Migration Plan**: Clear steps for updating existing code in affected projects
5. **Version Bump**: Semantic versioning of constitution
   - **MAJOR**: Backward-incompatible changes (principle removal/redefinition)
   - **MINOR**: New principles or materially expanded guidance
   - **PATCH**: Clarifications, wording fixes, non-semantic refinements

### Versioning Rules

- Version format: `MAJOR.MINOR.PATCH`
- Ratification Date: Original adoption date (never changes)
- Last Amended Date: Date of most recent change (updates with each amendment)
- All amendments documented in Sync Impact Report comment

### Project-Specific Exceptions

If a principle must be violated for a specific project:

1. Document the violation in implementation plan
2. Explain why it's necessary for that specific project context
3. Document what simpler alternatives were considered
4. Get explicit approval during code review
5. Add TODO with issue number for future remediation (if applicable)

### Compliance Reviews

- **Every PR**: Reviewed for constitution compliance (both cross-project and project-specific principles)
- **Monthly**: Audit both `/ai` and `/web` codebases for drift from principles
- **Quarterly**: Review constitution for needed updates based on learnings from both projects
- **Annual**: Major constitution review and refinement

### Template Synchronization

When constitution changes:

1. Update `.specify/templates/plan-template.md` (Constitution Check section)
2. Update `.specify/templates/spec-template.md` (requirements alignment)
3. Update `.specify/templates/tasks-template.md` (testing requirements)
4. Update command templates in `.claude/commands/speckit.*.md`
5. Update project documentation (`CLAUDE.md` in both `/ai` and `/web`, root `CLAUDE.md`)
6. Document all changes in Sync Impact Report

---

**Version**: 1.1.0 | **Ratified**: 2025-10-10 | **Last Amended**: 2025-10-10
