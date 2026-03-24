/**
 * Key Achievement Service Types
 *
 * Domain types for KeyAchievement service layer.
 * Re-exports shared types and defines service-specific types.
 *
 * @canonical KeyAchievement types are defined here as the source of truth.
 */

import type { Prisma } from '@/generated/prisma/client'
import type { WithProgress } from '../common/type-utils'

/**
 * Base KeyAchievement from Prisma
 *
 * Exported for use in other domains (experience, interview-preparation)
 */
export type BaseKeyAchievement = Prisma.KeyAchievementGetPayload<object>

/**
 * KeyAchievement with question progress counts for UI
 *
 * @canonical Use this type for KeyAchievement with progress across all domains.
 */
export type KeyAchievementWithProgress = WithProgress<BaseKeyAchievement>

/**
 * KeyAchievement with owner information for authorization
 */
export type KeyAchievementWithOwner = BaseKeyAchievement & {
  userId: string | null
  interviewPreparationId: string | null
}

/**
 * Full KeyAchievement result with progress and ownership
 */
export type KeyAchievementDetailResult = KeyAchievementWithProgress & {
  userId: string | null
  interviewPreparationId: string | null
}

// ==========================================
// CRUD Operation Types
// ==========================================

/**
 * Input data for creating a new KeyAchievement
 *
 * @refactored 2025-12-07: Added userId for denormalization (direct ownership verification)
 */
export interface CreateKeyAchievementData {
  userId: string // Required for denormalized ownership
  title: string
  problems?: string[]
  actions?: string[]
  results?: string[]
  reflections?: string[]
  orderIndex?: number
  careerExperienceId?: number
  projectExperienceId?: number
}

/**
 * Input data for updating a KeyAchievement
 */
export interface UpdateKeyAchievementData {
  title?: string
  problems?: string[]
  actions?: string[]
  results?: string[]
  reflections?: string[]
  orderIndex?: number
}
