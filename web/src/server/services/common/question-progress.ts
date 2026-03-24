/**
 * Question Progress Calculation Helpers
 *
 * Common utilities for calculating question completion progress
 * across KeyAchievements in Experience entities.
 *
 * Completion is determined by Answer.status (SSoT pattern):
 * A question is completed when it has at least one EVALUATED answer.
 */

import { AnswerStatus } from '@/generated/prisma/enums'

/**
 * Minimal interface for question with answers
 */
interface QuestionWithAnswers {
  answers: ReadonlyArray<{ status: AnswerStatus }>
}

/**
 * Minimal interface for achievements with questions
 * Used to calculate progress without depending on full Prisma types
 */
interface AchievementWithQuestions {
  questions: ReadonlyArray<QuestionWithAnswers>
}

/**
 * Question progress result
 */
export interface QuestionProgress {
  totalQuestions: number
  completedQuestions: number
}

/**
 * Check if a question is completed based on answer status
 */
function isQuestionCompleted(question: QuestionWithAnswers): boolean {
  return question.answers.some(a => a.status === AnswerStatus.EVALUATED)
}

/**
 * Calculates total and completed question counts from achievements
 *
 * @param achievements - Array of achievements with questions
 * @returns Object with totalQuestions and completedQuestions
 *
 * @example
 * ```typescript
 * const progress = calculateQuestionProgress(career.keyAchievements)
 * // { totalQuestions: 10, completedQuestions: 3 }
 * ```
 */
export function calculateQuestionProgress(
  achievements: ReadonlyArray<AchievementWithQuestions>
): QuestionProgress {
  let totalQuestions = 0
  let completedQuestions = 0

  for (const achievement of achievements) {
    totalQuestions += achievement.questions.length
    completedQuestions +=
      achievement.questions.filter(isQuestionCompleted).length
  }

  return { totalQuestions, completedQuestions }
}
