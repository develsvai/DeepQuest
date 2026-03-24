---
paths: src/server/**/*.ts
---

# 서버 레이어 아키텍처

`/src/server` 디렉토리의 아키텍처 원칙과 모범 사례입니다.

## 핵심 원칙

- **관심사 분리**: Router는 HTTP 관련 처리, Service는 비즈니스 로직 담당
- **낮은 결합도**: 레이어 간 의존성 최소화, 인터페이스를 통한 통신
- **높은 응집도**: 관련 기능을 단일 모듈 내에 그룹화
- **도메인 기반 구조**: UI 페이지가 아닌 비즈니스 도메인 기준으로 구조화

---

## 디렉토리 구조

```
src/server/
├── api/
│   ├── root.ts                          # 루트 라우터 집합
│   ├── trpc.ts                          # tRPC 컨텍스트 & 미들웨어
│   └── routers/
│       ├── file-upload.ts               # 파일 업로드 관리
│       ├── interview-preparation/       # 면접 준비 CRUD
│       │   ├── index.ts
│       │   └── schema.ts
│       ├── question/                    # 질문 조회 & 생성
│       │   ├── index.ts
│       │   └── schema.ts
│       ├── answer/                      # 답변 제출 & 피드백
│       │   ├── index.ts
│       │   └── schema.ts
│       └── key-achievement/             # STAR-L 핵심 성과
│           ├── index.ts
│           └── schema.ts
│
├── services/
│   ├── interview-preparation/           # 면접 준비 도메인
│   │   ├── index.ts
│   │   ├── preparation.service.ts
│   │   └── types.ts
│   ├── experience/                      # 경력/프로젝트 도메인
│   │   ├── index.ts
│   │   ├── experience.service.ts
│   │   └── types.ts
│   ├── education/                       # 학력 도메인
│   │   ├── index.ts
│   │   ├── education.service.ts
│   │   └── types.ts
│   ├── question/                        # 질문 도메인
│   │   ├── index.ts
│   │   ├── question.service.ts
│   │   ├── generation.service.ts
│   │   └── types.ts
│   ├── answer/                          # 답변 도메인
│   │   ├── index.ts
│   │   ├── answer.service.ts
│   │   ├── feedback.service.ts
│   │   └── types.ts
│   ├── key-achievement/                 # 핵심 성과 도메인
│   │   ├── index.ts
│   │   ├── key-achievement.service.ts
│   │   └── types.ts
│   ├── file-upload/                     # 파일 업로드 도메인
│   │   ├── index.ts
│   │   ├── file-upload.service.ts
│   │   └── types.ts
│   ├── webhook-event/                   # LangGraph 워크플로우 추적
│   │   ├── index.ts
│   │   ├── webhook-event.service.ts
│   │   └── types.ts
│   ├── ai/                              # AI 서비스 통합
│   │   ├── langgraph/
│   │   │   ├── client.ts
│   │   │   ├── service.ts
│   │   │   └── types/
│   │   └── contracts/
│   │       ├── validation.ts
│   │       └── schemas/
│   └── common/                          # 공통 유틸리티
│       ├── errors.ts
│       ├── trpc-error-handler.ts
│       ├── prisma-errors.ts
│       ├── experience-fields.ts
│       └── question-progress.ts
│
└── CLAUDE.md
```

> **Note**: 사용자 인증/인가는 Clerk를 직접 사용합니다 (`useUser`, `useAuth`, `auth()`)

---

## 현재 사용 가능한 모듈

| 라우터                  | 서비스                                   | 설명                                          |
| ----------------------- | ---------------------------------------- | --------------------------------------------- |
| `interview-preparation` | `preparation.service`                    | 면접 준비 CRUD, Career/Project/Education 관리 |
| `question`              | `question.service`, `generation.service` | 질문 조회 및 AI 생성 워크플로우               |
| `answer`                | `answer.service`, `feedback.service`     | 답변 제출, 피드백 저장 및 조회                |
| `key-achievement`       | `key-achievement.service`                | STAR-L 핵심 성과 CRUD                         |
| `file-upload`           | `file-upload.service`                    | 이력서 파일 업로드 관리                       |
| -                       | `experience.service`                     | 경력/프로젝트 공통 비즈니스 로직              |
| -                       | `education.service`                      | 학력 비즈니스 로직                            |
| -                       | `webhook-event.service`                  | LangGraph 워크플로우 상태 추적                |

---

## 모듈 네이밍: 도메인 기반 (권장)

### 안티 패턴: 페이지 기반 네이밍

```
# 피해야 함
services/
├── interview-prep/           # 페이지: /interview-prep/[id]
├── interview-prep-detail/    # 페이지: /interview-prep/[id]/detail
└── experience-detail/        # 페이지: /.../[experienceId]
```

**문제점:**

- UI 변경 시 백엔드도 변경 필요 (높은 결합도)
- 같은 도메인 로직이 여러 서비스에 분산 (낮은 응집도)
- 재사용성 저하

### 권장: 도메인 기반 네이밍

```
# 권장
services/
├── interview-preparation/    # 도메인: 면접 준비 (Aggregate Root)
│   ├── preparation.service.ts
│   └── types.ts
├── experience/               # 도메인: 경력/프로젝트
│   └── experience.service.ts
├── question/                 # 도메인: 질문
│   ├── question.service.ts
│   └── generation.service.ts
└── answer/                   # 도메인: 답변
    ├── answer.service.ts
    └── feedback.service.ts
```

**장점:**

- UI 변경에 독립적 (낮은 결합도)
- 관련 비즈니스 로직 응집 (높은 응집도)
- 여러 페이지에서 재사용 가능

### 네이밍 결정 기준

| 기준                 | 예시                            | 설명                 |
| -------------------- | ------------------------------- | -------------------- |
| **Entity/Resource**  | `user/`, `question/`, `answer/` | DB 엔티티와 1:1 매핑 |
| **Aggregate**        | `interview-preparation/`        | 관련 엔티티 그룹     |
| **External Service** | `ai/`, `storage/`               | 외부 연동            |

---

## 레이어 책임

### 1. Router 레이어 (`/api/routers`)

**책임**: HTTP/tRPC 관련 처리

```typescript
// Router가 해야 할 것:
- Input validation (Zod 스키마)
- Authentication/Authorization 체크 (protectedProcedure)
- Service 호출 및 결과 반환
- 에러를 HTTP 에러로 변환 (TRPCError)

// Router가 하면 안 되는 것:
- 비즈니스 로직 구현
- 직접 DB 쿼리
- 복잡한 데이터 변환
- 직접 외부 API 호출
```

**예시:**

```typescript
// routers/interview-preparation/index.ts
import { router, protectedProcedure } from '@/server/api/trpc'
import { preparationService } from '@/server/services/interview-preparation'
import { handleServiceError } from '@/server/services/common/trpc-error-handler'
import { createSchema, getByIdSchema } from './schema'

export const interviewPreparationRouter = router({
  create: protectedProcedure
    .input(createSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await preparationService.create({
          userId: ctx.userId,
          ...input,
        })
      } catch (error) {
        handleServiceError(error)
      }
    }),

  getById: protectedProcedure
    .input(getByIdSchema)
    .query(async ({ ctx, input }) => {
      try {
        return await preparationService.getById(input.id, ctx.userId)
      } catch (error) {
        handleServiceError(error)
      }
    }),
})
```

### 2. Service 레이어 (`/services`)

**책임**: 순수 비즈니스 로직

```typescript
// Service가 해야 할 것:
- 비즈니스 규칙 구현
- 데이터 변환 및 처리
- 트랜잭션 관리
- 외부 서비스 통합 (AI Server 등)
- 도메인 검증

// Service가 하면 안 되는 것:
- HTTP/tRPC 관련 코드 (TRPCError 등)
- Request/Response 객체 접근
- auth context 직접 참조
```

**예시:**

```typescript
// services/interview-preparation/preparation.service.ts
import { prisma } from '@/lib/db'
import { NotFoundError, ConflictError } from '@/server/services/common/errors'
import type { CreatePreparationInput } from './types'

export const preparationService = {
  async create(input: CreatePreparationInput) {
    const { userId, resumeId, ...data } = input

    // 비즈니스 규칙 검증
    const existing = await prisma.interviewPreparation.findFirst({
      where: { userId, status: 'IN_PROGRESS' },
    })

    if (existing) {
      throw new ConflictError('이미 진행 중인 면접 준비가 있습니다')
    }

    return prisma.interviewPreparation.create({
      data: { userId, resumeId, ...data },
    })
  },

  async getById(id: string, userId: string) {
    const result = await prisma.interviewPreparation.findUnique({
      where: { id },
      include: { questions: true },
    })

    if (!result) {
      throw new NotFoundError('InterviewPreparation', id)
    }

    if (result.userId !== userId) {
      throw new NotFoundError('InterviewPreparation', id) // 보안상 동일한 에러
    }

    return result
  },
}
```

---

## 에러 처리 전략

### 도메인 에러 클래스 (`services/common/errors.ts`)

```typescript
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message)
    this.name = 'DomainError'
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, id: string) {
    super(`${entity}을(를) 찾을 수 없습니다: ${id}`, 'NOT_FOUND')
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message, 'CONFLICT')
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR')
  }
}
```

### 통합 에러 핸들러 (`services/common/trpc-error-handler.ts`)

```typescript
import { TRPCError } from '@trpc/server'
import { NotFoundError, ConflictError, ValidationError } from './errors'

export function handleServiceError(error: unknown): never {
  if (error instanceof NotFoundError) {
    throw new TRPCError({ code: 'NOT_FOUND', message: error.message })
  }
  if (error instanceof ConflictError) {
    throw new TRPCError({ code: 'CONFLICT', message: error.message })
  }
  if (error instanceof ValidationError) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: error.message })
  }
  throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' })
}
```

### Prisma 에러 헬퍼 (`services/common/prisma-errors.ts`)

```typescript
// P2025 에러 (레코드를 찾을 수 없음) 감지
export function isPrismaNotFoundError(error: unknown): boolean

// findUnique 후 update 패턴 대신 사용
export async function withNotFoundHandler<T>(
  entityName: string,
  id: string,
  operation: () => Promise<T>
): Promise<T>
```

---

## AI/LangGraph 통합

### 구조

```
services/ai/
├── langgraph/
│   ├── client.ts       # LangGraph HTTP 클라이언트 설정
│   ├── service.ts      # 그래프 실행 인터페이스
│   └── types/
│       ├── graphs.ts   # 그래프 이름 정의
│       ├── runs.ts     # Run 페이로드 타입
│       └── client.ts   # 클라이언트 타입 정의
│
└── contracts/
    ├── validation.ts   # 계약 검증 헬퍼
    └── schemas/
        ├── common.ts                     # 공통 스키마 컴포넌트
        ├── resumeParsingV2.ts           # 이력서 파싱 입력 스키마
        ├── jdStructuring.ts             # JD 구조화 스키마
        ├── keyAchievementQuestionGen.ts # 질문 생성 입력
        ├── questionFeedbackGen.ts       # 피드백 생성 스키마
        └── jdUrlToText.ts               # URL→텍스트 스키마
```

### 사용 가능한 그래프

| 그래프                   | 용도                   |
| ------------------------ | ---------------------- |
| `resume_parser`          | 이력서에서 데이터 추출 |
| `question_gen`           | 인터뷰 질문 생성       |
| `question_feedback_gen`  | 답변 피드백 생성       |
| `jd_structuring`         | 채용공고 파싱          |
| `follow_up_question_gen` | 후속 질문 생성         |
| `jd_to_text`             | JD URL에서 텍스트 추출 |

### 계약 스키마 패턴

AI 서비스와의 통신에서 타입 안전성을 보장하기 위해 계약 스키마를 사용합니다:

```typescript
// contracts/schemas/keyAchievementQuestionGen.ts
import { z } from 'zod'

export const questionGenInputSchema = z.object({
  achievement: z.object({
    situation: z.string(),
    task: z.string(),
    action: z.string(),
    result: z.string(),
    learning: z.string().optional(),
  }),
  jobDescription: z.string().optional(),
  targetQuestionCount: z.number().default(5),
})

export type QuestionGenInput = z.infer<typeof questionGenInputSchema>
```

---

## 의존성 방향

```
Client
   |
   v
Router Layer
   - Input validation (Zod)
   - Auth/Authz
   - Error transformation
   |
   v
Service Layer
   - Business logic
   - Domain validation
   - Transaction management
   |
   v
Data Layer (Prisma)
   - Database operations
   - Query optimization
```

**규칙:**

- 상위 레이어는 하위 레이어만 참조
- 같은 레이어 내 교차 참조 지양 (Service A → Service B 피하기)
- 공통 로직은 별도 모듈로 추출

---

## 파일 네이밍 규칙

| 파일 유형     | 패턴                   | 예시                                      |
| ------------- | ---------------------- | ----------------------------------------- |
| Router        | `index.ts` 또는 `*.ts` | `routers/user.ts`                         |
| Router Schema | `schema.ts`            | `routers/interview-preparation/schema.ts` |
| Service       | `*.service.ts`         | `services/answer/answer.service.ts`       |
| Service Types | `types.ts`             | `services/answer/types.ts`                |
| Service Index | `index.ts`             | `services/answer/index.ts`                |
| Domain Errors | `errors.ts`            | `services/common/errors.ts`               |

---

## 체크리스트

### Router 작성 시

- [ ] Input/Output에 대한 Zod 스키마 정의
- [ ] `protectedProcedure` 또는 `publicProcedure` 적절히 사용
- [ ] 비즈니스 로직은 Service에 위임
- [ ] Service 에러를 TRPCError로 변환 (`handleServiceError` 사용)
- [ ] 권한 검증은 Router에서 수행

### Service 작성 시

- [ ] HTTP/tRPC 관련 코드 없음
- [ ] 순수 비즈니스 로직만 구현
- [ ] 도메인 에러 클래스 사용
- [ ] 명확한 타입 정의
- [ ] 단일 책임 원칙 준수

---

## 서비스 타입 가이드라인

### 타입 파일 구조

```
services/[domain]/
├── index.ts                # Public exports
├── [domain].service.ts     # Service implementation
├── types.ts                # Type definitions (타입만)
└── queries.ts              # Prisma Include/Select configs (선택)
```

**관심사 분리:**

- `types.ts` → 타입, 인터페이스 정의만
- `queries.ts` → Prisma Include/Select config (복잡한 쿼리 설정이 있는 경우)

### Generic 유틸리티 타입 (`common/type-utils.ts`)

```typescript
import type { WithProgress, WithUserId } from '../common/type-utils'

// 진행률 필드 추가
type KeyAchievementWithProgress = WithProgress<BaseKeyAchievement>
// { ...BaseKeyAchievement, totalQuestions: number, completedQuestions: number }

// userId 필드 추가
type CreateWithUser = WithUserId<CreateInput>
// { ...CreateInput, userId: string }
```

### Prisma 타입 활용 패턴

#### 1. Enum 재사용 (Never redefine)

```typescript
// ✅ 좋음: Prisma enum import
import { AnswerStatus, Rating } from '@/generated/prisma/enums'

// ❌ 나쁨: 문자열 리터럴 재정의
type Status = 'DRAFT' | 'SUBMITTED' | 'EVALUATED'
```

#### 2. GetPayload 타입 추론

```typescript
// ✅ 좋음: Prisma 타입 추론
import type { Prisma } from '@/generated/prisma/client'

export type CareerWithAchievements = Prisma.CareerExperienceGetPayload<{
  include: { keyAchievements: true }
}>

// ❌ 나쁨: 수동 타입 정의
export interface CareerWithAchievements {
  id: number
  company: string
  // ... 누락 위험
}
```

#### 3. Include/Select Config + satisfies

```typescript
// queries.ts
export const detailedInclude = {
  careers: { include: { keyAchievements: true } },
  projects: true,
} satisfies Prisma.InterviewPreparationInclude

// types.ts
export type DetailedPreparation = Prisma.InterviewPreparationGetPayload<{
  include: typeof detailedInclude
}>
```

### 중복 방지 원칙

**원천 도메인 (Canonical Source):**

- 타입은 해당 도메인에서 정의 → 다른 도메인에서 import
- 예: `KeyAchievementWithProgress` → `key-achievement/types.ts`에서 정의
- 예: `EducationData` → `education/types.ts`에서 정의

**Re-export 패턴 (Backward Compatibility):**

```typescript
// experience/types.ts
import type { KeyAchievementWithProgress } from '../key-achievement'
export type { KeyAchievementWithProgress } // Re-export for backward compat
```

### 타입 작성 체크리스트

- [ ] Prisma enum 재사용 (문자열 리터럴 대신)
- [ ] 기존 타입 검색 후 재사용
- [ ] GetPayload로 Prisma 타입 추론
- [ ] Include/Select config에 `satisfies` 사용
- [ ] 원천 도메인에서 정의, 다른 도메인에서 import
- [ ] Generic 유틸리티 타입 활용 (`WithProgress`, `WithUserId`)

---

## 참고 자료

- **tRPC Docs**: https://trpc.io/docs
- **Prisma Best Practices**: https://www.prisma.io/docs/guides
- **Clean Architecture**: Robert C. Martin
