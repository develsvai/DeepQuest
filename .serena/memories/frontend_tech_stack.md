# Frontend Technology Stack

## Core Framework
- **Next.js**: 15.4.5 with App Router (React 19.1.0)
- **TypeScript**: v5 with strict mode enabled
- **Node.js**: >=22.0.0
- **Package Manager**: pnpm >=9.0.0

## API & Data Management
- **tRPC**: v11.5.0 for type-safe API communication
- **React Query**: v5.85.5 (via @tanstack/react-query)
- **Zod**: v4.0.17 for schema validation
- **SuperJSON**: v2.2.2 for data serialization

## Database & Backend
- **Database**: Supabase PostgreSQL
- **ORM**: Prisma v6.16.1
- **Authentication**: Clerk v6.31.2 (GitHub/Google OAuth)

## UI & Styling
- **Styling Framework**: Tailwind CSS v4
- **Component Library**: shadcn/ui (Radix UI primitives)
- **Icons**: lucide-react v0.539.0
- **Animations**: tw-animate-css v1.3.6
- **Theme**: next-themes v0.4.6

## State Management
- **Client State**: Zustand v5.0.7
- **Server State**: React Query (via tRPC)
- **Form State**: react-hook-form v7.62.0

## Internationalization
- **Library**: next-intl v4.3.4
- **Supported Languages**: Korean (default), English
- **Translation Files**: `/locales/{ko,en}/`

## Development Tools
- **Linter**: ESLint v9 with Next.js config
- **Formatter**: Prettier v3.6.2 with Tailwind plugin
- **Testing**: Vitest v3.2.4 with Testing Library
- **Type Checking**: TypeScript compiler

## Key Database Models
- `User` - Authenticated users via Clerk
- `InterviewPreparation` - Interview prep sessions
- `Resume` - Parsed resume with STAR methodology
- `Question` - Generated questions with categories
- `Answer` - User responses
- `Feedback` - AI feedback with DEEP/INTERMEDIATE/SURFACE ratings