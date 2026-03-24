'use client'

/**
 * Custom hooks for InterviewPrepDetail component
 *
 * Handles Interview Preparation CRUD operations with optimistic updates
 * using tRPC and React Query with a factory pattern to reduce boilerplate.
 *
 * @module InterviewPrepDetail.hooks
 */

import { useCallback, useMemo } from 'react'
import { api } from '@/trpc/react'
import { toast } from 'sonner'
import type { TRPCClientErrorLike } from '@trpc/client'
import type { AppRouter } from '@/server/api/root'
import type { InterviewPrepDetailResult } from '@/server/services/interview-preparation/types'
import type {
  CreateCareerInput,
  UpdateCareerInput,
  DeleteCareerInput,
  CreateProjectInput,
  UpdateProjectInput,
  DeleteProjectInput,
  CreateEducationInput,
  UpdateEducationInput,
  DeleteEducationInput,
} from '@/server/api/routers/interview-preparation/schema'
import {
  updateCacheField,
  createOptimisticCareer,
  createOptimisticProject,
  createOptimisticEducation,
} from './InterviewPrepDetail.utils'

// ============================================================================
// Types
// ============================================================================

interface UseInterviewPrepMutationsParams {
  preparationId: string
}

/** Grouped mutation operations for a domain entity */
interface MutationGroup<TCreate, TUpdate, TDelete> {
  create: TCreate
  update: TUpdate
  delete: TDelete
  isPending: boolean
}

/** Header mutation (update only) */
interface HeaderMutationGroup<TUpdate> {
  update: TUpdate
  isPending: boolean
}

/** Return type with grouped mutations for better DX */
export interface UseInterviewPrepMutationsReturn {
  header: HeaderMutationGroup<
    ReturnType<typeof api.interviewPreparation.updateHeader.useMutation>
  >
  career: MutationGroup<
    ReturnType<typeof api.interviewPreparation.createCareer.useMutation>,
    ReturnType<typeof api.interviewPreparation.updateCareer.useMutation>,
    ReturnType<typeof api.interviewPreparation.deleteCareer.useMutation>
  >
  project: MutationGroup<
    ReturnType<typeof api.interviewPreparation.createProject.useMutation>,
    ReturnType<typeof api.interviewPreparation.updateProject.useMutation>,
    ReturnType<typeof api.interviewPreparation.deleteProject.useMutation>
  >
  education: MutationGroup<
    ReturnType<typeof api.interviewPreparation.createEducation.useMutation>,
    ReturnType<typeof api.interviewPreparation.updateEducation.useMutation>,
    ReturnType<typeof api.interviewPreparation.deleteEducation.useMutation>
  >
}

// ============================================================================
// Optimistic Update Factory
// ============================================================================

interface OptimisticMutationContext {
  previousData: InterviewPrepDetailResult | undefined
}

interface MutationMessages {
  success: string
  error: string
}

type TrpcUtils = ReturnType<typeof api.useUtils>
type QueryKey = { id: string }

/**
 * Factory function to create mutation options with optimistic updates
 *
 * Implements TanStack Query optimistic update pattern:
 * 1. Cancel outgoing refetches
 * 2. Snapshot previous data
 * 3. Optimistically update cache
 * 4. Rollback on error
 * 5. Always invalidate to ensure consistency
 */
function createMutationOptions<TInput>(
  messages: MutationMessages,
  optimisticUpdater: (
    data: InterviewPrepDetailResult,
    input: TInput
  ) => InterviewPrepDetailResult,
  utils: TrpcUtils,
  queryKey: QueryKey,
  invalidateQueries: () => Promise<void>
) {
  return {
    onMutate: async (input: TInput): Promise<OptimisticMutationContext> => {
      await utils.interviewPreparation.getById.cancel(queryKey)
      const previousData = utils.interviewPreparation.getById.getData(queryKey)

      if (previousData) {
        utils.interviewPreparation.getById.setData(
          queryKey,
          optimisticUpdater(previousData, input)
        )
      }

      return { previousData }
    },
    onError: (
      err: TRPCClientErrorLike<AppRouter>,
      _vars: TInput,
      context: OptimisticMutationContext | undefined
    ) => {
      if (context?.previousData) {
        utils.interviewPreparation.getById.setData(
          queryKey,
          context.previousData
        )
      }
      toast.error(messages.error, { description: err.message })
    },
    onSuccess: () => {
      toast.success(messages.success)
    },
    onSettled: () => {
      void invalidateQueries()
    },
  }
}

// ============================================================================
// Optimistic Updaters (Domain-Specific Logic)
// ============================================================================

const optimisticUpdaters = {
  // Career
  createCareer: (
    data: InterviewPrepDetailResult,
    input: CreateCareerInput
  ): InterviewPrepDetailResult =>
    updateCacheField(data, 'careers', careers => [
      ...careers,
      createOptimisticCareer(input.data),
    ]),

  updateCareer: (
    data: InterviewPrepDetailResult,
    input: UpdateCareerInput
  ): InterviewPrepDetailResult =>
    updateCacheField(data, 'careers', careers =>
      careers.map(c =>
        c.id === input.id ? { ...c, ...input.data, updatedAt: new Date() } : c
      )
    ),

  deleteCareer: (
    data: InterviewPrepDetailResult,
    input: DeleteCareerInput
  ): InterviewPrepDetailResult =>
    updateCacheField(data, 'careers', careers =>
      careers.filter(c => c.id !== input.id)
    ),

  // Project
  createProject: (
    data: InterviewPrepDetailResult,
    input: CreateProjectInput
  ): InterviewPrepDetailResult =>
    updateCacheField(data, 'projects', projects => [
      ...projects,
      createOptimisticProject(input.data),
    ]),

  updateProject: (
    data: InterviewPrepDetailResult,
    input: UpdateProjectInput
  ): InterviewPrepDetailResult =>
    updateCacheField(data, 'projects', projects =>
      projects.map(p =>
        p.id === input.id ? { ...p, ...input.data, updatedAt: new Date() } : p
      )
    ),

  deleteProject: (
    data: InterviewPrepDetailResult,
    input: DeleteProjectInput
  ): InterviewPrepDetailResult =>
    updateCacheField(data, 'projects', projects =>
      projects.filter(p => p.id !== input.id)
    ),

  // Education
  createEducation: (
    data: InterviewPrepDetailResult,
    input: CreateEducationInput,
    preparationId: string
  ): InterviewPrepDetailResult =>
    updateCacheField(data, 'educations', educations => [
      ...educations,
      createOptimisticEducation(input.data, preparationId),
    ]),

  updateEducation: (
    data: InterviewPrepDetailResult,
    input: UpdateEducationInput
  ): InterviewPrepDetailResult =>
    updateCacheField(data, 'educations', educations =>
      educations.map(e => (e.id === input.id ? { ...e, ...input.data } : e))
    ),

  deleteEducation: (
    data: InterviewPrepDetailResult,
    input: DeleteEducationInput
  ): InterviewPrepDetailResult =>
    updateCacheField(data, 'educations', educations =>
      educations.filter(e => e.id !== input.id)
    ),
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Hook for managing Interview Preparation CRUD operations with optimistic updates
 *
 * Returns grouped mutations for better developer experience:
 * - `header.update` - Update header data
 * - `career.create/update/delete` - Career CRUD
 * - `project.create/update/delete` - Project CRUD
 * - `education.create/update/delete` - Education CRUD
 *
 * Each group includes an `isPending` boolean for loading states.
 *
 * @example
 * const { career, project } = useInterviewPrepMutations({ preparationId: id })
 *
 * // Update career
 * await career.update.mutateAsync({ id: careerId, data: { company: 'New Corp' } })
 *
 * // Check loading state
 * if (career.isPending) { ... }
 */
export function useInterviewPrepMutations({
  preparationId,
}: UseInterviewPrepMutationsParams): UseInterviewPrepMutationsReturn {
  const utils = api.useUtils()
  const queryKey = useMemo(() => ({ id: preparationId }), [preparationId])

  const invalidateQueries = useCallback(async () => {
    await Promise.all([
      utils.interviewPreparation.getById.invalidate(queryKey),
      utils.interviewPreparation.listForSidebar.invalidate(),
      utils.interviewPreparation.list.invalidate(),
    ])
  }, [utils, queryKey])

  // ============================================================================
  // Header Mutation (Special Case - Not a List Operation)
  // ============================================================================

  const updateHeader = api.interviewPreparation.updateHeader.useMutation({
    onMutate: async input => {
      await utils.interviewPreparation.getById.cancel(queryKey)
      const previousData = utils.interviewPreparation.getById.getData(queryKey)

      if (previousData) {
        utils.interviewPreparation.getById.setData(queryKey, {
          ...previousData,
          ...input.data,
        })
      }

      return { previousData }
    },
    onError: (err, _vars, context) => {
      if (context?.previousData) {
        utils.interviewPreparation.getById.setData(
          queryKey,
          context.previousData
        )
      }
      toast.error('Failed to update header', { description: err.message })
    },
    onSuccess: () => {
      toast.success('Header updated successfully')
    },
    onSettled: () => {
      void invalidateQueries()
    },
  })

  // ============================================================================
  // Career Mutations
  // ============================================================================

  const createCareer = api.interviewPreparation.createCareer.useMutation(
    createMutationOptions<CreateCareerInput>(
      {
        success: 'Career created successfully',
        error: 'Failed to create career',
      },
      optimisticUpdaters.createCareer,
      utils,
      queryKey,
      invalidateQueries
    ) as Parameters<typeof api.interviewPreparation.createCareer.useMutation>[0]
  )

  const updateCareer = api.interviewPreparation.updateCareer.useMutation(
    createMutationOptions(
      {
        success: 'Career updated successfully',
        error: 'Failed to update career',
      },
      optimisticUpdaters.updateCareer,
      utils,
      queryKey,
      invalidateQueries
    )
  )

  const deleteCareer = api.interviewPreparation.deleteCareer.useMutation(
    createMutationOptions(
      {
        success: 'Career deleted successfully',
        error: 'Failed to delete career',
      },
      optimisticUpdaters.deleteCareer,
      utils,
      queryKey,
      invalidateQueries
    )
  )

  // ============================================================================
  // Project Mutations
  // ============================================================================

  const createProject = api.interviewPreparation.createProject.useMutation(
    createMutationOptions<CreateProjectInput>(
      {
        success: 'Project created successfully',
        error: 'Failed to create project',
      },
      optimisticUpdaters.createProject,
      utils,
      queryKey,
      invalidateQueries
    ) as Parameters<
      typeof api.interviewPreparation.createProject.useMutation
    >[0]
  )

  const updateProject = api.interviewPreparation.updateProject.useMutation(
    createMutationOptions(
      {
        success: 'Project updated successfully',
        error: 'Failed to update project',
      },
      optimisticUpdaters.updateProject,
      utils,
      queryKey,
      invalidateQueries
    )
  )

  const deleteProject = api.interviewPreparation.deleteProject.useMutation(
    createMutationOptions(
      {
        success: 'Project deleted successfully',
        error: 'Failed to delete project',
      },
      optimisticUpdaters.deleteProject,
      utils,
      queryKey,
      invalidateQueries
    )
  )

  // ============================================================================
  // Education Mutations
  // ============================================================================

  const createEducation = api.interviewPreparation.createEducation.useMutation(
    createMutationOptions(
      {
        success: 'Education created successfully',
        error: 'Failed to create education',
      },
      (data, input) =>
        optimisticUpdaters.createEducation(data, input, preparationId),
      utils,
      queryKey,
      invalidateQueries
    )
  )

  const updateEducation = api.interviewPreparation.updateEducation.useMutation(
    createMutationOptions(
      {
        success: 'Education updated successfully',
        error: 'Failed to update education',
      },
      optimisticUpdaters.updateEducation,
      utils,
      queryKey,
      invalidateQueries
    )
  )

  const deleteEducation = api.interviewPreparation.deleteEducation.useMutation(
    createMutationOptions(
      {
        success: 'Education deleted successfully',
        error: 'Failed to delete education',
      },
      optimisticUpdaters.deleteEducation,
      utils,
      queryKey,
      invalidateQueries
    )
  )

  // ============================================================================
  // Grouped Return Value
  // ============================================================================

  return {
    header: {
      update: updateHeader,
      isPending: updateHeader.isPending,
    },
    career: {
      create: createCareer,
      update: updateCareer,
      delete: deleteCareer,
      isPending:
        createCareer.isPending ||
        updateCareer.isPending ||
        deleteCareer.isPending,
    },
    project: {
      create: createProject,
      update: updateProject,
      delete: deleteProject,
      isPending:
        createProject.isPending ||
        updateProject.isPending ||
        deleteProject.isPending,
    },
    education: {
      create: createEducation,
      update: updateEducation,
      delete: deleteEducation,
      isPending:
        createEducation.isPending ||
        updateEducation.isPending ||
        deleteEducation.isPending,
    },
  }
}
