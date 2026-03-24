/**
 * Question Router
 *
 * Handles HTTP/tRPC concerns for Question endpoints.
 * Delegates business logic to the service layer.
 *
 * @example
 * // Client usage
 * const questions = await trpc.question.listByExperience.query({
 *   interviewPreparationId: 'xxx',
 *   experienceType: 'CAREER',
 *   experienceId: 1,
 * })
 */

import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import {
  questionService,
  questionGenerationService,
} from '@/server/services/question'
import { selectTodaysQuest } from '@/server/services/question/selection'
import { keyAchievementService } from '@/server/services/key-achievement'
import { preparationService } from '@/server/services/interview-preparation'
import { handleServiceError } from '@/server/services/common/trpc-error-handler'
import { GraphName } from '@/server/services/ai/langgraph/types/graphs'
import { WebhookStatus } from '@/generated/prisma/enums'
import {
  listByExperienceSchema,
  startQuestionGenerationSchema,
  getByIdSchema,
  createQuestionSchema,
  updateQuestionSchema,
  deleteQuestionSchema,
  getTodaysQuestSchema,
} from './schema'

export const questionRouter = createTRPCRouter({
  /**
   * Get a single question by ID
   *
   * Returns question data including text and category.
   * Verifies ownership through keyAchievementId.
   */
  getById: protectedProcedure
    .input(getByIdSchema)
    .query(async ({ ctx, input }) => {
      try {
        const question = await questionService.getById(input.questionId)

        if (!question) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Question not found',
          })
        }

        // Verify ownership through keyAchievementId
        if (question.keyAchievementId) {
          await keyAchievementService.verifyOwnershipByUserId(
            question.keyAchievementId,
            ctx.userId
          )
        }

        return question
      } catch (error) {
        handleServiceError(error)
      }
    }),

  /**
   * List questions by experience
   *
   * Returns questions for a specific key achievement if keyAchievementId is provided,
   * or all questions for the experience if not.
   *
   * Category filtering is handled client-side in the UI.
   */
  listByExperience: protectedProcedure
    .input(listByExperienceSchema)
    .query(async ({ ctx, input }) => {
      try {
        // Verify key achievement ownership if provided (using denormalized userId)
        if (input.keyAchievementId !== undefined) {
          await keyAchievementService.verifyOwnershipByUserId(
            input.keyAchievementId,
            ctx.userId
          )
        }

        return questionService.listByExperience({
          experienceType: input.experienceType,
          experienceId: input.experienceId,
          keyAchievementId: input.keyAchievementId,
        })
      } catch (error) {
        handleServiceError(error)
      }
    }),

  /**
   * Start question generation for a specific KeyAchievement
   *
   * Triggers async question generation via LangGraph.
   * Returns jobId (runId) for tracking progress.
   *
   * @returns runId, threadId, webhookEventId for tracking
   */
  startGeneration: protectedProcedure
    .input(startQuestionGenerationSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify keyAchievement ownership + belongs to the interview preparation
        await keyAchievementService.verifyOwnershipByUserId(
          input.keyAchievementId,
          ctx.userId
        )

        // Start question generation via service
        const result = await questionGenerationService.startGeneration({
          keyAchievementId: input.keyAchievementId,
          questionCategories: input.questionCategories,
          userId: ctx.userId,
        })

        return {
          runId: result.runId,
          threadId: result.threadId,
          webhookEventId: result.webhookEventId,
        }
      } catch (error) {
        handleServiceError(error)
      }
    }),

  /**
   * Get pending question generations for the current user
   *
   * Returns keyAchievementIds that have PENDING or RUNNING generation jobs.
   * Used by QuestionGenerationProvider to restore subscription state after page refresh.
   */
  getPendingGenerations: protectedProcedure.query(async ({ ctx }) => {
    const pendingEvents = await ctx.prisma.webhookEvent.findMany({
      where: {
        userId: ctx.userId,
        graphName: GraphName.QUESTION_GEN,
        status: { in: [WebhookStatus.PENDING, WebhookStatus.RUNNING] },
      },
      select: {
        metadata: true,
      },
    })

    return {
      keyAchievementIds: pendingEvents
        .map(
          e => (e.metadata as { keyAchievementId?: number })?.keyAchievementId
        )
        .filter((id): id is number => id !== undefined),
    }
  }),

  // ============================================
  // Question CRUD Operations
  // ============================================

  /**
   * Create a single question (user manual addition)
   *
   * Different from startGeneration which triggers AI bulk generation.
   * Validates keyAchievement ownership before creation.
   */
  create: protectedProcedure
    .input(createQuestionSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await questionService.create(input, ctx.userId)
      } catch (error) {
        handleServiceError(error)
      }
    }),

  /**
   * Update an existing question
   *
   * Verifies ownership through question → keyAchievement → userId chain.
   */
  update: protectedProcedure
    .input(updateQuestionSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await questionService.update(input.id, input.data, ctx.userId)
      } catch (error) {
        handleServiceError(error)
      }
    }),

  /**
   * Delete a question
   *
   * Answers are cascade-deleted by Prisma.
   * Verifies ownership before deletion.
   */
  delete: protectedProcedure
    .input(deleteQuestionSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        await questionService.delete(input.id, ctx.userId)
        return { success: true }
      } catch (error) {
        handleServiceError(error)
      }
    }),

  // ============================================
  // Today's Quest Selection
  // ============================================

  /**
   * Get Today's Quest questions
   *
   * Selects 3 questions (1 featured + 2 related) for daily practice.
   * Uses urgency scoring (empty/draft/surface answers prioritized)
   * combined with date-based seeding for consistent daily selection.
   *
   * @returns featuredQuest + relatedQuests (2) + meta
   */
  getTodaysQuest: protectedProcedure
    .input(getTodaysQuestSchema)
    .query(async ({ ctx, input }) => {
      try {
        // Verify interview preparation ownership
        await preparationService.verifyOwnershipByUserId(
          input.interviewPreparationId,
          ctx.userId
        )

        // Select today's quest questions
        return selectTodaysQuest({
          interviewPreparationId: input.interviewPreparationId,
          date: input.date,
          userId: ctx.userId,
        })
      } catch (error) {
        handleServiceError(error)
      }
    }),
})
