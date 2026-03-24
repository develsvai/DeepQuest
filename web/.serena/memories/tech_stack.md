# Technology Stack

## Repository Architecture

- **Type**: Monorepo with three main projects
- **Structure**:
  - `web/` - Next.js 15 full-stack application
  - `bmad-core/` - BMAD Method development framework
  - `docs/` - Comprehensive project documentation

## Core Stack (web/)

### Framework & Runtime

- **Next.js 15.4.5** - React framework with App Router
- **React 19.1.0** - UI library
- **TypeScript 5.x** - Type-safe JavaScript (strict mode)
- **Node.js** - JavaScript runtime

### Styling & UI

- **Tailwind CSS v4** - Utility-first CSS framework
- **shadcn/ui** - Headless component library (New York style)
- **Radix UI** - Unstyled, accessible components
- **Lucide React** - Icon library
- **class-variance-authority** - Component variant management
- **tailwind-merge** - Tailwind class merging

### API & Backend

- **tRPC v11.4.4** - End-to-end type-safe APIs
- **Prisma ORM v6.13.0** - Type-safe database client
- **Supabase** - PostgreSQL database & file storage
- **Zod v4.0.17** - Runtime type validation

### Authentication

- **Clerk v6.31.2** - Authentication & user management
- **OAuth Providers**: GitHub, Google
- **Svix** - Webhook signature verification

### State Management

- **Zustand v5.0.7** - Client-side global state
- **TanStack Query v5.85.5** - Server state management (via tRPC)
- **React Hook Form v7.62.0** - Form state management

### Internationalization

- **next-intl v4.3.4** - i18n for Next.js
- **Languages**: Korean (primary), English

### Development Tools

#### Package Management

- **pnpm** - Fast, disk space efficient package manager (REQUIRED)

#### Code Quality

- **ESLint 9** - JavaScript/TypeScript linting
- **Prettier 3.6.2** - Code formatting
- **TypeScript ESLint** - TypeScript-specific linting rules
- **prettier-plugin-tailwindcss** - Tailwind class sorting

#### Build Tools

- **Turbopack** - Fast bundler for development (Next.js built-in)
- **PostCSS** - CSS processing

#### Testing

- **Vitest v3.2.4** - Unit testing framework
- **@types/jsdom** - DOM testing utilities

### External Services

#### Infrastructure

- **Supabase**:
  - PostgreSQL database
  - Realtime subscriptions
  - File storage (resume uploads)
  - Row-level security

#### Deployment & Monitoring

- **Vercel** - Deployment platform (expected)
- **@vercel/analytics** - Web analytics
- **@vercel/speed-insights** - Performance monitoring

#### AI Backend (Separate Service)

- **Python LangGraph** - AI orchestration framework
- **Purpose**: Resume analysis, question generation, feedback
- **Communication**: Webhooks & Server-Sent Events (SSE)

## Version Requirements

### Runtime

- Node.js 18+ (for Next.js 15)
- pnpm 8+ (package manager)

### Browser Support

- Modern browsers with ES2020+ support
- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

## Key Dependencies Breakdown

### Production Dependencies (41 packages)

- **Framework**: Next.js, React, React DOM
- **UI Components**: 15+ Radix UI packages, shadcn/ui setup
- **API Layer**: tRPC client/server, TanStack Query
- **Database**: Prisma Client, Supabase clients
- **Auth**: Clerk SDK and themes
- **Forms**: React Hook Form, Zod validation
- **State**: Zustand
- **Utils**: clsx, tailwind-merge, superjson

### Development Dependencies (18 packages)

- **TypeScript**: Core + type definitions
- **Linting**: ESLint + plugins (React, TypeScript, etc.)
- **Database**: Prisma CLI
- **Styling**: Tailwind CSS, PostCSS
- **Testing**: Vitest
- **Formatting**: Prettier + Tailwind plugin

## Technology Decisions

### Why This Stack?

- **Type Safety**: End-to-end types from database to UI
- **Developer Experience**: Fast feedback loops with Turbopack
- **Performance**: Server Components, edge runtime support
- **Scalability**: Serverless-ready architecture
- **Maintainability**: Strict typing, automated code quality

### Trade-offs

- **Complexity**: Multiple tools require learning curve
- **Bundle Size**: Comprehensive UI library adds weight
- **Lock-in**: Some vendor-specific services (Clerk, Supabase)
