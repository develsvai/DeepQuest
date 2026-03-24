/**
 * Question Completion Helper
 *
 * Utility for computing question completion status from Answer data.
 * Implements Single Source of Truth pattern - Answer.status is the source.
 */

import { AnswerStatus } from '@/generated/prisma/enums'

/**
 * Minimal type for question with answers
 */
export type QuestionWithAnswers = {
  answers: ReadonlyArray<{ status: AnswerStatus }>
}

/**
 * Check if a question is completed
 *
 * A question is considered completed when it has at least one answer
 * with EVALUATED status (meaning feedback has been generated).
 *
 * @param question - Question with answers array
 * @returns true if question has an EVALUATED answer
 */
export function isQuestionCompleted(question: QuestionWithAnswers): boolean {
  return question.answers.some(a => a.status === AnswerStatus.EVALUATED)
}

/**
 * Prisma select config for question completion check
 *
 * Use this in Prisma queries to include minimal answer data needed
 * for completion status calculation.
 */
export const questionCompletionSelect = {
  answers: {
    select: { status: true },
  },
} as const
