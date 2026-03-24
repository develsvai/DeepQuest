---
paths: src/app/**/*.tsx, src/components/**/*.tsx, src/i18n/**/*.ts, src/lib/routes.ts
---

# Navigation & URL Routing Rules

## Core Principle

**Use next-intl Navigation API + centralized route constants.** Never use `next/link` or `next/navigation` directly.

## Required Imports

```typescript
// ✅ ALWAYS use these
import { Link, useRouter, usePathname, redirect } from '@/i18n/navigation'
import { routes } from '@/lib/routes'

// ❌ NEVER use these (blocked by ESLint)
import Link from 'next/link'
import { useRouter, usePathname, redirect } from 'next/navigation'
```

## Route Constants (`@/lib/routes`)

All URLs must be defined in `src/lib/routes.ts`:

```typescript
export const routes = {
  home: '/',
  dashboard: '/dashboard',
  interviewPrep: {
    new: '/interview-prep/new',
    detail: (id: string) => `/interview-prep/${id}`,
    experience: (id: string, type: string, expId: string) =>
      `/interview-prep/${id}/${type}/${expId}`,
    questions: (id: string, type: string, expId: string) =>
      `/interview-prep/${id}/${type}/${expId}/questions`,
  },
} as const
```

**Usage:**

```typescript
// ✅ Good: Use route constants
<Link href={routes.dashboard}>Dashboard</Link>
<Link href={routes.interviewPrep.detail(id)}>View</Link>
router.push(routes.interviewPrep.experience(id, 'career', expId))

// ❌ Bad: Hardcoded URLs
<Link href="/dashboard">Dashboard</Link>
<Link href={`/interview-prep/${id}`}>View</Link>
router.push(`/${locale}/interview-prep/${id}/career/${expId}`)
```

## Query Parameters

Use object syntax for URLs with query parameters:

```typescript
// With query params
router.push({
  pathname: routes.interviewPrep.experience(id, 'career', expId),
  query: { keyAchievementId: achievementId }
})

<Link href={{
  pathname: routes.interviewPrep.detail(id),
  query: { tab: 'questions' }
}}>
  View Questions
</Link>
```

## Language Toggle Pattern

**Never use regex-based locale switching.** Use next-intl's built-in locale option:

```typescript
'use client'
import { usePathname, useRouter } from '@/i18n/navigation'

export function LanguageToggle() {
  const pathname = usePathname()  // Returns path WITHOUT locale prefix
  const router = useRouter()

  const switchLocale = (newLocale: 'ko' | 'en') => {
    router.replace(pathname, { locale: newLocale })
  }

  return (
    <button onClick={() => switchLocale('ko')}>한국어</button>
  )
}
```

## Active State Detection

`usePathname()` from `@/i18n/navigation` returns pathname **without** locale prefix:

```typescript
// ✅ Correct: Simple comparison (no locale prefix needed)
const pathname = usePathname()  // Returns "/dashboard", not "/ko/dashboard"
const isActive = pathname === routes.dashboard

// ❌ Wrong: Manual locale prefix (old pattern)
const isActive = pathname === `/${locale}/dashboard`
```

## Server vs Client Usage

| Location | Import From | Locale Handling |
|----------|-------------|-----------------|
| Client Components | `@/i18n/navigation` | Automatic |
| Server Components | `@/i18n/navigation` | Automatic |
| Server Actions | `@/i18n/navigation` | Automatic |
| `app/page.tsx` (root only) | `next/navigation` | Manual (exception) |

## i18n Navigation Structure

```
src/i18n/
├── routing.ts      # defineRouting() - locale config, Locale type
├── navigation.ts   # createNavigation() - Link, useRouter, redirect exports
└── request.ts      # getRequestConfig() - server request config
```

## Common Mistakes

### 1. Direct next/link Import

```typescript
// ❌ Bad: Bypasses locale handling
import Link from 'next/link'
<Link href="/dashboard">Dashboard</Link>

// ✅ Good: Locale-aware
import { Link } from '@/i18n/navigation'
<Link href={routes.dashboard}>Dashboard</Link>
```

### 2. Manual Locale Prefix

```typescript
// ❌ Bad: Manual locale handling
const locale = useLocale()
router.push(`/${locale}/interview-prep/${id}`)

// ✅ Good: Automatic locale handling
router.push(routes.interviewPrep.detail(id))
```

### 3. Regex-based Language Switching

```typescript
// ❌ Bad: Fragile regex replacement
const newPath = pathname.replace(/^\/[a-z]{2}/, '')

// ✅ Good: Built-in locale option
router.replace(pathname, { locale: newLocale })
```

### 4. Hardcoded URLs in Components

```typescript
// ❌ Bad: URL scattered across files
<Link href="/interview-prep/new">New</Link>

// ✅ Good: Centralized in routes.ts
<Link href={routes.interviewPrep.new}>New</Link>
```

## ESLint Protection

Project enforces these via `no-restricted-imports`:

- `next/link` - blocked (use `@/i18n/navigation`)
- `next/navigation` useRouter/usePathname/redirect - blocked

**Exception:** `app/page.tsx` root redirect requires `next/navigation`.

## Reference

- **Refactoring Guide:** `/docs/refactoring/url-routing-refactoring.md`
- **Implementation Files:**
  - `src/i18n/navigation.ts` - Navigation exports
  - `src/i18n/routing.ts` - Locale configuration
  - `src/lib/routes.ts` - Route constants

## Context7 Reference

For latest next-intl docs:

```
mcp__context7__get-library-docs(
  context7CompatibleLibraryID: "/amannn/next-intl",
  topic: "navigation createNavigation Link useRouter"
)
```
