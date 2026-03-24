/**
 * Today's Quest API → UI Type Transformations
 *
 * Transforms API response types to UI component props types.
 * Centralizes data mapping logic for TodaysQuestSection.
 */

import type {
  FeaturedQuest,
  RelatedQuest,
} from '@/server/services/question/selection/types'
import type {
  TodaysQuestData,
  QuestionPreviewData,
} from '../InterviewPrepDetailV2.types'
import { QuestionCategory } from '@/generated/prisma/enums'

// ═══════════════════════════════════════════════════════════════════════════
// Featured Quest → TodaysQuestData
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Transform API FeaturedQuest to UI TodaysQuestData
 *
 * Maps server response to the format expected by TodaysQuestCard component.
 */
export function transformFeaturedToUI(
  featured: FeaturedQuest
): TodaysQuestData {
  return {
    id: featured.id,
    experienceId: featured.context.experienceId,
    experienceType: featured.context.experienceType.toLowerCase() as
      | 'career'
      | 'project',
    category: featured.category ?? QuestionCategory.PROBLEM_SOLVING,
    companyName: featured.context.experienceName,
    questionText: featured.text,
    tags: generateTags(featured),
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Related Quest → QuestionPreviewData
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Transform API RelatedQuest to UI QuestionPreviewData
 *
 * Maps server response to the format expected by QuestionPreviewCard component.
 * Note: Some fields use defaults as RelatedQuest has limited context.
 */
export function transformRelatedToUI(
  related: RelatedQuest
): QuestionPreviewData {
  return {
    id: related.id,
    // RelatedQuest doesn't include experienceId - use 0 as placeholder
    experienceId: 0,
    // Default to career - can be extended in API if needed
    experienceType: 'career',
    category: related.category ?? QuestionCategory.PROBLEM_SOLVING,
    // Map completion status to rating (simplified mapping)
    rating: related.isCompleted ? 'DEEP' : 'SURFACE',
    questionText: related.text,
    // RelatedQuest doesn't include company name - use empty string
    companyName: '',
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate UI tags based on urgencyReason
 *
 * Creates user-friendly tags that explain why this question was selected.
 */
function generateTags(featured: FeaturedQuest): string[] {
  const tags: string[] = []

  switch (featured.urgencyReason) {
    case 'NO_ANSWER':
      tags.push('새로운 질문')
      break
    case 'DRAFT_ONLY':
      tags.push('작성 중')
      break
    case 'SURFACE_RATING':
      tags.push('개선 필요')
      break
    case 'INTERMEDIATE_RATING':
      tags.push('더 깊이 있게')
      break
  }

  return tags
}
