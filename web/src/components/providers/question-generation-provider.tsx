'use client'

/**
 * QuestionGenerationProvider
 *
 * Global provider for managing question generation status via Supabase Realtime.
 *
 * Responsibilities:
 * 1. On mount: Query pending generations from DB
 * 2. Sync results to Zustand store
 * 3. Activate Realtime subscription when there are pending generations
 * 4. Handle status changes: update store, invalidate tRPC cache, show toast
 *
 * @example
 * // In protected layout
 * <QuestionGenerationProvider>
 *   {children}
 * </QuestionGenerationProvider>
 */

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

  // ✅ Best Practice: Actions from store via getState() - stable reference
  // These don't need to be in useEffect dependencies
  const { syncFromServer, removeGenerating } =
    useQuestionGenerationStore.getState()

  // Derived selector for subscription enable/disable
  const hasGenerating = useQuestionGenerationStore(selectHasGenerating)

  // 1. Query pending generations on mount
  const { data: pendingData } = api.question.getPendingGenerations.useQuery(
    undefined,
    { enabled: !!userId }
  )

  // 2. Sync DB results to Zustand store
  useEffect(() => {
    if (pendingData) {
      syncFromServer(pendingData.keyAchievementIds)
    }
  }, [pendingData, syncFromServer])

  // 3. Realtime status change handler
  const handleStatusChange = useCallback(
    (event: WebhookEventRealtimePayload) => {
      const keyAchievementId = event.metadata?.keyAchievementId
      if (typeof keyAchievementId !== 'number') return

      // Only handle terminal states
      if (
        event.status === WebhookStatus.SUCCESS ||
        event.status === WebhookStatus.ERROR
      ) {
        // Remove from tracking
        removeGenerating(keyAchievementId)

        // Invalidate tRPC cache for UI updates
        void utils.interviewPreparation.getExperienceById.invalidate()
        void utils.interviewPreparation.getById.invalidate()
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
    [removeGenerating, utils]
  )

  // 4. Supabase Realtime subscription (only when hasGenerating)
  useWebhookEventSubscription({
    userId: userId ?? undefined,
    graphName: GraphName.QUESTION_GEN,
    onStatusChange: handleStatusChange,
    onReconnect: () => {
      // On connection recovery, resync pending generations from server
      void utils.question.getPendingGenerations.invalidate()
    },
    enabled: !!userId && hasGenerating,
  })

  return <>{children}</>
}
