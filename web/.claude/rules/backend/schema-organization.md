---
paths: src/lib/schemas/**/*.ts, src/server/api/schemas/**/*.ts
---
# Schema Organization Rules

## Schema Classification Guidelines

### `/src/lib/schemas/` - Shared Domain Schemas

- **Purpose**: Business domain schemas used across multiple layers
- **Examples**: `job-posting.schema.ts`, `interview.schema.ts`, `user.schema.ts`
- **Criteria**: Used by 2+ layers (frontend, API, AI services)
- **Pattern**: Export base schema + variations (form, optional, update)

```typescript
// Example: job-posting.schema.ts
export const jobPostingSchema = z.object({
  /* base */
})
export const jobPostingFormSchema = jobPostingSchema.extend({
  /* form-specific */
})
export const jobPostingOptionalSchema = jobPostingSchema.partial()
```

### `/src/server/api/schemas/` - API Layer Schemas

- **Purpose**: tRPC input/output validation and API-specific structures
- **Examples**: `pagination.schema.ts`, `filters.schema.ts`, `sorting.schema.ts`
- **Criteria**: Used only within tRPC routers and API layer
- **Pattern**: API interface focused, HTTP request/response structure

### `/src/server/services/ai/contracts/schemas/` - External Service Contracts

- **Purpose**: External AI service communication contracts
- **Examples**: `langgraph-inputs.schema.ts`, `webhook-payloads.schema.ts`
- **Criteria**: External system integration, version management required
- **Pattern**: Pick from shared schemas + extend with service-specific fields

### File-Internal Schemas

- **Purpose**: Single-use, file-specific validation
- **Examples**: Component form validation, single router internal logic
- **Criteria**: Used only within one file, high cohesion
- **Pattern**: Define locally as `const schema = z.object({})`

## Decision Framework

**Before creating new schema, ALWAYS check existing schemas for reusability:**

1. **Search existing schemas**: Check `/src/lib/schemas/` first
2. **Consider extend/pick patterns**: `existingSchema.extend()`, `existingSchema.pick()`
3. **Evaluate reuse potential**: Will this be used elsewhere?

**Classification criteria:**

- **2+ layers** → `/src/lib/schemas/`
- **API only** → `/src/server/api/schemas/`
- **External service** → `/src/server/services/ai/contracts/schemas/`
- **Single file** → Define locally
