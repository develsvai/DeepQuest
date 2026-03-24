/**
 * Related Quests Selection Strategy
 *
 * Selects related questions based on the featured quest.
 * Uses date-based seeding for deterministic daily selection.
 *
 * Priority:
 * 1. Same KeyAchievement + Different category
 * 2. Same Experience + Different category
 * 3. Same Experience + Any category
 */

import { Rating } from '@/generated/prisma/enums'
import type {
  QuestionWithContext,
  FeaturedQuest,
  RelatedQuest,
  RelationReason,
} from '../types'
import type { SelectionContext } from './types'

// ═══════════════════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Select related quests based on the featured quest.
 *
 * Algorithm:
 * 1. Exclude featured quest and completed questions
 * 2. Prioritize by relation type (same achievement > same experience)
 * 3. Prefer different categories for variety
 * 4. Use date seed for deterministic selection within each priority group
 *
 * @param featured - The selected featured quest
 * @param ctx - Selection context with questions and seeder
 * @param count - Number of related quests to select (default: 2)
 * @returns Array of related quests (exactly `count` items if enough candidates)
 */
export function selectRelated(
  featured: FeaturedQuest,
  ctx: SelectionContext,
  count: number = 2
): RelatedQuest[] {
  const { questions, seeder } = ctx
  const selected: RelatedQuest[] = []
  const selectedIds = new Set<string>([featured.id])

  // Filter out featured and completed (DEEP) questions
  const candidates = questions.filter(
    q => q.id !== featured.id && !isCompleted(q)
  )

  // Priority 1: Same KeyAchievement + Different category
  const sameAchievementDiffCategory = candidates.filter(
    q =>
      q.context.keyAchievementId === featured.context.keyAchievementId &&
      q.category !== featured.category &&
      !selectedIds.has(q.id)
  )

  for (const q of seeder.shuffle(sameAchievementDiffCategory)) {
    if (selected.length >= count) break
    selected.push(mapToRelatedQuest(q, 'SAME_ACHIEVEMENT'))
    selectedIds.add(q.id)
  }

  if (selected.length >= count) return selected

  // Priority 2: Same Experience + Different category
  const sameExpDiffCategory = candidates.filter(
    q =>
      q.context.experienceType === featured.context.experienceType &&
      q.context.experienceId === featured.context.experienceId &&
      q.category !== featured.category &&
      !selectedIds.has(q.id)
  )

  for (const q of seeder.shuffle(sameExpDiffCategory)) {
    if (selected.length >= count) break
    selected.push(mapToRelatedQuest(q, 'SAME_EXPERIENCE'))
    selectedIds.add(q.id)
  }

  if (selected.length >= count) return selected

  // Priority 3: Same Experience + Any category (including same)
  const sameExpAny = candidates.filter(
    q =>
      q.context.experienceType === featured.context.experienceType &&
      q.context.experienceId === featured.context.experienceId &&
      !selectedIds.has(q.id)
  )

  for (const q of seeder.shuffle(sameExpAny)) {
    if (selected.length >= count) break
    selected.push(mapToRelatedQuest(q, 'SAME_EXPERIENCE'))
    selectedIds.add(q.id)
  }

  if (selected.length >= count) return selected

  // Priority 4: Same Achievement (any category, fallback)
  const sameAchievementAny = candidates.filter(
    q =>
      q.context.keyAchievementId === featured.context.keyAchievementId &&
      !selectedIds.has(q.id)
  )

  for (const q of seeder.shuffle(sameAchievementAny)) {
    if (selected.length >= count) break
    selected.push(mapToRelatedQuest(q, 'SAME_ACHIEVEMENT'))
    selectedIds.add(q.id)
  }

  if (selected.length >= count) return selected

  // Priority 5: Any remaining question (different experience)
  // This should rarely happen as business rule guarantees 3+ questions
  const remaining = candidates.filter(q => !selectedIds.has(q.id))

  for (const q of seeder.shuffle(remaining)) {
    if (selected.length >= count) break
    selected.push(mapToRelatedQuest(q, 'SAME_EXPERIENCE')) // Best effort
    selectedIds.add(q.id)
  }

  return selected
}

// ═══════════════════════════════════════════════════════════════════════════
// Internal Helpers
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if a question is completed (has DEEP rating).
 */
function isCompleted(question: QuestionWithContext): boolean {
  const { latestAnswer } = question
  return latestAnswer?.rating === Rating.DEEP
}

/**
 * Map internal question representation to RelatedQuest output.
 */
function mapToRelatedQuest(
  question: QuestionWithContext,
  relationReason: RelationReason
): RelatedQuest {
  return {
    id: question.id,
    text: question.text,
    category: question.category,
    relationReason,
    isCompleted: isCompleted(question),
  }
}
