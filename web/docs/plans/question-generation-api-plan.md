# Question Generation API Integration Plan

## 목표

`TopicSelectionDialog`의 `handleSubmit`에서 선택된 카테고리를 기반으로 특정 KeyAchievement에 대한 질문 생성 API 호출 구현

---

## 핵심 컨텍스트

### Python AI InputState 구조 (source of truth)

```python
# ai/src/graphs/question_gen/state.py
class InputState(BaseStateConfig):
    applied_position: str
    experience: Experience  # experience_type + details
    key_achievement: KeyAchievement  # 단일 객체
    question_categories: list[QuestionCategoryName]
    existing_questions: list[Question] | None
```

### 현재 TS 스키마 (배치 방식 - 사용 안함)

```typescript
// 기존: experiences 배열 (배치 처리)
// 신규: 단일 KeyAchievement 기반으로 새 스키마 필요
```

---

## Phase 1: AI Contracts 스키마 생성

### 작업 내용

Python `InputState`에 맞는 새 TypeScript 스키마 생성

### 파일

- `src/server/services/ai/contracts/schemas/keyAchievementQuestionGen.ts` (신규)

### 스키마 구조

```typescript
// Input
KeyAchievementQuestionGenInputSchema = {
  appliedPosition: string,
  experience: {
    experienceType: 'CAREER' | 'PROJECT',
    details: CareerExperience | ProjectExperience
  },
  keyAchievement: KeyAchievementSchema,
  questionCategories: QuestionCategory[],
  existingQuestions?: Question[]
}

// Output
KeyAchievementQuestionGenOutputSchema = {
  questions: Question[]
}
```

### 완료 체크리스트

- [x] `keyAchievementQuestionGen.ts` 파일 생성
- [x] `KeyAchievementQuestionGenInputSchema` 정의
- [x] `KeyAchievementQuestionGenOutputSchema` 정의
- [x] 기존 `KeyAchievementSchema` 재사용 (project.py 구조 반영)
- [x] `pnpm type-check` 통과

---

## Phase 2: Service 레이어 생성

### 작업 내용

질문 생성 비즈니스 로직 서비스 구현

### 파일

- `src/server/services/question/generation.service.ts` (신규)
- `src/server/services/question/types.ts` (확장)
- `src/server/services/question/index.ts` (export 추가)

### 서비스 책임

1. KeyAchievement 및 관련 Experience 데이터 조회
2. 입력 데이터를 AI 스키마에 맞게 변환
3. LangGraphService 호출
4. WebhookEvent 레코드 생성 (추적용)

### 패턴 준수 (server/CLAUDE.md)

```typescript
// Service: 순수 비즈니스 로직만
export async function startQuestionGeneration(
  input: StartQuestionGenerationInput
): Promise<StartQuestionGenerationResult>

// 에러는 DomainError 사용 (TRPCError 금지)
```

### 완료 체크리스트

- [x] `generation.service.ts` 생성
- [x] `StartQuestionGenerationInput` 타입 정의
- [x] KeyAchievement + Experience 데이터 조회 로직
- [x] AI 입력 변환 로직
- [x] WebhookEvent 생성 로직
- [x] `index.ts`에서 export
- [ ] DomainError 사용 (TRPCError 사용 금지)

---

## Phase 3: LangGraphService 메서드 추가

### 작업 내용

단일 KeyAchievement 기반 질문 생성 메서드 추가

### 파일

- `src/server/services/ai/langgraph/service.ts` (확장)

### 구현된 메서드

```typescript
// langGraphService 객체 메서드
async runQuestionGen(
  input: KeyAchievementQuestionGenInput,
  keyAchievementId: string
): Promise<Run>
```

### 구현 특징

- **간결한 파라미터**: `input`과 `keyAchievementId`만 필요
- **스레드 내부 생성**: `threadId`를 외부에서 받지 않고 `_createThread()`로 내부 생성
- **Webhook URL**: `_generateWebhookUrl()`에서 `keyAchievementId` 파라미터 지원

### Webhook URL 생성

```typescript
_generateWebhookUrl(
  graphName: GraphNameType,
  preparationId?: string,      // 이력서 파싱용
  keyAchievementId?: string    // 질문 생성용
)
// 결과: /api/webhooks/ai-workflow?type=question_gen&keyAchievementId=123&signature=...
```

### 완료 체크리스트

- [x] `runQuestionGen` 메서드 추가
- [x] `KeyAchievementQuestionGenInput` 타입 import
- [x] webhook URL에 `keyAchievementId` 포함
- [x] `_generateWebhookUrl` 함수 확장 (keyAchievementId 파라미터 추가)

---

## Phase 4: tRPC Endpoint 생성

### 작업 내용

question router에 질문 생성 mutation 추가

### 파일

- `src/server/api/routers/question/index.ts` (확장)
- `src/server/api/routers/question/schema.ts` (확장)

### Endpoint 구조

```typescript
// question.startGeneration
startGeneration: protectedProcedure
  .input(startQuestionGenerationSchema)
  .mutation(async ({ ctx, input }) => {
    // 1. 권한 검증 (interviewPreparation 소유 확인)
    // 2. keyAchievement 소유권 검증
    // 3. Service 호출
    // 4. jobId 반환
  })
```

### 완료 체크리스트

- [x] `startQuestionGenerationSchema` Zod 스키마 정의
- [x] `startGeneration` mutation 추가
- [x] 권한 검증 로직 (기존 패턴 재사용)
- [x] Service 호출 및 에러 변환 (handleServiceError)
- [x] jobId (runId) 반환

---

## Phase 5: Webhook Handler V2 생성

### 작업 내용

단일 KeyAchievement 질문 생성 결과 처리를 위한 **새로운 V2 핸들러** 생성

### 파일

- `src/app/api/webhooks/ai-workflow/handlers/question-generation-v2.handler.ts` (신규)
- `src/app/api/webhooks/ai-workflow/handlers/index.ts` (export 추가)

### 설계 원칙

기존 `question-generation.handler.ts`는 레거시로 유지하고, 도메인 서비스를 활용한 V2 핸들러를 새로 생성

### 활용할 Domain Services

| Service               | 메서드                     | 용도                            |
| --------------------- | -------------------------- | ------------------------------- |
| `webhookEventService` | `getByRunIdOrThrow(runId)` | WebhookEvent 조회               |
| `webhookEventService` | `markRunning(id)`          | 처리 시작 상태 업데이트         |
| `webhookEventService` | `markCompleted(id)`        | 성공 상태 업데이트              |
| `webhookEventService` | `markFailed(id, error)`    | 실패 상태 업데이트              |
| `questionService`     | `createMany(questions)`    | 질문 일괄 생성 (신규 구현 필요) |

### 핸들러 구조

```typescript
// question-generation-v2.handler.ts
import { webhookEventService } from '@/server/services/webhook-event'
import { questionService } from '@/server/services/question'
import { snakeToCamelCase } from '@/lib/utils/case-transform'

export async function handleQuestionGenerationV2(payload: WebhookPayload) {
  const { run_id, result } = payload

  // 1. WebhookEvent 조회 (도메인 서비스 활용)
  const webhookEvent = await webhookEventService.getByRunIdOrThrow(run_id)
  const { keyAchievementId } = webhookEvent.metadata as {
    keyAchievementId: string
  }

  // 2. 처리 시작 표시
  await webhookEventService.markRunning(webhookEvent.id)

  try {
    // 3. 결과 변환 및 저장
    const questions = snakeToCamelCase(result.questions)
    await questionService.createMany({
      keyAchievementId,
      questions,
    })

    // 4. 성공 상태 업데이트
    await webhookEventService.markCompleted(webhookEvent.id)
  } catch (error) {
    // 5. 실패 상태 업데이트
    await webhookEventService.markFailed(webhookEvent.id, error)
    throw error
  }
}
```

### 처리 흐름

```
Webhook 수신
    ↓
webhookEventService.getByRunIdOrThrow(runId)
    ↓
webhookEventService.markRunning(id)
    ↓
snakeToCamelCase(result) → 데이터 변환
    ↓
questionService.createMany() → DB 저장
    ↓
webhookEventService.markCompleted(id)
```

### questionService 확장 필요

```typescript
// src/server/services/question/question.service.ts 에 추가
async function createMany(input: CreateManyQuestionsInput): Promise<void> {
  await prisma.question.createMany({
    data: input.questions.map(q => ({
      keyAchievementId: input.keyAchievementId,
      content: q.content,
      category: q.category,
      // ... 기타 필드
    })),
  })
}
```

### 완료 체크리스트

- [x] `question-generation-v2.handler.ts` 파일 생성
- [x] `webhookEventService` 활용하여 이벤트 조회/상태 관리
- [x] `questionService.createMany` 메서드 추가
- [x] 에러 발생 시 `webhookEventService.markFailed` 호출
- [x] `handlers/index.ts`에 export 추가
- [x] 기존 `question-generation.handler.ts`는 레거시로 유지

---

## Phase 6: 프론트엔드 연결

### 작업 내용

TopicSelectionDialog에서 API 호출 및 상태 관리

### 파일

- `src/app/[locale]/(protected)/interview-prep/[id]/[experienceType]/[experienceId]/_components/ExperienceDetail.tsx`
- `src/app/[locale]/(protected)/interview-prep/[id]/[experienceType]/[experienceId]/_components/ExperienceDetail.hooks.ts` (확장)

### 구현 내용

```typescript
// hooks에 추가
const generateMutation = api.question.startGeneration.useMutation({
  onSuccess: data => {
    // jobId 저장 (polling 또는 realtime용)
    toast.success('질문 생성이 시작되었습니다')
  },
  onError: error => {
    toast.error('질문 생성 실패', { description: error.message })
  },
})

// ExperienceDetail.tsx
const handleTopicSubmit = (categories: QuestionCategory[]) => {
  generateMutation.mutate({
    interviewPreparationId,
    experienceType,
    experienceId,
    keyAchievementId: generatingAchievementId,
    questionCategories: categories,
  })
  setIsTopicDialogOpen(false)
}
```

### 완료 체크리스트

- [x] `useQuestionGeneration` hook 또는 기존 hooks 확장
- [x] mutation 호출 로직
- [x] 로딩 상태 UI 표시
- [x] 성공/실패 toast 메시지
- [x] 다이얼로그 닫기 처리

---

## Phase 7: Supabase Realtime 적용 (마지막)

### 작업 내용

WebhookEvent 테이블의 status 변경을 감지하여 질문 생성 완료 시 실시간 UI 업데이트

### 접근 방식

**기존 (폐기)**: Question 테이블의 다중 `keyAchievementId` 구독
**변경**: WebhookEvent 테이블의 `userId + graphName` 단일 구독

| 구분      | 기존                                | 변경                         |
| --------- | ----------------------------------- | ---------------------------- | --- |
| 구독 대상 | Question 테이블 INSERT              | WebhookEvent 테이블 UPDATE   |
| 필터      | `key_achievement_id=eq.${id}` × N개 | `user_id=eq.${userId}` × 1개 |     |
| 동적 관리 | 채널 재생성 필요                    | 불필요 (userId 고정)         |

### 파일

**DB 변경:**

- `prisma/schema.prisma` (수정)

**서비스 변경:**

- `src/server/services/webhook-event/types.ts` (수정)
- `src/server/services/webhook-event/webhook-event.service.ts` (수정)
- `src/server/services/question/generation.service.ts` (수정)

**프론트엔드:**

- `src/hooks/use-webhook-event-subscription.ts` (신규)
- `ExperienceDetail.hooks.ts` (수정)

### Step 7.1: DB 스키마 변경

WebhookEvent에 `userId` 칼럼 추가 및 backfill 마이그레이션

```prisma
model WebhookEvent {
  id            String                @id @default(cuid())
  userId        String                // 🆕 추가 (required)
  preparationId String?
  graphName     String
  runId         String
  threadId      String
  status        WebhookStatus         @default(PENDING)
  metadata      Json?
  createdAt     DateTime              @default(now()) @map("created_at")
  completedAt   DateTime?
  error         Json?

  @@index([userId, graphName])        // 🆕 복합 인덱스
  @@index([preparationId])
  @@index([runId])
  @@index([threadId])
  @@map("webhook_events")
}
```

**마이그레이션 전략:**

1. userId를 nullable로 추가
2. backfill: `preparationId` → `InterviewPreparation.userId`로 업데이트
3. userId를 required로 변경

### Step 7.2: 서비스 레이어 수정

**types.ts:**

```typescript
export interface CreateWebhookEventInput {
  userId: string // 🆕 필수
  preparationId?: string
  graphName: string
  runId: string
  threadId: string
  metadata?: Record<string, unknown>
}
```

**generation.service.ts:**

```typescript
const webhookEvent = await webhookEventService.create({
  userId, // 🆕 추가
  graphName: GraphName.QUESTION_GEN,
  runId: run.run_id,
  threadId: run.thread_id,
  metadata: {
    keyAchievementId,
    experienceType,
    experienceId,
    questionCategories,
  },
})
```

**레거시 코드 호환성 수정 (추가 작업):**

`userId`가 required로 변경됨에 따라, `prisma.webhookEvent.create()`를 직접 호출하는 모든 레거시 코드에도 `userId` 추가:

| 파일                                                         | 수정 내용                                            |
| ------------------------------------------------------------ | ---------------------------------------------------- |
| `interview-workflow/services/jd-structuring.service.ts`      | `createWorkflowTracker`에 userId 파라미터 추가       |
| `interview-workflow/services/resume-parsing.service.ts`      | `createResumeWorkflowTracker`에 userId 파라미터 추가 |
| `interview-workflow/services/question-generation.service.ts` | `PreparationData`에 userId 추가                      |
| `interview-prep/create.service.ts`                           | `webhookEvent.create`에 userId 추가                  |
| `interview-workflow/router.ts`                               | `processJobPosting` 호출 시 ctx.userId 전달          |
| `webhooks/ai-workflow/handlers/jd-structuring.handler.ts`    | `processResumeParsing` 호출 시 userId 전달           |

### Step 7.3: Supabase Realtime Hook 생성

**파일:** `src/hooks/use-webhook-event-subscription.ts`

```typescript
interface UseWebhookEventSubscriptionOptions {
  userId: string
  graphName?: string // 클라이언트에서 필터링
  onStatusChange?: (event: WebhookEventPayload) => void
  enabled?: boolean
}

function useWebhookEventSubscription(
  options: UseWebhookEventSubscriptionOptions
) {
  const { userId, graphName, onStatusChange, enabled = true } = options

  useEffect(() => {
    if (!enabled || !userId) return

    const channel = supabase
      .channel(`webhook-events:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'webhook_events',
          filter: `user_id=eq.${userId}`,
        },
        payload => {
          const event = payload.new as WebhookEvent
          // graphName 필터링 (클라이언트에서)
          if (graphName && event.graph_name !== graphName) return
          onStatusChange?.(event)
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
      supabase.removeChannel(channel)
    }
  }, [userId, graphName, enabled])

  return { isSubscribed: true }
}
```

### Step 7.4: ExperienceDetail 연동

```typescript
// ExperienceDetail.hooks.ts
const { userId } = useAuth()
const utils = api.useUtils()

useWebhookEventSubscription({
  userId,
  graphName: 'QUESTION_GEN',
  onStatusChange: event => {
    if (event.status === 'SUCCESS') {
      const { keyAchievementId } = event.metadata as {
        keyAchievementId: string
      }
      // tRPC 캐시 무효화 → UI 자동 업데이트
      void utils.question.listByKeyAchievement.invalidate({ keyAchievementId })
      toast.success('질문 생성이 완료되었습니다')
    } else if (event.status === 'ERROR') {
      toast.error('질문 생성 실패', { description: event.error?.message })
    }
  },
  enabled: true,
})
```

### 완료 체크리스트

**DB 변경:**

- [x] WebhookEvent에 `userId` 칼럼 추가 (nullable)
- [x] backfill 마이그레이션 (preparationId → InterviewPreparation.userId)
- [x] `userId`를 required로 변경
- [x] `[userId, graphName]` 복합 인덱스 추가
- [x] 마이그레이션 실행 및 검증

**서비스 변경:**

- [x] `CreateWebhookEventInput`에 `userId` 필드 추가
- [x] `webhookEventService.create()`에서 `userId` 저장
- [x] `generation.service.ts`에서 `userId` 전달
- [x] 레거시 `prisma.webhookEvent.create()` 호출부에 userId 추가 (6개 파일)

**프론트엔드:**

- [x] `useWebhookEventSubscription` hook 생성
- [x] Supabase client 설정 확인 (Realtime 활성화)
- [x] ExperienceDetail에서 hook 사용
- [x] 질문 생성 완료 시 캐시 무효화
- [x] 성공/실패 toast 메시지
- [x] 구독 cleanup 처리

**Fallback:**

- [ ] Realtime 연결 실패 시 polling 방식 구현

---

## Phase 8: 전역 Question Generation Status 리팩토링

### 배경 및 맥락

**현재 구현 상태 (Phase 7 완료):**

- `useWebhookEventSubscription`: Supabase Realtime으로 userId 기준 WebhookEvent 구독
- `useQuestionGenerationStatus`: ExperienceDetail 페이지에서 `useState`로 `generatingAchievementIds` 관리
- **문제점**: 페이지 새로고침 시 로컬 state가 초기화되어 구독이 끊어짐

**새로운 요구사항:**

1. **전역 구독 관리**: Supabase Realtime 구독을 전역적으로 관리
2. **페이지 간 상태 공유**: Questions 페이지에서도 generation 상태 확인 가능
3. **새로고침 복구**: DB 조회로 진행 중인 generation 감지 후 자동 재구독
4. **미래 확장성**: Notification system 도입 시 앱 전체에서 결과 알림 가능

### 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────┐
│                        App 진입점                            │
│  └── QuestionGenerationProvider (전역 구독 관리)              │
│       ├── 1. 페이지 로드 시 DB에서 PENDING/RUNNING 조회        │
│       ├── 2. Zustand store에 동기화                          │
│       └── 3. Supabase Realtime 구독 활성화                    │
├─────────────────────────────────────────────────────────────┤
│  ExperienceDetail 페이지                                     │
│  └── useQuestionGenerationStore() 사용                       │
│       └── generatingAchievementIds 읽기/추가                  │
├─────────────────────────────────────────────────────────────┤
│  Questions 페이지                                            │
│  └── useQuestionGenerationStore() 사용                       │
│       └── 해당 experience의 generation 상태 표시              │
└─────────────────────────────────────────────────────────────┘
```

### Step 8.1: Zustand Store 생성 (Best Practice 패턴)

**파일:** `src/lib/stores/question-generation-store.ts` (신규)

**Best Practice 적용:**

1. **State/Actions 분리** - 명확한 타입 정의
2. **Record 사용** - `Set<number>` 대신 직렬화 가능한 `Record<number, true>`
3. **Auto Selectors** - `createSelectors` 패턴으로 깔끔한 API
4. **Named Actions** - devtools 디버깅용 액션 이름
5. **Manual Immutability** - 간단한 객체 연산이므로 immer 없이 spread 연산자로 불변성 관리
6. **Custom Hooks** - 클로저 문제 해결을 위한 `useCallback` 패턴

```typescript
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { StoreApi, UseBoundStore } from 'zustand'
import { useCallback } from 'react'

// ============================================
// Types (State와 Actions 분리)
// ============================================

interface QuestionGenerationState {
  /** 현재 생성 중인 keyAchievementId Record (직렬화 가능) */
  generatingIds: Record<number, true>
  /** 마지막 서버 동기화 타임스탬프 */
  lastSyncedAt: number | null
}

interface QuestionGenerationActions {
  addGenerating: (keyAchievementId: number) => void
  removeGenerating: (keyAchievementId: number) => void
  syncFromServer: (keyAchievementIds: number[]) => void
  reset: () => void
}

type QuestionGenerationStore = QuestionGenerationState &
  QuestionGenerationActions

// ============================================
// Initial State
// ============================================

const initialState: QuestionGenerationState = {
  generatingIds: {},
  lastSyncedAt: null,
}

// ============================================
// Store Creation (devtools only - manual immutability)
// ============================================

const useQuestionGenerationStoreBase = create<QuestionGenerationStore>()(
  devtools(
    set => ({
      ...initialState,

      addGenerating: keyAchievementId =>
        set(
          state => ({
            ...state,
            generatingIds: { ...state.generatingIds, [keyAchievementId]: true },
          }),
          undefined,
          'questionGen/add'
        ),

      removeGenerating: keyAchievementId =>
        set(
          state => {
            const { [keyAchievementId]: _, ...rest } = state.generatingIds
            return { ...state, generatingIds: rest }
          },
          undefined,
          'questionGen/remove'
        ),

      syncFromServer: keyAchievementIds =>
        set(
          () => ({
            generatingIds: Object.fromEntries(
              keyAchievementIds.map(id => [id, true as const])
            ),
            lastSyncedAt: Date.now(),
          }),
          undefined,
          'questionGen/syncFromServer'
        ),

      reset: () => set(initialState, undefined, 'questionGen/reset'),
    }),
    { name: 'QuestionGenerationStore' }
  )
)

// ============================================
// Auto Selectors (Best Practice - 공식 문서 패턴)
// ============================================

type WithSelectors<S> = S extends { getState: () => infer T }
  ? S & { use: { [K in keyof T]: () => T[K] } }
  : never

const createSelectors = <S extends UseBoundStore<StoreApi<object>>>(
  _store: S
) => {
  const store = _store as WithSelectors<typeof _store>
  store.use = {} as WithSelectors<S>['use']
  for (const k of Object.keys(store.getState())) {
    ;(store.use as Record<string, () => unknown>)[k] = () =>
      store(s => s[k as keyof typeof s])
  }
  return store
}

export const useQuestionGenerationStore = createSelectors(
  useQuestionGenerationStoreBase
)

// ============================================
// Derived Selectors (정적 selectors만 - 리렌더 안전)
// ============================================

/** 생성 중인 총 개수 */
export const selectGeneratingCount = (state: QuestionGenerationState) =>
  Object.keys(state.generatingIds).length

/** 생성 중인 항목이 있는지 */
export const selectHasGenerating = (state: QuestionGenerationState) =>
  Object.keys(state.generatingIds).length > 0

/** 생성 중인 ID 배열 */
export const selectGeneratingIdArray = (state: QuestionGenerationState) =>
  Object.keys(state.generatingIds).map(Number)

// ============================================
// Custom Hooks (동적 파라미터용 - 클로저 문제 해결)
// ============================================

/**
 * 특정 keyAchievementId가 생성 중인지 확인하는 최적화된 훅
 * useCallback으로 selector 안정화하여 불필요한 리렌더 방지
 */
export function useIsKeyAchievementGenerating(keyAchievementId: number) {
  return useQuestionGenerationStore(
    useCallback(
      (state: QuestionGenerationState) =>
        keyAchievementId in state.generatingIds,
      [keyAchievementId]
    )
  )
}
```

**사용 예시:**

```typescript
// Auto Selector 사용 (단일 값)
const generatingIds = useQuestionGenerationStore.use.generatingIds()

// Custom Hook 사용 (특정 ID 확인 - 권장)
const isGenerating = useIsKeyAchievementGenerating(123)

// Derived Selector 사용 (boolean/number 반환)
const hasGenerating = useQuestionGenerationStore(selectHasGenerating)

// useShallow로 여러 값 선택 (리렌더 최적화)
import { useShallow } from 'zustand/shallow'
const { generatingIds, lastSyncedAt } = useQuestionGenerationStore(
  useShallow(state => ({
    generatingIds: state.generatingIds,
    lastSyncedAt: state.lastSyncedAt,
  }))
)
```

### Step 8.2: tRPC Endpoint 추가

**파일:** `src/server/api/routers/question/index.ts` (확장)

```typescript
// question.getPendingGenerations
getPendingGenerations: protectedProcedure.query(async ({ ctx }) => {
  // WebhookEvent에서 PENDING/RUNNING 상태인 QUESTION_GEN 조회
  const pendingEvents = await prisma.webhookEvent.findMany({
    where: {
      userId: ctx.userId,
      graphName: GraphName.QUESTION_GEN,
      status: { in: ['PENDING', 'RUNNING'] },
    },
    select: {
      metadata: true,
    },
  })

  // metadata에서 keyAchievementId 추출
  return {
    keyAchievementIds: pendingEvents
      .map(e => (e.metadata as { keyAchievementId?: number })?.keyAchievementId)
      .filter((id): id is number => id !== undefined),
  }
})
```

### Step 8.3: QuestionGenerationProvider 생성 (Best Practice)

**파일:** `src/providers/question-generation-provider.tsx` (신규)

**책임:**

1. 앱 마운트 시 `getPendingGenerations` 호출
2. 결과를 Zustand store에 동기화 (`syncFromServer`)
3. React hooks로 store 변경 감지 → Realtime 구독 자동 활성화
4. 상태 변경 시 store 업데이트 + tRPC cache 무효화

**Best Practice 적용:**

- **Zustand actions는 stable reference** - ref 패턴 불필요
- **Derived Selector 활용** - `selectHasGenerating` 등 재사용
- **useCallback** - 핸들러 참조 안정화

```typescript
'use client'

import { type PropsWithChildren, useCallback, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'

import { api } from '@/trpc/react'
import {
  useQuestionGenerationStore,
  selectHasGenerating,
} from '@/lib/stores/question-generation-store'
import {
  useWebhookEventSubscription,
  type WebhookEventRealtimePayload,
} from '@/hooks/use-webhook-event-subscription'
import { GraphName } from '@/server/services/ai/langgraph/types/graphs'
import { WebhookStatus } from '@/generated/prisma/enums'

export function QuestionGenerationProvider({ children }: PropsWithChildren) {
  const { userId } = useAuth()
  const utils = api.useUtils()

  // ✅ Best Practice: Actions는 stable reference이므로 getState()로 직접 접근
  // React 리렌더와 무관하게 항상 최신 actions 참조 가능
  const { syncFromServer, removeGenerating } = useQuestionGenerationStore.getState()

  // Derived selector로 구독 필요 여부 판단
  const hasGenerating = useQuestionGenerationStore(selectHasGenerating)

  // 1. 페이지 로드 시 pending generations 조회
  const { data: pendingData } = api.question.getPendingGenerations.useQuery(
    undefined,
    { enabled: !!userId }
  )

  // 2. DB 결과를 store에 동기화
  // ✅ getState()로 가져온 actions는 의존성 배열에 포함 불필요
  useEffect(() => {
    if (pendingData) {
      syncFromServer(pendingData.keyAchievementIds)
    }
  }, [pendingData])

  // 3. Realtime 구독 핸들러
  const handleStatusChange = useCallback(
    (event: WebhookEventRealtimePayload) => {
      const keyAchievementId = event.metadata?.keyAchievementId
      if (typeof keyAchievementId !== 'number') return

      if (
        event.status === WebhookStatus.SUCCESS ||
        event.status === WebhookStatus.ERROR
      ) {
        removeGenerating(keyAchievementId)

        // tRPC cache 무효화 (키 기반 invalidation)
        void utils.experienceDetail.getById.invalidate()
        void utils.question.listByExperience.invalidate()
        void utils.question.getPendingGenerations.invalidate()

        // Toast notification
        if (event.status === WebhookStatus.SUCCESS) {
          toast.success('Question generation completed', {
            description: 'New questions are now available.',
          })
        } else {
          const errorMsg =
            (event.error as { message?: string })?.message ?? 'Unknown error'
          toast.error('Question generation failed', {
            description: errorMsg,
          })
        }
      }
    },
    [utils] // ✅ removeGenerating는 getState()에서 가져왔으므로 의존성 불필요
  )

  // 4. Supabase Realtime 구독 (hasGenerating이 true일 때만)
  useWebhookEventSubscription({
    userId: userId ?? undefined,
    graphName: GraphName.QUESTION_GEN,
    onStatusChange: handleStatusChange,
    enabled: !!userId && hasGenerating,
  })

  return <>{children}</>
}
```

### Step 8.4: Provider 위치 결정

**파일:** `src/app/[locale]/(protected)/layout.tsx` (수정)

```typescript
export default async function ProtectedLayout({ children }) {
  return <QuestionGenerationProvider>{children}</QuestionGenerationProvider>
}
```

**이유:**

- `(protected)` 내의 모든 페이지에서 generation 상태 접근 가능
- 로그인된 사용자에게만 적용
- 불필요한 public 페이지에서의 구독 방지

### Step 8.5: ExperienceDetail.hooks.ts 리팩토링 (Best Practice)

**기존:** 로컬 `useState`로 `generatingAchievementIds` 관리
**변경:** Zustand store + derived selectors 사용

```typescript
import { useCallback } from 'react'
import {
  useQuestionGenerationStore,
  useIsKeyAchievementGenerating,
} from '@/lib/stores/question-generation-store'

/**
 * 간소화된 hook - Provider가 구독을 관리하므로 여기서는 store만 사용
 */
export function useQuestionGenerationStatus() {
  // ✅ Best Practice: Actions는 getState()로 직접 접근 (리렌더 유발 안함)
  const { addGenerating } = useQuestionGenerationStore.getState()

  // ✅ Record 기반 O(1) 조회를 위해 generatingIds Record 직접 사용
  const generatingIds = useQuestionGenerationStore.use.generatingIds()

  const trackGeneration = useCallback(
    (keyAchievementId: number) => {
      addGenerating(keyAchievementId)
    },
    [] // ✅ getState()로 가져온 actions는 의존성 불필요
  )

  // ✅ Best Practice: Record 기반 O(1) 조회 (배열 includes() 대신)
  const isGenerating = useCallback(
    (id: number) => id in generatingIds,
    [generatingIds]
  )

  return {
    /** 생성 중인 keyAchievementId Record */
    generatingIds,
    /** 특정 ID가 생성 중인지 확인 - O(1) 조회 */
    isGenerating,
    /** generation 시작 시 호출 */
    trackGeneration,
  }
}

// ✅ 개별 카드에서는 custom hook 직접 사용 권장 (최적화된 리렌더)
export { useIsKeyAchievementGenerating }
```

**ExperienceDetail.tsx에서 사용:**

```typescript
// 전체 리스트용
const { generatingIds, trackGeneration } = useQuestionGenerationStatus()

// 개별 카드에서 최적화된 체크
const isThisGenerating = useIsKeyAchievementGenerating(achievement.id)
```

**삭제할 코드:**

- `useState<Set<number>>` 로컬 상태
- `useWebhookEventSubscription` 직접 호출 (Provider로 이동)
- `ConnectionStatus` 관련 코드 (Provider가 관리)

### Step 8.6: Questions 페이지 연동 (Best Practice)

**파일:** `src/app/.../questions/_components/Questions.tsx` (수정)

```typescript
'use client'

import { Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useIsKeyAchievementGenerating } from '@/lib/stores/question-generation-store'

interface QuestionsProps {
  questionsByCategory: Partial<Record<QuestionCategory, QuestionListItem[]>>
  keyAchievementId?: number  // searchParams에서 전달받음
}

export default function Questions({
  questionsByCategory,
  keyAchievementId,
}: QuestionsProps) {
  // Custom hook 사용 - useCallback으로 selector 안정화됨
  const isGenerating = useIsKeyAchievementGenerating(keyAchievementId ?? 0)

  // keyAchievementId가 없으면 생성 상태 표시 안함
  const showGeneratingAlert = keyAchievementId && isGenerating

  return (
    <div className='space-y-6'>
      {/* Generation 진행 중 알림 */}
      {showGeneratingAlert && (
        <Alert>
          <Loader2 className='h-4 w-4 animate-spin' />
          <AlertDescription>
            Questions are being generated for this achievement...
          </AlertDescription>
        </Alert>
      )}

      {/* ... 기존 UI (카테고리 필터, 질문 목록 등) */}
    </div>
  )
}
```

**page.tsx에서 keyAchievementId 전달:**

```typescript
// questions/page.tsx
<Questions
  questionsByCategory={questionsResult.questionsByCategory}
  keyAchievementId={keyAchievementId ?? undefined}
/>
```

### 완료 체크리스트

**Zustand Store (Best Practice):**

- [x] `question-generation-store.ts` 파일 생성
- [x] `Record<number, true>` 사용 (Set 대신 - 직렬화 가능)
- [x] State/Actions 인터페이스 분리
- [x] `devtools` 미들웨어만 사용 (간단한 객체 연산이므로 immer 불필요, spread 연산자로 불변성 관리)
- [x] Named actions (devtools 디버깅용): `'questionGen/add'` 등
- [x] `createSelectors` 패턴으로 auto selectors 생성 (`UseBoundStore<StoreApi<object>>` 타입 사용)
- [x] Derived selectors (정적): `selectHasGenerating`, `selectGeneratingIdArray`, `selectGeneratingCount`
- [x] Custom hook (동적): `useIsKeyAchievementGenerating` (useCallback으로 클로저 문제 해결)

**tRPC Endpoint:**

- [x] `getPendingGenerations` query 추가
- [x] PENDING/RUNNING 상태 WebhookEvent 조회
- [x] metadata에서 keyAchievementId 추출

**Provider (Best Practice):**

- [x] `QuestionGenerationProvider` 생성
- [x] Zustand actions는 `getState()`로 직접 접근 (리렌더 유발 안함, 의존성 배열 불필요)
- [x] `selectHasGenerating` derived selector 사용
- [x] 초기 로드 시 DB 동기화 로직
- [x] Realtime 구독 (hasGenerating 조건부)
- [x] tRPC cache invalidation (키 기반)
- [x] Toast notification 연동
- [x] `(protected)/layout.tsx`에 Provider 배치

**기존 코드 리팩토링:**

- [x] `ExperienceDetail.hooks.ts`에서 로컬 `useState` 제거
- [x] `useQuestionGenerationStatus` 훅 간소화 (store만 사용)
- [x] Actions는 `getState()`로 접근, `isGenerating`은 Record 기반 O(1) 조회
- [x] `useIsKeyAchievementGenerating` store에서 re-export
- [x] `useWebhookEventSubscription` 직접 호출 제거 (Provider로 이동)
- [x] `ConnectionStatus` 관련 코드 제거

**Questions 페이지:**

- [x] `keyAchievementId` prop 추가
- [x] `useIsKeyAchievementGenerating` custom hook 사용
- [x] Generation 진행 중 Alert UI 추가
- [x] page.tsx에서 keyAchievementId 전달

**Quality Gates:**

- [x] `pnpm type-check` 통과
- [x] `pnpm lint` 통과
- [x] `pnpm build` 성공
- [x] Redux DevTools에서 액션 확인 (named actions)
- [x] 페이지 새로고침 후 구독 복구 테스트
- [x] Questions 페이지에서 상태 확인 테스트
- [x] 불필요한 리렌더 없음 확인 (React DevTools Profiler)

### 향후 확장 (미래 계획)

Phase 8 완료 후 notification system 도입 시:

1. Provider에서 전역 notification 연동
2. Header에 generation 진행 상태 badge 표시
3. 모든 페이지에서 완료 알림 수신 가능

---

## 핵심 파일 경로 요약

### 신규 생성

1. `src/server/services/ai/contracts/schemas/keyAchievementQuestionGen.ts`
2. `src/server/services/question/generation.service.ts`
3. `src/server/services/webhook-event/webhook-event.service.ts`
4. `src/app/api/webhooks/ai-workflow/handlers/question-generation-v2.handler.ts` (Phase 5)
5. `src/hooks/use-webhook-event-subscription.ts` (Phase 7)
6. `src/lib/stores/question-generation-store.ts` (Phase 8)
7. `src/providers/question-generation-provider.tsx` (Phase 8)

### 수정

1. `src/server/services/ai/langgraph/service.ts`
2. `src/server/api/routers/question/index.ts`
3. `src/server/api/routers/question/schema.ts`
4. `src/server/services/question/types.ts`
5. `src/server/services/question/index.ts`
6. `src/server/services/question/question.service.ts` (createMany 메서드 추가)
7. `src/app/api/webhooks/ai-workflow/handlers/index.ts` (V2 핸들러 export 추가)
8. `src/app/[locale]/(protected)/interview-prep/[id]/[experienceType]/[experienceId]/_components/ExperienceDetail.tsx`
9. `src/app/[locale]/(protected)/interview-prep/[id]/[experienceType]/[experienceId]/_components/ExperienceDetail.hooks.ts`
10. `prisma/schema.prisma` (WebhookEvent에 userId 추가) (Phase 7)
11. `src/server/services/webhook-event/types.ts` (userId 필드 추가) (Phase 7)
12. `src/app/[locale]/(protected)/layout.tsx` (QuestionGenerationProvider 추가) (Phase 8)
13. `src/app/.../questions/_components/Questions.tsx` (Generation 상태 표시) (Phase 8)

---

## 의존성 순서

```
Phase 1 (스키마)
    ↓
Phase 2 (Service) ← Phase 3 (LangGraph)
    ↓
Phase 4 (tRPC)
    ↓
Phase 5 (Webhook)
    ↓
Phase 6 (Frontend)
    ↓
Phase 7 (Realtime)
    ↓
Phase 8 (Global State Management)
```

Phase 2와 3은 병렬 진행 가능

---

## Quality Gates

각 Phase 완료 후:

- [x] `pnpm type-check` 통과
- [x] `pnpm lint` 통과
- [x] 관련 코드에서 console.log 디버깅 제거
- [x] server/CLAUDE.md 패턴 준수 확인
