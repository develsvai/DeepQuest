# Codebase Structure Overview

## Repository Structure (Monorepo)

```
deep-quest/
├── .mcp.json              # MCP server configurations
├── .claudeignore          # Claude-specific ignore rules
├── .gitignore             # Git ignore patterns
├── CLAUDE.md              # Claude Code guidance (root)
├── bmad-core/             # BMAD Method development framework
├── docs/                  # Project-wide documentation
│   ├── sharded/          # Organized documentation sections
│   │   ├── prd/          # Product Requirements Document
│   │   └── architecture/ # Technical architecture docs
│   └── web/            # Frontend-specific docs
│       └── rules/        # Development rules & guidelines
└── web/                 # Main Next.js application
```

## Frontend Application Structure (web/)

```
web/
├── CLAUDE.md              # Frontend-specific Claude guidance
├── package.json           # Dependencies and scripts (pnpm only)
├── tsconfig.json          # TypeScript strict mode config
├── eslint.config.mjs      # ESLint configuration
├── next.config.ts         # Next.js 15 configuration
├── tailwind.config.ts     # Tailwind CSS v4 config
├── components.json        # shadcn/ui configuration
├── prisma/
│   ├── schema.prisma      # Database schema definition
│   ├── migrations/        # Database migration history
│   └── seed.ts           # Database seed script
├── public/                # Static assets
│   └── locales/          # Translation files
│       ├── ko/           # Korean translations
│       └── en/           # English translations
└── src/                   # Source code (IMPORTANT: use @/ imports)
    ├── middleware.ts      # Clerk auth middleware
    ├── i18n.config.ts     # Internationalization config
    ├── app/               # Next.js 15 App Router
    │   ├── [locale]/      # Internationalized routes
    │   │   ├── (protected)/ # Auth-required pages
    │   │   ├── (public)/   # Public pages
    │   │   ├── layout.tsx  # Root layout with providers
    │   │   └── page.tsx    # Home page
    │   └── api/           # API routes
    │       ├── trpc/      # tRPC endpoint
    │       └── webhooks/  # Clerk webhooks
    ├── components/
    │   ├── ui/            # shadcn/ui components
    │   ├── design-system/ # Design tokens (core.ts)
    │   └── [feature]/     # Feature-specific components
    ├── server/
    │   └── api/           # tRPC backend
    │       ├── root.ts    # Main router export
    │       ├── trpc.ts    # tRPC setup & middleware
    │       └── routers/   # Feature-based routers
    ├── trpc/              # tRPC client setup
    │   ├── client.ts      # React Query client
    │   └── server.ts      # Server-side client
    ├── lib/               # Utilities and helpers
    │   ├── utils.ts       # Common utilities
    │   ├── clerk.ts       # Clerk configuration
    │   └── supabase/      # Supabase clients
    ├── hooks/             # Custom React hooks
    ├── types/             # TypeScript type definitions
    ├── i18n/              # i18n routing setup
    └── generated/
        └── prisma/        # Generated Prisma Client
```

## Key Directory Purposes

### `/web/src/app/[locale]/`

- **Purpose**: Internationalized routing with Next.js App Router
- **Pattern**: Server Components by default (no "use client" in page.tsx)
- **Structure**:
  - `(protected)/` - Routes requiring authentication
  - `(public)/` - Publicly accessible routes
  - `_components/` - Page-specific components

### `/web/src/components/`

- **ui/**: shadcn/ui base components (managed by CLI)
- **design-system/**: Design tokens and theme configuration
  - `core.ts` - CRITICAL: All color tokens (NEVER hardcode colors)
- **Feature folders**: Reusable feature components

### `/web/src/server/api/`

- **Purpose**: tRPC API implementation
- **Structure**:
  - `trpc.ts` - Context, middleware, procedure builders
  - `root.ts` - Main router aggregation
  - `routers/` - Feature-specific routers (user, interview, question, etc.)

### `/web/prisma/`

- **schema.prisma**: Single source of truth for database schema
- **migrations/**: Version-controlled schema changes
- **Generated client**: Located at `@/generated/prisma`

## Import Conventions

```typescript
// ✅ CORRECT: Absolute imports from src
import { Button } from '@/components/ui/button'
import { designTokens } from '@/components/design-system/core'
import { api } from '@/trpc/server'
import { prisma } from '@/generated/prisma'

// ❌ WRONG: Relative imports
import { Button } from '../../../components/ui/button'
```

## File Naming Conventions

- **Components**: PascalCase (`InterviewCard.tsx`)
- **Files**: kebab-case (`interview-preparation.ts`)
- **Routes**: kebab-case folders (`interview-prep/`)
- **API routers**: camelCase (`interviewRouter.ts`)

## Configuration Files

- **TypeScript**: Strict mode, no `any` types allowed
- **ESLint**: Next.js rules + TypeScript + React hooks
- **Prettier**: Tailwind CSS plugin for class sorting
- **Tailwind**: v4 with custom design tokens
- **shadcn/ui**: New York style, zinc color scheme

## Development Workflow Files

- **CLAUDE.md**: AI assistant instructions (root + web/)
- **.claudeignore**: Exclude generated/build files
- **.mcp.json**: MCP server configurations for enhanced tooling
- **package.json scripts**: All development commands (pnpm only)
