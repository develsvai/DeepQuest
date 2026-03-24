/**
 * Interview Preparation Store
 *
 * Zustand store for managing interview preparation status globally.
 * Tracks which preparations are currently pending (being processed by AI).
 *
 * Best Practice patterns applied:
 * - State/Actions separation
 * - Record<string, true> for serializable Set-like behavior
 * - Auto Selectors with createSelectors pattern
 * - Named actions for devtools debugging
 * - Manual immutability (simple object operations, no immer needed)
 * - Custom hooks for optimized subscriptions
 * - Persist middleware for state persistence across page reloads
 */

import { useCallback } from 'react'
import type { StoreApi, UseBoundStore } from 'zustand'
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { PreparationStatus } from '@/generated/prisma/enums'

// ============================================
// Types (State와 Actions 분리)
// ============================================

/** 개별 preparation의 realtime progress 데이터 */
export interface PreparationProgressData {
  status: PreparationStatus
  totalQuestionGenTasks: number | null
  completedQuestionGenTasks: number | null
  lastUpdatedAt: number
}

interface InterviewPreparationState {
  /** 현재 pending 상태인 preparationId Record (직렬화 가능) */
  pendingIds: Record<string, true>
  /** 마지막 서버 동기화 타임스탬프 */
  lastSyncedAt: number | null
  /** Realtime progress 데이터 (preparationId → progress) */
  progressMap: Record<string, PreparationProgressData>
}

interface InterviewPreparationActions {
  addPending: (preparationId: string) => void
  removePending: (preparationId: string) => void
  syncFromServer: (preparationIds: string[]) => void
  /** Realtime progress 데이터 업데이트 */
  updateProgress: (
    preparationId: string,
    data: Omit<PreparationProgressData, 'lastUpdatedAt'>
  ) => void
  /** Terminal state 도달 시 progress 데이터 제거 */
  clearProgress: (preparationId: string) => void
  reset: () => void
}

type InterviewPreparationStore = InterviewPreparationState &
  InterviewPreparationActions

// ============================================
// Initial State
// ============================================

const initialState: InterviewPreparationState = {
  pendingIds: {},
  lastSyncedAt: null,
  progressMap: {},
}

// ============================================
// Store Creation (devtools + persist)
// ============================================

const useInterviewPreparationStoreBase = create<InterviewPreparationStore>()(
  devtools(
    persist(
      set => ({
        ...initialState,

        addPending: preparationId =>
          set(
            state => ({
              ...state,
              pendingIds: { ...state.pendingIds, [preparationId]: true },
            }),
            undefined,
            'interviewPrep/add'
          ),

        removePending: preparationId =>
          set(
            state => {
              const { [preparationId]: _, ...rest } = state.pendingIds
              return { ...state, pendingIds: rest }
            },
            undefined,
            'interviewPrep/remove'
          ),

        syncFromServer: preparationIds =>
          set(
            () => ({
              pendingIds: Object.fromEntries(
                preparationIds.map(id => [id, true as const])
              ),
              lastSyncedAt: Date.now(),
            }),
            undefined,
            'interviewPrep/syncFromServer'
          ),

        updateProgress: (preparationId, data) =>
          set(
            state => ({
              ...state,
              progressMap: {
                ...state.progressMap,
                [preparationId]: {
                  ...data,
                  lastUpdatedAt: Date.now(),
                },
              },
            }),
            undefined,
            'interviewPrep/updateProgress'
          ),

        clearProgress: preparationId =>
          set(
            state => {
              const { [preparationId]: _, ...rest } = state.progressMap
              return { ...state, progressMap: rest }
            },
            undefined,
            'interviewPrep/clearProgress'
          ),

        reset: () => set(initialState, undefined, 'interviewPrep/reset'),
      }),
      {
        name: 'interview-preparation-store',
        // Persist pendingIds and progressMap for page reload survival
        partialize: state => ({
          pendingIds: state.pendingIds,
          progressMap: state.progressMap,
        }),
      }
    ),
    { name: 'InterviewPreparationStore' }
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

export const useInterviewPreparationStore = createSelectors(
  useInterviewPreparationStoreBase
)

// ============================================
// Derived Selectors (정적 selectors만 - 리렌더 안전)
// ============================================

/** pending 상태인 총 개수 */
export const selectPendingCount = (state: InterviewPreparationState) =>
  Object.keys(state.pendingIds).length

/** pending 상태인 항목이 있는지 */
export const selectHasPending = (state: InterviewPreparationState) =>
  Object.keys(state.pendingIds).length > 0

/** pending 상태인 ID 배열 */
export const selectPendingIdArray = (state: InterviewPreparationState) =>
  Object.keys(state.pendingIds)

// ============================================
// Custom Hooks (동적 파라미터용 - 클로저 문제 해결)
// ============================================

/**
 * 특정 preparationId가 pending 상태인지 확인하는 최적화된 훅
 * useCallback으로 selector 안정화하여 불필요한 리렌더 방지
 */
export function useIsPreparationPending(preparationId: string) {
  return useInterviewPreparationStore(
    useCallback(
      (state: InterviewPreparationState) => preparationId in state.pendingIds,
      [preparationId]
    )
  )
}

/**
 * 특정 preparationId의 progress 데이터를 구독하는 최적화된 훅
 * Provider에서 업데이트한 realtime 데이터에 접근
 */
export function usePreparationProgress(preparationId: string) {
  return useInterviewPreparationStore(
    useCallback(
      (state: InterviewPreparationState) =>
        state.progressMap[preparationId] ?? null,
      [preparationId]
    )
  )
}
