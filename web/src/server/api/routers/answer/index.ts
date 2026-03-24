/**
 * Answer Router
 *
 * tRPC router for Answer domain operations.
 * Thin layer: only input validation, auth, and service delegation.
 */

import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { answerService, feedbackService } from '@/server/services/answer'
import { handleServiceError } from '@/server/services/common/trpc-error-handler'
import {
  submitAnswerSchema,
  getFeedbackGenInputSchema,
  saveFeedbackResultSchema,
  getAnswerWithFeedbackSchema,
  listAttemptsSchema,
  getAttemptByIdSchema,
} from './schema'

export const answerRouter = createTRPCRouter({
  /**
   * Submit user's answer to a question
   *
   * Creates/updates Answer record with SUBMITTED status.
   * Marks question as completed.
   *
   * @returns answerId for use in streaming
   */
  submitAnswer: protectedProcedure
    .input(submitAnswerSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await answerService.submit({
          questionId: input.questionId,
          answerText: input.answerText,
          userId: ctx.userId,
        })
      } catch (error) {
        handleServiceError(error)
      }
    }),

  /**
   * Get feedback generation input for LangGraph
   *
   * Prepares full context (experience, question, answer) for AI streaming.
   * Returns V2 schema format.
   *
   * @returns QuestionFeedbackGenGraphInputV2
   */
  getFeedbackGenInput: protectedProcedure
    .input(getFeedbackGenInputSchema)
    .query(async ({ ctx, input }) => {
      try {
        return await feedbackService.getFeedbackGenInput({
          answerId: input.answerId,
          userId: ctx.userId,
        })
      } catch (error) {
        handleServiceError(error)
      }
    }),

  /**
   * Save feedback result after streaming completes
   *
   * Called from onFinish handler with V2 feedback format.
   * Stores rating.level and rating.rationale separately.
   * Updates Answer status to EVALUATED.
   *
   * @returns Status of what was saved
   */
  saveFeedbackResult: protectedProcedure
    .input(saveFeedbackResultSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Transform from Zod schema type to service type
        const feedbackInput = input.feedback
          ? {
              strengths: input.feedback.strengths,
              weaknesses: input.feedback.weaknesses,
              suggestions: input.feedback.suggestions,
              rating: {
                level: input.feedback.rating.level,
                rationale: input.feedback.rating.rationale,
              },
            }
          : undefined

        return await feedbackService.saveFeedbackResult({
          answerId: input.answerId,
          feedback: feedbackInput,
          guideAnswer: input.guideAnswer,
          userId: ctx.userId,
        })
      } catch (error) {
        handleServiceError(error)
      }
    }),

  /**
   * Get answer with feedback for display
   *
   * Retrieves saved answer and associated feedback.
   * Used for showing results after streaming or on page reload.
   *
   * @returns Answer with feedback or nulls
   */
  getAnswerWithFeedback: protectedProcedure
    .input(getAnswerWithFeedbackSchema)
    .query(async ({ ctx, input }) => {
      try {
        return await answerService.getWithFeedback({
          questionId: input.questionId,
          userId: ctx.userId,
        })
      } catch (error) {
        handleServiceError(error)
      }
    }),

  /**
   * List all attempts for a question
   *
   * Returns attempt summaries for displaying attempt history.
   * Ordered by creation time (oldest first = attempt #1).
   *
   * @returns List of attempt summaries
   */
  listAttempts: protectedProcedure
    .input(listAttemptsSchema)
    .query(async ({ ctx, input }) => {
      try {
        return await answerService.listAttempts({
          questionId: input.questionId,
          userId: ctx.userId,
        })
      } catch (error) {
        handleServiceError(error)
      }
    }),

  /**
   * Get specific attempt by answerId
   *
   * Retrieves a specific attempt's answer and feedback.
   * Used for viewing past attempts.
   *
   * @returns Answer with feedback or nulls
   */
  getAttemptById: protectedProcedure
    .input(getAttemptByIdSchema)
    .query(async ({ ctx, input }) => {
      try {
        return await answerService.getAttemptById({
          answerId: input.answerId,
          userId: ctx.userId,
        })
      } catch (error) {
        handleServiceError(error)
      }
    }),
})
