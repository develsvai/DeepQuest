# tRPC API 핵심 규칙 (tRPC Rules)

이 문서는 tRPC v11 기반의 타입 안전한 API 설계를 위해 모든 팀원이 반드시 준수해야 하는 핵심 규칙과 컨벤션을 정의합니다. 이 규칙들은 코드의 일관성, 보안성, 예측 가능성을 보장하는 것을 목표로 합니다.

## 1\. 라우터와 프로시저 (Routers & Procedures)

### 1.1. 라우터 구조

**규칙:** API는 도메인별로 라우터를 구성하고, 이를 `/server/api/root.ts`에서 하나로 통합하여 관리합니다.

- **라우터 위치**: 모든 tRPC 라우터 파일은 `/server/api/routers/` 내에 위치해야 합니다.
- **통합**: 개별 라우터들은 `/server/api/root.ts`에서 `appRouter`로 병합되어야 합니다.

<!-- end list -->

```typescript
// ✅ CORRECT: 잘 조직된 라우터 구조
// server/api/root.ts
export const appRouter = router({
  auth: authRouter,
  user: userRouter,
  post: postRouter,
  comment: commentRouter,
})

// server/api/routers/post.ts
export const postRouter = router({
  // ... post 관련 프로시저들
})
```

### 1.2. 프로시저 네이밍

**규칙:** 프로시저의 이름은 **`[동사][리소스]`** 형식으로 명확하게 작성합니다.

- **일관된 동사 사용**: 데이터 조회는 `get`, `list`, 생성은 `create`, 수정은 `update`, 삭제는 `delete`를 사용합니다.
- **명확한 리소스 명시**: `getUser`, `listPosts`, `updateProfile`과 같이 대상 리소스를 명확히 합니다.

### 1.3. 프로시저 타입 선택

**규칙:** 데이터 접근 권한에 따라 `publicProcedure`와 `protectedProcedure`를 명확히 구분하여 사용해야 합니다. 이는 RLS를 사용하지 않는 우리 아키텍처의 핵심 보안 계층입니다.

- `publicProcedure`: 인증이 필요 없는 공개 API에만 사용합니다. (예: 공개 게시물 목록 조회)
- `protectedProcedure`: **로그인한 사용자만 접근할 수 있는 모든 API에 사용해야 합니다.** 특히 데이터를 변경(CUD)하는 모든 `mutation`은 반드시 `protectedProcedure`를 사용해야 합니다.

<!-- end list -->

```typescript
// ❌ VIOLATION: 보호가 필요한 프로필 수정에 publicProcedure 사용
export const userRouter = router({
  updateProfile: publicProcedure
    .input(/*...*/)
    .mutation(async ({ ctx, input }) => {
      // ctx.user가 보장되지 않아 심각한 보안 위험 발생
      return updateUser(ctx.user.id, input)
    }),
})

// ✅ CORRECT: protectedProcedure를 사용하여 인증된 사용자만 접근 허용
export const userRouter = router({
  updateProfile: protectedProcedure
    .input(/*...*/)
    .mutation(async ({ ctx, input }) => {
      // protectedProcedure 미들웨어를 통과하여 ctx.user가 항상 보장됨
      return await updateUser(ctx.user.id, input)
    }),
})
```

---

## 2\. 입력과 출력 (Inputs & Outputs)

### 2.1. 입력 검증 (Input Validation)

**규칙:** 모든 프로시저의 입력값(`input`)은 Zod 스키마를 통해 엄격하고 포괄적으로 검증해야 합니다.

- 단순히 타입만 검증하는 것을 넘어, `min`, `max`, `trim`, `regex` 등을 활용하여 비즈니스 규칙에 맞는 상세한 검증을 포함해야 합니다.
- 사용자에게 피드백으로 전달될 수 있도록 명확한 에러 메시지를 작성합니다.
- **Zod 스키마 네이밍**: 스키마 이름은 반드시 명확하고 의도를 나타내는 이름을 사용해야 합니다. `[동작][대상]Input` 또는 `[대상][동작]Schema` 패턴을 따릅니다.

<!-- end list -->

```typescript
// ❌ VIOLATION: 약한 검증과 부적절한 네이밍
const CreatePostInput = z.object({
  title: z.string(),
})

// ❌ VIOLATION: 모호한 스키마 네이밍
const PostSchema = z.object({...})
const Input = z.object({...})

// ✅ CORRECT: 포괄적이고 상세한 검증과 명확한 네이밍
const CreatePostInput = z.object({
  title: z
    .string()
    .min(1, '제목을 입력해주세요.')
    .max(200, '제목은 200자를 초과할 수 없습니다.')
    .trim(),
  tags: z
    .array(z.string().regex(/^[a-z0-9]+$/))
    .max(5, '태그는 최대 5개까지 설정할 수 있습니다.')
    .optional(),
})

// ✅ CORRECT: 추가적인 네이밍 예시
const UpdateUserProfileInput = z.object({...})
const GetPostsByTagInput = z.object({...})
const DeleteCommentInput = z.object({...})
const UserRegistrationSchema = z.object({...})
```

### 2.2. 출력 데이터 필터링 (Output Filtering)

**규칙:** 프로시저는 절대 민감한 데이터를 클라이언트에 반환해서는 안 됩니다. `.output()`을 사용하여 반환될 데이터의 형태를 명시적으로 정의하는 것을 권장합니다. 민감한 정보를 필터링하거나, API가 반드시 특정 구조를 따라야할 때만 사용합니다.

- 사용자 정보 조회 시 `passwordHash`나 개인정보 등 민감한 필드는 절대 포함되어서는 안 됩니다.
- `.output()`을 사용하면 실수로 민감 데이터가 포함되더라도 tRPC가 컴파일 또는 런타임에 에러를 발생시켜 안전장치 역할을 합니다.

<!-- end list -->

```typescript
// ✅ CORRECT: .output()을 사용하여 반환 데이터 형태를 명시하고 민감 정보를 필터링
export const userRouter = router({
  getProfile: publicProcedure
    .input(z.object({ id: z.string() }))
    .output(
      z.object({
        // 반환될 데이터 스키마 정의
        id: z.string(),
        name: z.string(),
        createdAt: z.date(),
      })
    )
    .query(async ({ input }) => {
      const user = await getUserById(input.id)

      // 스키마에 정의된 필드만 반환 (password 등은 자동으로 제외됨)
      return user
    }),
})
```

---

## 3\. 에러 처리 (Error Handling)

### 3.1. 표준 에러 처리 방식

**규칙:** API 프로시저 내에서 발생하는 예상 가능한 오류는 **`throw new TRPCError({ ... })`** 방식을 사용해야 합니다. 이것이 우리 프로젝트의 표준 에러 처리 방식입니다.

- **이유**: 이 방식은 TanStack Query의 `error` 상태 및 `onError` 콜백과 가장 자연스럽게 연동됩니다. 별도의 `success` 필드를 가진 래퍼 객체를 반환하는 방식은 사용하지 않습니다.
- **`code`**: `NOT_FOUND`, `BAD_REQUEST`, `UNAUTHORIZED` 등 표준 tRPC 에러 코드를 사용하여 에러의 유형을 명확히 합니다.
- **`message`**: 클라이언트에서 사용자에게 보여줄 수 있는, 이해하기 쉬운 메시지를 작성합니다.

<!-- end list -->

```typescript
// ❌ VIOLATION: 일반 Error 객체를 던지거나 커스텀 객체 반환
export const postRouter = router({
  getPost: publicProcedure.query(async ({ input }) => {
    const post = await getPost(input.id)
    if (!post) {
      // throw new Error('Not found'); // 클라이언트에서 상태 코드 추론 불가
      return { success: false, error: 'Not found' } // React Query 에러 상태와 연동되지 않음
    }
    return post
  }),
})

// ✅ CORRECT: TRPCError를 사용하여 구체적인 에러 처리
import { TRPCError } from '@trpc/server'

export const postRouter = router({
  getPost: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const post = await getPost(input.id)

      if (!post) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `ID '${input.id}'에 해당하는 포스트를 찾을 수 없습니다.`,
        })
      }
      return post
    }),
})
```

---

## 4\. 미들웨어와 컨텍스트 (Middleware & Context)

**규칙:** 인증, 인가(권한 부여) 등 여러 프로시저에서 반복되는 로직은 미들웨어로 분리하여 재사용합니다.

- **인증 미들웨어 (`isAuthed`)**: `protectedProcedure`의 기반이 되며, 로그인 여부를 확인합니다.
- **인가 미들웨어 (`isAdmin`)**: 특정 역할(예: 관리자)을 가진 사용자인지 확인하며, 인증 미들웨어와 체이닝하여 사용합니다.

<!-- end list -->

```typescript
// ✅ CORRECT: 미들웨어를 체이닝하여 역할 기반 프로시저 생성
const isAuthed = t.middleware(/* ... */)
const isAdmin = t.middleware(/* ... */)

export const protectedProcedure = t.procedure.use(isAuthed)
export const adminProcedure = t.procedure.use(isAuthed).use(isAdmin)
```

---

## 5\. Prisma v7 Import 패턴

**규칙:** Prisma Client v7에서는 생성된 코드의 import 경로가 변경되었습니다. 올바른 경로에서 import해야 합니다.

### 5.1. Import 경로

```typescript
// ✅ CORRECT: Prisma v7 import 패턴

// 1. PrismaClient 및 Prisma 네임스페이스 (타입용)
import { PrismaClient, Prisma } from '@/generated/prisma/client'
import type {
  User,
  Post,
  InterviewPreparation,
} from '@/generated/prisma/client'

// 2. Enum 타입들 (별도 경로에서 import)
import { PreparationStatus, DegreeType, Rating } from '@/generated/prisma/enums'

// 3. 브라우저 환경용 (클라이언트 컴포넌트에서 타입만 사용 시)
import { PreparationStatus } from '@/generated/prisma/browser'

// 4. Prisma 싱글톤 인스턴스 (서비스 레이어에서 사용)
import { prisma } from '@/lib/db/prisma'

// ❌ VIOLATION: 잘못된 import 경로
import { PrismaClient } from '@prisma/client' // v6 스타일
import { Status } from '@/generated/prisma' // 루트에서 직접 import
import { Prisma } from 'prisma' // 패키지에서 직접 import
```

### 5.2. Prisma Enum 사용 규칙

**규칙:** Prisma에서 생성된 Enum은 재정의하지 말고, 생성된 타입을 그대로 사용합니다.

```typescript
// ✅ CORRECT: Prisma Enum 직접 사용
import { PreparationStatus } from '@/generated/prisma/enums'

if (status === PreparationStatus.READY) {
  // ...
}

// Zod 스키마에서 Enum 사용 (nativeEnum)
const statusSchema = z.nativeEnum(PreparationStatus)

// 타입 추론을 위한 Prisma 네임스페이스 사용
const include = {
  questions: true,
  careers: true,
} satisfies Prisma.InterviewPreparationInclude

type PrepWithRelations = Prisma.InterviewPreparationGetPayload<{
  include: typeof include
}>

// ❌ VIOLATION: Enum 재정의
const STATUS = {
  READY: 'READY',
  PENDING: 'PENDING',
} as const // Prisma Enum이 이미 존재함

// ❌ VIOLATION: 문자열 리터럴 사용
if (status === 'READY') {
  // PreparationStatus.READY 사용해야 함
  // ...
}
```

---

## 6\. 클린 코드 원칙 (Clean Code Principles)

### 6.1. 모듈화된 파일 구조

**규칙:** 복잡한 라우터는 관심사별로 파일을 분리하여 모듈화된 구조로 관리해야 합니다.

```
/server/api/routers/[feature-name]/
├── index.ts                    # Public exports
├── router.ts                   # Main router definition
├── schemas.ts                  # Zod validation schemas
├── types.ts                    # TypeScript type definitions
└── services/
    ├── [domain].service.ts     # Business logic services
    └── [helper].service.ts     # Helper functions
```

**예시:**

```typescript
// ✅ CORRECT: 모듈화된 구조
// interview-workflow/router.ts
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { CreatePreparationInput } from './schemas'
import {
  createInterviewPreparation,
  processJobPosting,
} from './services/preparation.service'

export const interviewWorkflowRouter = createTRPCRouter({
  createPreparation: protectedProcedure
    .input(CreatePreparationInput)
    .mutation(async ({ ctx, input }) => {
      const preparation = await createInterviewPreparation(ctx, input)
      const result = await processJobPosting(preparation)
      return result
    }),
})
```

### 6.2. 단일 책임 원칙 (Single Responsibility)

**규칙:** 각 함수는 하나의 명확한 책임만을 가져야 합니다. 복잡한 로직은 여러 개의 작은 함수로 분리합니다.

```typescript
// ❌ VIOLATION: 한 함수에서 너무 많은 일을 처리
export const complexRouter = router({
  process: protectedProcedure.mutation(async ({ ctx, input }) => {
    // 1. 데이터 검증
    if (!input.data) throw new Error('Invalid')
    // 2. DB 생성
    const record = await prisma.record.create(...)
    // 3. 외부 서비스 호출
    const result = await externalAPI.call(...)
    // 4. 알림 전송
    await sendNotification(...)
    // 5. 로깅
    console.log(...)
    return result
  })
})

// ✅ CORRECT: 책임별로 분리된 함수들
// services/preparation.service.ts
export async function validatePreparationData(data: unknown) {
  // 단일 책임: 데이터 검증
}

export async function createPreparationRecord(ctx: Context, data: ValidatedData) {
  // 단일 책임: DB 레코드 생성
}

export async function startWorkflow(preparation: Preparation) {
  // 단일 책임: 워크플로우 시작
}

// router.ts
export const cleanRouter = router({
  process: protectedProcedure.mutation(async ({ ctx, input }) => {
    const validatedData = await validatePreparationData(input)
    const preparation = await createPreparationRecord(ctx, validatedData)
    const result = await startWorkflow(preparation)
    return result
  })
})
```

### 6.3. 타입 가드와 조건부 로직

**규칙:** 조건부 로직은 명확한 타입 가드를 사용하여 가독성을 높입니다.

```typescript
// ✅ CORRECT: 명확한 타입 가드 사용
function hasJobPosting(input: CreatePreparationInput): boolean {
  return !!(input.companyName && input.jobTitle && input.jobDescription)
}

export async function processJobPosting(preparation: Preparation, input: CreatePreparationInput) {
  if (!hasJobPosting(input)) {
    return { hasJobPosting: false, jdStructuring: null }
  }

  // Job posting이 있는 경우의 로직
  const result = await startJdStructuring(...)
  return { hasJobPosting: true, jdStructuring: result }
}
```

### 6.4. 서비스 레이어 패턴

**규칙:** 비즈니스 로직은 라우터에서 분리하여 서비스 레이어에 구현합니다.

- **라우터**: 요청/응답 처리, 입력 검증, 서비스 호출 조정
- **서비스**: 비즈니스 로직, DB 작업, 외부 API 호출

```typescript
// services/jd-structuring.service.ts
export class JdStructuringService {
  async startWorkflow(jobData: JobPostingData): Promise<WorkflowResult> {
    // 비즈니스 로직 구현
    const run = await this.aiService.runJdStructuring(jobData)
    await this.createWebhookEvent(run)
    return this.formatResult(run)
  }

  private async createWebhookEvent(run: AiRun) {
    // 단일 책임: 웹훅 이벤트 생성
  }

  private formatResult(run: AiRun): WorkflowResult {
    // 단일 책임: 결과 포맷팅
  }
}
```

### 6.5. 에러 처리 계층화

**규칙:** 에러는 발생 위치에서 적절한 수준으로 처리하고, 상위 계층으로 전파합니다.

```typescript
// services/preparation.service.ts
export async function createInterviewPreparation(ctx: Context, input: Input) {
  try {
    return await ctx.db.interviewPreparation.create({
      data: { ...input, userId: ctx.user.id }
    })
  } catch (error) {
    // 서비스 레벨에서 구체적인 에러로 변환
    if (error.code === 'P2002') {
      throw new TRPCError({
        code: 'CONFLICT',
        message: '이미 진행 중인 면접 준비가 있습니다.'
      })
    }
    throw error // 예상치 못한 에러는 상위로 전파
  }
}

// router.ts
.mutation(async ({ ctx, input }) => {
  try {
    const result = await createInterviewPreparation(ctx, input)
    return result
  } catch (error) {
    // 라우터 레벨에서 최종 에러 처리
    if (error instanceof TRPCError) throw error

    // 예상치 못한 에러는 일반 서버 에러로
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: '처리 중 오류가 발생했습니다.'
    })
  }
})
```

---

## 7\. 금지되는 안티패턴 (Anti-Patterns)

**규칙:** 다음의 안티패턴을 반드시 피해야 합니다.

1.  **입력값 검증 누락**: Zod 스키마 없이 `input`을 신뢰하는 행위.
2.  **모호한 에러 메시지**: "에러 발생"과 같이 원인 파악이 불가능한 메시지 반환.
3.  **보호되지 않은 데이터 변경**: `mutation`에 `publicProcedure`를 사용하는 행위.
4.  **민감 데이터 노출**: `password`, `token` 등의 필드를 API 응답에 포함하는 행위.
5.  **비효율적인 쿼리**: 페이지네이션 없이 대규모 데이터를 한 번에 조회하는 행위.
6.  **모든 로직을 라우터에 작성**: 비즈니스 로직을 라우터 파일에 직접 구현하는 행위.
7.  **거대한 단일 파일**: 수백 줄의 코드를 하나의 파일에 모두 작성하는 행위.
8.  **재사용 불가능한 코드**: 동일한 로직을 여러 곳에 복사-붙여넣기하는 행위.
9.  **부적절한 Zod 스키마 네이밍**: `Input`, `Schema`, `Data`와 같이 모호하거나 의미가 불분명한 스키마 이름 사용.

<!-- end list -->
