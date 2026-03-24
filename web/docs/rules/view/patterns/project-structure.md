# Next.js App Router Project Structure

## Overview

이 문서는 Next.js App Router에서 기능/도메인별 코드 구성을 통해 응집성을 높이는 디렉토리 구조 패턴을 정의합니다.

## 기능/도메인별 코드 구성

**규칙:** 디렉토리를 코드 유형이 아닌 기능/도메인별로 구성하세요.

**이유:**

- 관련 파일을 함께 유지하여 응집성을 높입니다.
- 기능 이해, 개발, 유지보수 및 삭제를 단순화합니다.

## 권장 App Router 구조

```
/src
|-- /app
|   |-- /[locale]
|   |   |-- (public)
|   |   |   |-- layout.tsx
|   |   |   |-- page.tsx
|   |   |   |-- sign-in/
|   |   |   |   |-- [[...sign-in]]/        # Clerk sign-in component
|   |   |   |   |-- page.tsx
|   |   |   |-- sign-up/
|   |   |   |   |-- [[...sign-up]]/        # Clerk sign-up component
|   |   |   |   |-- page.tsx
|   |   `-- (protected)
|   |       |-- layout.tsx
|   |       |-- /dashboard
|   |       |   |-- _components/
|   |       |   |   `-- MetricCard.tsx
|   |       |   |-- hooks/
|   |       |   |   `-- useDashboard.ts
|   |       |   `-- page.tsx
|   |       `-- /interview-prep
|   |           |-- /new
|   |           |   |-- _components/
|   |           |   |   `-- NewPrepForm.tsx
|   |           |   |-- hooks/
|   |           |   |   `-- useCreatePrep.ts
|   |           |   `-- page.tsx
|   |           `-- /[id]
|   |               |-- _components/
|   |               |   `-- PrepSessionDetails.tsx
|   |               |-- hooks/
|   |               |   `-- usePrepSession.ts
|   |               |-- page.tsx
|   |               |-- /[experienceType]
|   |                   |-- /[experienceId]
|   |                       |-- _components/
|   |                       |   `-- QuestionList.tsx
|   |                       |-- hooks/
|   |                       |   `-- useQuestionList.ts
|   |                       |-- page.tsx
|   |                       `-- /[questionId]
|   |                           |-- _components/
|   |                           |   |-- CodeEditor.tsx
|   |                           |   `-- QuestionDisplay.tsx
|   |                           |-- hooks/
|   |                           |   `-- usePracticeQuestion.ts
|   |                           `-- page.tsx
|   |-- /api
|   |   |-- /trpc
|   |   |   `-- /[trpc]/route.ts      # tRPC HTTP 엔드포인트
|   |   `-- /webhooks
|   |       `-- /clerk/route.ts        # Clerk 사용자 동기화 webhook
|
|-- /components                     # ✨ 전역 공유 컴포넌트
|   |-- /ui                         # shadcn/ui 등 순수 UI 컴포넌트 (Button, Card...)
|   |-- /layout                     # 전역 레이아웃 컴포넌트 (Header, Footer...)
|   |-- /common                     # 여러 곳에서 쓰이는 범용 컴포넌트 (Spinner, Avatar...)
|   `-- /clerk-provider.tsx        # Clerk Provider 래퍼
|
|-- /hooks                         # ✨ 전역 공유 커스텀 훅
|-- /lib                           # ✨ 전역 공유 유틸리티
|   `-- /db
|       `-- prisma.ts              # Prisma 클라이언트 싱글톤
|
|-- /stores                        # ◀ Zustand 스토어 위치
|   |-- useUIStore.ts              # UI 관련 전역 상태 (사이드바, 모달 등)
|   `-- index.ts                   # (선택) 스토어들을 한번에 export
|
|-- /types                         # ✨ 전역 공유 타입
|
|-- /server                        # ◀ tRPC 서버 로직의 핵심
|   `-- /api
|       |-- trpc.ts                # tRPC 초기 설정, context, middleware
|       |-- root.ts                # 루트 라우터 (모든 라우터 통합)
|       `-- routers/               # 도메인별 API 로직
|           |-- user.ts            # 사용자 관련 프로시저
|           |-- interview.ts       # 인터뷰 관련 프로시저 (추후 추가)
|           `-- preparation.ts    # 준비 관련 프로시저 (추후 추가)
|
|-- /trpc                          # ◀ tRPC 클라이언트 설정
|   |-- server.ts                  # 서버 컴포넌트용 caller
|   |-- provider.tsx               # React 컴포넌트용 Provider
|   `-- query-client.ts            # React Query 설정
|
|-- /generated                     # ◀ 자동 생성 파일
|   `-- /prisma                    # Prisma Client 타입
|
|-- /styles
|   `-- globals.css
|
`-- middleware.ts                  # 언어/인증 처리 미들웨어
```

## Prisma 및 데이터베이스 구조

```
/prisma
|-- schema.prisma                  # 데이터베이스 스키마 정의
|-- migrations/                    # 마이그레이션 히스토리
|   |-- 20250819085913_init_user_table/
|   |-- 20250819120129_add_user_fields/
|   `-- 20250820003636_use_clerk_id_as_pk/
`-- seed.ts                        # (선택) 시드 데이터 스크립트
```

## 핵심 아키텍처 구성요소

### 1. tRPC 레이어 분리

#### `/server/api/` - 백엔드 로직

- **역할**: 비즈니스 로직, 데이터베이스 작업, 인증 확인
- **특징**: 서버에서만 실행, 클라이언트에 번들링되지 않음

```typescript
// server/api/routers/user.ts
export const userRouter = createTRPCRouter({
  whoAmI: publicProcedure.query(/* ... */),
  getProfile: protectedProcedure.query(/* ... */),
})
```

#### `/trpc/` - 클라이언트 설정

- **역할**: 서버와 클라이언트 간 통신 설정
- **특징**: 서버 컴포넌트와 클라이언트 컴포넌트 모두 지원

```typescript
// trpc/server.ts - 서버 컴포넌트용
export async function api() {
  const context = await createContext()
  return appRouter.createCaller(context)
}
```

#### `/app/api/trpc/` - HTTP 엔드포인트

- **역할**: tRPC를 HTTP API로 노출
- **특징**: Next.js Route Handler, CORS 처리

```typescript
// app/api/trpc/[trpc]/route.ts
export { handler as GET, handler as POST }
```

### 2. Prisma + Supabase 통합

#### 데이터베이스 연결

- **Supabase PostgreSQL**: 프로덕션 데이터베이스
- **Prisma ORM**: 타입 안전한 데이터베이스 접근
- **Connection Pooling**: Supabase Pooler 사용 권장

#### User 모델 구조

```prisma
model User {
  id        String   @id  // Clerk user ID를 직접 PK로 사용
  email     String   @unique
  firstName String?  @map("first_name")
  lastName  String?  @map("last_name")
  profileImageUrl String? @map("profile_image_url")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("users")
}
```

### 3. Clerk Webhook 동기화

#### `/app/api/webhooks/clerk/route.ts`

- **목적**: Clerk 사용자 이벤트를 Supabase DB와 동기화
- **처리 이벤트**:
  - `user.created`: 새 사용자 생성
  - `user.updated`: 사용자 정보 업데이트
  - `user.deleted`: 사용자 삭제
- **보안**: Svix를 통한 webhook 서명 검증

```typescript
// Webhook 플로우
Clerk Event → Webhook Endpoint → Verify Signature → Prisma → Supabase DB
```

### 4. 인증 플로우

```
1. 사용자 로그인 (Clerk)
2. Webhook으로 사용자 데이터 동기화 (Supabase)
3. tRPC Context에서 userId 확인
4. protected procedure로 인가 처리
```

## 핵심 구조 원칙

### 1. 라우트 그룹 활용

- `(public)`, `(protected)` 등 괄호를 사용한 라우트 그룹으로 관련 페이지 묶기
- URL에 영향을 주지 않으면서 논리적 구조 형성

### 2. \_components 디렉토리

- 각 페이지/라우트별 전용 컴포넌트는 `_components/`에 배치
- 언더스코어 접두사로 라우트와 구분

### 3. 계층적 공유 레벨

- **페이지 레벨**: `_components/`, `hooks/` (해당 페이지 전용)
- **라우트 그룹 레벨**: `layout.tsx`, 공통 컴포넌트
- **앱 레벨**: `components/`, `lib/`, `hooks/`, `types/`

## 파일 네이밍 규칙

### 컴포넌트 파일

- **PascalCase**: `LoginForm.tsx`, `AnalyticsChart.tsx`
- **설명적 이름**: 컴포넌트의 목적이 명확히 드러나도록

### 훅 파일

- **camelCase with use prefix**: `useLogin.ts`, `useAnalytics.ts`
- **도메인 명시**: 어떤 기능 영역의 훅인지 명확히

### 유틸리티 파일

- **camelCase**: `authUtils.ts`, `dateHelpers.ts`
- **기능별 그룹핑**: 관련 함수들을 하나의 파일로

### API 라우터 파일

- **camelCase**: `user.ts`, `interview.ts`
- **도메인 중심**: 비즈니스 도메인별로 라우터 분리

## 상대 경로 vs 절대 경로

### 절대 경로 사용 (권장)

```typescript
// ✅ CORRECT: 절대 경로 사용
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { prisma } from '@/lib/db/prisma'
import { api } from '@/trpc/server'
```

### 상대 경로 사용 (지양)

```typescript
// ❌ AVOID: 상대 경로는 복잡하고 오류 발생 가능
import { Button } from '../../../components/ui/button'
import { useAuth } from '../../hooks/useAuth'
```

## Co-location Strategy

### 관련 코드는 가까이 배치

```typescript
// ✅ CORRECT: 기능별 Co-location
app/dashboard/analytics/
├── _components/
│   ├── AnalyticsChart.tsx      # 차트 컴포넌트
│   ├── AnalyticsChart.test.tsx # 차트 테스트
│   └── AnalyticsChart.stories.tsx # 차트 스토리북
├── hooks/
│   ├── useAnalytics.ts         # 분석 데이터 훅
│   └── useAnalytics.test.ts    # 훅 테스트
├── utils/
│   └── chartHelpers.ts         # 차트 관련 유틸리티
└── page.tsx                    # 페이지 컴포넌트
```

## 확장 가능한 구조

### 기능 추가 시 확장 패턴

```
app/
├── (e-commerce)/          # 새로운 기능 영역 추가
│   ├── products/
│   │   ├── _components/
│   │   ├── [id]/
│   │   └── page.tsx
│   ├── cart/
│   │   ├── _components/
│   │   └── page.tsx
│   └── layout.tsx
```

### tRPC 라우터 확장

```
server/api/routers/
├── user.ts                # 기존 사용자 라우터
├── interview.ts           # 새로운 인터뷰 라우터
├── preparation.ts         # 새로운 준비 라우터
└── feedback.ts            # 새로운 피드백 라우터
```

### 공유 컴포넌트 진화

```
components/
├── ui/                    # 기본 UI 컴포넌트
├── business/             # 비즈니스 로직 포함 컴포넌트
│   ├── UserCard.tsx
│   └── ProductCard.tsx
└── layout/               # 레이아웃 전용 컴포넌트
```

## 환경 변수 관리

### 필수 환경 변수

```env
# Database
DATABASE_URL=              # Supabase PostgreSQL 연결 문자열

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SIGNING_SECRET=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## 개발 워크플로우

### 데이터베이스 변경 시

1. `prisma/schema.prisma` 수정
2. `pnpm prisma migrate dev` 실행
3. `pnpm prisma generate` (자동 실행됨)

### 새 API 엔드포인트 추가 시

1. `/server/api/routers/`에 새 라우터 생성
2. `/server/api/root.ts`에 라우터 등록
3. 필요시 context에 새 리소스 추가

### Webhook 추가 시

1. `/app/api/webhooks/`에 새 route handler 생성
2. 서명 검증 로직 구현
3. 미들웨어에서 해당 경로 제외 확인
