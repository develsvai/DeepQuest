'use client'

/**
 * Custom hooks for ExperienceDetail component
 *
 * Handles KeyAchievement CRUD operations with optimistic updates
 * and cache invalidation using tRPC and React Query.
 */

import { useCallback, useMemo } from 'react'
import { api } from '@/trpc/react'
import { toast } from 'sonner'
import posthog from 'posthog-js'
import { POSTHOG_EVENTS } from '@/lib/posthog-events'
import type { KeyAchievementData } from './KeyAchievementDialog'
import type {
  ExperienceDetailResult,
  KeyAchievementWithProgress,
} from '@/server/services/experience'
import { QuestionCategory } from '@/generated/prisma/enums'
import {
  useQuestionGenerationStore,
  useIsKeyAchievementGenerating,
} from '@/lib/stores/question-generation-store'

interface UseKeyAchievementMutationsParams {
  experienceId: number
  experienceType: 'career' | 'project'
  interviewPrepId: string
}

interface UseKeyAchievementMutationsReturn {
  createMutation: ReturnType<typeof api.keyAchievement.create.useMutation>
  updateMutation: ReturnType<typeof api.keyAchievement.update.useMutation>
  deleteMutation: ReturnType<typeof api.keyAchievement.delete.useMutation>
  handleCreate: (data: KeyAchievementData) => Promise<void>
  handleUpdate: (id: number, data: KeyAchievementData) => Promise<void>
  handleDelete: (id: number) => Promise<void>
  isLoading: boolean
}

/**
 * Helper to update keyAchievements in ExperienceDetailResult
 */
function updateKeyAchievements(
  previousData: ExperienceDetailResult,
  updater: (
    achievements: KeyAchievementWithProgress[]
  ) => KeyAchievementWithProgress[]
): ExperienceDetailResult {
  if (previousData.type === 'career') {
    return {
      ...previousData,
      data: {
        ...previousData.data,
        keyAchievements: updater(previousData.data.keyAchievements),
      },
    }
  }
  return {
    ...previousData,
    data: {
      ...previousData.data,
      keyAchievements: updater(previousData.data.keyAchievements),
    },
  }
}

/**
 * Hook for managing KeyAchievement CRUD operations with optimistic updates
 */
export function useKeyAchievementMutations({
  experienceId,
  experienceType,
  interviewPrepId,
}: UseKeyAchievementMutationsParams): UseKeyAchievementMutationsReturn {
  const utils = api.useUtils()

  const queryKey = useMemo(
    () => ({
      interviewPreparationId: interviewPrepId,
      experienceType,
      experienceId,
    }),
    [interviewPrepId, experienceType, experienceId]
  )

  // Invalidate related queries after mutation
  const invalidateQueries = useCallback(async () => {
    await Promise.all([
      // Invalidate the experience detail query
      utils.interviewPreparation.getExperienceById.invalidate(queryKey),
      // Invalidate the interview prep detail query for the parent page
      utils.interviewPreparation.getById.invalidate({ id: interviewPrepId }),
    ])
  }, [utils, queryKey, interviewPrepId])

  // Create mutation with optimistic update
  const createMutation = api.keyAchievement.create.useMutation({
    onMutate: async newAchievement => {
      // Cancel any outgoing refetches
      await utils.interviewPreparation.getExperienceById.cancel(queryKey)

      // Snapshot the previous value
      const previousData =
        utils.interviewPreparation.getExperienceById.getData(queryKey)

      // Optimistically update the cache
      if (previousData) {
        const now = new Date()
        const optimisticAchievement: KeyAchievementWithProgress = {
          id: Date.now(), // Temporary ID
          userId: null, // Will be set by server
          careerExperienceId: experienceType === 'career' ? experienceId : null,
          projectExperienceId:
            experienceType === 'project' ? experienceId : null,
          title: newAchievement.title,
          problems: newAchievement.problems ?? [],
          actions: newAchievement.actions ?? [],
          results: newAchievement.results ?? [],
          reflections: newAchievement.reflections ?? [],
          orderIndex: previousData.data.keyAchievements.length,
          createdAt: now,
          updatedAt: now,
          totalQuestions: 0, // New achievement has no questions yet
          completedQuestions: 0,
        }

        utils.interviewPreparation.getExperienceById.setData(
          queryKey,
          updateKeyAchievements(previousData, achievements => [
            ...achievements,
            optimisticAchievement,
          ])
        )
      }

      return { previousData }
    },
    onError: (err, _newAchievement, context) => {
      // Rollback on error
      if (context?.previousData) {
        utils.interviewPreparation.getExperienceById.setData(
          queryKey,
          context.previousData
        )
      }
      toast.error('Failed to create achievement', {
        description: err.message,
      })
    },
    onSuccess: () => {
      toast.success('Achievement created successfully')
    },
    onSettled: () => {
      // Always refetch after mutation to ensure cache consistency
      void invalidateQueries()
    },
  })

  // Update mutation with optimistic update
  const updateMutation = api.keyAchievement.update.useMutation({
    onMutate: async ({ id, data: updateData }) => {
      await utils.interviewPreparation.getExperienceById.cancel(queryKey)

      const previousData =
        utils.interviewPreparation.getExperienceById.getData(queryKey)

      if (previousData) {
        utils.interviewPreparation.getExperienceById.setData(
          queryKey,
          updateKeyAchievements(previousData, achievements =>
            achievements.map(ka =>
              ka.id === id
                ? {
                    ...ka,
                    ...updateData,
                  }
                : ka
            )
          )
        )
      }

      return { previousData }
    },
    onError: (err, _variables, context) => {
      if (context?.previousData) {
        utils.interviewPreparation.getExperienceById.setData(
          queryKey,
          context.previousData
        )
      }
      toast.error('Failed to update achievement', {
        description: err.message,
      })
    },
    onSuccess: () => {
      toast.success('Achievement updated successfully')
    },
    onSettled: () => {
      void invalidateQueries()
    },
  })

  // Delete mutation with optimistic update
  const deleteMutation = api.keyAchievement.delete.useMutation({
    onMutate: async ({ id }) => {
      await utils.interviewPreparation.getExperienceById.cancel(queryKey)

      const previousData =
        utils.interviewPreparation.getExperienceById.getData(queryKey)

      if (previousData) {
        utils.interviewPreparation.getExperienceById.setData(
          queryKey,
          updateKeyAchievements(previousData, achievements =>
            achievements.filter(ka => ka.id !== id)
          )
        )
      }

      return { previousData }
    },
    onError: (err, _variables, context) => {
      if (context?.previousData) {
        utils.interviewPreparation.getExperienceById.setData(
          queryKey,
          context.previousData
        )
      }
      toast.error('Failed to delete achievement', {
        description: err.message,
      })
    },
    onSuccess: () => {
      toast.success('Achievement deleted successfully')
    },
    onSettled: () => {
      void invalidateQueries()
    },
  })

  // Handler functions
  const handleCreate = useCallback(
    async (data: KeyAchievementData) => {
      await createMutation.mutateAsync({
        title: data.title,
        problems: data.problems,
        actions: data.actions,
        results: data.results,
        reflections: data.reflections,
        ...(experienceType === 'career'
          ? { careerExperienceId: experienceId }
          : { projectExperienceId: experienceId }),
      })
      // PostHog: Track key achievement creation (important for STAR method practice)
      posthog.capture(POSTHOG_EVENTS.ACHIEVEMENT.CREATED, {
        experience_id: experienceId,
        experience_type: experienceType,
        preparation_id: interviewPrepId,
        has_problems: data.problems && data.problems.length > 0,
        has_actions: data.actions && data.actions.length > 0,
        has_results: data.results && data.results.length > 0,
        has_reflections: data.reflections && data.reflections.length > 0,
      })
    },
    [createMutation, experienceId, experienceType, interviewPrepId]
  )

  const handleUpdate = useCallback(
    async (id: number, data: KeyAchievementData) => {
      await updateMutation.mutateAsync({
        id,
        data: {
          title: data.title,
          problems: data.problems,
          actions: data.actions,
          results: data.results,
          reflections: data.reflections,
        },
      })
    },
    [updateMutation]
  )

  const handleDelete = useCallback(
    async (id: number) => {
      await deleteMutation.mutateAsync({ id })
    },
    [deleteMutation]
  )

  const isLoading =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    handleCreate,
    handleUpdate,
    handleDelete,
    isLoading,
  }
}

// ============================================
// Question Generation Mutation Hook
// ============================================

interface UseQuestionGenerationParams {
  interviewPrepId: string
  /** Callback when generation starts successfully */
  onGenerationStarted?: (keyAchievementId: number) => void
}

interface UseQuestionGenerationReturn {
  startGeneration: (input: {
    keyAchievementId: number
    questionCategories: QuestionCategory[]
  }) => Promise<{ runId: string; threadId: string; webhookEventId: string }>
  isGenerating: boolean
}

/**
 * Hook for starting question generation for a KeyAchievement
 * Calls LangGraph AI to generate interview questions based on selected categories
 */
export function useQuestionGenerationMutation({
  onGenerationStarted,
}: UseQuestionGenerationParams): UseQuestionGenerationReturn {
  const mutation = api.question.startGeneration.useMutation({
    onSuccess: (_data, variables) => {
      // Notify parent to track this generation
      onGenerationStarted?.(variables.keyAchievementId)

      toast.success('Question generation started', {
        description: 'Questions will be generated shortly.',
      })
    },
    onError: err => {
      toast.error('Failed to start question generation', {
        description: err.message,
      })
    },
  })

  const startGeneration = useCallback(
    async (input: {
      keyAchievementId: number
      questionCategories: QuestionCategory[]
    }) => {
      // PostHog: Track question generation start
      posthog.capture(POSTHOG_EVENTS.QUESTION.GENERATION_STARTED, {
        key_achievement_id: input.keyAchievementId,
        question_categories: input.questionCategories,
        category_count: input.questionCategories.length,
      })
      return mutation.mutateAsync({
        ...input,
      })
    },
    [mutation]
  )

  return {
    startGeneration,
    isGenerating: mutation.isPending,
  }
}

// ============================================
// Question Generation Status Hook (Global Store)
// ============================================

interface UseQuestionGenerationStatusReturn {
  /** Record of keyAchievementIds currently being generated */
  generatingIds: Record<number, true>
  /** Check if a specific keyAchievementId is generating - O(1) lookup */
  isGenerating: (id: number) => boolean
  /** Add a keyAchievementId to tracking */
  trackGeneration: (keyAchievementId: number) => void
}

/**
 * Hook for tracking question generation status
 *
 * Uses global Zustand store for state management.
 * Realtime subscription is handled by QuestionGenerationProvider.
 *
 * @example
 * const { generatingIds, trackGeneration, isGenerating } = useQuestionGenerationStatus()
 *
 * // Track a new generation
 * trackGeneration(achievementId)
 *
 * // Check if generating (O(1) lookup)
 * const isThisGenerating = isGenerating(achievementId)
 */
export function useQuestionGenerationStatus(): UseQuestionGenerationStatusReturn {
  // ✅ Best Practice: Actions from getState() - stable reference
  const { addGenerating } = useQuestionGenerationStore.getState()

  // ✅ Auto selector for generatingIds (Record-based for O(1) lookup)
  const generatingIds = useQuestionGenerationStore.use.generatingIds()

  const trackGeneration = useCallback(
    (keyAchievementId: number) => {
      addGenerating(keyAchievementId)
    },
    [addGenerating]
  )

  // O(1) lookup using Record (not array includes)
  const isGenerating = useCallback(
    (id: number) => id in generatingIds,
    [generatingIds]
  )

  return {
    generatingIds,
    isGenerating,
    trackGeneration,
  }
}

// Re-export custom hook for individual card optimization
export { useIsKeyAchievementGenerating }
