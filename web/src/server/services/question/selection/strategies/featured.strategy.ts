/**
 * Featured Quest Selection Strategy
 *
 * Selects the most urgent question as the featured quest.
 * Uses urgency scoring combined with date-based seeding for daily rotation.
 *
 * Priority (higher = more urgent):
 * 1. NO_ANSWER (100) - Never attempted
 * 2. DRAFT_ONLY (80) - Started but not submitted
 * 3. SURFACE_RATING (60) - Feedback indicates shallow answer
 * 4. INTERMEDIATE_RATING (40) - Can be improved further
 * 5. DEEP_RATING (0) - Completed, excluded from selection
 */

import { AnswerStatus, Rating } from '@/generated/prisma/enums'
import type {
  QuestionWithContext,
  FeaturedQuest,
  UrgencyReason,
} from '../types'
import type { SelectionContext } from './types'

// Re-export URGENCY_SCORES for easy modification
export { URGENCY_SCORES } from '../types'

// ═══════════════════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Select the featured quest based on urgency scoring.
 *
 * Algorithm:
 * 1. Filter out completed (DEEP) questions
 * 2. Shuffle remaining questions using date seed (daily rotation)
 * 3. Sort by urgency score (descending)
 * 4. Pick the first one (highest urgency among shuffled)
 *
 * @param ctx - Selection context with questions and seeder
 * @returns Featured quest or null if all questions are completed
 */
export function selectFeatured(ctx: SelectionContext): FeaturedQuest | null {
  const { questions, seeder } = ctx

  // 1. Filter to urgent questions only (score > 0)
  const urgentPool = questions.filter(q => calculateUrgencyScore(q) > 0)

  if (urgentPool.length === 0) {
    return null // All questions are DEEP
  }

  // 2. Shuffle for daily rotation
  const shuffled = seeder.shuffle(urgentPool)

  // 3. Sort by urgency (highest first)
  // Note: Stable sort within same score due to shuffle
  const sorted = [...shuffled].sort(
    (a, b) => calculateUrgencyScore(b) - calculateUrgencyScore(a)
  )

  // 4. Select the most urgent
  const selected = sorted[0]

  return mapToFeaturedQuest(selected)
}

// ═══════════════════════════════════════════════════════════════════════════
// Internal Helpers
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate urgency score for a question.
 * Higher score = more urgent.
 */
export function calculateUrgencyScore(question: QuestionWithContext): number {
  const { latestAnswer } = question

  // No answer at all
  if (!latestAnswer) {
    return 100 // URGENCY_SCORES.NO_ANSWER
  }

  // Draft only (started but not submitted)
  if (latestAnswer.status === AnswerStatus.DRAFT) {
    return 80 // URGENCY_SCORES.DRAFT_ONLY
  }

  // Check rating
  const rating = latestAnswer.rating

  if (rating === Rating.SURFACE) {
    return 60 // URGENCY_SCORES.SURFACE_RATING
  }

  if (rating === Rating.INTERMEDIATE) {
    return 40 // URGENCY_SCORES.INTERMEDIATE_RATING
  }

  if (rating === Rating.DEEP) {
    return 0 // URGENCY_SCORES.DEEP_RATING - Completed
  }

  // Submitted but not yet evaluated (no feedback)
  // Treat as INTERMEDIATE priority
  return 40
}

/**
 * Determine the urgency reason based on question state.
 */
export function determineUrgencyReason(
  question: QuestionWithContext
): UrgencyReason {
  const { latestAnswer } = question

  if (!latestAnswer) {
    return 'NO_ANSWER'
  }

  if (latestAnswer.status === AnswerStatus.DRAFT) {
    return 'DRAFT_ONLY'
  }

  const rating = latestAnswer.rating

  if (rating === Rating.SURFACE) {
    return 'SURFACE_RATING'
  }

  // INTERMEDIATE or not yet evaluated
  return 'INTERMEDIATE_RATING'
}

/**
 * Map internal question representation to FeaturedQuest output.
 */
function mapToFeaturedQuest(question: QuestionWithContext): FeaturedQuest {
  const { latestAnswer } = question

  return {
    id: question.id,
    text: question.text,
    category: question.category,
    urgencyReason: determineUrgencyReason(question),
    context: question.context,
    lastAttempt: latestAnswer
      ? {
          answerId: latestAnswer.id,
          status: latestAnswer.status,
          rating: latestAnswer.rating,
        }
      : null,
  }
}
