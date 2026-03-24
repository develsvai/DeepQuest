/**
 * Answer Router Zod Schemas
 *
 * Input/Output validation schemas for Answer domain endpoints.
 * Uses V2 feedback schema with rating object (level + rationale).
 */

import { z } from 'zod'
import {
  StructuredGuideAnswerSchema,
  FeedbackSchemaV2,
} from '@/server/services/ai/contracts/schemas/questionFeedbackGen'
import { AnswerStatusZod } from '@/lib/db/utils/prisma-to-zod'

// ============= Input Schemas =============

/**
 * Submit Answer Input
 *
 * Used when user submits their answer to a question.
 */
export const submitAnswerSchema = z.object({
  questionId: z.string().min(1, 'Question ID is required'),
  answerText: z.string().min(10, 'Answer must be at least 10 characters'),
})

export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>

/**
 * Get Feedback Generation Input
 *
 * Used to prepare context for LangGraph streaming.
 */
export const getFeedbackGenInputSchema = z.object({
  answerId: z.string().min(1, 'Answer ID is required'),
})

export type GetFeedbackGenInputInput = z.infer<typeof getFeedbackGenInputSchema>

/**
 * Save Feedback Result Input
 *
 * V2 feedback with rating object (level + rationale).
 * Called from onFinish handler after streaming completes.
 */
export const saveFeedbackResultSchema = z.object({
  answerId: z.string().min(1, 'Answer ID is required'),
  feedback: FeedbackSchemaV2,
  guideAnswer: StructuredGuideAnswerSchema,
})

export type SaveFeedbackResultInput = z.infer<typeof saveFeedbackResultSchema>

/**
 * Get Answer With Feedback Input
 *
 * Used to retrieve saved answer and feedback for display.
 */
export const getAnswerWithFeedbackSchema = z.object({
  questionId: z.string().min(1, 'Question ID is required'),
})

export type GetAnswerWithFeedbackInput = z.infer<
  typeof getAnswerWithFeedbackSchema
>

/**
 * List Attempts Input
 *
 * Used to retrieve all attempts for a question.
 */
export const listAttemptsSchema = z.object({
  questionId: z.string().min(1, 'Question ID is required'),
})

export type ListAttemptsInput = z.infer<typeof listAttemptsSchema>

/**
 * Get Attempt By ID Input
 *
 * Used to retrieve a specific attempt's answer and feedback.
 */
export const getAttemptByIdSchema = z.object({
  answerId: z.string().min(1, 'Answer ID is required'),
})

export type GetAttemptByIdInput = z.infer<typeof getAttemptByIdSchema>

// ============= Output Schemas =============

/**
 * Get Answer Output
 *
 * Basic answer record for display.
 */
export const GetAnswerOutput = z.object({
  id: z.string(),
  questionId: z.string(),
  text: z.string(),
  status: AnswerStatusZod,
  version: z.number(),
  startedAt: z.date(),
  submittedAt: z.date().nullable(),
  lastAutoSaveAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type GetAnswerOutput = z.infer<typeof GetAnswerOutput>

/**
 * Answer With Feedback Output
 *
 * Combined answer and feedback for display.
 */
export const AnswerWithFeedbackOutput = z.object({
  answer: GetAnswerOutput.nullable(),
  feedback: FeedbackSchemaV2.extend({
    id: z.string(),
    generatedAt: z.date(),
    /** Guide answer - optimized for each feedback */
    guideAnswer: StructuredGuideAnswerSchema.nullish(),
  }).nullable(),
})

export type AnswerWithFeedbackOutput = z.infer<typeof AnswerWithFeedbackOutput>
