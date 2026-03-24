---
paths: src/server/**
---

# Deep Quest Backend Guide

This file provides guidance to Claude Code when working with backend code.

## Development Commands

```bash
# Database (Prisma)
pnpm db:generate       # Generate Prisma Client
pnpm db:migrate        # Create and apply migration (interactive)
pnpm db:migrate:create # Create migration file only
pnpm db:migrate:deploy # Deploy migrations to production
pnpm db:migrate:reset  # Reset DB and rerun migrations (dev only)
pnpm db:pull           # Pull schema from Supabase
pnpm db:studio         # Open Prisma Studio GUI
pnpm db:seed           # Seed database
pnpm db:validate       # Validate schema.prisma syntax
pnpm db:format         # Format schema.prisma

# Code Quality (REQUIRED after code changes)
pnpm check-all         # Run type-check, lint, and format check
```

## Architecture Overview

### Technology Stack

- **API**: tRPC v11.7.2 with TanStack React Query v5.90
- **Database**: PostgreSQL (Supabase) with Prisma ORM v7.0.1
- **Authentication**: Clerk (GitHub/Google OAuth)
- **Monitoring**: Sentry (error tracking & performance)

### Directory Structure

```
src/server/
├── api/
│   ├── root.ts        # Root router
│   ├── trpc.ts        # tRPC context and middleware
│   └── routers/       # Feature-based routers with schemas
├── services/          # Business logic layer
│   ├── ai/            # LangGraph integration
│   ├── experience/    # Experience-related services
│   └── common/        # Shared utilities (errors, handlers)
├── lib/
│   ├── schemas/       # Shared Zod schemas
│   └── db/            # Database utilities
└── generated/
    └── prisma/        # Generated Prisma Client (v7)
```

## Critical Development Rules

### API Development (tRPC)

- **Use protectedProcedure** for authenticated endpoints
- **Define schemas with Zod** for runtime validation
- **Type-safe by default** - leverage tRPC's type inference
- **Router organization**: Feature-based routing structure

### Database Operations

- **Prisma Client location**: `@/generated/prisma`
- **Always regenerate** after schema changes: `pnpm db:generate`
- **Migration workflow**: Create → Review → Deploy
- **Type safety**: Use generated Prisma types

### Prisma Generated Types (One Source of Truth)

- **ALWAYS reuse Prisma enums** - import from `@/generated/prisma`, never redefine
- **Example**: Use `ImportanceLevel.HIGH` instead of `'HIGH'` string literal
- **Zod schemas**: Use `z.enum([EnumName.VALUE1, EnumName.VALUE2])` for Prisma enums
- **Re-export if needed**: `export type { EnumName }` in utility files
- **Benefits**: Single source of truth, refactoring safety, compile-time validation

## tRPC Endpoint Pattern

```typescript
// server/api/routers/example.ts
export const exampleRouter = router({
  getItems: protectedProcedure
    .input(z.object({ limit: z.number() }))
    .query(async ({ ctx, input }) => {
      // Implementation
    }),
})
```

## Production Deployment Environment

### Infrastructure Overview

- **Frontend Hosting**: Vercel Hobby Plan
  - Automatic deployments from Git
  - Edge Runtime optimizations
  - Global CDN distribution
  - Serverless Functions for API routes
- **Domain Management**: Cloudflare
  - DNS configuration
  - SSL/TLS termination
  - CDN and security features
- **Database**: Supabase (Production)
  - PostgreSQL with real-time features
  - Built-in authentication (integrated with Clerk)
  - Row Level Security (RLS) policies
- **Authentication**: Clerk (Production Mode)
  - GitHub/Google OAuth integration
  - User management and session handling
  - Webhook integration with Supabase
- **AI Server**: LangGraph Platform
  - Managed LangGraph deployment
  - Scalable AI processing
  - Integration via HTTP APIs

### Deployment Considerations

When answering questions about production, deployment, or environment-specific issues, consider:

- **Vercel Limitations**: Hobby plan restrictions (bandwidth, function execution time, build minutes)
- **Serverless Architecture**: Cold starts, stateless functions, edge runtime compatibility
- **Edge Deployment**: Geographic distribution and edge-specific optimizations
- **Environment Isolation**: Separate production/development database instances
- **SSL/Security**: Cloudflare SSL termination and security policies
- **Scalability**: Auto-scaling serverless functions and database connection pooling

### Environment-Specific Debugging

- Use Vercel Analytics and logs for production issues
- Supabase dashboard for database monitoring
- Clerk dashboard for authentication issues
- LangGraph Platform logs for AI server debugging
- Cloudflare analytics for domain/CDN issues

## Environment Variables

Required in `.env.local`:

```
DATABASE_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Common Tasks

### Creating tRPC Endpoint

1. Define Zod schemas for input/output
2. Add procedure to appropriate router in `server/api/routers/`
3. Use `protectedProcedure` for auth-required endpoints
4. Export from `server/api/root.ts`

### Database Schema Changes

1. Edit `prisma/schema.prisma`
2. Run `pnpm db:migrate dev --name descriptive-name`
3. Run `pnpm db:generate`
4. Update seed data if needed

## Key Documentation References

- **API Patterns**: `/docs/rules/backend/api/` - tRPC rules and patterns
- **Sentry Logging**: `/docs/rules/backend/logging/sentry-logging.md`
- **Server Architecture**: @server-architecture.md
- **Schema Organization**: @schema-organization.md
