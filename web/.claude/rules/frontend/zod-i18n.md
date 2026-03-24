---
paths: src/lib/utils/zod/**/*.ts, src/**/*Form*.tsx
---

# Form i18n Error Message Management with Zod v4

## Overview

This document contains guidelines for managing internationalized validation error messages in forms using Zod v4 and next-intl.

## Pattern: Error Map Approach

Use `createZodErrorMap()` utility for field-specific i18n error messages.

**Why**: Zod v4's error precedence allows per-parse error maps to customize messages while keeping schemas reusable across layers.

## Implementation Steps

### 1. Define Field Name Constants

```typescript
// In schema file: /src/lib/schemas/your-schema.schema.ts
export const YOUR_FORM_FIELDS = {
  fieldName: 'fieldName',
  // ...
} as const satisfies Record<string, string>

export type YourFormFieldName =
  (typeof YOUR_FORM_FIELDS)[keyof typeof YOUR_FORM_FIELDS]
```

### 2. Keep Schema Message-Free

```typescript
// ❌ BAD: Hardcoded messages (highest precedence, blocks error map)
export const schema = z.object({
  field: z.string().min(1, 'Error message'),
})

// ✅ GOOD: No messages, let error map handle it
export const schema = z.object({
  field: z.string().min(1),
})
```

### 3. Use Error Map in Form

```typescript
import { createZodErrorMap } from '@/lib/utils/zod/zod-error-map'
import { YOUR_FORM_FIELDS } from '@/lib/schemas/your-schema.schema'

const tValidation = useTranslations('your-namespace.validation')

const form = useForm({
  resolver: zodResolver(yourSchema, {
    error: createZodErrorMap(tValidation), // Zod v4 API
  }),
})
```

### 4. Add Translation Keys

```json
// locales/{ko,en}/your-namespace.json
{
  "validation": {
    "fieldRequired": "필드를 입력해주세요",
    "fieldTooLong": "필드는 50자 이하로 입력해주세요",
    "required": "이 항목은 필수입니다",
    "tooShort": "입력값이 너무 짧습니다",
    "tooLong": "입력값이 너무 깁니다"
  }
}
```

## Error Map Customization

Extend `zod-error-map.ts` for project-specific field mappings:

```typescript
// In createZodErrorMap function
case 'too_small':
  if (issue.origin === 'string' || issue.type === 'string') {
    const minimum = toNumber(issue.minimum)
    if (fieldName === YOUR_FORM_FIELDS.yourField && minimum === 10) {
      return t('validation.yourFieldRequired')
    }
    return t('validation.tooShort')
  }
  return t('validation.tooSmall')
```

## Zod v4 Breaking Changes

- **API Change**: `errorMap` parameter → `error` function
- **String Validation**: Use `issue.origin === 'string'` instead of `issue.type === 'string'`
- **Error Precedence**: schema-level > per-parse > global > locale

## Key Files

- `/src/lib/utils/zod/zod-error-map.ts` - Core error map utility
- `/src/lib/schemas/job-posting.schema.ts` - Reference implementation

## Reference

Example: `/src/app/[locale]/(protected)/interview-prep/new/_components/JobPostingForm.tsx`
