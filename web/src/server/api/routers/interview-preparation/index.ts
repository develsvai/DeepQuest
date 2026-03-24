/**
 * Interview Preparation Router
 *
 * Consolidated tRPC router for Interview Preparation domain operations.
 * Thin layer: only input validation, auth, and service delegation.
 *
 * Procedures:
 * - create: Create new preparation with resume parsing
 * - getById: Get detailed preparation data
 * - list: List all preparations for dashboard
 * - getExperienceById: Get career/project experience detail
 */

import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import {
  preparationService,
  sidebarService,
  weeklyGoalService,
} from '@/server/services/interview-preparation'
import { experienceService } from '@/server/services/experience'
import { educationService } from '@/server/services/education'
import { handleServiceError } from '@/server/services/common/trpc-error-handler'
import {
  createInputSchema,
  createOutputSchema,
  getByIdInputSchema,
  getExperienceByIdInputSchema,
  listForSidebarInputSchema,
  updateHeaderInputSchema,
  deletePreparationInputSchema,
  createCareerInputSchema,
  updateCareerInputSchema,
  deleteCareerInputSchema,
  createProjectInputSchema,
  updateProjectInputSchema,
  deleteProjectInputSchema,
  createEducationInputSchema,
  updateEducationInputSchema,
  deleteEducationInputSchema,
  getWeeklyGoalDataInputSchema,
} from './schema'

export const interviewPreparationRouter = createTRPCRouter({
  // ==========================================================================
  // Create Operation
  // ==========================================================================

  /**
   * Create new InterviewPreparation
   *
   * 1. Create DB record (title, jobTitle)
   * 2. Start Resume Parsing workflow via LangGraph
   * 3. Create WebhookEvent for tracking
   */
  create: protectedProcedure
    .input(createInputSchema)
    .output(createOutputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await preparationService.create(ctx.prisma, ctx.userId, {
          title: input.title,
          jobTitle: input.jobTitle,
          experienceNames: input.experienceNames,
          resumeFileId: input.resumeFileId,
          resumeFileUrl: input.resumeFileUrl,
          locale: input.locale,
        })

        return {
          success: result.success,
          preparationId: result.preparationId,
        }
      } catch (error) {
        handleServiceError(error)
      }
    }),

  // ==========================================================================
  // Read Operations
  // ==========================================================================

  /**
   * Get detailed interview preparation by ID
   *
   * Returns preparation with careers, projects, educations, and question counts.
   * Authorization: Verifies user owns the preparation.
   */
  getById: protectedProcedure
    .input(getByIdInputSchema)
    .query(async ({ ctx, input }) => {
      try {
        const result = await preparationService.getById(input.id)

        // Authorization check
        if (result.userId !== ctx.userId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have access to this interview preparation',
          })
        }

        return result
      } catch (error) {
        handleServiceError(error)
      }
    }),

  /**
   * List all interview preparations for the authenticated user
   *
   * Ordered by updated date (newest first).
   * Returns dashboard-ready data with aggregated stats.
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await preparationService.listByUserId(ctx.userId)
    } catch (error) {
      handleServiceError(error)
    }
  }),

  /**
   * List pending interview preparations for the authenticated user
   *
   * Returns only IDs of preparations with PENDING status.
   * Used by InterviewPreparationProvider for Realtime subscription.
   */
  listPending: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await preparationService.listPending(ctx.userId)
    } catch (error) {
      handleServiceError(error)
    }
  }),

  /**
   * List preparations for sidebar display
   *
   * Returns minimal data for sidebar rendering:
   * - Preparation id, title
   * - Experience id, name
   * - KeyAchievement id, title
   * - Question counts per keyAchievement
   *
   * Only includes READY and ANALYZING status preparations.
   */
  listForSidebar: protectedProcedure
    .input(listForSidebarInputSchema)
    .query(async ({ ctx, input }) => {
      try {
        return await sidebarService.listForSidebar({
          userId: ctx.userId,
          limit: input.limit,
        })
      } catch (error) {
        handleServiceError(error)
      }
    }),

  /**
   * Get experience detail by type and ID
   *
   * Returns career or project experience with key achievements.
   * Authorization: Verifies user owns the interview preparation.
   */
  getExperienceById: protectedProcedure
    .input(getExperienceByIdInputSchema)
    .query(async ({ ctx, input }) => {
      try {
        // Verify user owns the interview preparation (throws if not found or not owned)
        await preparationService.verifyOwnershipByUserId(
          input.interviewPreparationId,
          ctx.userId
        )

        // Fetch experience detail
        const result = await experienceService.getExperienceById(
          input.experienceType,
          input.experienceId
        )

        // Verify the experience belongs to the specified preparation
        if (result.interviewPreparationId !== input.interviewPreparationId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message:
              'This experience does not belong to the specified interview preparation',
          })
        }

        return result
      } catch (error) {
        handleServiceError(error)
      }
    }),

  /**
   * Get weekly goal data for stats widget
   *
   * Returns daily completed question counts for the specified week.
   * Used by WeeklyGoalWidget component.
   *
   * Authorization: Verifies user owns the preparation.
   */
  getWeeklyGoalData: protectedProcedure
    .input(getWeeklyGoalDataInputSchema)
    .query(async ({ ctx, input }) => {
      try {
        // Authorization check
        await preparationService.verifyOwnershipByUserId(
          input.interviewPreparationId,
          ctx.userId
        )

        return await weeklyGoalService.getWeeklyGoalData(
          input.interviewPreparationId,
          input.weekStartDate
        )
      } catch (error) {
        handleServiceError(error)
      }
    }),

  // ==========================================================================
  // Update Operations
  // ==========================================================================

  /**
   * Update interview preparation header data
   *
   * Updates title, jobTitle, yearsOfExperience, and/or summary.
   * Authorization: Verifies user owns the preparation.
   */
  updateHeader: protectedProcedure
    .input(updateHeaderInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        await preparationService.verifyOwnershipByUserId(input.id, ctx.userId)

        return await preparationService.updateHeader(input.id, input.data)
      } catch (error) {
        handleServiceError(error)
      }
    }),

  // ==========================================================================
  // Delete Operation
  // ==========================================================================

  /**
   * Delete interview preparation and all related data
   *
   * Cascade deletes all associated data:
   * - CareerExperience, ProjectExperience, CandidateEducation
   * - KeyAchievements, Questions, Answers
   * - FileUpload, StructuredJD, WebhookEvents
   *
   * Authorization: Verifies user owns the preparation.
   */
  deletePreparation: protectedProcedure
    .input(deletePreparationInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        await preparationService.verifyOwnershipByUserId(input.id, ctx.userId)
        await preparationService.deletePreparation(input.id)
      } catch (error) {
        handleServiceError(error)
      }
    }),

  // ==========================================================================
  // Career CRUD Operations
  // ==========================================================================

  /**
   * Create new CareerExperience
   *
   * Authorization: Verifies user owns the interview preparation.
   */
  createCareer: protectedProcedure
    .input(createCareerInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify user owns the interview preparation
        await preparationService.verifyOwnershipByUserId(
          input.interviewPreparationId,
          ctx.userId
        )

        return await experienceService.createCareer(
          input.interviewPreparationId,
          input.data
        )
      } catch (error) {
        handleServiceError(error)
      }
    }),

  /**
   * Update existing CareerExperience
   *
   * Authorization: Verifies user owns the interview preparation through career ownership.
   */
  updateCareer: protectedProcedure
    .input(updateCareerInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify career exists and user owns it (throws if not found or not owned)
        await experienceService.verifyCareerOwnership(input.id, ctx.userId)

        return await experienceService.updateCareer(input.id, input.data)
      } catch (error) {
        handleServiceError(error)
      }
    }),

  /**
   * Delete CareerExperience
   *
   * Authorization: Verifies user owns the interview preparation through career ownership.
   */
  deleteCareer: protectedProcedure
    .input(deleteCareerInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify career exists and user owns it (throws if not found or not owned)
        await experienceService.verifyCareerOwnership(input.id, ctx.userId)

        await experienceService.deleteCareer(input.id)
      } catch (error) {
        handleServiceError(error)
      }
    }),

  // ==========================================================================
  // Project CRUD Operations
  // ==========================================================================

  /**
   * Create new ProjectExperience
   *
   * Authorization: Verifies user owns the interview preparation.
   */
  createProject: protectedProcedure
    .input(createProjectInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify user owns the interview preparation
        await preparationService.verifyOwnershipByUserId(
          input.interviewPreparationId,
          ctx.userId
        )

        return await experienceService.createProject(
          input.interviewPreparationId,
          input.data
        )
      } catch (error) {
        handleServiceError(error)
      }
    }),

  /**
   * Update existing ProjectExperience
   *
   * Authorization: Verifies user owns the interview preparation through project ownership.
   */
  updateProject: protectedProcedure
    .input(updateProjectInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify project exists and user owns it (throws if not found or not owned)
        await experienceService.verifyProjectOwnership(input.id, ctx.userId)

        return await experienceService.updateProject(input.id, input.data)
      } catch (error) {
        handleServiceError(error)
      }
    }),

  /**
   * Delete ProjectExperience
   *
   * Authorization: Verifies user owns the interview preparation through project ownership.
   */
  deleteProject: protectedProcedure
    .input(deleteProjectInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify project exists and user owns it (throws if not found or not owned)
        await experienceService.verifyProjectOwnership(input.id, ctx.userId)

        await experienceService.deleteProject(input.id)
      } catch (error) {
        handleServiceError(error)
      }
    }),

  // ==========================================================================
  // Education CRUD Operations
  // ==========================================================================

  /**
   * Create new CandidateEducation
   *
   * Authorization: Verifies user owns the interview preparation.
   */
  createEducation: protectedProcedure
    .input(createEducationInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify user owns the interview preparation
        await preparationService.verifyOwnershipByUserId(
          input.interviewPreparationId,
          ctx.userId
        )

        return await educationService.createEducation(
          input.interviewPreparationId,
          input.data
        )
      } catch (error) {
        handleServiceError(error)
      }
    }),

  /**
   * Update existing CandidateEducation
   *
   * Authorization: Verifies user owns the interview preparation through education ownership.
   */
  updateEducation: protectedProcedure
    .input(updateEducationInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify education exists and user owns it (throws if not found or not owned)
        await educationService.verifyOwnership(input.id, ctx.userId)

        return await educationService.updateEducation(input.id, input.data)
      } catch (error) {
        handleServiceError(error)
      }
    }),

  /**
   * Delete CandidateEducation
   *
   * Authorization: Verifies user owns the interview preparation through education ownership.
   */
  deleteEducation: protectedProcedure
    .input(deleteEducationInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify education exists and user owns it (throws if not found or not owned)
        await educationService.verifyOwnership(input.id, ctx.userId)

        await educationService.deleteEducation(input.id)
      } catch (error) {
        handleServiceError(error)
      }
    }),
})
