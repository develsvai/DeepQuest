# tRPC API Contract: Experience Importance Update

**Feature**: 001-experience-importance-visualization
**Date**: 2025-10-13
**API Type**: tRPC Mutation (Type-safe RPC)
**Router**: `interviewPreparation`

## Overview

This document defines the API contract for updating experience importance ratings. The API follows tRPC conventions for end-to-end type safety and is implemented as a mutation in the existing `interviewPreparation` router.

---

## Endpoint Definition

### Procedure: `updateExperienceImportance`

**Type**: Mutation (modifies server state)
**Router Path**: `interviewPreparation.updateExperienceImportance`
**Authorization**: Protected (requires authenticated user)

---

## Request Contract

### Input Schema

**TypeScript Definition**:

```typescript
import { z } from "zod";

export const updateExperienceImportanceInput = z.object({
  experienceType: z.enum(["CAREER", "PROJECT"], {
    required_error: "Experience type is required",
    invalid_type_error: "Experience type must be either CAREER or PROJECT",
  }),
  experienceId: z.number().int().positive({
    message: "Experience ID must be a positive integer",
  }),
  importance: z.enum(["HIGH", "MEDIUM", "LOW"], {
    required_error: "Importance level is required",
    invalid_type_error: "Importance must be HIGH, MEDIUM, or LOW",
  }),
});

export type UpdateExperienceImportanceInput = z.infer<
  typeof updateExperienceImportanceInput
>;
```

### Field Descriptions

| Field            | Type                          | Required | Constraints      | Description                      |
| ---------------- | ----------------------------- | -------- | ---------------- | -------------------------------- |
| `experienceType` | `'CAREER' \| 'PROJECT'`       | ✅ Yes   | Enum             | Type of experience being updated |
| `experienceId`   | `number`                      | ✅ Yes   | Positive integer | Database ID of the experience    |
| `importance`     | `'HIGH' \| 'MEDIUM' \| 'LOW'` | ✅ Yes   | Enum             | New importance level             |

### Example Requests

**Update Career Experience to High Importance**:

```typescript
// Client call
const result =
  await trpc.interviewPreparation.updateExperienceImportance.mutate({
    experienceType: "CAREER",
    experienceId: 42,
    importance: "HIGH",
  });
```

**Update Project Experience to Low Importance**:

```typescript
const result =
  await trpc.interviewPreparation.updateExperienceImportance.mutate({
    experienceType: "PROJECT",
    experienceId: 17,
    importance: "LOW",
  });
```

---

## Response Contract

### Success Response

**TypeScript Definition**:

```typescript
export interface UpdateExperienceImportanceOutput {
  success: boolean;
  experienceId: number;
  experienceType: "CAREER" | "PROJECT";
  importance: "HIGH" | "MEDIUM" | "LOW";
  updatedAt: string; // ISO 8601 timestamp
}
```

### Success Response Example

```json
{
  "success": true,
  "experienceId": 42,
  "experienceType": "CAREER",
  "importance": "HIGH",
  "updatedAt": "2025-10-13T10:30:00.000Z"
}
```

### Field Descriptions

| Field            | Type                          | Description                                    |
| ---------------- | ----------------------------- | ---------------------------------------------- |
| `success`        | `boolean`                     | Always `true` for successful operations        |
| `experienceId`   | `number`                      | ID of the updated experience                   |
| `experienceType` | `'CAREER' \| 'PROJECT'`       | Type of experience that was updated            |
| `importance`     | `'HIGH' \| 'MEDIUM' \| 'LOW'` | New importance level                           |
| `updatedAt`      | `string`                      | ISO 8601 timestamp of when the update occurred |

---

## Error Responses

### tRPC Error Format

```typescript
interface TRPCError {
  message: string;
  code: TRPCErrorCode;
  data?: {
    code?: string;
    httpStatus?: number;
    stack?: string; // Only in development
    path?: string;
  };
}
```

### Error Codes

| HTTP Status | tRPC Code               | Scenario                             | Error Message                                         | Client Action                  |
| ----------- | ----------------------- | ------------------------------------ | ----------------------------------------------------- | ------------------------------ |
| 401         | `UNAUTHORIZED`          | User not authenticated               | "You must be logged in to perform this action"        | Redirect to login              |
| 403         | `FORBIDDEN`             | Experience doesn't belong to user    | "You don't have permission to update this experience" | Show error toast               |
| 404         | `NOT_FOUND`             | Experience ID doesn't exist          | "Experience not found"                                | Show error toast, refresh page |
| 400         | `BAD_REQUEST`           | Invalid input (Zod validation)       | Specific field error                                  | Show field-level error         |
| 500         | `INTERNAL_SERVER_ERROR` | Database error or unexpected failure | "An unexpected error occurred. Please try again."     | Show error toast, enable retry |

### Error Response Examples

**UNAUTHORIZED (401)**:

```json
{
  "message": "You must be logged in to perform this action",
  "code": "UNAUTHORIZED",
  "data": {
    "httpStatus": 401,
    "path": "interviewPreparation.updateExperienceImportance"
  }
}
```

**FORBIDDEN (403)**:

```json
{
  "message": "You don't have permission to update this experience",
  "code": "FORBIDDEN",
  "data": {
    "httpStatus": 403,
    "path": "interviewPreparation.updateExperienceImportance"
  }
}
```

**NOT_FOUND (404)**:

```json
{
  "message": "Experience not found",
  "code": "NOT_FOUND",
  "data": {
    "code": "EXPERIENCE_NOT_FOUND",
    "httpStatus": 404,
    "path": "interviewPreparation.updateExperienceImportance"
  }
}
```

**BAD_REQUEST (400) - Zod Validation**:

```json
{
  "message": "Validation error",
  "code": "BAD_REQUEST",
  "data": {
    "httpStatus": 400,
    "zodError": {
      "issues": [
        {
          "code": "invalid_enum_value",
          "options": ["HIGH", "MEDIUM", "LOW"],
          "path": ["importance"],
          "message": "Importance must be HIGH, MEDIUM, or LOW"
        }
      ]
    }
  }
}
```

**INTERNAL_SERVER_ERROR (500)**:

```json
{
  "message": "An unexpected error occurred. Please try again.",
  "code": "INTERNAL_SERVER_ERROR",
  "data": {
    "httpStatus": 500,
    "code": "DATABASE_ERROR"
  }
}
```

---

## Authorization

### Requirements

**Authentication**:

- User must be authenticated via Clerk
- Session token must be valid
- User ID extracted from `ctx.session.user.id`

**Authorization Logic**:

```typescript
// Verify experience belongs to user's resume
const experience = await ctx.db[experienceTable].findFirst({
  where: {
    id: input.experienceId,
    resume: {
      interviewPreparation: {
        userId: ctx.session.user.id, // Match current user
      },
    },
  },
});

if (!experience) {
  throw new TRPCError({
    code: "FORBIDDEN",
    message: "You don't have permission to update this experience",
  });
}
```

### Security Considerations

1. **Row-Level Security**: Query includes `userId` check to prevent unauthorized access
2. **Input Validation**: Zod schema validates all inputs before database access
3. **Type Safety**: TypeScript ensures correct table selection based on `experienceType`
4. **SQL Injection**: Prisma ORM prevents SQL injection via parameterized queries
5. **Rate Limiting**: Debouncing on client (300ms) prevents abuse

---

## Implementation Details

### tRPC Procedure Definition

**Location**: `/web/src/server/api/routers/interview-preparation.ts`

```typescript
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { ImportanceLevel } from "@/generated/prisma";

export const interviewPreparationRouter = createTRPCRouter({
  // ... existing procedures

  updateExperienceImportance: protectedProcedure
    .input(
      z.object({
        experienceType: z.enum(["CAREER", "PROJECT"]),
        experienceId: z.number().int().positive(),
        importance: z.enum(["HIGH", "MEDIUM", "LOW"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Determine which table to query
      const experienceTable =
        input.experienceType === "CAREER"
          ? ctx.db.careerExperience
          : ctx.db.projectExperience;

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
      });

      if (!experience) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to update this experience",
        });
      }

      // Update importance
      const updated = await experienceTable.update({
        where: { id: input.experienceId },
        data: { importance: input.importance as ImportanceLevel },
      });

      return {
        success: true,
        experienceId: updated.id,
        experienceType: input.experienceType,
        importance: updated.importance,
        updatedAt: new Date().toISOString(),
      };
    }),
});
```

---

## Client Integration

### React Query Hook (via tRPC)

```typescript
import { api } from "@/trpc/client";

function ExperienceCard({ experience }) {
  const utils = api.useUtils();

  const updateImportance =
    api.interviewPreparation.updateExperienceImportance.useMutation({
      // Optimistic update
      onMutate: async (newData) => {
        // Cancel outgoing refetches
        await utils.interviewPreparation.getDetail.cancel({
          id: preparationId,
        });

        // Snapshot previous value
        const previous = utils.interviewPreparation.getDetail.getData({
          id: preparationId,
        });

        // Optimistically update cache
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

      // Revert on error
      onError: (err, newData, context) => {
        if (context?.previous) {
          utils.interviewPreparation.getDetail.setData(
            { id: preparationId },
            context.previous
          );
        }

        // Show error toast
        toast.error(err.message);
      },

      // Refetch on success
      onSuccess: (data) => {
        toast.success("Importance updated successfully");
      },

      // Always refetch after error or success
      onSettled: () => {
        utils.interviewPreparation.getDetail.invalidate({ id: preparationId });
      },
    });

  const handleStarClick = (stars: 1 | 2 | 3) => {
    const importance = starsToImportance(stars);
    updateImportance.mutate({
      experienceType: experience.type,
      experienceId: experience.id,
      importance,
    });
  };

  return (
    <StarRating
      value={importanceToStars(experience.importance)}
      onChange={handleStarClick}
      disabled={updateImportance.isPending}
    />
  );
}
```

---

## Performance Characteristics

### Expected Latency

| Percentile   | Target   | Measurement                     |
| ------------ | -------- | ------------------------------- |
| p50 (median) | < 200ms  | Time from request to response   |
| p95          | < 500ms  | 95% of requests complete within |
| p99          | < 1000ms | 99% of requests complete within |

### Database Query Performance

**Query**: Single UPDATE with WHERE clause on indexed fields
**Expected Execution Time**: < 10ms

```sql
-- Optimized query (uses primary key index)
UPDATE career_experiences
SET importance = $1
WHERE id = $2
RETURNING *;
```

### Caching Strategy

**Client-Side** (React Query):

- Optimistic update: < 50ms
- Cache invalidation on success
- Automatic retry on network failure (3 attempts, exponential backoff)

**Server-Side**:

- No caching (mutation)
- Database connection pooling via Prisma

---

## Testing Contract

### Unit Tests

**Test Cases**:

1. ✅ Valid input updates importance successfully
2. ✅ Unauthorized user receives FORBIDDEN error
3. ✅ Non-existent experience returns NOT_FOUND
4. ✅ Invalid importance value fails Zod validation
5. ✅ Invalid experienceType fails Zod validation
6. ✅ Invalid experienceId (negative, zero, non-integer) fails validation

### Integration Tests

**Test Cases**:

1. ✅ Update career experience importance end-to-end
2. ✅ Update project experience importance end-to-end
3. ✅ Verify experience list re-sorts after update
4. ✅ Verify optimistic update + rollback on error
5. ✅ Verify authorization prevents cross-user updates

### Example Test

```typescript
import { describe, it, expect } from "vitest";
import { appRouter } from "@/server/api/root";
import { createInnerTRPCContext } from "@/server/api/trpc";

describe("updateExperienceImportance", () => {
  it("should update career experience importance", async () => {
    // Setup context with authenticated user
    const ctx = await createInnerTRPCContext({
      session: { user: { id: "user_123" } },
    });

    const caller = appRouter.createCaller(ctx);

    // Create test experience
    const experience = await ctx.db.careerExperience.create({
      data: {
        resumeId: testResumeId,
        company: "Test Corp",
        importance: "MEDIUM",
        // ... other required fields
      },
    });

    // Call mutation
    const result = await caller.interviewPreparation.updateExperienceImportance(
      {
        experienceType: "CAREER",
        experienceId: experience.id,
        importance: "HIGH",
      }
    );

    // Assertions
    expect(result.success).toBe(true);
    expect(result.importance).toBe("HIGH");
    expect(result.experienceId).toBe(experience.id);

    // Verify database update
    const updated = await ctx.db.careerExperience.findUnique({
      where: { id: experience.id },
    });
    expect(updated?.importance).toBe("HIGH");
  });

  it("should reject unauthorized access", async () => {
    const ctx = await createInnerTRPCContext({
      session: { user: { id: "user_456" } }, // Different user
    });

    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.interviewPreparation.updateExperienceImportance({
        experienceType: "CAREER",
        experienceId: otherUserExperienceId,
        importance: "HIGH",
      })
    ).rejects.toThrow("FORBIDDEN");
  });
});
```

---

## Monitoring & Observability

### Metrics to Track

**Application Metrics**:

- Request count (success/failure)
- Response latency (p50, p95, p99)
- Error rate by error code
- Concurrent requests

**Business Metrics**:

- Number of importance updates per user
- Most common importance changes (MEDIUM→HIGH, etc.)
- User engagement with star ratings

### Logging

**Info Level** (on success):

```typescript
logger.info("Experience importance updated", {
  userId: ctx.session.user.id,
  experienceId: input.experienceId,
  experienceType: input.experienceType,
  oldImportance: experience.importance,
  newImportance: input.importance,
  latencyMs: Date.now() - startTime,
});
```

**Error Level** (on failure):

```typescript
logger.error("Failed to update experience importance", {
  userId: ctx.session.user.id,
  experienceId: input.experienceId,
  errorCode: error.code,
  errorMessage: error.message,
  stack: error.stack,
});
```

---

## API Contract Checklist

- [x] Input schema defined with Zod
- [x] Output schema defined with TypeScript
- [x] All error codes documented
- [x] Authorization requirements specified
- [x] Performance targets defined
- [x] Example requests/responses provided
- [x] Test cases outlined
- [x] Monitoring strategy defined
- [x] Client integration example provided
- [x] Security considerations addressed

---

**API contract complete. Next: Generate quickstart.md developer guide.**
