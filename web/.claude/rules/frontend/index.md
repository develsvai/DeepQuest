---
paths: src/app/**, src/components/**
---
# Deep Quest Frontend Guide

This file provides guidance to Claude Code when working with frontend code.

## Project Overview

**Deep Quest Frontend** - Next.js 16 application for AI-powered technical interview coaching service. Built with TypeScript, tRPC, Prisma, and Supabase.

## Development Commands

```bash
# Install dependencies (REQUIRED: use pnpm only)
pnpm install

# Development
pnpm dev                # Start dev server with Turbopack (port 3000)
pnpm build             # Build for production
pnpm start             # Start production server

# Code Quality (REQUIRED after code changes)
pnpm check-all         # Run type-check, lint, and format check
pnpm type-check        # TypeScript type checking
pnpm lint              # ESLint
pnpm lint:fix          # Fix ESLint issues
pnpm format            # Format with Prettier
pnpm format:check      # Check formatting

# Testing (Vitest)
pnpm test              # Run tests in watch mode
pnpm test:watch        # Run tests with file watcher
pnpm test:ui           # Open Vitest UI for interactive debugging
pnpm test:coverage     # Generate test coverage report
pnpm test:run          # Run tests once (CI mode)
```

## Architecture Overview

### Technology Stack

- **Framework**: Next.js 16.0.10 (App Router)
- **Language**: TypeScript 5.9.3 (strict mode)
- **React**: 19.2.0 with React Compiler
- **Styling**: Tailwind CSS v4.1.17 + shadcn/ui components
- **State**: Zustand v5.0.8 (client), React Query via tRPC (server)
- **i18n**: next-intl v4.5.5 (Korean/English)
- **Testing**: Vitest v4.0.14 + Testing Library
- **Monitoring**: Sentry (error tracking & performance)

### Directory Structure

```
src/
├── app/                  # Next.js App Router
│   ├── [locale]/        # Internationalized routes
│   │   ├── (protected)/ # Auth-required pages
│   │   └── (public)/    # Public pages
│   └── api/             # API routes (tRPC, webhooks, langgraph)
├── components/
│   ├── ui/              # shadcn/ui components (~46 components)
│   ├── ui/custom/       # Custom UI components
│   ├── design-system/   # Design tokens (core.ts)
│   ├── layout/          # Layout components (sidebar, etc.)
│   ├── providers/       # React context providers
│   └── common/          # Shared components
├── hooks/               # Custom React hooks
├── types/               # Centralized type definitions
├── i18n/                # i18n configuration
└── test/                # Test setup and utilities
```

## Critical Development Rules

### Component Architecture

- **Create separate client components** when client-side functionality needed
- **Maximize componentization** - keep files short and focused
- **Search for existing components first** before creating new ones
- **Generalize components** for reusability

### Design System Compliance

- **NEVER use raw HTML tags** (`<div>`, `<span>`, etc.) - use design system components
- **NEVER use hardcoded colors** - only use `designTokens` from `/src/components/design-system/core.ts`
- **ALWAYS import and use** `designTokens.colors.*` for all styling
- **Use shadcn/ui components** as foundation for all UI

### Code Quality Requirements

- **ALWAYS run `pnpm check-all`** after any code changes
- **TypeScript strict mode** - no `any` types allowed
- **Required JSDoc** for public APIs and components
- **File naming**: kebab-case for files, PascalCase for components
- **Absolute imports**: Use `@/` prefix for src imports

## Component Development Patterns

### Server vs Client Components

```typescript
// ✅ Server Component (default)
// app/[locale]/(protected)/dashboard/page.tsx
export default async function DashboardPage() {
  const data = await fetchData(); // Direct data fetching
  return <PageContainer>{/* ... */}</PageContainer>;
}

// ✅ Client Component (when needed)
// components/interactive-feature.tsx
"use client";
export function InteractiveFeature() {
  const [state, setState] = useState();
  return <Card>{/* ... */}</Card>;
}
```

## Common Tasks

### Adding New Page

1. Create in `app/[locale]/(protected|public)/route-name/page.tsx`
2. Add `_components` folder for page-specific components
3. Add translations to `locales/{ko,en}/`
4. Use server components by default

## Testing & Quality

### Testing with Vitest

- **Framework**: Vitest v4.0.14 with JSDOM environment
- **Test location**: Alongside implementation files in `__tests__/` folders
- **Setup file**: `src/test/setup.ts`

```typescript
// Example test file: src/lib/utils/__tests__/example.test.ts
import { describe, it, expect } from 'vitest'
import { myFunction } from '../example'

describe('myFunction', () => {
  it('should work correctly', () => {
    expect(myFunction()).toBe(true)
  })
})
```

### Pre-commit Checklist

- ✅ Run `pnpm check-all` (type-check + lint + format)
- ✅ Run `pnpm test:run` for affected tests
- ✅ Verify no hardcoded colors or raw HTML
- ✅ Check component reusability
- ✅ Ensure proper error handling

### Performance Considerations

- Prefer Server Components (no "use client" unless required)
- Use dynamic imports for heavy client components
- Implement loading.tsx with skeleton loaders
- Optimize images with Next.js Image component
- Use React.memo() sparingly and only when measured

## Key Documentation References

- **Development Rules**: `/docs/rules/index.md`
- **Component Patterns**: `/docs/rules/view/components/`
- **TypeScript Rules**: `/docs/rules/common/typescript/typing.md`
- **App Router Patterns**: @app-router.md
- **Navigation & Routing**: @navigation.md
- **i18n Rules**: @i18n.md
- **Zod i18n**: @zod-i18n.md
