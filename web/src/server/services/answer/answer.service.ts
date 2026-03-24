/**
 * Answer Service
 *
 * Business logic for Answer operations.
 * Pure domain logic without HTTP/tRPC concerns.
 */

import { prisma } from '@/lib/db/prisma'
import { AnswerStatus } from '@/generated/prisma/enums'
import { NotFoundError } from '@/server/services/common/errors'
import type {
  SubmitAnswerInput,
  SubmitAnswerResult,
  GetWithFeedbackInput,
  AnswerWithFeedbackResult,
  ListAttemptsInput,
  ListAttemptsResult,
  GetAttemptByIdInput,
} from './types'
import type { StructuredGuideAnswer } from '@/server/services/ai/contracts/schemas/questionFeedbackGen'

/**
 * Verify question ownership via keyAchievement.userId
 *
 * Question → KeyAchievement → userId (denormalized)
 *
 * @throws NotFoundError if question not found or user doesn't own it
 */
async function verifyQuestionOwnership(
  questionId: string,
  userId: string
): Promise<void> {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: {
      id: true,
      keyAchievementId: true,
      keyAchievement: {
        select: { userId: true },
      },
    },
  })

  if (!question) {
    throw new NotFoundError('Question', questionId)
  }

  // Verify via denormalized userId on keyAchievement
  if (!question.keyAchievement || question.keyAchievement.userId !== userId) {
    // Treat as not found for security (don't reveal existence to unauthorized users)
    throw new NotFoundError('Question', questionId)
  }
}

/**
 * Submit user's answer to a question
 *
 * Always creates a new Answer (supports multiple attempts per question).
 * Each question can have multiple answer-feedback pairs for practice history.
 *
 * 1. Verify question ownership
 * 2. Create new Answer with SUBMITTED status
 *
 * Note: Question completion is computed from Answer.status (SSoT pattern)
 *
 * @param input - questionId, answerText, userId
 * @returns Submitted answer data
 */
async function submit(input: SubmitAnswerInput): Promise<SubmitAnswerResult> {
  const { questionId, answerText, userId } = input

  // 1. Verify ownership
  await verifyQuestionOwnership(questionId, userId)

  // 2. Always create a new answer (multiple attempts allowed)
  const answer = await prisma.answer.create({
    data: {
      questionId,
      text: answerText,
      status: AnswerStatus.SUBMITTED,
      submittedAt: new Date(),
      startedAt: new Date(),
    },
  })

  return {
    id: answer.id,
    questionId: answer.questionId,
    text: answer.text,
    status: answer.status,
    submittedAt: answer.submittedAt,
  }
}

/**
 * Get answer with feedback by questionId
 *
 * Returns latest answer with associated feedback for display
 *
 * @param input - questionId, userId
 * @returns Answer with feedback or nulls
 */
async function getWithFeedback(
  input: GetWithFeedbackInput
): Promise<AnswerWithFeedbackResult> {
  const { questionId, userId } = input

  // Verify ownership
  await verifyQuestionOwnership(questionId, userId)

  // Get latest answer with feedback
  const answer = await prisma.answer.findFirst({
    where: { questionId },
    orderBy: { createdAt: 'desc' },
    include: { feedback: true },
  })

  if (!answer) {
    return { answer: null, feedback: null }
  }

  return {
    answer: {
      id: answer.id,
      questionId: answer.questionId,
      text: answer.text,
      status: answer.status,
      version: answer.version,
      startedAt: answer.startedAt,
      submittedAt: answer.submittedAt,
      createdAt: answer.createdAt,
      updatedAt: answer.updatedAt,
    },
    feedback: answer.feedback
      ? {
          id: answer.feedback.id,
          strengths: answer.feedback.strengths,
          weaknesses: answer.feedback.weaknesses,
          suggestions: answer.feedback.suggestions,
          rating: answer.feedback.rating,
          ratingRationale: answer.feedback.ratingRationale,
          generatedAt: answer.feedback.generatedAt,
          guideAnswer: answer.feedback
            .guideAnswer as StructuredGuideAnswer | null,
        }
      : null,
  }
}

/**
 * List all attempts for a question
 *
 * Returns all answer-feedback pairs for history display.
 * Ordered by createdAt ASC (oldest first = attempt #1)
 *
 * @param input - questionId, userId
 * @returns List of attempt summaries
 */
async function listAttempts(
  input: ListAttemptsInput
): Promise<ListAttemptsResult> {
  const { questionId, userId } = input

  // Verify ownership
  await verifyQuestionOwnership(questionId, userId)

  // Get all answers ordered by creation time (oldest first for proper numbering)
  const answers = await prisma.answer.findMany({
    where: { questionId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      submittedAt: true,
      status: true,
      createdAt: true,
    },
  })

  return {
    attempts: answers.map((answer, index) => ({
      id: answer.id,
      attemptNumber: index + 1,
      submittedAt: answer.submittedAt,
      status: answer.status,
      hasEvaluated: answer.status === AnswerStatus.EVALUATED,
    })),
  }
}

/**
 * Get specific attempt by answerId
 *
 * Returns answer with feedback for viewing past attempts.
 *
 * @param input - answerId, userId
 * @returns Answer with feedback or nulls
 */
async function getAttemptById(
  input: GetAttemptByIdInput
): Promise<AnswerWithFeedbackResult> {
  const { answerId, userId } = input

  const answer = await prisma.answer.findUnique({
    where: { id: answerId },
    include: {
      feedback: true,
      question: {
        select: {
          keyAchievement: { select: { userId: true } },
        },
      },
    },
  })

  if (!answer) {
    throw new NotFoundError('Answer', answerId)
  }

  // Verify ownership via question -> keyAchievement
  if (
    !answer.question.keyAchievement ||
    answer.question.keyAchievement.userId !== userId
  ) {
    // Treat as not found for security (don't reveal existence to unauthorized users)
    throw new NotFoundError('Answer', answerId)
  }

  return {
    answer: {
      id: answer.id,
      questionId: answer.questionId,
      text: answer.text,
      status: answer.status,
      version: answer.version,
      startedAt: answer.startedAt,
      submittedAt: answer.submittedAt,
      createdAt: answer.createdAt,
      updatedAt: answer.updatedAt,
    },
    feedback: answer.feedback
      ? {
          id: answer.feedback.id,
          strengths: answer.feedback.strengths,
          weaknesses: answer.feedback.weaknesses,
          suggestions: answer.feedback.suggestions,
          rating: answer.feedback.rating,
          ratingRationale: answer.feedback.ratingRationale,
          generatedAt: answer.feedback.generatedAt,
          guideAnswer: answer.feedback
            .guideAnswer as StructuredGuideAnswer | null,
        }
      : null,
  }
}

export const answerService = {
  submit,
  getWithFeedback,
  listAttempts,
  getAttemptById,
}
