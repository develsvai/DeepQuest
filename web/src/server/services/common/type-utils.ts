/**
 * Service Layer Type Utilities
 *
 * Generic utility types for service layer to reduce duplication
 * and improve type reusability across domains.
 */

// ============================================================================
// Common Prisma Field Types
// ============================================================================

/**
 * Common Prisma auto-generated fields to omit in input types
 */
export type OmittedPrismaFields = 'id' | 'createdAt' | 'updatedAt'

// ============================================================================
// Progress Types (Question Completion Tracking)
// ============================================================================

/**
 * Adds question progress fields to any type
 *
 * @example
 * ```typescript
 * type KeyAchievementWithProgress = WithProgress<BaseKeyAchievement>
 * // Result: BaseKeyAchievement & { totalQuestions: number; completedQuestions: number }
 * ```
 */
export type WithProgress<T> = T & {
  totalQuestions: number
  completedQuestions: number
}

// ============================================================================
// Service Input Helpers
// ============================================================================

/**
 * Adds userId to any input type for service layer ownership verification
 *
 * @example
 * ```typescript
 * type CreateWithUser = WithUserId<CreateInput>
 * // Result: CreateInput & { userId: string }
 * ```
 */
export type WithUserId<T> = T & { userId: string }

// ============================================================================
// Base Type Helpers (for Prisma types)
// ============================================================================

/**
 * Re-export QuestionProgress from question-progress module
 * to centralize progress-related types
 */
export type { QuestionProgress } from './question-progress'
