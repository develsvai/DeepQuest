---
description: "Implementation tasks for Experience Importance Visualization feature"
---

# Tasks: Experience Importance Visualization

**Input**: Design documents from `/specs/001-experience-importance-visualization/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/trpc-api.md ✅, quickstart.md ✅

**Tests**: Tests are NOT explicitly requested in the feature specification. Following Constitution Principle I (Pragmatic Testing - MVP-Aware), this implementation focuses on critical path testing only. UI component tests and visual regression tests are skipped for MVP.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- File paths use monorepo structure: `/web/` (frontend), `/ai/` (AI server)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database schema, type definitions, and core infrastructure needed by all user stories

**⚠️ CRITICAL**: These tasks provide the foundation for all user stories

- [x] T001 [P] Add `ImportanceLevel` enum to Prisma schema in `/web/prisma/schema.prisma` (HIGH, MEDIUM, LOW)
- [x] T002 [P] Add `importance` field with default MEDIUM to `CareerExperience` model in `/web/prisma/schema.prisma`
- [x] T003 [P] Add `importance` field with default MEDIUM to `ProjectExperience` model in `/web/prisma/schema.prisma`
- [x] T004 [P] Add composite indexes `[resumeId, importance, endDate]` to both experience models in `/web/prisma/schema.prisma`
- [x] T005 Generate Prisma migration with `pnpm prisma migrate dev --name add_experience_importance` in `/web/`
- [x] T006 Verify migration success and regenerate Prisma client with `pnpm prisma generate` in `/web/`
- [x] T007 [P] Create type utility functions in `/web/src/types/experience.ts` (importanceToStars, starsToImportance, ImportanceLevel type)

**Checkpoint**: Database schema ready - experience importance can now be stored and retrieved

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: AI server schema updates and translation infrastructure that MUST be complete before ANY user story UI can function

**⚠️ CRITICAL**: No user story UI work can begin until this phase is complete

- [x] T008 [P] Add `ImportanceLevel` type alias (Literal["HIGH", "MEDIUM", "LOW"]) to `/ai/src/common/schemas/project.py`
- [x] T009 Add `importance` field with evaluation criteria to `BaseExperience` class in `/ai/src/common/schemas/project.py` (default="MEDIUM" with detailed LLM prompt description)
- [x] T010 Verify AI server type checks pass with `uv run make lint` in `/ai/`
- [ ] T011 Test resume parser in LangGraph Studio at http://localhost:8000 to verify importance field appears in output
- [x] T012 [P] Add Korean translation keys to `/web/locales/ko/interview-prep.json` (importance label, high/medium/low, updateError, updateSuccess)
- [x] T013 [P] Add English translation keys to `/web/locales/en/interview-prep.json` (importance label, high/medium/low, updateError, updateSuccess)

**Checkpoint**: Foundation ready - AI generates importance ratings, translations available, user story implementation can now begin

---

## Phase 3: User Story 1 - View Importance Indicators (Priority: P1) 🎯 MVP

**Goal**: Display AI-generated star ratings (1-3 stars) next to each experience title on interview preparation page

**Independent Test**: Upload a resume with multiple experiences, navigate to interview prep detail page, verify star ratings (1-3 stars) appear next to each experience title. AI assigns ratings based on JD match. Users can immediately identify which experiences are most important.

### Critical Path Tests for User Story 1 ⚠️

**NOTE: These tests verify critical business logic (Constitution Principle I - MVP pragmatic testing)**

- [ ] T014 [P] [US1] Database test: Verify `ImportanceLevel` enum constraint in database (manual check with Prisma Studio or SQL query)
- [ ] T015 [P] [US1] Database test: Verify default MEDIUM importance for new experiences (create test experience, check default value)

### Implementation for User Story 1

- [x] T016 [P] [US1] Create `StarRating` component in `/web/src/components/ui/star-rating.tsx` with read-only display mode (value prop 1-3, size variants sm/md/lg, disabled state)
- [x] T017 [US1] Update `ExperienceCard` component in `/web/src/app/[locale]/(protected)/interview-prep/[id]/_components/ExperienceCard.tsx` to import StarRating and display read-only star rating next to experience title
- [x] T018 [US1] Update `ExperienceCard` component to add `importance` field to Experience interface and use `importanceToStars()` utility
- [ ] T019 [US1] Manually test in browser: Upload resume → Navigate to interview prep page → Verify stars appear next to each experience (verify all tests pass with `pnpm check-all` in `/web/`)

**Checkpoint**: At this point, User Story 1 is fully functional - users can see AI-generated importance ratings as stars

---

## Phase 4: User Story 2 - Automatic Priority Sorting (Priority: P2)

**Goal**: Experiences automatically sort by importance (HIGH → MEDIUM → LOW), then by recency within each tier

**Independent Test**: Verify experience cards display in correct order: all 3-star experiences first, then 2-star, then 1-star. Within each importance level, most recent experiences appear first. Test by viewing interview prep page with mixed importance levels.

### Critical Path Tests for User Story 2 ⚠️

- [ ] T020 [P] [US2] Sorting test: Create experiences with different importance levels and verify SQL ORDER BY produces correct sequence (manual query test or tRPC test)
- [ ] T021 [P] [US2] Edge case test: Verify experiences with same importance level sort by recency (endDate DESC)

### Implementation for User Story 2

- [x] T022 [US2] Update `getDetailedById` query in `/web/src/server/api/routers/interview-preparation.ts` to add orderBy clause for CareerExperience: `[{ importance: 'asc' }, { endDate: 'desc' }]`
- [x] T023 [US2] Update `getDetailedById` query in `/web/src/server/api/routers/interview-preparation.ts` to add orderBy clause for ProjectExperience: `[{ importance: 'asc' }, { endDate: 'desc' }]`
- [ ] T024 [US2] Manually test in browser: Verify experiences display in correct importance order (HIGH → MEDIUM → LOW), with most recent first within each tier
- [x] T025 [US2] Run quality checks with `pnpm check-all` in `/web/` before committing

**Checkpoint**: At this point, User Stories 1 AND 2 both work - users see sorted experiences with star ratings

---

## Phase 5: User Story 3 - Enhanced Visual Emphasis (Priority: P3)

**Goal**: High-importance experiences have enhanced visual styling (stronger border, subtle background, visible shadow)

**Independent Test**: Compare visual appearance of HIGH importance cards (3 stars) versus MEDIUM/LOW importance cards. HIGH cards should have stronger border (2px), subtle background tint, and larger shadow. Visual hierarchy should be immediately apparent without reading text.

### Implementation for User Story 3

- [x] T026 [P] [US3] Create `getExperienceCardStyles` utility function in `/web/src/app/[locale]/(protected)/interview-prep/[id]/_components/ExperienceCard.tsx` that returns style objects based on importance level using designTokens
- [x] T027 [US3] Define HIGH importance styles in utility function: 2px primary border, 4% opacity primary background, md shadow (all from designTokens)
- [x] T028 [P] [US3] Define MEDIUM importance styles: 1px border, card background, sm shadow
- [x] T029 [P] [US3] Define LOW importance styles: 1px muted border, card background, 2xs shadow
- [x] T030 [US3] Apply conditional styles to Card component in ExperienceCard.tsx using inline style prop: `style={getExperienceCardStyles(experience.importance)}`
- [ ] T031 [US3] Verify WCAG AA color contrast ratios for all styling variants (use browser DevTools or contrast checker)
- [ ] T032 [US3] Manually test in browser: Verify HIGH importance cards visually stand out with enhanced styling
- [ ] T033 [US3] Test in Korean and English locales to verify styling consistency
- [ ] T034 [US3] Test on mobile viewport (375px width) to verify responsive styling
- [x] T035 [US3] Run quality checks with `pnpm check-all` in `/web/` before committing

**Checkpoint**: All three user stories work together - sorted experiences with stars and visual emphasis

---

## Phase 6: User Story 4 - Edit Importance Ratings (Priority: P4)

**Goal**: Users can manually edit importance ratings by clicking stars, with immediate UI update and automatic re-sorting

**Independent Test**: Click on a star rating to change it (e.g., click 3rd star on a 2-star experience). Verify: (1) Stars update immediately, (2) Visual styling changes instantly, (3) Experience re-sorts to correct position, (4) Rating persists on page refresh. Test error handling by disconnecting network and clicking star - verify error toast and revert to previous rating.

### Critical Path Tests for User Story 4 ⚠️

- [ ] T036 [P] [US4] API authorization test: Verify `updateExperienceImportance` mutation rejects unauthorized access (user doesn't own experience) with FORBIDDEN error
- [ ] T037 [P] [US4] API validation test: Verify Zod schema rejects invalid importance values (e.g., "INVALID") with BAD_REQUEST error
- [ ] T038 [P] [US4] API test: Verify successful importance update returns correct response shape and updates database

### Implementation for User Story 4

- [x] T039 [P] [US4] Add `updateExperienceImportance` mutation to `/web/src/server/api/routers/interview-preparation.ts` with Zod input schema (experienceType enum, experienceId number, importance enum)
- [x] T040 [US4] Implement authorization check in mutation: Query experience with userId filter to verify ownership, throw FORBIDDEN if not found
- [x] T041 [US4] Implement mutation logic: Determine table (CareerExperience or ProjectExperience), execute UPDATE query, return success response with updated importance
- [x] T042 [US4] Add error handling for NOT_FOUND (invalid experienceId) and INTERNAL_SERVER_ERROR (database failure)
- [x] T043 [US4] Update `StarRating` component in `/web/src/components/ui/star-rating.tsx` to add interactive edit mode (onChange handler, hover preview, click handler)
- [x] T044 [US4] Add hover interaction to StarRating: onMouseEnter/Leave handlers that highlight stars up to cursor position (preview selection)
- [x] T045 [US4] Add click interaction to StarRating: onClick handler that calls onChange with selected star index (1, 2, or 3)
- [x] T046 [US4] Add disabled state to StarRating: opacity-50, cursor-not-allowed, no hover effects when disabled prop is true
- [x] T047 [US4] Update ExperienceCard to add preparationId prop to component interface (required for mutation context)
- [x] T048 [US4] Add mutation hook in ExperienceCard: `api.interviewPreparation.updateExperienceImportance.useMutation()` with optimistic update in onMutate
- [x] T049 [US4] Implement optimistic update in mutation: Cancel outgoing queries, snapshot previous data, update cache with new importance value
- [x] T050 [US4] Implement error handling in mutation: onError reverts cache to previous value, displays error toast using sonner
- [x] T051 [US4] Implement onSettled handler: Invalidate and refetch query to ensure server consistency
- [x] T052 [US4] Add `handleStarClick` function in ExperienceCard: Convert star index to importance level using `starsToImportance()`, call mutation
- [ ] T053 [US4] Add debouncing to handleStarClick with 300ms delay using useMemo + debounce utility to prevent rapid duplicate saves
- [x] T054 [US4] Update StarRating usage in ExperienceCard to pass onChange={handleStarClick} and disabled={updateImportance.isPending}
- [x] T055 [US4] Update ExperienceTimeline in `/web/src/app/[locale]/(protected)/interview-prep/[id]/_components/ExperienceTimeline.tsx` to pass preparationId prop to ExperienceCard
- [ ] T056 [US4] Manually test in browser: Click stars → Verify immediate UI update → Verify experience re-sorts → Refresh page → Verify persistence
- [ ] T057 [US4] Test error handling: Disconnect network → Click star → Verify error toast → Verify revert to previous rating
- [ ] T058 [US4] Test optimistic update: Slow network (Chrome DevTools throttling) → Click star → Verify instant UI feedback before server response
- [ ] T059 [US4] Test rapid clicking: Click multiple stars quickly → Verify only final rating saves (debouncing works)
- [ ] T060 [US4] Test authorization: Attempt to manipulate experienceId in browser DevTools → Verify FORBIDDEN error
- [ ] T061 [US4] Test in Korean locale: Verify error messages use Korean translations
- [ ] T062 [US4] Test in English locale: Verify error messages use English translations
- [x] T063 [US4] Run quality checks with `pnpm check-all` in `/web/` and `uv run make lint` in `/ai/` before committing

**Checkpoint**: All four user stories complete - fully functional importance visualization with user editing

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final quality improvements, documentation, and validation

- [ ] T064 [P] Code cleanup: Remove any console.log or debug statements from all modified files
- [ ] T065 [P] Code review: Verify all design tokens used (no hardcoded colors/spacing/shadows) in ExperienceCard and StarRating
- [ ] T066 [P] Verify TypeScript strict mode compliance: Check all modified files have no `any` types or `@ts-ignore` comments
- [ ] T067 Verify composite database indexes exist: Check Prisma Studio or run SQL query to confirm `[resumeId, importance, endDate]` indexes
- [ ] T068 Performance check: Verify star click → UI update is < 100ms (use Chrome DevTools Performance tab)
- [ ] T069 Performance check: Verify API save latency is < 500ms p95 (use Chrome DevTools Network tab or Vercel Analytics)
- [ ] T070 Accessibility audit: Verify star ratings have proper ARIA labels and keyboard navigation support
- [ ] T071 Mobile testing: Test all user stories on iOS Safari and Android Chrome (viewport 375px)
- [ ] T072 Cross-browser testing: Test in Chrome, Firefox, Safari on desktop
- [ ] T073 Run complete quality suite: `pnpm check-all` in `/web/` must pass (type-check + lint + format)
- [ ] T074 Run AI server quality suite: `uv run make lint` in `/ai/` must pass (ruff + mypy)
- [ ] T075 Follow quickstart.md validation: Execute all manual test checklist items from `/specs/001-experience-importance-visualization/quickstart.md`
- [ ] T076 [P] Update feature documentation: Add completion notes to spec.md if needed
- [ ] T077 Create Git commit with descriptive message following convention (feat: add experience importance visualization)
- [ ] T078 Push feature branch to remote: `git push origin 001-experience-importance-visualization`
- [ ] T079 Create pull request using GitHub CLI with summary from quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
  - Database schema changes are foundational
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) completion - BLOCKS all user stories
  - AI server must generate importance ratings before UI can display them
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) completion
  - Can proceed independently once foundation is ready
- **User Story 2 (Phase 4)**: Depends on User Story 1 (Phase 3) completion
  - Extends US1 by adding sorting to existing display
- **User Story 3 (Phase 5)**: Depends on User Story 1 (Phase 3) completion
  - Extends US1 by adding visual styling to existing display
  - Can develop in parallel with US2 if team capacity allows
- **User Story 4 (Phase 6)**: Depends on User Stories 1, 2, 3 completion
  - Requires all read-only features before adding editing capability
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

```
Setup (Phase 1)
    ↓
Foundational (Phase 2) ← BLOCKS ALL USER STORIES
    ↓
    ├─→ User Story 1 (P1) ← MVP DELIVERABLE
    │       ↓
    │       ├─→ User Story 2 (P2) ← Adds sorting
    │       │
    │       └─→ User Story 3 (P3) ← Adds visual emphasis (can parallel with US2)
    │               ↓
    └───────────────┴─→ User Story 4 (P4) ← Requires US1, US2, US3
                            ↓
                        Polish (Phase 7)
```

### Within Each User Story

- **Tests FIRST**: All critical path tests must be written and verified BEFORE implementation (TDD approach)
- **Models → Services → Endpoints → UI**: Follow bottom-up implementation order
- **Parallel opportunities**: Tasks marked [P] within the same phase can run simultaneously

### Parallel Opportunities

**Setup Phase (Phase 1)**:

```bash
# Can launch together (different schema sections):
Task T001 (ImportanceLevel enum)
Task T002 (CareerExperience field)
Task T003 (ProjectExperience field)
Task T004 (Composite indexes)
Task T007 (Type utilities - independent file)
```

**Foundational Phase (Phase 2)**:

```bash
# Can launch together (different files):
Task T008 + T009 (AI server schemas)
Task T012 + T013 (Translation files - Korean/English separate)
```

**User Story 1 Implementation**:

```bash
# Can launch together (different files):
Task T016 (StarRating component)
Task T017 (ExperienceCard updates - if no StarRating import conflicts)
```

**User Story 3 Implementation**:

```bash
# Can launch together (within same utility function):
Task T028 (MEDIUM styles)
Task T029 (LOW styles)
```

---

## Parallel Example: Phase 1 Setup

```bash
# Launch all independent setup tasks together:
claude --task "Add ImportanceLevel enum to Prisma schema in /web/prisma/schema.prisma (HIGH, MEDIUM, LOW)"
claude --task "Create type utility functions in /web/src/types/experience.ts (importanceToStars, starsToImportance)"

# Wait for completion, then run dependent tasks sequentially:
claude --task "Generate Prisma migration with pnpm prisma migrate dev --name add_experience_importance"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

Recommended path for fastest user validation:

1. **Week 1**: Complete Phase 1 (Setup) + Phase 2 (Foundational)

   - Day 1-2: Database schema + migrations (T001-T007)
   - Day 3-4: AI server updates + translations (T008-T013)
   - **Checkpoint**: Foundation ready

2. **Week 2**: Complete Phase 3 (User Story 1)

   - Day 1-2: Critical tests + StarRating component (T014-T016)
   - Day 3: ExperienceCard integration (T017-T018)
   - Day 4: Manual testing and validation (T019)
   - **Checkpoint**: MVP COMPLETE - Deploy for user feedback

3. **Wait for user feedback before proceeding to US2-US4**

### Incremental Delivery (All User Stories)

Full feature implementation:

1. **Phase 1**: Setup (2-3 days) → Foundation laid
2. **Phase 2**: Foundational (2-3 days) → AI + i18n ready
3. **Phase 3**: User Story 1 (3-4 days) → MVP delivered
4. **Phase 4**: User Story 2 (1-2 days) → Sorting added
5. **Phase 5**: User Story 3 (2-3 days) → Visual emphasis added
6. **Phase 6**: User Story 4 (4-5 days) → User editing enabled
7. **Phase 7**: Polish (2-3 days) → Production ready

**Total Estimated Time**: 16-23 days (individual developer) or 8-12 days (team of 2-3)

### Parallel Team Strategy

With multiple developers (maximum efficiency):

**Week 1**: All team members work together

- Days 1-2: Phase 1 (Setup) - Team collaboration
- Days 3-5: Phase 2 (Foundational) - Team collaboration
- **Checkpoint**: Foundation complete

**Week 2**: Split into parallel user stories

- Developer A: User Story 1 (Phase 3) - MVP priority
- Developer B: User Story 3 (Phase 5) - Visual design
- **Note**: US2 waits for US1, US4 waits for US1+US2+US3

**Week 3**: Integration

- Developer A: User Story 2 (Phase 4) after US1 complete
- Developer B: Continue US3 or support US2
- Developer C: User Story 4 (Phase 6) after US1+US2+US3 complete

**Week 4**: Polish

- All team members: Phase 7 (Polish & validation)

---

## Task Metrics

- **Total Tasks**: 79 tasks
- **Setup**: 7 tasks (T001-T007)
- **Foundational**: 6 tasks (T008-T013)
- **User Story 1**: 6 tasks (T014-T019) - MVP
- **User Story 2**: 6 tasks (T020-T025)
- **User Story 3**: 10 tasks (T026-T035)
- **User Story 4**: 28 tasks (T036-T063) - Most complex
- **Polish**: 16 tasks (T064-T079)

**Parallel Opportunities**: 18 tasks marked [P] (23% can run in parallel)

**Critical Path Tests**: 5 tests (T014-T015, T020-T021, T036-T038)

- Database integrity tests: 2
- Sorting logic tests: 2
- API authorization/validation tests: 3

**Independent Test Checkpoints**: 5 major checkpoints

1. Foundation ready (after Phase 2)
2. User Story 1 complete (MVP)
3. User Stories 1+2 complete (sorted display)
4. User Stories 1+2+3 complete (visual hierarchy)
5. All user stories complete (full feature)

---

## Notes

- **[P] markers**: Tasks marked [P] operate on different files or independent sections, enabling parallel execution
- **[Story] labels**: US1/US2/US3/US4 map tasks to user stories for traceability and independent delivery
- **MVP path**: Setup → Foundational → US1 provides immediate user value (star ratings display)
- **TDD approach**: Critical tests (T014-T015, T020-T021, T036-T038) must be written FIRST and FAIL before implementation
- **Quality gates**: `pnpm check-all` (frontend) and `uv run make lint` (AI server) must pass before commit
- **No test bloat**: Following Constitution Principle I, only critical business logic is tested (database, API, sorting)
- **Optimistic UI**: User Story 4 uses React Query optimistic updates for instant feedback (< 100ms)
- **Accessibility**: Star ratings include ARIA labels, keyboard navigation, and pointer cursor affordances
- **i18n**: All user-facing text uses next-intl translation keys (Korean + English)
- **Design tokens**: All visual styling uses designTokens from core.ts (no hardcoded values)
- **Error handling**: Network failures trigger error toasts and cache rollbacks (manual retry pattern)

---

**Suggested Next Steps**:

1. Review this task list with team
2. Assign tasks to developers (consider parallel opportunities)
3. Start with MVP path (Setup → Foundational → User Story 1) for fastest validation
4. Use task IDs (T001, T002...) in commit messages for traceability
5. Mark tasks complete as you progress
6. Stop at any checkpoint to validate and demo progress

**Questions?** Refer to:

- [quickstart.md](./quickstart.md) - Step-by-step developer guide
- [research.md](./research.md) - Technical decisions and rationale
- [data-model.md](./data-model.md) - Database schema details
- [contracts/trpc-api.md](./contracts/trpc-api.md) - API specifications
