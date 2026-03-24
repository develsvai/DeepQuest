/**
 * Selection Strategies
 *
 * Export all selection strategy implementations.
 */

// Strategy interfaces
export type {
  SelectionContext,
  FeaturedSelectionStrategy,
  RelatedSelectionStrategy,
  SelectionStrategy,
} from './types'

// Strategy implementations
export {
  selectFeatured,
  calculateUrgencyScore,
  determineUrgencyReason,
} from './featured.strategy'
export { selectRelated } from './related.strategy'
