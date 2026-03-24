/**
 * Selection Strategy Types
 *
 * Defines interfaces for question selection strategies.
 * Allows easy swapping of selection logic in the future.
 */

import type { DateSeeder } from '../seeder'
import type { QuestionWithContext, FeaturedQuest, RelatedQuest } from '../types'

// ═══════════════════════════════════════════════════════════════════════════
// Strategy Context
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Context passed to selection strategies.
 * Contains all data needed for making selection decisions.
 */
export interface SelectionContext {
  /** All questions with their context */
  questions: QuestionWithContext[]
  /** Date-based seeder for deterministic selection */
  seeder: DateSeeder
  /** Interview preparation ID for reference */
  interviewPreparationId: string
}

// ═══════════════════════════════════════════════════════════════════════════
// Strategy Interfaces
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Interface for featured quest selection strategy.
 * Implement this to create alternative selection algorithms.
 */
export interface FeaturedSelectionStrategy {
  /**
   * Select the featured quest from available questions.
   *
   * @param ctx - Selection context
   * @returns Featured quest or null if no suitable question found
   */
  selectFeatured(ctx: SelectionContext): FeaturedQuest | null
}

/**
 * Interface for related quests selection strategy.
 * Implement this to create alternative selection algorithms.
 */
export interface RelatedSelectionStrategy {
  /**
   * Select related quests based on the featured quest.
   *
   * @param featured - The selected featured quest
   * @param ctx - Selection context
   * @param count - Number of related quests to select
   * @returns Array of related quests
   */
  selectRelated(
    featured: FeaturedQuest,
    ctx: SelectionContext,
    count: number
  ): RelatedQuest[]
}

/**
 * Combined strategy interface for convenience.
 * Use when implementing a complete selection strategy.
 */
export interface SelectionStrategy
  extends FeaturedSelectionStrategy, RelatedSelectionStrategy {}
