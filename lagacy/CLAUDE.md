# CLAUDE.md

This file provides guidance to Claude Code when working with the Deep Quest monorepo.

## Project Overview

**Deep Quest** is an AI-powered technical interview coaching platform built as a monorepo with two main services:

- **Full-Stack Server** (`/web`) - Next.js 15 application handling UI, API, and database
- **AI Server** (`/ai`) - Python LangGraph service for AI processing

## Monorepo Navigation

```
deep-quest/
├── web/              # Next.js 16 Full-Stack Application
│   ├── .claude/
│   │   └── rules/
│   │       ├── frontend/      # → Frontend rules (components, app router, i18n)
│   │       │   ├── index.md
│   │       │   ├── app-router.md
│   │       │   ├── zod-i18n.md
│   │       │   └── locales.md
│   │       └── backend/       # → Backend rules (tRPC, services, schemas)
│   │           ├── index.md
│   │           ├── server-architecture.md
│   │           └── schema-organization.md
│   ├── src/           # Application code
│   └── prisma/        # Database schema
│
├── ai/                # Python LangGraph AI Server
│   ├── CLAUDE.md      # → Detailed AI/LangGraph guidance
│   ├── src/           # AI processing graphs
│   └── tests/         # AI server tests
│
└── .specify/
    └── memory/
        └── constitution.md  # → Source of truth for all principles
```

## Where to Work: Decision Tree

**If you're working on:**

- ✅ **UI, Frontend, Components** → Work in `/web` (rules auto-loaded from `web/.claude/rules/frontend/`)
- ✅ **API, Database, tRPC, Services** → Work in `/web` (rules auto-loaded from `web/.claude/rules/backend/`)
- ✅ **AI Processing, LangGraph, Question Generation, Resume Parsing** → Work in `/ai` and read `ai/CLAUDE.md`
- ✅ **Documentation, Requirements, Architecture** → Work in `/docs`

**When in doubt:** Check `.specify/memory/constitution.md` for principles that apply to your work.

## Constitutional Principles (MUST READ)

**All development MUST comply with** `.specify/memory/constitution.md` (v1.1.0):

### Cross-Project Principles (Apply to ALL code)

1. **Pragmatic Testing (MVP-Aware)** - Test critical paths, skip non-critical during MVP
2. **Type Safety First** - Explicit types everywhere, no implicit any
3. **Component/Module Reusability** - Search before creating, extract reusable code
4. **Performance by Default** - Loading states, caching, optimization built-in
5. **Code Quality Automation (NON-NEGOTIABLE)** - Quality checks MUST pass before commit

### Project-Specific Principles

- **Full-Stack (`/web`)** - Design System Supremacy, Server-First Rendering, i18n First
- **AI Server (`/ai`)** - Graph Structure Consistency, LangGraph Best Practices

**Quality Gates (NON-NEGOTIABLE):**

- `/web`: Run `pnpm check-all` before every commit (type-check + lint + format)
- `/ai`: Run `uv run make lint` before every commit (ruff + mypy + format)
- All existing tests MUST pass
- NEVER use `--no-verify` to bypass hooks
- **Exception:** Quality checks can be skipped if changes are only in `.md` files

## Quick Start by Role

### Frontend/Full-Stack Developer

1. Rules auto-loaded from `web/.claude/rules/frontend/` and `web/.claude/rules/backend/`
2. Key commands: `pnpm install`, `pnpm dev`, `pnpm check-all`
3. Tech stack: Next.js 16, tRPC, Prisma, Supabase, Clerk, Tailwind CSS

### AI/Backend Developer

1. Read `ai/CLAUDE.md` for detailed guidance
2. Key commands: `uv run langgraph dev`, `uv run make test`, `uv run make lint`
3. Tech stack: Python 3.13+, LangGraph, LangChain, Pydantic

### Documentation Writer

1. Product requirements: `/docs/sharded/prd/index.md`
2. Architecture docs: `/docs/sharded/architecture/index.md`
3. Development rules: `/docs/web/rules/` (frontend-specific)

## Cross-Project Development Workflow

### Pre-Commit Checklist (ALL Projects)

**For code changes:**

- ✅ Run project-specific quality checks (`pnpm check-all` or `uv run make lint`)
- ✅ All existing tests pass
- ✅ Constitution principles followed
- ✅ No hardcoded values (use design tokens in `/web`, config in `/ai`)
- ✅ Descriptive commit message explaining "why"

**Exception:** If changes are **only** in `.md` files (documentation), quality checks can be skipped.

### Pull Request Requirements

- Self-review all changes
- Run full test suite locally
- Update relevant documentation
- Verify no debug statements (`console.log`, `print()`)
- Check constitution compliance

### Git Workflow

- Main branch: `main` (production)
- Development branch: `dev`
- Feature branches: Create from `dev`, merge back to `dev`
- Never commit broken code or failing tests

## Technology Stack Overview

| Aspect    | Full-Stack (`/web`)            | AI Server (`/ai`) |
| --------- | ------------------------------ | ----------------- |
| Language  | TypeScript                     | Python 3.13+      |
| Framework | Next.js 15                     | LangGraph         |
| Database  | Supabase (PostgreSQL) + Prisma | N/A               |
| Auth      | Clerk                          | N/A               |
| API       | tRPC                           | LangGraph HTTP    |
| Testing   | Vitest                         | pytest            |
| Linting   | ESLint + Prettier              | ruff + mypy       |

## Project Status

**Current Phase:** Beta MVP Development (Post-Integration)

**Development Progress:**

1. ✅ UI Foundation (Epic 1) - Completed
2. ✅ Backend Integration (Epic 2) - Completed
3. ✅ AI Server Integration (Epic 3) - Completed
4. 🚧 Additional Features & Refinement - In Progress

**MVP Focus:** Beta-level product with core features integrated. Currently implementing additional features while maintaining pragmatic testing approach. Focus on user feedback and iterative improvements.

## Environment Setup

Each project has its own environment requirements:

- **Frontend:** See `web/.claude/rules/backend/index.md` for required environment variables (Clerk, Supabase)
- **AI Server:** See `ai/CLAUDE.md` for required API keys (OpenAI, Anthropic, Google)

## Key Documentation References

- **Constitution:** `.specify/memory/constitution.md` - Governing principles for ALL development
- **Frontend Rules:** `web/.claude/rules/frontend/` - Component patterns, App Router, i18n
- **Backend Rules:** `web/.claude/rules/backend/` - tRPC, services, schema organization
- **AI Details:** `ai/CLAUDE.md` - Complete LangGraph/LangChain guidance
- **Product Requirements:** `/docs/sharded/prd/index.md` - What we're building
- **Architecture:** `/docs/sharded/architecture/index.md` - How it's structured
- **Development Rules:** `/docs/web/rules/index.md` - Coding standards and patterns

## Important Reminders

- **Rules auto-load from `web/.claude/rules/`** - path-specific rules apply automatically
- **Constitution is the source of truth** for all principles and rules
- **Run quality checks before every commit** - except for documentation-only (.md) changes
- **Test critical paths** - MVP allows skipping non-critical tests
- **Search before creating** - reuse existing components/modules
- **Type everything** - explicit types prevent bugs
- **Never bypass pre-commit hooks** - they exist for a reason

---

## Question Category Management

### Overview

Question categories are managed **manually** across `/web` and `/ai` projects:

- **Source of Truth**: Prisma enum (`web/prisma/schema.prisma`)
- **UI Mappings**: Defined locally in each component (icons, colors)
- **i18n**: Managed in locale files (`locales/ko/common.json`, `locales/en/common.json`)

### When to Reference `/common-contents/question-categories/README.md`

**⚠️ MUST READ before:**

- Adding, modifying, or deleting question categories
- Syncing categories between `/web` and `/ai`

### Key Points

1. **Prisma enum is the source of truth for `/web`**
2. **UI mappings are defined locally in components** (no shared generated file)
3. **Manual sync required between `/web` and `/ai`**

**Full documentation:** `/common-contents/question-categories/README.md`

---

**For detailed implementation guidance, always refer to the appropriate sub-project's CLAUDE.md file.**
