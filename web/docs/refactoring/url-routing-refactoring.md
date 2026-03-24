# URL Routing Refactoring Plan

## Overview

**Purpose:** Centralize URL/route management using next-intl's navigation APIs and route constants.

**Current State:** URLs are hardcoded as template literals across 17+ files, with manual locale prefixing everywhere.

**Target State:** Centralized route definitions (`routes.ts`) + automatic locale handling (`@/i18n/navigation`).

---

## ⚠️ next-intl App Router Best Practice 준수

> **이 리팩토링은 next-intl 공식 권장 패턴을 따릅니다.**

### 핵심 원칙

이 프로젝트는 Next.js App Router + next-intl 조합을 사용합니다. next-intl은 i18n 라우팅을 위한 **전용 Navigation API**를 제공하며, 이를 사용하지 않으면 locale 처리가 일관되지 않고 버그가 발생합니다.

| 원칙                               | 설명                                                                      |
| ---------------------------------- | ------------------------------------------------------------------------- |
| **`createNavigation` 사용**        | `next/link`, `next/navigation` 대신 next-intl의 locale-aware wrapper 사용 |
| **Locale 자동 처리**               | 수동 `/${locale}/...` prefix 제거, next-intl이 자동 처리                  |
| **중앙화된 Navigation 모듈**       | `@/i18n/navigation`에서 `Link`, `useRouter`, `redirect` 등 export         |
| **Locale 전환은 router 옵션 사용** | 문자열 치환 대신 `router.replace(pathname, { locale })`                   |

### 공식 권장 구조

```
src/i18n/
├── routing.ts      # defineRouting() - locale 설정
├── navigation.ts   # createNavigation() - Link, useRouter 등 export
└── request.ts      # getRequestConfig() - 서버 요청 설정
```

### 최신 문서 참조 방법

구현 시 **최신 next-intl 문서를 반드시 확인**하세요:

```bash
# Context7 MCP를 통한 최신 문서 조회
mcp__context7__get-library-docs(
  context7CompatibleLibraryID: "/amannn/next-intl",
  topic: "navigation createNavigation Link useRouter"
)
```

**주요 참조 문서:**

- [Routing Setup](https://next-intl.dev/docs/routing/setup) - 라우팅 기본 설정
- [Navigation APIs](https://next-intl.dev/docs/routing/navigation) - Link, useRouter, redirect 사용법
- [App Router Getting Started](https://next-intl.dev/docs/getting-started/app-router) - App Router 통합 가이드

---

## 1. Current Problems Analysis

| Problem                                 | Description                                                                        | Impact                                   |
| --------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------- |
| **Hardcoded URLs**                      | 30+ occurrences of inline URL strings like `` `/${locale}/interview-prep/${id}` `` | High maintenance cost when routes change |
| **Manual locale handling**              | Every navigation requires `/${locale}/...` prefix                                  | Code duplication, error-prone            |
| **Unused next-intl features**           | `createNavigation` not utilized despite next-intl being installed                  | Missing built-in locale handling         |
| **No central route management**         | No helper functions or constants for routes                                        | Difficult refactoring, no type safety    |
| **Inconsistent patterns**               | Mix of `router.push()` and `<Link>` with different URL construction                | Maintenance burden                       |
| **Duplicate type definitions**          | `Locale` type defined in both `i18n.config.ts` and `routing.ts`                    | Potential inconsistency, confusion       |
| **Shared components using native Link** | `LinkButton` uses `next/link` directly, bypassing locale handling                  | Locale bugs in reusable components       |

### Current URL Patterns Found

1. **Dashboard navigation:** `router.push(\`/${locale}/dashboard\`)`
2. **Single dynamic param:** `router.push(\`/${locale}/interview-prep/${id}\`)`
3. **Nested dynamic params:** `router.push(\`/${locale}/interview-prep/${id}/career/${experienceId}\`)`
4. **Query parameters:** `\`/${locale}/...?keyAchievementId=${achievementId}\``
5. **Language toggle (string manipulation):** `pathname.replace(/^\/[a-z]{2}/, '')`

---

## 2. Affected Files

### Shared UI Components (1 file) ⚠️ CRITICAL

| File                                       | Usage Type | Note                                 |
| ------------------------------------------ | ---------- | ------------------------------------ |
| `src/components/ui/custom/link-button.tsx` | `<Link>`   | **Critical:** Used across many pages |

### Sidebar Components (4 files)

- `src/components/layout/AppSidebar.tsx` - `router.push`, `<Link>`, language toggle, active state
- `src/components/layout/sidebar/recent-preparations/PreparationSidebarItem.tsx`
- `src/components/layout/sidebar/recent-preparations/ExperienceSidebarItem.tsx`
- `src/components/layout/sidebar/recent-preparations/KeyAchievementSidebarItem.tsx`

### Dashboard Components (3 files)

- `src/app/[locale]/(protected)/dashboard/_components/DashboardContent.tsx`
- `src/app/[locale]/(protected)/dashboard/_components/NewPreparationButton.tsx`
- `src/app/[locale]/(protected)/dashboard/_components/EmptyDashboard.tsx`

### Interview Prep Components (6 files)

- `src/app/[locale]/(protected)/interview-prep/new/_components/InterviewCreationFlow.tsx`
- `src/app/[locale]/(protected)/interview-prep/new/_components/BackToDashboardButton.tsx`
- `src/app/[locale]/(protected)/interview-prep/[id]/_components/InterviewPrepDetail.tsx`
- `src/app/[locale]/(protected)/interview-prep/[id]/_components/ExperienceTimeline.tsx`
- `src/app/[locale]/(protected)/interview-prep/[id]/[experienceType]/[experienceId]/_components/QuestionList.tsx`
- `src/app/[locale]/(protected)/interview-prep/[id]/[experienceType]/[experienceId]/questions/_components/Questions.tsx`

### Common/Public Components (3 files)

- `src/components/common/LanguageToggle.tsx` - language toggle with string manipulation
- `src/app/[locale]/(public)/_components/LandingHeader.tsx`
- `src/app/[locale]/(public)/_components/HeroContent.tsx`

**Total: 17 files, 24+ URL occurrences**

---

## 3. Refactoring Strategy

### Phase 1: Infrastructure Setup

#### 1.1 Create `src/i18n/navigation.ts`

- Use `createNavigation(routing)` to export locale-aware:
  - `Link` - locale-aware link component
  - `useRouter` - programmatic navigation with locale support
  - `usePathname` - returns pathname without locale prefix
  - `redirect` - server-side redirect
  - `permanentRedirect` - permanent server-side redirect (301)
  - `getPathname` - get localized pathname for a route
- Re-export `Locale` type from `routing.ts`

#### 1.2 Update `src/i18n/routing.ts`

- Export `Locale` type as single source of truth

#### 1.3 Create `src/lib/routes.ts` (Minimal)

URL 중앙화를 위한 단순한 route 상수. Over-engineering 없이 필요한 것만:

```typescript
// src/lib/routes.ts
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
  settings: '/settings',
  help: '/help',
} as const
```

**사용:**

```typescript
import { routes } from '@/lib/routes';
import { Link, useRouter } from '@/i18n/navigation';

// 기본 네비게이션
<Link href={routes.dashboard}>Dashboard</Link>
<Link href={routes.interviewPrep.detail(id)}>View</Link>
router.push(routes.interviewPrep.experience(id, 'career', expId));

// Query parameters가 있는 경우
router.push({
  pathname: routes.interviewPrep.experience(id, 'career', expId),
  query: { keyAchievementId: achievementId }
});

// Link with query
<Link
  href={{
    pathname: routes.interviewPrep.detail(id),
    query: { tab: 'questions' }
  }}
>
  View Questions
</Link>
```

> **원칙:** `routes.ts`는 pathname만 반환. Query는 호출 시 별도 전달.
> next-intl의 `{ pathname, query }` 객체 지원을 활용.

**❌ 하지 않는 것:**

- 타입 제네릭 복잡하게 만들기
- route validation 로직
- 별도 라이브러리 (`next-safe-navigation` 등) 도입

~~#### 1.4 Create `src/lib/url.ts`~~ ❌ REMOVED

> next-intl useRouter가 query 지원: `router.push({ pathname, query: { foo: 'bar' } })`

### Phase 2: Component Migration

#### 2.1 Migration Pattern (All Components)

| Before                                        | After                                           |
| --------------------------------------------- | ----------------------------------------------- |
| `import Link from 'next/link'`                | `import { Link } from '@/i18n/navigation'`      |
| `import { useRouter } from 'next/navigation'` | `import { useRouter } from '@/i18n/navigation'` |
| `` `/${locale}/dashboard` ``                  | `routes.dashboard`                              |
| `` `/${locale}/interview-prep/${id}` ``       | `routes.interviewPrep.detail(id)`               |
| `useLocale()` for URL construction            | Remove (no longer needed)                       |

#### 2.1.1 Dynamic Routes with Parameters

> **✅ This project does NOT use `pathnames` configuration.**
> Use simple string paths for all navigation.

```typescript
// Simple string paths (this project's pattern)
router.push('/users/12');
router.push('/interview-prep/abc123');
router.push('/interview-prep/prep1/career/exp1');

<Link href="/interview-prep/abc123">View</Link>
<Link href={`/interview-prep/${id}/career/${experienceId}`}>View</Link>
```

<details>
<summary>📚 Reference: If using <code>pathnames</code> config (NOT applicable to this project)</summary>

The `pathnames` setting enables localized URLs (e.g., `/en/about` → `/de/über-uns`).
When enabled, you must use object syntax with params:

```typescript
// Only needed if pathnames config exists in routing.ts
router.push({
  pathname: '/users/[userId]',
  params: { userId: '12' },
})
```

**When to consider `pathnames`:**

- SEO-critical public pages needing localized URLs
- Marketing sites with language-specific slugs

**This project doesn't need it because:**

- Most pages are protected (login required)
- SEO is not critical for dashboard/interview-prep pages
- Simpler codebase for MVP phase

</details>

#### 2.2 LinkButton Migration ⚠️ CRITICAL FIRST

`link-button.tsx`가 `next/link`를 직접 사용 중. `@/i18n/navigation`의 `Link`로 교체 필요.

- 이 컴포넌트는 여러 페이지에서 재사용되므로 먼저 마이그레이션해야 함
- 마이그레이션 후 모든 사용처가 자동으로 locale 처리 혜택을 받음

#### 2.3 Language Toggle Migration ⚠️ IMPORTANT

**현재 문제 (`LanguageToggle.tsx`, `AppSidebar.tsx`):**

- 문자열 치환 기반: `pathname.replace(/^\/[a-z]{2}/, '')`
- 취약하고 오류 발생 가능

**해결책:**

- `@/i18n/navigation`에서 `useRouter`, `usePathname` import
- `router.replace(pathname, { locale: newLocale })` 사용
- next-intl이 locale 전환을 안전하게 처리

**구현 패턴 (이 프로젝트용):**

```typescript
'use client';

import { usePathname, useRouter } from '@/i18n/navigation';

export function LanguageToggle() {
  const pathname = usePathname();
  const router = useRouter();

  const switchLocale = (newLocale: 'ko' | 'en') => {
    // Simple - no params needed since we don't use pathnames config
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <button onClick={() => switchLocale('ko')}>한국어</button>
  );
}
```

#### 2.4 Active State Simplification ⚠️ BEHAVIOR CHANGE

**현재 (`AppSidebar.tsx:104`):**

```typescript
const isActive = pathname === `/${locale}${item.href}`
```

**변경 후:**

- `@/i18n/navigation`의 `usePathname()`은 locale prefix 없이 경로 반환
- 예: 실제 `/ko/dashboard` → 반환값 `/dashboard`
- 따라서 `pathname === item.href`로 단순화 가능

**⚠️ 주의:** 이것은 동작 변경임. `usePathname()`이 전체 경로를 반환한다고 가정하는 코드는 모두 업데이트 필요.

### Phase 3: Server Component Patterns

| Location                        | Import From         | Locale Handling |
| ------------------------------- | ------------------- | --------------- |
| `app/[locale]/**/*.tsx` (pages) | `@/i18n/navigation` | Automatic       |
| Server Actions                  | `@/i18n/navigation` | Automatic       |
| `app/page.tsx` (root)           | `next/navigation`   | Manual          |

### Phase 3: Type Import 통일 (Optional)

`Locale` 타입을 `@/i18n/navigation`에서 import하도록 통일. 기존 `i18n.config.ts`는 유지해도 무방.

### Phase 3: ESLint Import Guard (권장)

실수 방지를 위해 `next/link`, `next/navigation` 직접 import를 금지:

```javascript
// eslint.config.mjs (또는 .eslintrc.js)
{
  rules: {
    'no-restricted-imports': ['error', {
      paths: [
        {
          name: 'next/link',
          message: 'Use Link from @/i18n/navigation instead.'
        },
        {
          name: 'next/navigation',
          importNames: ['useRouter', 'usePathname', 'redirect'],
          message: 'Use from @/i18n/navigation instead.'
        }
      ]
    }]
  }
}
```

> **예외:** `app/page.tsx` (root redirect)에서는 `next/navigation` 사용 필요. `// eslint-disable-next-line` 사용.

---

## 4. Migration Checklist (Simplified)

### Step 1: Infrastructure (20분)

- [ ] Create `src/i18n/navigation.ts` (5줄)
- [ ] Create `src/lib/routes.ts` (route 상수)
- [ ] Export `Locale` type from `routing.ts`
- [ ] Add ESLint `no-restricted-imports` rule
- [ ] Run `pnpm type-check` + `pnpm lint`

### Step 2: Component Migration (1-2시간)

**Shared Components (먼저):**

- [ ] `link-button.tsx` - `next/link` → `@/i18n/navigation`

**Language Toggle (핵심):**

- [ ] `LanguageToggle.tsx` - regex 제거, `router.replace(pathname, { locale })` 사용
- [ ] `AppSidebar.tsx` - 동일 패턴 적용, active state 단순화

**나머지 컴포넌트 (import만 변경):**

- [ ] Sidebar components (3개)
- [ ] Dashboard components (3개)
- [ ] Interview-prep components (6개)
- [ ] Public components (2개)

### Step 3: Validation (15분)

- [ ] `pnpm check-all`
- [ ] 브라우저에서 수동 테스트: 네비게이션, 언어 전환, active state

---

## 5. Expected Benefits

| Metric                 | Before                             | After                                    |
| ---------------------- | ---------------------------------- | ---------------------------------------- |
| **URL 변경 시**        | 17개 파일 수정                     | `routes.ts` 1개 파일만 수정              |
| **Locale handling**    | Manual `/${locale}/...` everywhere | Automatic via next-intl                  |
| **Language toggle**    | Fragile regex-based                | Robust `router.replace(..., { locale })` |
| **Active state logic** | Complex locale prefix comparison   | Simple `pathname === href`               |
| **타입 안전성**        | 문자열 리터럴 (오타 가능)          | 함수 호출 (자동완성, 컴파일 체크)        |
| **Bug potential**      | High (locale mismatch, 오타)       | Low (consistent API, 타입 체크)          |

---

~~## 6. Rollback Plan~~ ❌ REMOVED (기본 git 사용법)

~~## 7. Future Considerations~~ ❌ REMOVED (MVP에서 불필요)

---

## Change History

| Date       | Version | Changes                                                                                                                                                                                                                 |
| ---------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2025-12-12 | v1.0    | Initial document                                                                                                                                                                                                        |
| 2025-12-12 | v1.1    | Added `buildUrl` utility                                                                                                                                                                                                |
| 2025-12-12 | v1.2    | Added Server Component redirect pattern                                                                                                                                                                                 |
| 2025-12-29 | v2.0    | Added: LinkButton migration, Language toggle pattern, Active state simplification, Type consolidation, ESLint rules                                                                                                     |
| 2025-12-29 | v2.1    | Added: next-intl App Router Best Practice section, Context7 MCP reference guide                                                                                                                                         |
| 2025-12-29 | v2.2    | Refined based on Context7 next-intl docs review: Added `permanentRedirect` to exports, Dynamic params patterns for `pathnames` config, `buildUrl` reassessment note, Language toggle implementation pattern with params |
| 2025-12-29 | v2.3    | Simplified: Confirmed this project does NOT use `pathnames` config. Removed complex params patterns, simplified Language Toggle. Added collapsible reference for `pathnames` (future reference only)                    |
| 2025-12-29 | v3.0    | **Major simplification:** Removed `routes.ts`, `url.ts`, Rollback Plan, Future Considerations. Consolidated 8 phases → 3 steps. Focus on essential: navigation.ts + import changes                                      |
| 2025-12-29 | v3.1    | Re-added ESLint `no-restricted-imports` rule for mistake prevention (practical need, not over-engineering)                                                                                                              |
| 2025-12-29 | v3.2    | Re-added minimal `routes.ts` for URL centralization. Both goals achieved: locale auto-handling + URL centralization                                                                                                     |
| 2025-12-29 | v3.3    | Added query parameter handling pattern with `{ pathname, query }` syntax                                                                                                                                                |
