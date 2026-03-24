/**
 * Today's Quest Selection Module
 *
 * Exports the selection service and related types.
 */

// Main service
export { selectTodaysQuest } from './selection.service'

// Types
export type {
  SelectTodaysQuestInput,
  TodaysQuestResult,
  FeaturedQuest,
  RelatedQuest,
  QuestContext,
  LastAttemptInfo,
  UrgencyReason,
  RelationReason,
  SelectionReason,
  QuestionWithContext,
} from './types'

// Seeder (for testing or custom implementations)
export { createDateSeeder } from './seeder'
export type { DateSeeder } from './seeder'

// Strategies (for custom implementations or testing)
export {
  selectFeatured,
  selectRelated,
  calculateUrgencyScore,
  determineUrgencyReason,
} from './strategies'
export type {
  SelectionContext,
  SelectionStrategy,
  FeaturedSelectionStrategy,
  RelatedSelectionStrategy,
} from './strategies'
