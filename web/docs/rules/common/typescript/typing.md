# TypeScript 타입 관리 가이드라인

### 문서 개요

이 문서는 우리 프로젝트의 TypeScript 코드 품질, 유지보수성, 개발자 경험 향상을 위한 타입 관리 표준 가이드라인을 정의합니다. 모든 개발자는 이 가이드라인을 숙지하고 준수하는 것을 원칙으로 합니다.

---

## 1\. 타입 관리 기본 패턴

프로젝트의 타입은 **사용 범위**에 따라 관리하며, **하이브리드 패턴**을 기본 전략으로 채택합니다.

### 1. 컴포넌트 지역 타입 (Colocation)

- **원칙**: 특정 컴포넌트나 페이지에서만 사용되는 타입은 해당 파일 바로 옆에 `*.types.ts` 파일로 생성합니다. 단, 함수의 인자, 반환값 등은 inline type으로 작성하거나, 복잡한 경우에는 같은 파일 내에서 타입 정의를 합니다.
- **적용 대상**: 컴포넌트 `Props`, 내부 `State` 등 해당 스코프에서만 유효한 타입.
- **구조 예시**:
  ```bash
  web/components/
  └── Button/
      ├── Button.tsx
      └── Button.types.ts
  ```

### 2. 중앙 공유 타입 (Centralized)

- **원칙**: 프로젝트 전반에서 재사용되는 타입은 `web/types` 디렉토리에서 중앙 관리합니다.
- **적용 대상**: API 데이터 모델, DB 스키마, 전역 상태 등 공통으로 사용되는 핵심 타입.
- **구조 예시**:
  ```bash
  web/
  └── types/
      ├── api.ts      # API 관련 공통 타입
      ├── user.ts     # User 데이터 모델
      └── index.ts    # 전체 타입 export (선택 사항)
  ```

> #### **핵심 판단 기준**
>
> 타입을 정의할 때 "이 타입이 다른 곳에서도 필요한가?"를 자문하세요.
>
> - **아니오 (No)** -> 컴포넌트 옆에 지역 타입으로 배치합니다.
> - **예 (Yes)** -> `web/types` 디렉토리로 옮겨 공유 타입으로 관리합니다.

---

## 2\. 타입 정의 원칙

타입을 정의할 때는 일관성과 명확성을 최우선으로 고려합니다.

### Interface vs. Type Alias 사용 기준

- **`interface`**: **객체 구조**를 정의할 때 사용하며, **확장(extends)이 필요할 때** 우선적으로 사용합니다. 선언 병합(declaration merging)이 필요한 경우에도 유용합니다.

  ```typescript
  // ✅ Good: 확장 가능한 객체 구조
  interface BaseUser {
    id: string
    name: string
  }

  interface AdminUser extends BaseUser {
    permissions: string[]
  }
  ```

- **`type`**: **유니온(`|`)**, **교차(`&`)**, **계산된 타입(Conditional, Mapped)**, **원시 타입 조합** 등 복합적인 데이터 형태나 별칭을 정의할 때 사용합니다.

  ```typescript
  // ✅ Good: 유니온, 계산된 타입
  type Status = 'pending' | 'completed' | 'failed'
  type UserWithStatus = BaseUser & { status: Status }
  type UserId = string
  ```

### 엄격한 타입 원칙 (Strict Typing)

- **`any` 사용 금지**: `any` 타입의 사용을 **엄격히 금지**합니다. 타입을 특정할 수 없는 경우 `unknown`을 사용하고, 타입 가드(e.g., `typeof`, `instanceof`)로 타입을 좁혀서 사용합니다.
- **명확한 Optional 처리**: 선택적 속성은 `?`를 사용하여 명확히 구분합니다. `Optional Chaining(?.)`과 `Non-null Assertion(!)`의 남용을 피하고, 명시적인 분기 처리로 코드의 안정성을 확보합니다.
- **Null Safety**: 값이 `null` 또는 `undefined`가 될 수 있는 모든 변수와 속성은 `string | null`처럼 유니온 타입으로 명시적으로 선언하여 잠재적 런타임 에러를 방지합니다.

### 네이밍 컨벤션

- 타입과 인터페이스 이름은 **PascalCase**를 사용합니다. (e.g., `AdminUser`, `ApiResponse`)
- Boolean 값을 나타내는 속성은 `is`, `has`, `should` 등의 접두사를 붙여 명확성을 높입니다. (e.g., `isVerified`, `hasNextPage`)

---

## 3\. 제네릭(Generic) 타입 활용

제네릭은 타입의 재사용성을 극대화하고 강력한 타입 추론을 지원하므로 적극적으로 활용을 권장합니다.

### API 응답 제네릭 패턴

API 응답 구조를 제네릭으로 표준화하여 반복을 줄이고 일관성을 유지합니다.

```typescript
// web/types/api.ts

// 기본 API 응답 구조
export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
}

// 페이지네이션이 포함된 API 응답 구조
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    total: number
    has_next: boolean // 백엔드 필드명을 그대로 따름 (snake_case)
  }
}
```

### 컴포넌트 제네릭 Props

다양한 데이터 타입을 받을 수 있는 재사용 가능한 컴포넌트를 만들 때 제네릭을 활용합니다.

```typescript
// web/components/common/Select/Select.types.ts

export interface SelectProps<T> {
  options: T[]
  value: T
  onChange: (value: T) => void
  /** 옵션 객체에서 화면에 표시할 라벨을 추출하는 함수 */
  getLabel: (item: T) => string
}
```

---

## 4\. 고급 패턴: Zod 활용 권장

API 응답과 같이 외부에서 들어오는 데이터는 **Zod** 라이브러리를 사용해 **런타임 유효성 검사**와 **타입 추론**을 동시에 처리하는 것을 강력히 권장합니다. 이를 통해 '단일 진실 공급원(Single Source of Truth)'을 구축할 수 있습니다.

### 기본 Zod 패턴

```typescript
import { z } from 'zod'

// 1. Zod 스키마 정의 (유효성 검사 규칙 포함)
export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2),
  email: z.string().email(),
})

// 2. 스키마로부터 타입 자동 추론
export type User = z.infer<typeof UserSchema>

// 사용: API 호출 후 UserSchema.parse(response.data)로 유효성 검사 및 타입 보장
```

### tRPC와 Zod 통합

**규칙:** tRPC 프로시저의 모든 input/output에 Zod 스키마를 사용해야 합니다.

```typescript
// server/api/routers/user.ts
import { z } from 'zod'

const CreateUserInput = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email format'),
  age: z.number().int().min(13, 'Must be at least 13').optional(),
})

const UserOutput = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  createdAt: z.date(),
})

export const userRouter = router({
  create: protectedProcedure
    .input(CreateUserInput)
    .output(UserOutput)
    .mutation(async ({ input }) => {
      // input은 자동으로 타입 추론됨
      const user = await createUser(input)
      return user // 반환 타입도 검증됨
    }),
})

// 클라이언트에서 타입 자동 추론
type CreateUserInput = z.infer<typeof CreateUserInput> // { name: string; email: string; age?: number }
```

### 런타임 Type Guards

**규칙:** unknown 타입 데이터에 대해 type guard를 구현할 때 Zod를 활용합니다.

```typescript
// Type guard with Zod
const isUser = (data: unknown): data is User => {
  const result = UserSchema.safeParse(data)
  return result.success
}

// API 응답 처리
async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`)
  const data: unknown = await response.json()

  if (!isUser(data)) {
    throw new Error('Invalid user data received from API')
  }

  return data // 타입이 User로 확정됨
}
```

### Form Validation 패턴

**규칙:** 폼 데이터 검증에도 Zod 스키마를 활용하여 일관성을 유지합니다.

```typescript
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

const ContactFormSchema = z.object({
  name: z.string().min(1, 'Please enter your name'),
  email: z.string().email('Please enter a valid email'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type ContactFormData = z.infer<typeof ContactFormSchema>;

export function ContactForm() {
  const form = useForm<ContactFormData>({
    resolver: zodResolver(ContactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      message: '',
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    // 데이터는 이미 스키마로 검증됨
    await submitContactForm(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* form fields */}
    </form>
  );
}
```

### 환경 변수 검증

**규칙:** 환경 변수도 Zod로 검증하여 런타임 오류를 방지합니다.

```typescript
// lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
})

export const env = envSchema.parse(process.env)

// 사용시 완전한 타입 안전성 보장
const isDev = env.NODE_ENV === 'development' // 타입 추론됨
```

---

## 5\. Prisma 생성 타입 최대 활용 원칙

**중요**: 이 프로젝트는 Prisma ORM을 사용하므로, Prisma에서 생성된 타입을 최대한 활용하여 단일 진실 공급원(Single Source of Truth)을 유지합니다.

### Prisma 타입 우선 사용

- **기본 원칙**: 새로운 타입을 정의하기 전에 반드시 Prisma 생성 타입을 먼저 검토합니다.
- **직접 사용**: `User`, `InterviewPreparation`, `Rating`, `PreparationStatus` 등 Prisma 모델과 enum은 직접 사용합니다.

```typescript
// ✅ Good: Prisma 생성 타입 직접 사용
import type { User, Rating, PreparationStatus } from '@/generated/prisma'

function updateUserRating(user: User, rating: Rating) {
  // implementation
}

// ❌ Bad: Prisma 타입이 있는데 중복 정의
type CustomRating = 'SURFACE' | 'INTERMEDIATE' | 'DEEP' // Rating enum이 이미 존재
```

### 유틸리티 타입으로 Prisma 타입 확장

Prisma 타입을 기반으로 유틸리티 타입을 적극 활용하여 UI/API 요구사항에 맞게 조정합니다.

```typescript
// ✅ Good: Prisma 타입 + 유틸리티 타입 활용
import type { User, InterviewPreparation } from '@/generated/prisma'

// API 응답용 - 민감한 정보 제외
type UserProfile = Pick<User, 'id' | 'email' | 'name' | 'imageUrl'> & {
  preferredLanguage: 'ko' | 'en'
}

// UI 목록용 - 필요한 필드만 선택
type PreparationSummary = Pick<
  InterviewPreparation,
  'id' | 'companyName' | 'jobTitle' | 'status' | 'progress'
> & {
  questionsCount: number
  completedCount: number
  createdAt: string // Date를 string으로 직렬화
}

// 폼 입력용 - 선택적 필드로 변환
type CreatePreparationInput = Partial<
  Pick<InterviewPreparation, 'companyName' | 'jobTitle' | 'jobDescription'>
>

// ❌ Bad: Prisma 타입 무시하고 중복 정의
interface CustomUser {
  id: string
  email: string
  name?: string
  // ... (User와 동일한 구조를 중복 정의)
}
```

### Prisma 관계형 타입 활용

복잡한 데이터 구조는 Prisma의 `Payload` 타입을 활용합니다.

```typescript
// ✅ Good: Prisma Payload 타입으로 관계 데이터 타입 정의
import type { Prisma } from '@/generated/prisma'

type InterviewPreparationWithDetails = Prisma.InterviewPreparationGetPayload<{
  include: {
    resume: {
      include: {
        profile: true
        careers: true
        projects: true
      }
    }
    questions: {
      include: {
        answers: {
          include: {
            feedback: true
          }
        }
      }
    }
  }
}>

// ❌ Bad: 관계형 데이터를 수동으로 정의
interface ManualInterviewPreparation {
  id: string
  companyName: string
  resume?: {
    profile?: CandidateProfile
    careers: CareerExperience[]
    // ... (복잡한 중첩 구조 수동 정의)
  }
}
```

### 타입 변환 어댑터 패턴

Prisma 타입과 UI 타입 간 변환은 명확한 어댑터 함수를 사용합니다.

```typescript
// ✅ Good: 명확한 타입 변환 어댑터
function mapPrismaUserToProfile(user: User): UserProfile {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    imageUrl: user.imageUrl,
    preferredLanguage: 'ko', // 기본값 추가
  }
}

// ✅ Good: 도메인 중심 함수명 (기술 스택 중립적)
function mapPreparationToSummary(prep: InterviewPreparation): PreparationSummary
```

---

## 6\. 주의사항 및 모범 사례

- **단순함과 명확성**: 가능한 한 타입을 단순하고 명확하게 유지합니다. 복잡한 타입은 여러 개의 작은 타입으로 분리하는 것을 고려합니다.
- **확장성 고려**: 타입 정의 시 미래의 요구사항 변경에 따른 확장 가능성을 염두에 둡니다.
- **순환 참조 방지**: 타입 파일 간의 순환 참조(`A -> B -> A`)는 예기치 않은 오류를 유발할 수 있으므로 구조 설계 시 주의합니다.
- **유틸리티 타입 활용**: `Partial<T>`, `Pick<T, K>`, `Omit<T, K>` 등 TypeScript 내장 유틸리티 타입을 적극 활용하여 불필요한 타입 중복을 줄입니다.
- **JSDoc 주석**: 복잡한 타입, 제네릭, 특정 비즈니스 로직이 담긴 타입에는 JSDoc 주석을 추가하여 다른 개발자의 이해를 돕습니다.
- **타입 단언 최소화**: `as` 키워드를 사용한 타입 단언은 타입 시스템의 추론을 무시하므로, 정말 불가피한 경우에만 사용하고 그 이유를 주석으로 명시해야 합니다.
