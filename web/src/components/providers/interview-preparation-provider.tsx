'use client'

/**
 * InterviewPreparationProvider
 *
 * Global provider for managing interview preparation status via Supabase Realtime.
 *
 * Responsibilities:
 * 1. On mount: Query pending preparations from DB
 * 2. Sync results to Zustand store (with persist for page reload survival)
 * 3. Activate Realtime subscription when there are pending preparations
 * 4. Handle status changes: update store (progressMap), invalidate tRPC cache, show toast
 *
 * @example
 * // In protected layout
 * <InterviewPreparationProvider>
 *   {children}
 * </InterviewPreparationProvider>
 */

import { type PropsWithChildren, useCallback, useEffect, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

import { api } from '@/trpc/react'
import {
  useInterviewPreparationStore,
  selectHasPending,
} from '@/lib/stores/interview-preparation-store'
import {
  usePreparationStatusSubscription,
  type PreparationStatusPayload,
} from '@/hooks/use-preparation-status-subscription'
import { PreparationStatus } from '@/generated/prisma/browser'

export function InterviewPreparationProvider({ children }: PropsWithChildren) {
  const { userId } = useAuth()
  const utils = api.useUtils()
  const t = useTranslations('dashboard.preparationItem')
  const tProgress = useTranslations('interview-prep.detail.progressSteps.toast')

  // ✅ Best Practice: Actions from store via getState() - stable reference
  // These don't need to be in useEffect dependencies
  const { syncFromServer, removePending, updateProgress } =
    useInterviewPreparationStore.getState()

  // Derived selector for subscription enable/disable
  const hasPending = useInterviewPreparationStore(selectHasPending)

  // Track previous progress state for detecting parsing completion
  const prevProgressRef = useRef<
    Record<string, { totalQuestionGenTasks: number | null }>
  >({})

  // 1. Query pending preparations on mount
  const { data: pendingData } = api.interviewPreparation.listPending.useQuery(
    undefined,
    { enabled: !!userId }
  )

  // 2. Sync DB results to Zustand store
  // This reconciles persisted state with server state
  useEffect(() => {
    if (pendingData) {
      syncFromServer(pendingData.ids)
    }
  }, [pendingData, syncFromServer])

  // 3. Realtime status change handler
  const handleStatusChange = useCallback(
    (event: PreparationStatusPayload) => {
      const prevProgress = prevProgressRef.current[event.id]
      const wasParsingPending = prevProgress?.totalQuestionGenTasks === null
      const isParsingNowComplete = event.totalQuestionGenTasks !== null

      // Always update progress in store (for all status changes)
      updateProgress(event.id, {
        status: event.status,
        totalQuestionGenTasks: event.totalQuestionGenTasks,
        completedQuestionGenTasks: event.completedQuestionGenTasks,
      })

      // Track for next comparison
      prevProgressRef.current[event.id] = {
        totalQuestionGenTasks: event.totalQuestionGenTasks,
      }

      // Detect parsing completion (resume analysis done)
      if (wasParsingPending && isParsingNowComplete) {
        void utils.interviewPreparation.getById.invalidate({ id: event.id })
        toast.success(tProgress('parsingComplete'))
      }

      // Handle terminal states (READY or FAILED)
      if (
        event.status === PreparationStatus.READY ||
        event.status === PreparationStatus.FAILED
      ) {
        // Remove from pending tracking (keep progressMap for UI display)
        removePending(event.id)
        delete prevProgressRef.current[event.id]

        // Invalidate tRPC cache for UI updates
        void utils.interviewPreparation.list.invalidate()
        void utils.interviewPreparation.listPending.invalidate()
        void utils.interviewPreparation.listForSidebar.invalidate()
        void utils.interviewPreparation.getById.invalidate({ id: event.id })
        void utils.question.getTodaysQuest.invalidate({
          interviewPreparationId: event.id,
        })

        // Toast notification
        if (event.status === PreparationStatus.READY) {
          toast.success(t('analysisComplete'), {
            description: t('analysisCompleteDescription'),
          })
        } else {
          toast.error(t('analysisFailed'), {
            description: event.errorMessage ?? t('analysisFailedDescription'),
          })
        }
      }
      // Note: When all pending items are removed, hasPending becomes false
      // and subscription is automatically disabled via enabled prop
    },
    [removePending, updateProgress, utils, t, tProgress]
  )

  // 4. Supabase Realtime subscription (only when hasPending is true)
  // When hasPending becomes false, subscription is automatically disabled
  usePreparationStatusSubscription({
    userId: userId ?? undefined,
    onStatusChange: handleStatusChange,
    onReconnect: () => {
      // On connection recovery, resync pending status from server
      void utils.interviewPreparation.listPending.invalidate()
    },
    enabled: !!userId && hasPending,
  })

  return <>{children}</>
}
