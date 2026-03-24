# Implementation Plan: Experience Importance Visualization

**Branch**: `001-experience-importance-visualization` | **Date**: 2025-10-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-experience-importance-visualization/spec.md`

## Summary

**Primary Requirement**: Add AI-generated star ratings (1-3 stars) to resume experiences on interview preparation pages, with user editing capability, automatic sorting by importance, and visual emphasis for high-priority items.

**Technical Approach**:

- Extend existing Prisma schema with `ImportanceLevel` enum field
- Modify AI resume parser graph to generate importance ratings based on JD context
- Create reusable `StarRating` React component with edit mode
- Add tRPC mutation for updating importance with optimistic updates
- Implement database-level sorting (importance first, recency second)
- Apply conditional visual styling using design system tokens
- Zero new dependencies required (all existing tools sufficient)

**MVP Focus**: Brownfield implementation prioritizing reuse of existing patterns, pragmatic testing (critical paths only), and rapid user validation.

## Technical Context

**Language/Version**: TypeScript 5.x (frontend), Python 3.13+ (AI server)
**Primary Dependencies**:

- Frontend: Next.js 15, React 19, tRPC v11, Prisma ORM, Tailwind CSS v4, Zod, React Query
- AI Server: LangGraph 0.5.3+, LangChain 0.3.26+, Pydantic
  **Storage**: PostgreSQL (Supabase) with Prisma ORM
  **Testing**: Vitest (frontend), pytest (AI server) - MVP pragmatic approach (critical paths only)
  **Target Platform**:
- Frontend: Web (Next.js SSR/SSG, browser ES2020+)
- AI Server: Python server (LangGraph HTTP)
  **Project Type**: Monorepo web application (frontend + AI backend)
  **Performance Goals**:
- Star click → UI update: < 100ms (optimistic update)
- API save latency: < 500ms p95
- Page load with sorted experiences: < 2s
- AI importance generation: No additional latency (part of existing resume parsing)
  **Constraints**:
- No new dependencies (use existing stack)
- Must follow Design System Supremacy (Constitution VI)
- Must support Korean + English i18n
- Must work on mobile viewports
- Optimistic updates required (instant feedback)
  **Scale/Scope**:
- 2 database tables modified (CareerExperience, ProjectExperience)
- 1 new UI component (StarRating)
- 1 new tRPC mutation (updateExperienceImportance)
- 1 AI schema update (BaseExperience importance field)
- Estimated implementation time: 8-12 hours

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### ✅ Cross-Project Principles (ALL PASS)

**I. Pragmatic Testing (MVP-Aware)** - ✅ PASS

- **Status**: Compliant with MVP-aware testing strategy
- **Approach**: Critical path testing only (database operations, API authorization, sorting logic)
- **Skipped**: UI component unit tests, visual regression tests, hover interaction tests (per Constitution)
- **Rationale**: Feature is low-risk UI enhancement; critical business logic (data integrity, authorization) is tested
- **Post-MVP**: Add component integration tests and E2E tests after user validation

**II. Type Safety First** - ✅ PASS

- **Frontend**: TypeScript strict mode, Zod validation for all API inputs, Prisma-generated types
- **AI Server**: Pydantic models with type hints, mypy strict mode
- **End-to-end**: ImportanceLevel enum consistent across all layers (Prisma, TypeScript, Python)
- **No `any` types**: All types explicitly defined

**III. Component/Module Reusability** - ✅ PASS

- **Reuses Existing**: ExperienceCard, ExperienceTimeline, designTokens, tRPC patterns
- **New Component**: StarRating (reusable, 3 size variants, read-only/edit modes)
- **Modularity**: Utility functions (importanceToStars, starsToImportance) in shared types file
- **No Duplication**: Single source of truth for importance logic

**IV. Performance by Default** - ✅ PASS

- **Frontend**: Optimistic updates (< 100ms feedback), React Query caching, debouncing (300ms)
- **Backend**: Database composite index for sorted queries, single UPDATE query
- **AI Server**: No additional latency (importance generated during existing parse workflow)
- **Loading States**: Spinner on star during save, disabled interaction while loading
- **Targets Met**: All performance goals achievable with proposed architecture

**V. Code Quality Automation (NON-NEGOTIABLE)** - ✅ PASS

- **Frontend**: `pnpm check-all` required before commit (type-check + lint + format)
- **AI Server**: `uv run make lint` required before commit (ruff + mypy strict)
- **Pre-commit**: Quality checks enforced via hooks (NO `--no-verify`)
- **CI/CD**: All checks must pass before PR merge

### ✅ Full-Stack Server-Specific Principles (ALL PASS)

**VI. Design System Supremacy** - ✅ PASS

- **NO Hardcoded Values**: All colors, spacing, shadows use `designTokens` from `core.ts`
- **Example**: `designTokens.colors.primary.DEFAULT`, `designTokens.shadows.md`
- **Visual Styling**: Conditional styles based on importance level use design tokens
- **Star Colors**: Filled (primary), empty (muted.foreground) from design system

**VII. Server-First Rendering** - ✅ PASS

- **Page Components**: Server Components by default (`interview-prep/[id]/page.tsx`)
- **Client Components**: Only where needed (StarRating, ExperienceCard with interaction)
- **Data Fetching**: Server-side via tRPC (no client-side fetch in page components)
- **Justification**: StarRating requires `onChange` handler (client-side event)

**VIII. Internationalization First** - ✅ PASS

- **All Text**: Uses next-intl translation keys
- **Languages**: Korean (primary) + English
- **New Keys Added**:
  - `interview-prep.detail.experienceCard.importance.label`
  - `interview-prep.detail.experienceCard.importance.updateError`
  - `interview-prep.detail.experienceCard.importance.updateSuccess`
- **Tested**: Both locales verified in manual testing checklist

### ✅ AI Server-Specific Principles (ALL PASS)

**IX. Graph Structure Consistency** - ✅ PASS

- **Follows Standard Pattern**: Importance field added to `BaseExperience` in `common/schemas/project.py`
- **No New Graph**: Reuses existing `resume_parser` graph
- **State Management**: Pydantic model with validation
- **File Structure**: No changes to graph directory structure

**X. LangGraph Best Practices** - ✅ PASS

- **Documentation Consulted**: LangGraph patterns followed for state extension
- **Field Addition**: `importance: ImportanceLevel` with detailed prompt criteria
- **Default Value**: "MEDIUM" fallback ensures robustness
- **Error Handling**: LLM failure defaults to MEDIUM (no throw)
- **Testable**: Can verify in LangGraph Studio

### 🔍 Re-Evaluation After Phase 1 Design

**All gates remain PASS** ✅

**No violations requiring justification** - All Constitution principles followed without exceptions.

**Summary**:

- ✅ 10/10 principles compliant
- ✅ Zero hardcoded design values
- ✅ Type safety end-to-end
- ✅ Reuses existing components and patterns
- ✅ Performance targets achievable
- ✅ Quality automation enforced
- ✅ Pragmatic MVP testing strategy
- ✅ i18n complete
- ✅ No architectural complexity added

## Project Structure

### Documentation (this feature)

```
specs/001-experience-importance-visualization/
├── spec.md              # Feature specification (user stories, requirements)
├── plan.md              # This file (implementation plan)
├── research.md          # ✅ Phase 0 output (technical decisions)
├── data-model.md        # ✅ Phase 1 output (database schema, entities)
├── quickstart.md        # ✅ Phase 1 output (developer guide)
├── contracts/           # ✅ Phase 1 output (API contracts)
│   └── trpc-api.md      # tRPC mutation contract
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT YET CREATED)
```

### Source Code (repository root)

**Monorepo Structure**: Web application with frontend + AI backend

```
deep-quest/
├── web/                        # Next.js Full-Stack Application
│   ├── prisma/
│   │   └── schema.prisma         # ✏️ MODIFY: Add ImportanceLevel enum + fields
│   ├── public/
│   │   └── locales/
│   │       ├── ko/
│   │       │   └── common.json   # ✏️ MODIFY: Add importance translation keys
│   │       └── en/
│   │           └── common.json   # ✏️ MODIFY: Add importance translation keys
│   └── src/
│       ├── components/
│       │   ├── ui/
│       │       └── star-rating.tsx           # ✨ CREATE: New star rating component
│       │   └── design-system/
│       │       └── core.ts                   # ✅ REUSE: Design tokens
│       ├── types/
│       │   └── experience.ts                 # ✨ CREATE: Importance utility types
│       ├── server/
│       │   └── api/
│       │       └── routers/
│       │           └── interview-preparation.ts  # ✏️ MODIFY: Add updateExperienceImportance mutation
│       └── app/
│           └── [locale]/
│               └── (protected)/
│                   └── interview-prep/
│                       └── [id]/
│                           └── _components/
│                               ├── ExperienceCard.tsx    # ✏️ MODIFY: Add star rating UI
│                               └── ExperienceTimeline.tsx # ✏️ MODIFY: Pass preparationId
│
└── ai/                           # Python LangGraph AI Server
    └── src/
        ├── common/
        │   └── schemas/
        │       └── project.py    # ✏️ MODIFY: Add importance field to BaseExperience
        └── graphs/
            └── resume_parser/
                ├── graph.py      # ✅ REUSE: No changes (inherits schema)
                ├── nodes.py      # ✅ REUSE: No changes (LLM generates importance)
                └── state.py      # ✅ REUSE: No changes (inherits schema)
```

**Structure Decision**: Brownfield monorepo web application

**Key Modifications**:

1. **Database Layer**: Prisma schema update (2 tables, 1 enum)
2. **AI Layer**: Single schema file update (importance field)
3. **API Layer**: One new tRPC mutation in existing router
4. **UI Layer**: One new component + updates to 2 existing components
5. **i18n Layer**: Translation keys in existing locale files

**No New Directories**: All changes integrate into existing structure

**Architectural Impact**: Minimal - extends existing patterns without introducing new complexity

## Complexity Tracking

_Fill ONLY if Constitution Check has violations that must be justified_

**No violations** - All Constitution principles passed without exceptions.

This section intentionally left empty as no complexity justifications are required.
