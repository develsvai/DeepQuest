# Interview Preparation Realtime Status Tracking

## 목표

Dashboard에서 Interview Preparation 생성 후 실시간으로 상태 변경을 추적하고, 완료 시 사용자에게 알림을 제공하는 기능 구현.

---

## 핵심 컨텍스트

### 상태 흐름 (현재 단계)

```
PENDING ──────────────────────────────> READY (Success)
    │
    └──────────────────────────────────> FAILED (Error)
```

**Note**: 현재 단계에서는 PENDING → READY 또는 PENDING → FAILED만 존재.
중간 상태(VALIDATING, ANALYZING)는 미래 확장용으로 예약됨.

### 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Protected Layout                             │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              InterviewPreparationProvider                      │  │
│  │  - Mount: Query pending preparations                          │  │
│  │  - Sync: Update Zustand store                                 │  │
│  │  - Subscribe: Realtime on interview_preparations table        │  │
│  │  - Handle: Status change → remove from store, invalidate,     │  │
│  │            show toast                                          │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                              │                                       │
│                              ▼                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │         useInterviewPreparationStore (Zustand)                 │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │ pendingIds: Record<string, true>  ← O(1) lookup         │  │  │
│  │  │ lastSyncedAt: number | null                              │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  │  Actions: addPending, removePending, syncFromServer, reset   │  │  │
│  │  Persist: localStorage (pendingIds only)                     │  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                              │                                       │
└──────────────────────────────┼───────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Dashboard Page                                  │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    PreparationItem                             │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │ useIsPreparationPending(id)                              │  │  │
│  │  │   └─> isPending ? <ContentSkeleton /> : <Content />      │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 설계 결정

### 1. InterviewPreparation 테이블 직접 구독 (vs WebhookEvent)

**선택 이유:**

- **Single Source of Truth**: `preparation.status`가 최종 상태를 나타냄
- **미래 확장 용이**: 내부에서 여러 webhook event가 발생해도 클라이언트 코드 변경 불필요
- **관심사 분리**: 클라이언트는 "준비 완료 여부"만 알면 됨

### 2. Zustand Persist Middleware

**선택 이유:**

- **새로고침 복구**: 페이지 새로고침 후에도 pending 상태 유지
- **partialize 사용**: `pendingIds`만 persist, `lastSyncedAt`은 제외 (메모리 전용)
- **서버 동기화**: 마운트 시 서버 데이터와 reconciliation

### 3. Skeleton 범위: ActionCardContent만

**선택 이유:**

- Header(제목, 날짜, 상태 Badge)는 이미 DB에서 가져온 정보
- Content(경력/프로젝트 목록)만 AI 파싱 결과에 의존
- Footer는 단순 버튼이므로 disabled 상태로 충분

---

## 구현 완료 파일

### 신규 생성 파일 (4개)

| 파일                                                                                | 설명                                    |
| ----------------------------------------------------------------------------------- | --------------------------------------- |
| `src/lib/stores/interview-preparation-store.ts`                                     | Zustand store (persist middleware 포함) |
| `src/hooks/use-preparation-status-subscription.ts`                                  | Supabase Realtime 구독 hook             |
| `src/components/providers/interview-preparation-provider.tsx`                       | Global provider                         |
| `src/app/[locale]/(protected)/dashboard/_components/PreparationContentSkeleton.tsx` | Skeleton UI                             |

### 수정된 파일 (5개)

| 파일                                                                               | 변경 사항                    |
| ---------------------------------------------------------------------------------- | ---------------------------- |
| `src/server/api/routers/interview-preparation/index.ts`                            | `listPending` procedure 추가 |
| `src/app/[locale]/(protected)/layout.tsx`                                          | Provider 추가                |
| `src/app/[locale]/(protected)/dashboard/_components/PreparationItem.tsx`           | Skeleton 조건부 렌더링       |
| `src/app/[locale]/(protected)/interview-prep/new/_components/NewInterviewPrep.tsx` | 생성 후 addPending 호출      |
| `locales/{ko,en}/dashboard.json`                                                   | i18n 번역 키 추가            |

---

## 핵심 구현 상세

### 1. Zustand Store (Persist Middleware)

**파일:** `src/lib/stores/interview-preparation-store.ts`

```typescript
interface InterviewPreparationState {
  pendingIds: Record<string, true> // preparationId → true (O(1) lookup)
  lastSyncedAt: number | null
}

interface InterviewPreparationActions {
  addPending: (preparationId: string) => void
  removePending: (preparationId: string) => void
  syncFromServer: (preparationIds: string[]) => void
  reset: () => void
}

// Persist middleware로 localStorage 저장
const useInterviewPreparationStoreBase = create<InterviewPreparationStore>()(
  devtools(
    persist(
      set => ({
        /* ... actions ... */
      }),
      {
        name: 'interview-preparation-store',
        partialize: state => ({ pendingIds: state.pendingIds }), // lastSyncedAt 제외
      }
    ),
    { name: 'InterviewPreparationStore' }
  )
)
```

**패턴:**

- Auto Selectors 패턴
- DevTools 지원
- `Record<string, true>`로 O(1) lookup

### 2. Supabase Realtime Hook

**파일:** `src/hooks/use-preparation-status-subscription.ts`

```typescript
interface UsePreparationStatusSubscriptionOptions {
  userId: string | undefined
  onStatusChange?: (payload: PreparationStatusPayload) => void
  enabled?: boolean
}

export function usePreparationStatusSubscription(options) {
  // Filter: user_id=eq.${userId}
  // Event: UPDATE (status column changes)
  // Callback ref pattern으로 불필요한 재연결 방지
}
```

### 3. Provider 컴포넌트

**파일:** `src/components/providers/interview-preparation-provider.tsx`

```typescript
export function InterviewPreparationProvider({ children }: PropsWithChildren) {
  // ✅ Actions from store via getState() - stable reference
  const { syncFromServer, removePending } =
    useInterviewPreparationStore.getState()

  // Derived selector for conditional subscription
  const hasPending = useInterviewPreparationStore(selectHasPending)

  // 1. Query pending preparations on mount
  const { data } = api.interviewPreparation.listPending.useQuery()

  // 2. Sync to Zustand store
  useEffect(() => {
    if (data) syncFromServer(data.ids)
  }, [data, syncFromServer])

  // 3. Handle status change (READY or FAILED)
  const handleStatusChange = useCallback((event: PreparationStatusPayload) => {
    if (event.status === 'READY' || event.status === 'FAILED') {
      removePending(event.id)
      void utils.interviewPreparation.list.invalidate()

      // Toast notification
      if (event.status === 'READY') {
        toast.success('분석이 완료되었습니다!')
      } else {
        toast.error('분석에 실패했습니다.')
      }
    }
  }, [])

  // 4. Subscribe (ONLY when hasPending is true)
  usePreparationStatusSubscription({
    userId,
    onStatusChange: handleStatusChange,
    enabled: !!userId && hasPending, // ← 구독 해제 조건
  })

  return <>{children}</>
}
```

**구독 해제 로직:**

- `removePending(id)` 호출 → `pendingIds`에서 해당 ID 제거
- 모든 pending이 제거되면 `hasPending = false`
- `enabled: hasPending`이 false가 되어 **구독 자동 해제**

### 4. tRPC Endpoint

**파일:** `src/server/api/routers/interview-preparation/index.ts`

```typescript
listPending: protectedProcedure.query(async ({ ctx }) => {
  const preparations = await ctx.prisma.interviewPreparation.findMany({
    where: {
      userId: ctx.userId,
      status: 'PENDING',
    },
    select: { id: true },
  })
  return { ids: preparations.map(p => p.id) }
})
```

### 5. PreparationItem 수정

**파일:** `src/app/[locale]/(protected)/dashboard/_components/PreparationItem.tsx`

```typescript
const isPending = useIsPreparationPending(preparation.id)

// ActionCardContent 조건부 렌더링
<ActionCardContent>
  {isPending ? (
    <PreparationContentSkeleton />
  ) : (
    hasExperiences && <ExperienceList careers={...} projects={...} />
  )}
</ActionCardContent>
```

### 6. NewInterviewPrep 수정

**파일:** `src/app/[locale]/(protected)/interview-prep/new/_components/NewInterviewPrep.tsx`

```typescript
const { addPending } = useInterviewPreparationStore.getState()

const createPrepMutation = api.interviewPreparation.create.useMutation({
  onSuccess: data => {
    addPending(data.preparationId) // 생성 직후 tracking 시작
    router.push(`/${locale}/dashboard`)
  },
})
```

---

## i18n Keys

### 한국어 (locales/ko/dashboard.json)

```json
{
  "preparationItem": {
    "analyzing": "이력서를 분석하고 있습니다...",
    "analysisComplete": "분석이 완료되었습니다!",
    "analysisCompleteDescription": "이력서 분석이 완료되어 면접 준비를 시작할 수 있습니다.",
    "analysisFailed": "분석에 실패했습니다.",
    "analysisFailedDescription": "다시 시도해 주세요."
  }
}
```

### 영어 (locales/en/dashboard.json)

```json
{
  "preparationItem": {
    "analyzing": "Analyzing your resume...",
    "analysisComplete": "Analysis completed!",
    "analysisCompleteDescription": "Resume analysis is complete. You can now start preparing for your interview.",
    "analysisFailed": "Analysis failed.",
    "analysisFailedDescription": "Please try again."
  }
}
```

---

## Quality Gates 완료

- [x] `pnpm type-check` 통과
- [x] `pnpm lint` 통과
- [x] `pnpm format:check` 통과
- [x] 모든 기존 테스트 통과

---

## 테스트 체크리스트

- [ ] 새 preparation 생성 → Dashboard에서 skeleton 표시
- [ ] AI 파싱 완료 → skeleton이 실제 데이터로 교체
- [ ] 완료 시 toast 메시지 표시
- [ ] 페이지 새로고침 후 pending 상태 유지
- [ ] 여러 pending preparation 동시 처리
- [ ] FAILED 상태 처리 (에러 toast)
- [ ] 브라우저 탭 전환 후 Realtime 재연결

---

## 미래 확장 고려사항

1. **중간 상태 활성화**: VALIDATING, ANALYZING 상태 사용 시
   - `listPending` 쿼리에 상태 추가: `status: { in: ['PENDING', 'VALIDATING', 'ANALYZING'] }`
   - Skeleton UI에 단계별 메시지 표시

2. **Progress 표시**: `preparation.progress` 필드를 활용한 진행률 표시

3. **취소 기능**: pending 상태에서 취소 버튼 추가

4. **재시도**: FAILED 상태에서 재시도 버튼

---

## Summary

| 항목               | 내용                                                          |
| ------------------ | ------------------------------------------------------------- |
| **상태 흐름**      | PENDING → READY 또는 PENDING → FAILED                         |
| **구독 대상**      | `interview_preparations` 테이블                               |
| **구독 해제 조건** | 모든 pending 항목이 제거되면 (`hasPending = false`)           |
| **Skeleton 범위**  | ActionCardContent만 (Header/Footer 유지)                      |
| **상태 지속성**    | Zustand persist middleware로 localStorage 저장                |
| **새 파일**        | 4개 (store, hook, provider, skeleton)                         |
| **수정 파일**      | 5개 (router, layout, PreparationItem, NewInterviewPrep, i18n) |

---

## 관련 문서

- **기존 구현 참고**: Question Generation Status Tracking (`question-generation-store.ts`, `QuestionGenerationProvider`)
- **계획 문서**: `.claude/plans/lively-yawning-honey.md`
