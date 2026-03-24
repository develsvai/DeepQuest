# Deep Quest - AI Interview Coaching Service

## Project Purpose

AI-powered technical interview coaching service for software developers. The system provides personalized interview preparation through:

- Resume analysis and job description parsing
- Hyper-personalized technical question generation
- Real-time answer feedback with structured assessment
- Adaptive follow-up questions to test knowledge depth
- Support for multiple concurrent interview preparations

## Target Users

- Software developers with 0-5 years experience
- Job seekers preparing for technical interviews
- Developers wanting to validate and improve their technical knowledge depth
- Korean and international job market candidates

## Key Features (MVP)

### Core Functionality

- **Resume Management**: Upload and parse PDF/DOCX resumes using STAR methodology
- **Job Analysis**: Parse job descriptions from URL or text input
- **Question Generation**: AI-generated questions based on resume + job requirements
- **Answer Evaluation**: Real-time feedback with DEEP/INTERMEDIATE/SURFACE ratings
- **Adaptive Learning**: Follow-up questions that adapt to user's knowledge level
- **Multi-session Support**: Manage multiple interview preparations simultaneously

### Technical Features

- **Internationalization**: Full Korean/English language support via next-intl
- **Authentication**: Secure OAuth via Clerk (GitHub/Google)
- **Type Safety**: End-to-end type safety with tRPC and Prisma
- **Real-time Updates**: Server-sent events for AI processing feedback
- **File Management**: Secure file upload to Supabase Storage

## Development Approach

### UI-First Strategy (Current Phase)

1. Build complete UI with mock data (Epic 1 - In Progress)
2. Integrate backend services progressively (Epic 2 - Pending)
3. Connect Python LangGraph AI server (Future phase)

### Architecture Philosophy

- **Server Components First**: Maximize SSR, minimize client-side JavaScript
- **Component Reusability**: Generalized, composable components
- **Design System Driven**: Consistent UI via designTokens and shadcn/ui
- **Type-Safe API**: tRPC for end-to-end type safety

## Business Model

Premium subscription service with:

- Free tier: Limited questions per month
- Premium tier: Unlimited questions and advanced AI feedback
- Enterprise tier: Team features and analytics

## Project Status

**Current Phase**: MVP Development - UI Foundation (Epic 1)

- ✅ Project setup and infrastructure
- ✅ Authentication integration (Clerk)
- ✅ Database schema (Prisma + Supabase)
- 🔄 UI component development
- ⏳ Backend API implementation
- ⏳ AI server integration

## Success Metrics

- 5-second response time for AI feedback
- 90%+ user satisfaction with question relevance
- Support for 10+ concurrent users
- Mobile-responsive design for all features
