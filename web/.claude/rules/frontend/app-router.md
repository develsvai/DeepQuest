---
paths: src/app/**/*.{ts,tsx}
---

# Next.js 16 App Router Best Practices

## Component Architecture Principles

**Golden Rule:** If a component only passes children through without transformation, it's probably unnecessary.

**Core Principles:**

1. **Flatten Hierarchy** - Avoid unnecessary wrapper layers
2. **Self-Contained Components** - Use hooks directly, don't prop-drill framework objects
3. **Purposeful Extraction** - Extract when truly reusable or complex (>100 lines)
4. **Direct Composition** - Prefer explicit composition over implicit wrapping

---

## Props Design Principles

### ✅ DO - Minimize Props Dependencies

```typescript
// ✅ Good: Client component uses next-intl hook directly
'use client'
import { useTranslations } from 'next-intl'

function MyComponent({ onSubmit, data }: { onSubmit: () => void, data: any }) {
  const t = useTranslations('myComponent') // Direct hook usage
  return <div>{t('title')}</div>
}

// ✅ Good: Server component passes minimal data
export default async function Page() {
  const data = await fetchData()
  return <MyComponent onSubmit={handleSubmit} data={data} />
}
```

### ❌ DON'T - Pass Framework-Managed Data as Props

```typescript
// ❌ Bad: Passing translations as props
function MyComponent({
  onSubmit,
  data,
  translations // ← Unnecessary prop
}: {
  onSubmit: () => void
  data: any
  translations: Record<string, string>
}) {
  return <div>{translations.title}</div>
}

// ❌ Bad: Parent component manages translations
export default async function Page() {
  const t = await getTranslations('myComponent') // Server-side
  const translations = {
    title: t('title'),
    description: t('description'),
    // ... Manual mapping
  }
  return <MyComponent translations={translations} />
}
```

### Core Rules

1. **Framework Integration**: Use hooks directly (`useTranslations`, `useRouter`)
2. **Server/Client Boundary**: Pass only business data, not framework objects
3. **Component Autonomy**: Make components self-contained
4. **Props Validation**: Business logic props only

```typescript
// ✅ Good: Business logic props only
interface ComponentProps {
  data: BusinessData
  onAction: () => void
  isLoading?: boolean
}

// ❌ Bad: Including framework-managed data
interface ComponentProps {
  data: BusinessData
  translations: Record<string, string> // ← Framework responsibility
  router: NextRouter // ← Framework responsibility
}
```

---

## Common Anti-Patterns to Avoid

### ❌ Anti-Pattern 1: Unnecessary Wrapper Components

```typescript
// ❌ Bad: Wrapper that just passes children through
function ActionsWrapper({ data, children }) {
  const router = useRouter()
  const handleClick = () => router.push('/dashboard')

  return (
    <>
      <Header onClick={handleClick} />
      {children}  // ← Just passing through
      <Footer />
    </>
  )
}

// ✅ Good: Direct composition, self-contained components
function Page() {
  return (
    <>
      <Header />  // Handles own navigation internally
      <Content data={data} />
      <Footer />
    </>
  )
}
```

**Wrapper is acceptable when:**

- Provides Context (Context.Provider)
- Transforms/filters children (error boundaries)
- Adds shared layout with logic

---

### ❌ Anti-Pattern 2: Props Drilling for Callbacks

```typescript
// ❌ Bad: Drilling callback through multiple layers
<Wrapper onSelect={callback}>
  <Timeline onSelect={callback}>
    <Card onSelect={callback} />  // ← Props drilling
  </Timeline>
</Wrapper>

// ✅ Good: Create callback where it's needed
// Note: See @navigation.md for useRouter import pattern
import { useRouter } from '@/i18n/navigation'
import { routes } from '@/lib/routes'

function Card({ preparationId, itemId }) {
  const router = useRouter()

  const handleSelect = useCallback(() => {
    // Locale is handled automatically by next-intl
    router.push(routes.interviewPrep.experience(preparationId, 'career', itemId))
  }, [router, preparationId, itemId])

  return <Button onClick={handleSelect}>Select</Button>
}
```

---

## Component Extraction Guidelines

**Extract when:**

- ✅ Used in 2+ places (DRY)
- ✅ Complex logic (>100 lines)
- ✅ Independent responsibility (high cohesion)

**Don't extract when:**

- ❌ Single use (<30 lines) - inline instead
- ❌ Tightly coupled to parent
- ❌ No clear boundary

```typescript
// ❌ Bad: Over-extraction for single use
// StatusBadge.tsx (73 lines for one usage)
export function StatusBadge({ status }) { ... }

// ✅ Good: Inline single-use component
function CompanyInfo({ status }) {
  const t = useTranslations('status')
  return <span className={statusClasses[status]}>{t(status)}</span>
}
```

---

## Hook Extraction Guidelines

**Extract when:**

- ✅ Used in 2+ components (reusability)
- ✅ Complex logic (>10 lines, multiple side effects)
- ✅ Needs isolated testing
- ✅ Component file >200 lines

**Don't extract when:**

- ❌ Single useState/simple logic
- ❌ Tightly coupled to one component's internal state
- ❌ Adds more complexity than it removes

### Hook Location Rules

```typescript
// 1️⃣ Component-specific hook → {Component}.hooks.ts (same folder)
_components/
├── ExperienceCard.tsx
└── ExperienceCard.hooks.ts  // ← High cohesion

// 2️⃣ Page-level shared hook → _hooks/ folder
interview-prep/[id]/
├── _components/
└── _hooks/
    └── use-update-experience.ts  // ← Multiple components

// 3️⃣ Global shared hook → /src/hooks/
src/hooks/
└── use-optimistic-mutation.ts  // ← 2+ pages
```

**Decision criteria:**

- One component → `{Component}.hooks.ts`
- Multiple components in page → `_hooks/` folder
- Multiple pages → `/src/hooks/` folder

**File naming:**

```typescript
// ✅ Good
ExperienceCard.hooks.ts
use - update - importance.ts

// ❌ Avoid
hooks.ts // Too generic
experienceCardHooks.ts // Use kebab-case
```

---

## Next.js 16 Dynamic Route Params Typing

### ⚠️ Important: Locale Param Must Be `string`

Next.js 16 generates type validation in `.next/dev/types/validator.ts` with `locale: string` for dynamic route segments like `[locale]`.

**Problem:** Using custom union types like `Locale` (`"en" | "ko"`) in layout/page props causes TS2344 error:

```
Type 'string' is not assignable to type '"en" | "ko"'
```

**Solution:** Use `string` type for params, validate at runtime.

```typescript
// ✅ Correct: Use string, validate at runtime
interface LayoutProps {
  params: Promise<{ locale: string }> // ← string, not Locale
}

export default async function Layout({ params }: LayoutProps) {
  const { locale } = await params

  // Runtime validation (already in RootLayout)
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  // Safe to use locale after validation
  return <div>{/* ... */}</div>
}

// ❌ Wrong: Using custom union type
interface LayoutProps {
  params: Promise<{ locale: Locale }> // ← Causes TS2344
}
```

**Why this happens:**

- Next.js generates generic types for dynamic segments (`[param]` → `string`)
- Custom narrower types conflict with generated validator types
- This is by design - runtime validation is the intended pattern
