/**
 * Question Generation Store
 *
 * Zustand store for managing question generation state globally.
 * Tracks which keyAchievements are currently generating questions.
 *
 * Best Practice patterns applied:
 * - State/Actions separation
 * - Record<number, true> for serializable Set-like behavior
 * - Auto Selectors with createSelectors pattern
 * - Named actions for devtools debugging
 * - Manual immutability (simple object operations, no immer needed)
 * - Custom hooks for optimized subscriptions
 */

import { useCallback } from 'react'
import type { StoreApi, UseBoundStore } from 'zustand'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

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
// Store Creation (devtools only - manual immutability for simple object ops)
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
