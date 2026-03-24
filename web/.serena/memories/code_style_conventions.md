# Code Style and Conventions

## 🚨 CRITICAL RULES (MUST FOLLOW)

### Design System Compliance

- **NEVER use raw HTML tags** (`<div>`, `<span>`, `<p>`, etc.)
- **NEVER hardcode colors** - ONLY use `designTokens` from `@/components/design-system/core.ts`
- **ALWAYS use shadcn/ui components** or design system components
- **ALWAYS import designTokens** for any color/spacing/typography needs

### Component Architecture Rules

- **NEVER use "use client" in page.tsx files** - maximize Server-Side Rendering
- **Create separate client components** when interactivity is needed
- **Search for existing components first** before creating new ones
- **Maximize componentization** - keep files short and focused
- **Generalize components** for reusability across features

### Quality Gates

- **ALWAYS run `pnpm check-all`** after code changes (type-check + lint + format)
- **NO `any` types** - use `unknown` with proper type guards
- **Required JSDoc** for public APIs, utilities, and components

## TypeScript Conventions

### Type Definitions

```typescript
// ✅ CORRECT: Explicit, safe types
interface UserProfile {
  id: string
  name: string
  email: string | null
  preferences?: UserPreferences
}

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// ❌ WRONG: Weak typing
interface User {
  id: any // Never use any
  data: object // Too generic
  meta?: any // Avoid optional any
}
```

### Naming Conventions

- **Types/Interfaces**: PascalCase (`InterviewPreparation`, `UserProfile`)
- **Variables/Functions**: camelCase (`getUserData`, `isAuthenticated`)
- **Constants**: UPPER_SNAKE_CASE for true constants (`MAX_FILE_SIZE`)
- **Files**: kebab-case (`user-profile.tsx`, `api-client.ts`)
- **Components**: PascalCase files (`UserProfile.tsx`)

### Import Organization

```typescript
// 1. React/Next.js imports
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 2. Third-party libraries
import { z } from 'zod'
import { useForm } from 'react-hook-form'

// 3. Internal imports (use @/ absolute paths)
import { api } from '@/trpc/client'
import { Button } from '@/components/ui/button'
import { designTokens } from '@/components/design-system/core'

// 4. Types
import type { UserProfile } from '@/types/user'
```

## Component Patterns

### Server Components (Default)

```typescript
// app/[locale]/(protected)/dashboard/page.tsx
export default async function DashboardPage() {
  // Direct data fetching in server component
  const data = await api.dashboard.getData()

  return (
    <PageContainer>
      <Card>
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Server-rendered content */}
        </CardContent>
      </Card>
    </PageContainer>
  )
}
```

### Client Components (When Needed)

```typescript
// components/interactive-chart.tsx
'use client' // Only when interactivity required

import { useState } from 'react'
import { Card } from '@/components/ui/card'

export function InteractiveChart() {
  const [selected, setSelected] = useState<string>()

  return (
    <Card onClick={() => setSelected('chart')}>
      {/* Interactive content */}
    </Card>
  )
}
```

## API Development (tRPC)

### Router Pattern

```typescript
// server/api/routers/interview.ts
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'

export const interviewRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(100),
        jobDescription: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Implementation with proper error handling
      return ctx.prisma.interviewPreparation.create({
        data: {
          ...input,
          userId: ctx.userId,
        },
      })
    }),
})
```

## File Structure Patterns

### Page Components

```
app/[locale]/(protected)/interview-prep/
├── page.tsx              # Server component
├── loading.tsx           # Loading state
├── error.tsx            # Error boundary
└── _components/         # Page-specific components
    ├── InterviewForm.tsx  # Client component
    └── QuestionList.tsx   # Server/Client component
```

### Shared Components

```
components/
├── ui/                  # shadcn/ui (don't modify directly)
├── design-system/       # Design tokens and theme
│   └── core.ts         # Color tokens (CRITICAL)
└── shared/             # Reusable components
    ├── FileUpload/
    │   ├── index.tsx
    │   └── FileUpload.types.ts
    └── LanguageToggle/
```

## Styling Conventions

### Using Design Tokens

```typescript
// ✅ CORRECT: Using design tokens
import { designTokens } from '@/components/design-system/core'

const styles = {
  backgroundColor: designTokens.colors.background,
  color: designTokens.colors.foreground,
  borderColor: designTokens.colors.border,
}

// ❌ WRONG: Hardcoded colors
const styles = {
  backgroundColor: '#faf9f5', // Never hardcode
  color: 'rgb(61, 57, 41)', // Use tokens instead
}
```

### Tailwind Classes

```tsx
// ✅ CORRECT: Semantic Tailwind classes
<Card className="p-6 space-y-4 border-border bg-card">

// ❌ WRONG: Arbitrary values
<div className="p-[24px] bg-[#faf9f5]"> // Use design system
```

## Error Handling

### API Error Handling

```typescript
// Proper error handling in tRPC
.mutation(async ({ ctx, input }) => {
  try {
    const result = await ctx.prisma.user.update({
      where: { id: input.id },
      data: input.data,
    })
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Email already exists',
        })
      }
    }
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to update user',
    })
  }
})
```

## Code Organization Rules

### Feature-Based Structure

- Group related components together
- Colocate types with components
- Keep page-specific components in `_components`
- Share only truly reusable components

### Separation of Concerns

- **UI Logic**: In components
- **Business Logic**: In tRPC routers
- **Data Fetching**: Server components or tRPC hooks
- **State Management**: Zustand for global, useState for local
- **Side Effects**: useEffect or server actions

## Performance Guidelines

### Component Optimization

```typescript
// Use React.memo sparingly, only when measured
const ExpensiveComponent = React.memo(({ data }) => {
  // Only if re-renders are proven bottleneck
})

// Prefer server components for static content
async function StaticContent() {
  const data = await fetchData()
  return <div>{data}</div>
}
```

### Dynamic Imports

```typescript
// Lazy load heavy components
const HeavyChart = dynamic(
  () => import('@/components/charts/HeavyChart'),
  {
    loading: () => <Skeleton />,
    ssr: false // Only if needed
  }
)
```

## Documentation Standards

### Component Documentation

```typescript
/**
 * Displays user profile information with edit capabilities
 *
 * @param user - User object from database
 * @param onEdit - Callback when edit is triggered
 * @param readonly - Disable editing features
 *
 * @example
 * <UserProfile user={currentUser} onEdit={handleEdit} />
 */
export function UserProfile({ user, onEdit, readonly = false }: Props) {
  // Implementation
}
```

### API Documentation

```typescript
/**
 * Creates a new interview preparation session
 *
 * @throws {TRPCError} UNAUTHORIZED if not authenticated
 * @throws {TRPCError} BAD_REQUEST if validation fails
 * @returns {InterviewPreparation} Created interview session
 */
```

## Forbidden Practices

### Never Do These

- ❌ Use `any` type (use `unknown` with guards)
- ❌ Hardcode colors or spacing values
- ❌ Use raw HTML elements when components exist
- ❌ Put "use client" in page.tsx files
- ❌ Create components without checking existing ones
- ❌ Skip `pnpm check-all` before committing
- ❌ Use relative imports (use `@/` prefix)
- ❌ Ignore TypeScript errors
- ❌ Mix concerns (UI + business logic)
- ❌ Create giant components (>200 lines)

### Always Do These

- ✅ Run `pnpm check-all` after changes
- ✅ Use design tokens for styling
- ✅ Search for existing components first
- ✅ Write JSDoc for public APIs
- ✅ Use Server Components by default
- ✅ Handle errors properly
- ✅ Follow existing patterns in codebase
- ✅ Keep components small and focused
- ✅ Use TypeScript strict mode
- ✅ Test your changes manually
