# TDD (Test-Driven Development) API 개발 가이드

## 📌 개요

이 문서는 tRPC API 엔드포인트를 TDD 방식으로 개발하는 표준 프로세스를 정의합니다. 모든 백엔드 API 개발은 이 가이드라인을 따라 테스트 우선 접근 방식으로 진행되어야 합니다.

## 🎯 핵심 원칙

### 1. Test-First Development

- **테스트를 먼저 작성**: 구현 전에 항상 테스트를 먼저 작성
- **Red-Green-Refactor 사이클**: 실패 → 성공 → 개선의 반복
- **최소 구현**: 테스트를 통과하는 최소한의 코드만 작성
- **점진적 개선**: 테스트 통과 후 리팩토링으로 코드 품질 향상

### 2. Test Isolation

- **고유 테스트 ID**: 각 테스트에 `generateTestId()` 사용
- **자동 정리**: `cleanupTestData()` 로 테스트 데이터 자동 삭제
- **병렬 실행 안전**: 테스트 간 데이터 충돌 방지

## 🔄 TDD 개발 프로세스

### Step 1: 스키마 분석

```typescript
// 1. Prisma 스키마 확인
// prisma/schema.prisma
model InterviewPreparation {
  id        String   @id @default(cuid())
  userId    String
  // ... 필드 확인
}
```

### Step 2: 테스트 파일 생성 (RED Phase)

```typescript
// src/server/api/routers/__tests__/[model-name].test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  createInnerTRPCContext,
  generateTestId,
  cleanupTestData,
  testHelpers,
} from '@/test/helpers/trpc'

describe('[Model] Router', () => {
  let ctx: ReturnType<typeof createInnerTRPCContext>
  let testId: string

  beforeEach(() => {
    testId = generateTestId()
    ctx = createInnerTRPCContext({
      userId: `user-${testId}`,
    })
  })

  afterEach(async () => {
    await cleanupTestData(testId)
    vi.clearAllMocks()
  })

  // 테스트 케이스 작성...
})
```

### Step 3: 테스트 케이스 작성

```typescript
describe('create', () => {
  it('should create new record', async () => {
    // Given: 테스트 데이터 준비
    await testHelpers.createUser(testId, { id: ctx.userId! })

    // When: API 호출
    const result = await router.createCaller(ctx).create({
      field1: 'value1',
      field2: 'value2',
    })

    // Then: 결과 검증
    expect(result).toMatchObject({
      field1: 'value1',
      field2: 'value2',
      userId: ctx.userId,
    })
  })

  it('should throw UNAUTHORIZED without auth', async () => {
    // Given: 인증되지 않은 컨텍스트
    const unauthedCtx = createInnerTRPCContext({ userId: null })

    // When & Then: 에러 검증
    await expect(
      router.createCaller(unauthedCtx).create({
        /* ... */
      })
    ).rejects.toThrow('UNAUTHORIZED')
  })
})
```

### Step 4: 라우터 구현 (GREEN Phase)

```typescript
// src/server/api/routers/[model-name].ts
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { TRPCError } from '@trpc/server'

// Input validation schemas
const createSchema = z.object({
  field1: z.string().min(1),
  field2: z.string().min(1),
})

export const modelRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.model.create({
        data: {
          ...input,
          userId: ctx.userId,
        },
      })
    }),
})
```

### Step 5: 리팩토링 (REFACTOR Phase)

```typescript
// 개선 사항 적용
// - 에러 처리 강화
// - 코드 중복 제거
// - 성능 최적화
// - 타입 안전성 향상
```

## 📋 테스트 체크리스트

### 필수 테스트 케이스

#### ✅ CRUD 기본 기능

- [ ] Create: 새 레코드 생성 성공
- [ ] Read: ID로 단일 레코드 조회
- [ ] List: 사용자의 모든 레코드 목록
- [ ] Update: 기존 레코드 수정
- [ ] Delete: 레코드 삭제 및 관련 데이터 정리

#### ✅ 인증/인가

- [ ] 인증되지 않은 요청 차단 (UNAUTHORIZED)
- [ ] 다른 사용자의 데이터 접근 차단 (FORBIDDEN)
- [ ] 자신의 데이터만 조회/수정 가능

#### ✅ 입력 검증

- [ ] 필수 필드 누락 시 에러
- [ ] 잘못된 데이터 타입 거부
- [ ] 문자열 길이 제한 검증
- [ ] URL/이메일 형식 검증
- [ ] 열거형(enum) 값 검증

#### ✅ 에러 처리

- [ ] 존재하지 않는 레코드 조회 (NOT_FOUND)
- [ ] 중복 데이터 생성 시도 (CONFLICT)
- [ ] 데이터베이스 제약 조건 위반

#### ✅ 비즈니스 로직

- [ ] 상태 전환 규칙 검증
- [ ] 계산 로직 정확성
- [ ] 연관 데이터 자동 생성/삭제

## 🛠️ 테스트 헬퍼 활용

### 테스트 데이터 생성

```typescript
// 자동 추적 기능이 있는 헬퍼 사용
const user = await testHelpers.createUser(testId, {
  id: ctx.userId,
  firstName: 'Test',
  lastName: 'User',
})

const prep = await testHelpers.createInterviewPrep(testId, user.id, {
  jobTitle: 'Software Engineer',
  company: 'Tech Corp',
})
```

### 테스트 격리

```typescript
// 각 테스트는 고유한 ID로 완전히 격리
beforeEach(() => {
  testId = generateTestId() // 'test-1234567890-1'
})

afterEach(async () => {
  await cleanupTestData(testId) // 자동으로 모든 관련 데이터 삭제
})
```

## 📊 커버리지 목표

- **라인 커버리지**: 최소 80%
- **브랜치 커버리지**: 최소 75%
- **함수 커버리지**: 100% (모든 엔드포인트)
- **중요 경로**: 100% 커버리지 필수

## 🚀 실행 명령어

```bash
# 테스트 실행 (watch 모드)
pnpm test

# 단일 실행
pnpm test:run

# 커버리지 리포트
pnpm test:coverage

# UI 모드 (시각적 디버깅)
pnpm test:ui
```

## ⚡ 병렬 테스트 실행

테스트는 기본적으로 병렬로 실행됩니다. 안전한 병렬 실행을 위해:

1. **고유 ID 사용**: 모든 테스트 데이터에 `testId` 포함
2. **격리된 데이터**: 테스트 간 데이터 공유 금지
3. **자동 정리**: `cleanupTestData()` 로 확실한 정리

## 🔍 디버깅 팁

### 테스트 실패 시

1. 에러 메시지 확인
2. `console.log()` 로 중간 값 확인
3. `test:ui` 모드에서 시각적 디버깅
4. 단일 테스트만 실행: `it.only()`

### 일반적인 문제

- **타입 에러**: Zod 스키마와 Prisma 모델 불일치
- **권한 에러**: 테스트 사용자 생성 누락
- **데이터 충돌**: 테스트 격리 미흡
- **비동기 문제**: `await` 키워드 누락

## 📝 코드 리뷰 체크리스트

PR 제출 전 확인사항:

- [ ] 모든 테스트 통과 (`pnpm test:run`)
- [ ] 타입 체크 통과 (`pnpm type-check`)
- [ ] 린트 통과 (`pnpm lint`)
- [ ] 포맷팅 완료 (`pnpm format`)
- [ ] 테스트 커버리지 목표 달성
- [ ] Red-Green-Refactor 사이클 완료
- [ ] 에지 케이스 테스트 포함
- [ ] 문서화 주석 추가

## 🎯 Best Practices

### DO ✅

- 테스트를 먼저 작성하고 실패 확인
- 명확한 Given-When-Then 구조 사용
- 테스트 이름으로 의도 명확히 표현
- 한 테스트에 하나의 검증만 수행
- 테스트 격리와 독립성 보장

### DON'T ❌

- 구현 후 테스트 작성
- 테스트 없이 코드 수정
- 테스트 간 데이터 공유
- 복잡한 테스트 셋업
- 테스트 실패 무시

## 🔗 관련 문서

- [tRPC Rules](./trpc-rules.md) - tRPC 핵심 규칙
- [tRPC Patterns](./trpc-patterns.md) - 구현 패턴
- [Test Helpers](/src/test/helpers/trpc.ts) - 테스트 유틸리티

## 📚 참고 자료

- [Vitest Documentation](https://vitest.dev/)
- [tRPC Testing Guide](https://trpc.io/docs/testing)
- [Testing Library Best Practices](https://testing-library.com/docs/guiding-principles)
