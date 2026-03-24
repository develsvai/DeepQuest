# Developer Quickstart: Experience Importance Visualization

**Feature**: 001-experience-importance-visualization
**Date**: 2025-10-13
**Estimated Implementation Time**: 8-12 hours

## Quick Start TL;DR

**What**: Add AI-generated star ratings (1-3 stars) to resume experiences with user editing capability
**Where**: Interview preparation detail page (`/interview-prep/[id]`)
**Stack**: Prisma + tRPC + React + Tailwind CSS v4 + LangGraph (AI)

**Key Files to Modify**:

1. `/web/prisma/schema.prisma` - Add importance enum and fields
2. `/ai/src/common/schemas/project.py` - Add importance to AI models
3. `/web/src/components/ui/star-rating.tsx` - New component (create)
4. `/web/src/server/api/routers/interview-preparation.ts` - New mutation
5. `/web/src/app/[locale]/(protected)/interview-prep/[id]/_components/ExperienceCard.tsx` - Add star rating UI

---

## Prerequisites

Before starting, ensure you have:

- [x] Node.js 18+ installed
- [x] pnpm installed (`npm install -g pnpm`)
- [x] Python 3.13+ installed
- [x] uv installed (`curl -LsSf https://astral.sh/uv/install.sh | sh`)
- [x] Database access (Supabase PostgreSQL)
- [x] OpenAI/Anthropic API keys configured
- [x] Familiarity with Next.js, Prisma, tRPC, React

---

## Phase 1: Database Schema (30 minutes)

### Step 1.1: Update Prisma Schema

**File**: `/web/prisma/schema.prisma`

**Add enum** (after existing enums, before models):

```prisma
enum ImportanceLevel {
  HIGH    // 3 stars
  MEDIUM  // 2 stars (default)
  LOW     // 1 star
}
```

**Update CareerExperience model**:

```prisma
model CareerExperience {
  // ... existing fields
  importance  ImportanceLevel @default(MEDIUM)

  @@index([resumeId, importance, endDate]) // Add composite index
  @@map("career_experiences")
}
```

**Update ProjectExperience model**:

```prisma
model ProjectExperience {
  // ... existing fields
  importance  ImportanceLevel @default(MEDIUM)

  @@index([resumeId, importance, endDate]) // Add composite index
  @@map("project_experiences")
}
```

### Step 1.2: Generate Migration

```bash
cd web
pnpm prisma migrate dev --name add_experience_importance
```

**Expected output**:

```
✔ Generated Prisma Client
✔ The migration has been created successfully
```

### Step 1.3: Verify Migration

```bash
# Check generated migration file
cat prisma/migrations/<timestamp>_add_experience_importance/migration.sql
```

**Should contain**:

- CREATE TYPE "ImportanceLevel"
- ALTER TABLE ... ADD COLUMN "importance"
- CREATE INDEX statements

---

## Phase 2: AI Server Schema (20 minutes)

### Step 2.1: Update Common Schemas

**File**: `/ai/src/common/schemas/project.py`

**Add type alias** (top of file):

```python
from typing import Literal

ImportanceLevel = Literal["HIGH", "MEDIUM", "LOW"]
```

**Update BaseExperience class**:

```python
class BaseExperience(BaseStateConfig):
    # ... existing fields

    # Add this field after result field
    importance: ImportanceLevel = Field(
        default="MEDIUM",
        description="""
        Importance level of this experience for the target job position.

        Evaluation criteria:
        - HIGH: Strong tech stack overlap (70%+) with job requirements + directly relevant responsibilities + recent experience (< 2 years) + comprehensive STAR methodology
        - MEDIUM: Moderate tech stack overlap (30-70%) OR relevant domain experience OR moderate recency (2-5 years) OR partial STAR methodology
        - LOW: Minimal tech stack overlap (< 30%) + old experience (> 5 years) OR weak/incomplete STAR methodology OR unrelated domain

        Consider:
        1. Technology alignment with job description's tech stack
        2. Relevance of responsibilities to job requirements
        3. Recency of experience (more recent = more relevant)
        4. Completeness and impact of STAR methodology
        5. Duration and depth of experience
        """
    )
```

### Step 2.2: Test AI Server

```bash
cd ai
uv run make lint        # Verify no type errors
uv run langgraph dev    # Start development server
```

**Test in LangGraph Studio**:

1. Open http://localhost:8000
2. Select `resume_parser` graph
3. Upload test resume + JD
4. Verify experiences include `importance` field in output

---

## Phase 3: Frontend Types (15 minutes)

### Step 3.1: Create Type Utilities

**File**: `/web/src/types/experience.ts` (create if doesn't exist)

```typescript
export type ImportanceLevel = "HIGH" | "MEDIUM" | "LOW";
export type StarRating = 1 | 2 | 3;

export function importanceToStars(importance: ImportanceLevel): StarRating {
  const mapping: Record<ImportanceLevel, StarRating> = {
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };
  return mapping[importance];
}

export function starsToImportance(stars: StarRating): ImportanceLevel {
  const mapping: Record<StarRating, ImportanceLevel> = {
    3: "HIGH",
    2: "MEDIUM",
    1: "LOW",
  };
  return mapping[stars];
}
```

### Step 3.2: Regenerate Prisma Client

```bash
cd web
pnpm prisma generate
```

**Verify**: Check `/web/src/generated/prisma` contains `ImportanceLevel` type

---

## Phase 4: Star Rating Component (45 minutes)

### Step 4.1: Create StarRating Component

**File**: `/web/src/components/ui/star-rating.tsx` (create new file)

```typescript
"use client";

import React, { useState, memo } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { designTokens } from "@/components/design-system/core";

export interface StarRatingProps {
  value: 1 | 2 | 3; // Current rating
  onChange?: (value: 1 | 2 | 3) => void; // Optional edit handler
  disabled?: boolean; // Read-only mode or loading state
  size?: "sm" | "md" | "lg"; // Size variants
}

const sizeMap = {
  sm: 16,
  md: 20,
  lg: 24,
} as const;

export const StarRating = memo(function StarRating({
  value,
  onChange,
  disabled = false,
  size = "md",
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const isInteractive = !disabled && !!onChange;
  const iconSize = sizeMap[size];

  const handleClick = (starIndex: 1 | 2 | 3) => {
    if (!isInteractive) return;
    onChange(starIndex);
  };

  const handleMouseEnter = (starIndex: number) => {
    if (!isInteractive) return;
    setHoverValue(starIndex);
  };

  const handleMouseLeave = () => {
    if (!isInteractive) return;
    setHoverValue(null);
  };

  const displayValue = hoverValue ?? value;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5",
        isInteractive && "cursor-pointer"
      )}
      onMouseLeave={handleMouseLeave}
      role={isInteractive ? "radiogroup" : "img"}
      aria-label={`${value} out of 3 stars`}
    >
      {[1, 2, 3].map((starIndex) => {
        const isFilled = starIndex <= displayValue;
        const isClickable = isInteractive && starIndex !== value;

        return (
          <button
            key={starIndex}
            type="button"
            onClick={() => handleClick(starIndex as 1 | 2 | 3)}
            onMouseEnter={() => handleMouseEnter(starIndex)}
            disabled={disabled}
            className={cn(
              "focus-visible:ring-2 focus-visible:ring-offset-2",
              isInteractive &&
                "hover:scale-110 transition-transform duration-150",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            style={{
              color: isFilled
                ? designTokens.colors.primary.DEFAULT
                : designTokens.colors.muted.foreground,
            }}
            aria-label={`Rate ${starIndex} out of 3 stars`}
            aria-pressed={isInteractive ? starIndex === value : undefined}
            role={isInteractive ? "radio" : undefined}
            aria-checked={isInteractive ? starIndex === value : undefined}
          >
            <Star
              size={iconSize}
              fill={isFilled ? "currentColor" : "none"}
              strokeWidth={2}
            />
          </button>
        );
      })}
    </div>
  );
});
```

### Step 4.2: Test Component in Isolation

**File**: `/web/src/app/[locale]/demo/star-rating-demo.tsx` (optional test page)

```typescript
"use client";

import { useState } from "react";
import { StarRating } from "@/components/ui/star-rating";

export function StarRatingDemo() {
  const [rating, setRating] = useState<1 | 2 | 3>(2);

  return (
    <div className="p-8 space-y-4">
      <h2>Star Rating Component Demo</h2>

      <div className="space-y-2">
        <p>Interactive (editable):</p>
        <StarRating value={rating} onChange={setRating} />
        <p>Current value: {rating}</p>
      </div>

      <div className="space-y-2">
        <p>Read-only:</p>
        <StarRating value={3} />
      </div>

      <div className="space-y-2">
        <p>Sizes:</p>
        <StarRating value={2} size="sm" />
        <StarRating value={2} size="md" />
        <StarRating value={2} size="lg" />
      </div>

      <div className="space-y-2">
        <p>Disabled:</p>
        <StarRating value={2} onChange={setRating} disabled />
      </div>
    </div>
  );
}
```

**Manual test**: Visit `/demo/star-rating-demo` and verify interactions

---

## Phase 5: tRPC API Endpoint (30 minutes)

### Step 5.1: Add Mutation to Router

**File**: `/web/src/server/api/routers/interview-preparation.ts`

**Add import** (top of file):

```typescript
import { ImportanceLevel } from "@/generated/prisma";
```

**Add procedure** (inside `createTRPCRouter`):

```typescript
updateExperienceImportance: protectedProcedure
  .input(
    z.object({
      experienceType: z.enum(['CAREER', 'PROJECT']),
      experienceId: z.number().int().positive(),
      importance: z.enum(['HIGH', 'MEDIUM', 'LOW']),
    })
  )
  .mutation(async ({ ctx, input }) => {
    // Determine table based on experience type
    const experienceTable =
      input.experienceType === 'CAREER'
        ? ctx.db.careerExperience
        : ctx.db.projectExperience

    // Authorization: Verify experience belongs to user
    const experience = await experienceTable.findFirst({
      where: {
        id: input.experienceId,
        resume: {
          interviewPreparation: {
            userId: ctx.session.user.id,
          },
        },
      },
    })

    if (!experience) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: "You don't have permission to update this experience",
      })
    }

    // Update importance
    const updated = await experienceTable.update({
      where: { id: input.experienceId },
      data: { importance: input.importance as ImportanceLevel },
    })

    return {
      success: true,
      experienceId: updated.id,
      experienceType: input.experienceType,
      importance: updated.importance,
      updatedAt: new Date().toISOString(),
    }
  }),
```

### Step 5.2: Update getDetail Query (Add Sorting)

**Find existing `getDetail` procedure**, update the orderBy clause:

```typescript
getDetail: protectedProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ ctx, input }) => {
    // ... existing authorization code

    // Fetch career experiences (sorted)
    const careerExperiences = await ctx.db.careerExperience.findMany({
      where: { resumeId: resume.id },
      orderBy: [
        { importance: 'asc' },  // ✨ HIGH first, then MEDIUM, then LOW
        { endDate: 'desc' },    // ✨ Most recent first within each tier
      ],
    })

    // Fetch project experiences (sorted)
    const projectExperiences = await ctx.db.projectExperience.findMany({
      where: { resumeId: resume.id },
      orderBy: [
        { importance: 'asc' },  // ✨ HIGH first, then MEDIUM, then LOW
        { endDate: 'desc' },    // ✨ Most recent first within each tier
      ],
    })

    // ... rest of the query
  }),
```

---

## Phase 6: UI Integration (60 minutes)

### Step 6.1: Update ExperienceCard Component

**File**: `/web/src/app/[locale]/(protected)/interview-prep/[id]/_components/ExperienceCard.tsx`

**Add imports** (top of file):

```typescript
import { StarRating } from "@/components/ui/star-rating";
import { importanceToStars, starsToImportance } from "@/types/experience";
import type { ImportanceLevel } from "@/generated/prisma";
import { toast } from "sonner";
```

**Add importance to Experience interface**:

```typescript
interface ExperienceCardProps {
  experience: Experience & { importance: ImportanceLevel }; // ✨ Add importance field
  preparationId: string; // ✨ Add preparationId for mutation
  onSelectForPractice?: (experienceId: string) => void;
}
```

**Add mutation hook** (inside component):

```typescript
export const ExperienceCard = memo(function ExperienceCard({
  experience,
  preparationId,
  onSelectForPractice,
}: ExperienceCardProps) {
  const t = useTranslations("interview-prep.detail.experienceCard");
  const utils = api.useUtils();

  // ✨ NEW: Importance update mutation
  const updateImportance =
    api.interviewPreparation.updateExperienceImportance.useMutation({
      onMutate: async (newData) => {
        // Optimistic update
        await utils.interviewPreparation.getDetail.cancel({
          id: preparationId,
        });
        const previous = utils.interviewPreparation.getDetail.getData({
          id: preparationId,
        });

        utils.interviewPreparation.getDetail.setData(
          { id: preparationId },
          (old) => {
            if (!old) return old;
            return {
              ...old,
              experiences: old.experiences.map((exp) =>
                exp.id === newData.experienceId &&
                exp.type === newData.experienceType
                  ? { ...exp, importance: newData.importance }
                  : exp
              ),
            };
          }
        );

        return { previous };
      },
      onError: (err, _, context) => {
        // Revert on error
        if (context?.previous) {
          utils.interviewPreparation.getDetail.setData(
            { id: preparationId },
            context.previous
          );
        }
        toast.error(t("importance.updateError"));
      },
      onSettled: () => {
        // Refetch to ensure consistency
        utils.interviewPreparation.getDetail.invalidate({ id: preparationId });
      },
    });

  // ✨ NEW: Handle star click
  const handleStarClick = (stars: 1 | 2 | 3) => {
    const importance = starsToImportance(stars);
    updateImportance.mutate({
      experienceType: experience.type === "career" ? "CAREER" : "PROJECT",
      experienceId: Number(experience.id),
      importance,
    });
  };

  // ... existing component code

  return (
    <Card className="transition-shadow duration-300 hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            {/* ... existing icon and title code */}

            {/* ✨ NEW: Add star rating next to title */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-semibold">{title}</CardTitle>
                <StarRating
                  value={importanceToStars(experience.importance)}
                  onChange={handleStarClick}
                  disabled={updateImportance.isPending}
                  size="sm"
                />
              </div>
              {/* ... rest of title section */}
            </div>
          </div>
          {/* ... rest of header */}
        </div>
      </CardHeader>
      {/* ... rest of card */}
    </Card>
  );
});
```

### Step 6.2: Update Visual Styling for High Importance

**Add style utility function** (before component):

```typescript
function getExperienceCardStyles(importance: ImportanceLevel) {
  switch (importance) {
    case "HIGH":
      return {
        border: `2px solid ${designTokens.colors.primary.DEFAULT}`,
        backgroundColor: `${designTokens.colors.primary.DEFAULT}0A`, // 4% opacity
        boxShadow: designTokens.shadows.md,
      };
    case "LOW":
      return {
        border: `1px solid ${designTokens.colors.muted.DEFAULT}`,
        backgroundColor: designTokens.colors.card.DEFAULT,
        boxShadow: designTokens.shadows["2xs"],
      };
    default: // MEDIUM
      return {
        border: `1px solid ${designTokens.colors.border}`,
        backgroundColor: designTokens.colors.card.DEFAULT,
        boxShadow: designTokens.shadows.sm,
      };
  }
}
```

**Apply styles to Card**:

```typescript
return (
  <Card
    className="transition-shadow duration-300 hover:shadow-md"
    style={getExperienceCardStyles(experience.importance)} // ✨ Apply conditional styles
  >
    {/* ... card content */}
  </Card>
);
```

### Step 6.3: Pass preparationId to ExperienceCard

**File**: `/web/src/app/[locale]/(protected)/interview-prep/[id]/_components/ExperienceTimeline.tsx`

**Update ExperienceCard usage**:

```typescript
<ExperienceCard
  experience={experience}
  preparationId={preparationId} // ✨ Pass preparationId
  onSelectForPractice={handleSelectForPractice}
/>
```

---

## Phase 7: Internationalization (15 minutes)

### Step 7.1: Add Translation Keys

**File**: `/web/public/locales/ko/common.json`

**Add keys**:

```json
{
  "interview-prep": {
    "detail": {
      "experienceCard": {
        "importance": {
          "label": "중요도",
          "high": "높음",
          "medium": "보통",
          "low": "낮음",
          "updateError": "중요도 업데이트 실패. 다시 시도해주세요.",
          "updateSuccess": "중요도가 업데이트되었습니다."
        }
      }
    }
  }
}
```

**File**: `/web/public/locales/en/common.json`

**Add keys**:

```json
{
  "interview-prep": {
    "detail": {
      "experienceCard": {
        "importance": {
          "label": "Importance",
          "high": "High",
          "medium": "Medium",
          "low": "Low",
          "updateError": "Failed to update importance. Please try again.",
          "updateSuccess": "Importance updated successfully."
        }
      }
    }
  }
}
```

---

## Phase 8: Quality Checks (30 minutes)

### Step 8.1: Run Type Checking

```bash
cd web
pnpm type-check
```

**Fix any type errors before proceeding.**

### Step 8.2: Run Linting

```bash
cd web
pnpm lint
```

**Fix any ESLint errors.**

### Step 8.3: Run Formatting

```bash
cd web
pnpm format
```

### Step 8.4: Run Full Quality Check

```bash
cd web
pnpm check-all
```

**Must pass** ✅ before committing.

---

## Phase 9: Manual Testing (45 minutes)

### Test Checklist

#### Data Model Tests

- [ ] Run migration successfully
- [ ] Verify importance field in database (use Prisma Studio)
- [ ] Verify default value is MEDIUM for new experiences

#### AI Server Tests

- [ ] Start AI server (`uv run langgraph dev`)
- [ ] Test resume parser with JD context
- [ ] Verify importance field in AI output
- [ ] Test with different resume/JD combinations

#### Frontend Tests

- [ ] Upload new resume → verify experiences have importance
- [ ] Click star rating → verify immediate UI update
- [ ] Refresh page → verify importance persists
- [ ] Test in Korean locale
- [ ] Test in English locale
- [ ] Test on mobile viewport (responsive)

#### Interaction Tests

- [ ] Hover over stars → verify preview animation
- [ ] Click 1 star → verify experience visual styling changes
- [ ] Click 3 stars → verify experience visual styling changes
- [ ] Rapidly click multiple stars → verify only final rating saves
- [ ] Test with slow network (Chrome DevTools throttling)

#### Error Handling Tests

- [ ] Disconnect network → click star → verify error toast
- [ ] Login as different user → try to update another user's experience → verify FORBIDDEN error
- [ ] Invalid experience ID → verify NOT_FOUND error

#### Sorting Tests

- [ ] Verify HIGH importance experiences appear first
- [ ] Verify MEDIUM importance experiences appear second
- [ ] Verify LOW importance experiences appear last
- [ ] Within each tier, verify most recent experiences first

---

## Phase 10: Deployment (20 minutes)

### Step 10.1: Run Pre-Commit Checks

```bash
# Frontend
cd web
pnpm check-all

# AI Server
cd ../ai
uv run make lint
```

**Both must pass** ✅

### Step 10.2: Create Git Commit

```bash
git add .
git commit -m "feat: add experience importance visualization

- Add ImportanceLevel enum to Prisma schema
- Add importance field to CareerExperience and ProjectExperience
- Update AI resume parser to generate importance ratings
- Create StarRating component with edit capability
- Add updateExperienceImportance tRPC mutation
- Update ExperienceCard with star rating UI
- Add importance-based sorting to experience lists
- Add conditional styling for high-importance experiences
- Add Korean and English translations

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Step 10.3: Push to Remote

```bash
git push origin 001-experience-importance-visualization
```

### Step 10.4: Create Pull Request

```bash
# Using GitHub CLI
gh pr create --title "feat: Experience Importance Visualization" --body "$(cat <<'EOF'
## Summary
Adds AI-generated and user-editable importance ratings (1-3 stars) to resume experiences in interview preparation pages.

## Changes
- Database: Added `importance` field to experience models
- AI Server: Resume parser generates importance ratings based on JD match
- UI: Star rating component with hover preview and click-to-edit
- API: tRPC mutation for updating importance with optimistic updates
- Sorting: Experiences automatically sort by importance then recency
- Styling: High-importance experiences have enhanced visual emphasis

## Test Plan
- [x] Type checking passes
- [x] Linting passes
- [x] Manual testing completed (see quickstart.md checklist)
- [x] AI server integration tested
- [x] Tested in Korean and English locales
- [x] Tested on mobile viewport

## Screenshots
[Add screenshots showing star ratings and visual styling]

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Troubleshooting

### Issue: Migration fails

**Symptom**: `prisma migrate dev` fails with error
**Solution**:

1. Check database connection (verify Supabase is accessible)
2. Review migration SQL for syntax errors
3. Try `prisma migrate reset` (WARNING: deletes all data in dev)

### Issue: AI server doesn't assign importance

**Symptom**: Experiences have NULL or MEDIUM importance after parsing
**Solution**:

1. Verify `BaseExperience` schema includes `importance` field
2. Check LLM prompt includes importance criteria
3. Test with higher-temperature LLM to see if it assigns ratings
4. Verify JD context is passed to resume parser

### Issue: Star rating doesn't update

**Symptom**: Clicking stars doesn't change UI
**Solution**:

1. Check browser console for tRPC errors
2. Verify `preparationId` is passed to ExperienceCard
3. Check authorization (user must own experience)
4. Verify `updateImportance` mutation is called

### Issue: Experiences not sorting correctly

**Symptom**: HIGH importance not at top
**Solution**:

1. Verify orderBy clause uses `importance: 'asc'` (not 'desc')
2. Check enum values match exactly (HIGH, MEDIUM, LOW)
3. Clear React Query cache and refetch

### Issue: Type errors after migration

**Symptom**: TypeScript errors about ImportanceLevel
**Solution**:

```bash
cd web
pnpm prisma generate  # Regenerate Prisma client
```

---

## Common Gotchas

1. **Don't forget composite index**: Without `[resumeId, importance, endDate]` index, sorted queries will be slow
2. **Always use designTokens**: No hardcoded colors or styles
3. **Pass preparationId**: ExperienceCard needs it for the mutation
4. **Handle NULL importance**: Old experiences may have NULL until backfilled
5. **Enum capitalization matters**: 'HIGH' not 'high', 'CAREER' not 'Career'
6. **Test optimistic updates**: Network errors should revert UI changes

---

## Next Steps (Post-MVP)

After implementing this feature:

1. **Analytics**: Track importance update frequency and patterns
2. **A/B Testing**: Test different AI rating criteria
3. **Bulk Operations**: Add "Apply to All" button for batch rating updates
4. **Explanations**: Show tooltip explaining why AI assigned a rating
5. **Re-analysis**: Add button to regenerate AI ratings with updated JD

---

## Getting Help

**Documentation**:

- [research.md](./research.md) - Technical decisions and rationale
- [data-model.md](./data-model.md) - Complete data model specification
- [contracts/trpc-api.md](./contracts/trpc-api.md) - API contract details

**Reference Implementations**:

- Star rating pattern: Similar to movie rating sites (hover preview + click)
- tRPC mutation: Follow existing `updateAnswer` mutation pattern
- Optimistic updates: Reference `updateAnswer` implementation

**Contact**:

- Tech lead: [Your name]
- Product: [PM name]
- Design: [Designer name]

---

**Estimated Total Time**: 8-12 hours (varies by experience level)

**Good luck!** 🚀
