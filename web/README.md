# Deep Quest - AI Interview Coaching Service

AI 기반 기술 면접 코칭 서비스의 Next.js 프론트엔드 애플리케이션입니다.

## 📋 Overview

Deep Quest는 개발자의 이력서와 목표 직무를 분석하여 맞춤형 기술 면접 질문을 생성하고, AI 피드백을 통해 면접 준비를 돕는 서비스입니다.

### 주요 기능

- 📄 이력서 기반 맞춤형 질문 생성
- 🎯 직무별 특화 면접 준비
- 💬 AI 피드백 및 후속 질문
- 🌏 한국어/영어 다국어 지원
- 📊 면접 준비 진행 상황 대시보드

## 🛠 Tech Stack

- **Framework**: Next.js 15.4.5 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **API**: tRPC v11.4.4
- **Database**: PostgreSQL (Supabase) + Prisma ORM v6.13.0
- **Authentication**: Clerk
- **State Management**: Zustand v5.0.7
- **Internationalization**: next-intl

## 📁 Project Structure

```
src/
├── app/                  # Next.js App Router
│   ├── [locale]/        # Internationalized routes
│   │   ├── (protected)/ # Auth-required pages
│   │   └── (public)/    # Public pages
│   └── api/             # API routes (tRPC, webhooks)
├── components/
│   ├── ui/              # shadcn/ui components
│   └── design-system/   # Design tokens
├── server/
│   └── api/             # tRPC routers and procedures
├── lib/                 # Utilities and helpers
├── hooks/               # Custom React hooks
└── generated/
    └── prisma/          # Generated Prisma Client
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm 9+
- PostgreSQL database (Supabase)

### Installation

```bash
# Install dependencies (MUST use pnpm)
pnpm install
```

### Development Commands

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Code quality checks
pnpm check-all         # Run all checks
pnpm type-check        # TypeScript checking
pnpm lint              # ESLint
pnpm format            # Format with Prettier

# Database management
pnpm db:generate   # Generate Prisma Client
pnpm db:migrate    # Run migrations
pnpm db:studio     # Open Prisma Studio
```

### Environment Setup

환경 변수 설정이 필요합니다. 프로젝트 실행을 위한 환경 변수는 관리자에게 문의해 주세요.

Required environment variables:

- `DATABASE_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 📸 Screenshots

<details>
<summary>주요 화면 미리보기</summary>

### Dashboard

사용자의 면접 준비 현황을 한눈에 볼 수 있는 대시보드

![Dashboard](./docs/pages/en/dashboard.png)

### Interview Preparation Flow

#### Step 1: 채용 공고 분석

회사명, 직무, JD 입력

![Interview Prep Step 1](./docs/pages/en/interview-prep-new-step1.png)

#### Step 2: 이력서 업로드

PDF/DOCX 파일 지원

![Interview Prep Step 2](./docs/pages/en/interview-prep-new-step2.png)

### Interview Preparation Detail

면접 준비 상세 페이지 - 직무 설명, 후보자 프로필, 연습 통계

![Interview Prep Detail](./docs/pages/en/interview-prep-detail.png)

### Practice Session

#### Career Experience Questions

경력별 맞춤 질문 리스트 (Deep/Intermediate/Surface 카테고리)

![Career Experience Questions](./docs/pages/en/interview-prep-career-experience.png)

#### Answer & AI Feedback

답변 작성 및 AI 피드백 (점수, 강점, 개선점, 제안사항)

![Question Answer Feedback](./docs/pages/en/interview-prep-question-answer-feedback.png)

#### Follow-up Questions

사용자 답변 기반 AI 생성 후속 질문

![Follow-up Questions](./docs/pages/en/interview-prep-follow-up-questions.png)

</details>

## 🔧 Development Guidelines

### Code Quality Standards

- **TypeScript**: Strict mode enabled
- **Components**: Server Components 우선, 필요시에만 Client Components 사용
- **Styling**: Design tokens 사용 필수 (`@/components/design-system/core.ts`)
- **State**: Zustand (client), React Query via tRPC (server)

### Pre-commit Checklist

- ✅ `pnpm check-all` 통과
- ✅ 모든 테스트 통과
- ✅ Design system 준수
- ✅ TypeScript strict mode 준수

## 📚 Documentation

프로젝트의 상세 문서는 다음 위치에서 확인할 수 있습니다:

- **Product Requirements**: `docs/project/prd/`
- **Architecture**: `docs/project/architecture/`
- **Development Rules**: `docs/rules/`
- **UI Screenshots**: `docs/pages/`

## 📐 Development Rules & Guidelines

프로젝트의 일관성과 품질을 보장하기 위한 체계적인 개발 규칙이 정의되어 있습니다.

### 규칙 구조 (관심사 분리)

#### 🎨 View Development (`docs/rules/view/`)

- **컴포넌트 아키텍처**: React 컴포넌트 설계 원칙 (SRP, SoC, Composition)
- **디자인 시스템**: 토큰 기반 일관된 스타일링
- **패턴 & 성능**: React 패턴과 Next.js 최적화
- **shadcn/ui 통합**: 컴포넌트 확장 패턴

#### 🔧 Backend Development (`docs/rules/backend/`)

- **API 설계**: tRPC 기반 타입 안전한 API
- **데이터베이스**: Supabase SSR 통합
- **데이터 페칭**: 서버/클라이언트 전략

#### 🔗 Common Development (`docs/rules/common/`)

- **TypeScript**: 하이브리드 타입 전략, strict mode
- **코드 품질**: 필수 `pnpm check-all` 실행
- **상태 관리**: Zustand, React Query, Context 전략

### 적용 프로세스

새로운 기능 개발 시:

1. 관련 규칙 문서 확인 (`docs/rules/`)
2. 규칙에 따라 구현
3. `pnpm check-all` 실행 (필수)
4. AI 에이전트로 코드 리뷰

## 🤖 AI-Powered Development Workflow

이 프로젝트는 Claude Code의 AI 에이전트를 활용한 **AI Feedback Loop** 개발 방식을 채택하고 있습니다.

### AI Agent Architecture

`.claude/agents/` 디렉토리에 특화된 AI 에이전트들이 정의되어 있습니다:

#### Development Agents

- **nextjs-front-dev**: React 컴포넌트 개발, shadcn/ui 통합, 성능 최적화
- **nextjs-backend-dev**: tRPC API 개발, 데이터베이스 연동

#### Reviewer Agents (자동 코드 리뷰)

- **nextjs-component-reviewer**: 컴포넌트 아키텍처 검증
- **react-patterns-reviewer**: React 패턴 및 hooks 최적화 검토
- **typescript-reviewer**: TypeScript strict mode 준수 확인
- **design-system-reviewer**: 디자인 토큰 사용 검증
- **trpc-api-reviewer**: API 패턴 및 타입 안전성 검토

#### 특수 목적 Agents

- **ascii-web-designer**: UI 와이어프레임 설계
- **playwright-e2e-reviewer**: 실시간 브라우저 테스트

### AI Feedback Loop 프로세스

```mermaid
graph LR
    A[개발 요구사항] --> B[Dev Agent 구현]
    B --> C[Reviewer Agents 검토]
    C --> D{규칙 준수?}
    D -->|No| E[피드백 및 개선]
    E --> B
    D -->|Yes| F[코드 완성]
```

1. **규칙 기반 개발**: 모든 에이전트는 `docs/rules/`의 규칙을 엄격히 준수
2. **자동 검증**: Reviewer 에이전트가 규칙 준수 여부를 자동으로 검토
3. **반복 개선**: 피드백을 통한 지속적인 코드 품질 향상

### 사용 예시

```bash
# Claude Code에서 컴포넌트 개발
"새로운 UserProfile 컴포넌트 생성해줘"
→ nextjs-front-dev 에이전트가 규칙에 따라 구현
→ nextjs-component-reviewer가 자동으로 검토
→ 피드백에 따라 개선

# API 엔드포인트 개발
"사용자 목록 조회 API 만들어줘"
→ nextjs-backend-dev 에이전트가 tRPC 패턴 적용
→ trpc-api-reviewer가 타입 안전성 검증
```

## 🌐 Internationalization

한국어와 영어를 지원합니다. 번역 파일은 `locales/` 디렉토리에 위치합니다.

```
locales/
├── ko/    # Korean translations
└── en/    # English translations
```

## 📄 Status

현재 개발 중 (Development Phase)

---

For more information or access to environment variables, please contact the project administrator.
