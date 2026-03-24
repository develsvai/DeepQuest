# Research: Experience Importance Visualization

**Feature**: 001-experience-importance-visualization
**Date**: 2025-10-13
**Phase**: 0 - Research & Technical Decisions

## Executive Summary

This document resolves all technical unknowns for implementing experience importance visualization in the Deep Quest brownfield codebase. The feature adds AI-generated and user-editable importance ratings (1-3 stars) to resume experiences, with automatic sorting and visual emphasis.

---

## 1. Data Model Decisions

### Decision: Add `importance` Field to Experience Entities

**Chosen Approach**: Add `importance` enum field to both `CareerExperience` and `ProjectExperience` tables

**Rationale**:

- Prisma schema already has separate tables for career and project experiences
- Both experience types need importance ratings for interview prep
- Storing as enum (HIGH/MEDIUM/LOW) provides type safety and clear semantics
- Database-level constraint ensures data integrity

**Implementation Details**:

```prisma
enum ImportanceLevel {
  HIGH    // Maps to 3 stars
  MEDIUM  // Maps to 2 stars (default)
  LOW     // Maps to 1 star
}

model CareerExperience {
  // ... existing fields
  importance  ImportanceLevel @default(MEDIUM)
}

model ProjectExperience {
  // ... existing fields
  importance  ImportanceLevel @default(MEDIUM)
}
```

**Alternatives Considered**:

1. **Separate ImportanceRating table** - Rejected: Over-engineered for MVP, adds unnecessary joins
2. **Integer field (1-3)** - Rejected: Less type-safe, no semantic meaning
3. **String field** - Rejected: No database-level validation

**Migration Strategy**:

- Add nullable field first with default MEDIUM
- Backfill existing experiences with MEDIUM importance
- Make field non-nullable after backfill

---

## 2. AI Integration Pattern

### Decision: Modify Resume Parser Graph to Generate Importance Ratings

**Chosen Approach**: Resume parser graph receives JD context and generates importance ratings using LLM

**Workflow**:

```
1. User uploads resume + job description
2. JD structuring graph runs first → produces StructuredJD
3. Resume parser graph receives:
   - Resume text
   - StructuredJD (tech stack, responsibilities, qualifications)
4. Resume parser generates importance ratings by:
   - Analyzing experience relevance to JD requirements
   - Considering tech stack overlap
   - Evaluating STAR methodology completeness
   - Assessing recency and duration
5. Resume parser output includes importance level for each experience
```

**LLM Prompt Strategy**:

- Add importance rating to Pydantic schema (CareerExperience/ProjectExperience in AI server)
- Provide clear criteria in system prompt:
  - HIGH: Direct tech stack match + relevant responsibilities + strong STAR + recent (< 2 years)
  - MEDIUM: Partial tech stack match OR relevant experience OR moderate recency
  - LOW: Minimal relevance OR old experience (> 5 years) OR weak STAR

**Alternatives Considered**:

1. **Separate graph for rating generation** - Rejected: Adds complexity, slower
2. **Client-side JavaScript scoring** - Rejected: Cannot leverage LLM intelligence
3. **Post-processing script** - Rejected: Not integrated with workflow

**Implementation Notes**:

- Update `BaseExperience` model in `/ai/src/common/schemas/project.py`
- Add `importance: Literal["HIGH", "MEDIUM", "LOW"]` field with default "MEDIUM"
- Modify resume parser prompts to instruct LLM on importance criteria
- Test with varied resume/JD combinations to ensure consistent ratings

---

## 3. UI Component Strategy

### Decision: Create Reusable StarRating Component with Edit Mode

**Chosen Approach**: New `StarRating` component in design system following existing patterns

**Component Architecture**:

```typescript
// src/components/ui/star-rating.tsx
interface StarRatingProps {
  value: 1 | 2 | 3; // Current rating
  onChange?: (value: 1 | 2 | 3) => void; // Optional edit handler
  disabled?: boolean; // Read-only mode
  size?: "sm" | "md" | "lg"; // Size variants
}
```

**Visual Design** (following designTokens):

- Uses Lucide React `Star` icon
- Filled stars: `designTokens.colors.primary.DEFAULT` (orange)
- Empty stars: `designTokens.colors.muted.foreground` (gray)
- Hover state: Progressive fill animation
- Size variants: sm (16px), md (20px), lg (24px)

**Interaction Pattern**:

- Read-only mode: Stars are static, no hover effects
- Edit mode: Hover highlights all stars up to cursor position
- Click: Immediately updates rating, triggers onChange callback
- No toggle-off: Minimum 1 star always maintained
- Pointer cursor on hover to indicate interactivity

**Placement Strategy**:

- ExperienceCard: Next to title in card header
- ExperienceTimeline: Summary stats show average importance
- Question practice pages: Display experience importance context

**Alternatives Considered**:

1. **Material-UI Rating component** - Rejected: Not in tech stack
2. **Custom SVG stars** - Rejected: Lucide icons more consistent
3. **Text-based indicators** - Rejected: Less intuitive than stars

---

## 4. API Design

### Decision: Add tRPC Mutation for Updating Experience Importance

**Chosen Approach**: New `updateExperienceImportance` procedure in existing interview-preparation router

**API Contract**:

```typescript
// src/server/api/routers/interview-preparation.ts
updateExperienceImportance: protectedProcedure
  .input(
    z.object({
      experienceType: z.enum(["CAREER", "PROJECT"]),
      experienceId: z.number().int().positive(),
      importance: z.enum(["HIGH", "MEDIUM", "LOW"]),
    })
  )
  .mutation(async ({ ctx, input }) => {
    // 1. Verify experience belongs to user's preparation
    // 2. Update importance in appropriate table
    // 3. Return updated experience
  });
```

**Error Handling**:

- `NOT_FOUND`: Experience doesn't exist
- `FORBIDDEN`: Experience doesn't belong to user
- `BAD_REQUEST`: Invalid importance level

**Performance Considerations**:

- Single database UPDATE query
- Optimistic UI update on client (revert on error)
- Debounce rapid clicks (300ms) to prevent duplicate requests

**Alternatives Considered**:

1. **REST API** - Rejected: tRPC provides end-to-end type safety
2. **Bulk update endpoint** - Rejected: Not needed for MVP single-rating updates
3. **PUT vs PATCH** - Not applicable (tRPC uses mutations)

---

## 5. Sorting Implementation

### Decision: SQL ORDER BY with Computed Sorting Key

**Chosen Approach**: Sort in database query using CASE expression for importance priority

**SQL Strategy**:

```sql
ORDER BY
  CASE importance
    WHEN 'HIGH' THEN 1
    WHEN 'MEDIUM' THEN 2
    WHEN 'LOW' THEN 3
  END ASC,
  end_date DESC
```

**Benefits**:

- Database-level sorting (most efficient)
- No client-side array manipulation
- Maintains stable sort order
- Supports pagination if needed later

**Client-Side Handling**:

- ExperienceTimeline receives pre-sorted experiences from tRPC
- No additional sorting logic needed
- Filter button changes query, re-fetches sorted data

**Alternatives Considered**:

1. **Client-side Array.sort()** - Rejected: Less efficient, duplicates logic
2. **Separate queries per importance** - Rejected: Multiple round trips
3. **Indexed database field** - Considered for future optimization

---

## 6. Visual Styling Strategy

### Decision: Conditional Styling Based on Importance Using designTokens

**Chosen Approach**: Style variants for high-importance experiences using existing design system

**High Importance (3 Stars) Styling**:

```typescript
{
  border: `2px solid ${designTokens.colors.primary.DEFAULT}`,
  backgroundColor: `${designTokens.colors.primary.DEFAULT}0A`, // 4% opacity
  boxShadow: designTokens.shadows.md,
}
```

**Medium Importance (2 Stars) - Default**:

```typescript
{
  border: `1px solid ${designTokens.colors.border}`,
  backgroundColor: designTokens.colors.card.DEFAULT,
  boxShadow: designTokens.shadows.sm,
}
```

**Low Importance (1 Star) - Subtle**:

```typescript
{
  border: `1px solid ${designTokens.colors.muted.DEFAULT}`,
  backgroundColor: designTokens.colors.card.DEFAULT,
  boxShadow: designTokens.shadows['2xs'],
}
```

**Implementation Pattern**:

- Create `getExperienceCardStyles` utility function
- Accept importance level as parameter
- Return style object compatible with inline styles
- Use in ExperienceCard component

**Accessibility**:

- Ensure color contrast ratios meet WCAG AA standards
- Don't rely solely on color (star count provides redundant cue)
- High-importance cards have stronger visual weight

**Alternatives Considered**:

1. **CSS classes** - Rejected: Inline styles with design tokens more flexible
2. **Background color only** - Rejected: Not enough visual distinction
3. **Animation on render** - Rejected: Per spec (instant jump, no animation)

---

## 7. State Management

### Decision: React Query (TanStack Query) via tRPC for Server State

**Chosen Approach**: Leverage existing tRPC + React Query integration for state management

**Client State Flow**:

```typescript
// Fetch experiences (server state)
const { data: experiences } = api.interviewPreparation.getDetail.useQuery({
  id,
});

// Update importance (optimistic update)
const updateImportance =
  api.interviewPreparation.updateExperienceImportance.useMutation({
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await utils.interviewPreparation.getDetail.cancel({ id });

      // Snapshot previous value
      const previous = utils.interviewPreparation.getDetail.getData({ id });

      // Optimistically update
      utils.interviewPreparation.getDetail.setData({ id }, (old) => {
        // Update experience importance in cached data
        return updatedData;
      });

      return { previous };
    },
    onError: (err, newData, context) => {
      // Revert on error
      utils.interviewPreparation.getDetail.setData({ id }, context.previous);
    },
    onSettled: () => {
      // Refetch to ensure consistency
      utils.interviewPreparation.getDetail.invalidate({ id });
    },
  });
```

**Benefits**:

- Automatic caching and synchronization
- Optimistic updates for instant UI feedback
- Error handling with rollback
- No additional state management library needed

**Loading States**:

- Show spinner on star icon during save
- Disable further clicks until save completes
- Toast notification on error (using sonner)

**Alternatives Considered**:

1. **Local component state** - Rejected: Loses sync with server
2. **Zustand store** - Rejected: Unnecessary for server-synced data
3. **Context API** - Rejected: React Query already handles this

---

## 8. Internationalization

### Decision: Add Translation Keys for Star Rating Feature

**Chosen Approach**: Extend existing next-intl setup with new translation keys

**Required Translation Keys**:

```json
{
  "interview-prep": {
    "detail": {
      "experienceCard": {
        "importance": {
          "label": "중요도",
          "high": "높음 (3개 별)",
          "medium": "보통 (2개 별)",
          "low": "낮음 (1개 별)",
          "updateError": "중요도 업데이트 실패. 다시 시도해주세요.",
          "updateSuccess": "중요도가 업데이트되었습니다."
        }
      }
    }
  }
}
```

**Translation Files**:

- `/web/public/locales/ko/common.json` (Korean)
- `/web/public/locales/en/common.json` (English)

**Implementation Notes**:

- Use `useTranslations` hook in components
- Provide context-aware error messages
- Support both Korean (primary) and English

---

## 9. Testing Strategy

### Decision: MVP-Aware Testing (Critical Paths Only)

**Chosen Approach**: Test critical business logic, skip UI component tests during MVP

**Test Coverage** (per Constitution Principle I):

**Critical Path Tests** (REQUIRED):

1. **Database Operations**:

   - Importance field CRUD operations
   - Migration script validates existing data
   - Enum constraints enforce valid values

2. **API Endpoints**:

   - `updateExperienceImportance` mutation success/error cases
   - Authorization checks (user owns experience)
   - Input validation (valid importance levels)

3. **Sorting Logic**:
   - Experiences sorted by importance then recency
   - Filter maintains sort order
   - Edge case: All experiences same importance

**Skipped During MVP** (per Constitution):

- StarRating component unit tests
- ExperienceCard visual regression tests
- Hover interaction tests
- Styling validation tests

**Manual Testing Checklist**:

- [ ] Upload resume with multiple experiences
- [ ] Verify AI assigns importance ratings
- [ ] Click stars to change rating
- [ ] Verify experience re-sorts immediately
- [ ] Verify visual styling updates
- [ ] Test error handling (network failure)
- [ ] Test in Korean and English locales
- [ ] Test on mobile viewport

**Future Test Expansion** (Post-MVP):

- Component integration tests with Testing Library
- E2E tests with Playwright
- Visual regression tests with Percy/Chromatic

---

## 10. Performance Considerations

### Decision: Optimistic UI Updates with Debouncing

**Chosen Optimizations**:

**1. Debouncing** (300ms):

```typescript
const debouncedUpdate = useMemo(
  () =>
    debounce((experienceId, importance) => {
      updateImportance.mutate({ experienceId, importance });
    }, 300),
  [updateImportance]
);
```

**2. Optimistic Updates**:

- Update local cache immediately on click
- Show visual feedback instantly
- Revert on error, refetch on success

**3. Database Indexes**:

- Add composite index: `(resume_id, importance, end_date DESC)`
- Speeds up sorted queries significantly

**4. Bundle Size**:

- StarRating component: ~1KB gzipped (Lucide icon only)
- No additional dependencies

**Performance Targets** (from Constitution):

- Star click → visual update: < 100ms (instant)
- API save operation: < 500ms (p95)
- Page load with sorted experiences: < 2s

**Monitoring**:

- Track `updateExperienceImportance` latency in Vercel Analytics
- Monitor bundle size impact (should be negligible)
- Log debounce cancellations (rapid clicking)

---

## 11. Security Considerations

### Decision: Row-Level Authorization on Experience Updates

**Security Measures**:

**1. Authorization Check**:

```typescript
// Verify experience belongs to user's preparation
const experience = await ctx.db.careerExperience.findFirst({
  where: {
    id: input.experienceId,
    resume: {
      interviewPreparation: {
        userId: ctx.session.user.id, // Clerk user ID
      },
    },
  },
});

if (!experience) {
  throw new TRPCError({ code: "FORBIDDEN" });
}
```

**2. Input Validation**:

- Zod schema enforces enum values (prevents invalid importance levels)
- Type-safe experienceId (positive integer)
- tRPC handles malformed requests automatically

**3. Rate Limiting**:

- Not required for MVP (debouncing prevents abuse)
- Consider Vercel rate limiting for production

**4. Audit Trail**:

- Not required for MVP (single current value, no history)
- Future: Add `importanceUpdatedAt` and `importanceUpdatedBy` fields

---

## 12. Deployment & Migration

### Decision: Prisma Migration with Zero-Downtime Strategy

**Migration Steps**:

**1. Add Nullable Field**:

```prisma
importance  ImportanceLevel?
```

**2. Deploy Application Code**:

- Deploy code that handles null importance (defaults to MEDIUM)
- No breaking changes

**3. Backfill Data**:

```sql
UPDATE career_experiences SET importance = 'MEDIUM' WHERE importance IS NULL;
UPDATE project_experiences SET importance = 'MEDIUM' WHERE importance IS NULL;
```

**4. Make Field Non-Nullable**:

```prisma
importance  ImportanceLevel @default(MEDIUM)
```

**5. Deploy Final Version**:

- Code now assumes importance is always present

**Rollback Plan**:

- If issues arise, keep field nullable longer
- Remove UI components (invisible to users)
- Keep database field for future retry

**AI Server Deployment**:

- Update Pydantic models in `/ai/src/common/schemas/project.py`
- Add importance field with default "MEDIUM"
- Deploy AI server before frontend (backward compatible)
- Test with LangGraph Studio before production

---

## 13. Known Limitations & Future Enhancements

### MVP Limitations (Intentional):

1. **No Importance Edit History**:

   - Only current value stored
   - Future: Add audit log for user vs AI ratings

2. **No Bulk Rating Updates**:

   - One experience at a time
   - Future: Add "Apply to All" button

3. **No Importance Explanation**:

   - AI doesn't explain why it rated an experience
   - Future: Add tooltip with reasoning

4. **No Re-calculation**:

   - AI rating generated once at parse time
   - Future: Add "Re-analyze" button to regenerate ratings

5. **No Custom Sort Options**:
   - Fixed sort: importance → recency
   - Future: Allow user to choose sort preference

### Post-MVP Enhancements:

- **Advanced Filtering**: Filter by importance level + experience type
- **Importance Analytics**: Show distribution chart (how many high/medium/low)
- **Smart Defaults**: Learn user preferences over time
- **Export**: Include importance in resume export
- **Mobile Gestures**: Swipe to change rating

---

## 14. Dependencies & Prerequisites

### New Dependencies: NONE

All required dependencies already present:

- ✅ Lucide React (star icons)
- ✅ tRPC (API)
- ✅ Prisma (database)
- ✅ Zod (validation)
- ✅ React Query (state management)
- ✅ next-intl (translations)
- ✅ sonner (toast notifications)

### Development Prerequisites:

**Frontend**:

- Node.js 18+
- pnpm 8+
- Postgres database (Supabase)

**AI Server**:

- Python 3.13+
- uv package manager
- OpenAI/Anthropic API keys

### Environment Variables (No New Requirements):

- All existing variables sufficient
- No new API keys or services needed

---

## Summary of Technical Decisions

| Aspect             | Decision                                        | Rationale                                |
| ------------------ | ----------------------------------------------- | ---------------------------------------- |
| **Data Model**     | Add `importance` enum to experience tables      | Type-safe, validated, simple             |
| **AI Integration** | Resume parser generates ratings with JD context | Integrated workflow, leverages LLM       |
| **UI Component**   | Reusable StarRating with edit mode              | Consistent with design system            |
| **API**            | tRPC mutation with optimistic updates           | End-to-end type safety, instant feedback |
| **Sorting**        | Database ORDER BY with CASE                     | Most efficient, scalable                 |
| **Styling**        | Conditional styles using designTokens           | Follows Constitution Principle VI        |
| **State**          | React Query via tRPC                            | Existing pattern, no new library         |
| **i18n**           | Extend next-intl with new keys                  | Existing pattern                         |
| **Testing**        | Critical paths only (MVP-aware)                 | Constitution Principle I                 |
| **Performance**    | Debouncing + optimistic updates                 | Sub-100ms interaction                    |
| **Security**       | Row-level authorization checks                  | Prevents unauthorized access             |
| **Deployment**     | Phased migration with backfill                  | Zero-downtime strategy                   |

---

**All NEEDS CLARIFICATION items from Technical Context have been resolved.**

**Next Phase**: Generate data-model.md, contracts/, and quickstart.md (Phase 1)
