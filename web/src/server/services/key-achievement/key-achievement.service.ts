/**
 * Key Achievement Service
 *
 * Pure business logic for KeyAchievement operations.
 * This service handles data fetching and transformation without any
 * HTTP/tRPC concerns.
 *
 * @refactored 2025-12-05: Added userId-based methods for direct ownership verification
 * @see docs/refactoring/key-achievement-userid-denormalization.md
 */

import { prisma } from '@/lib/db/prisma'
import { NotFoundError, ValidationError } from '@/server/services/common/errors'
import { AnswerStatus } from '@/generated/prisma/enums'
import type { KeyAchievement } from '@/generated/prisma/client'
import type {
  KeyAchievementDetailResult,
  KeyAchievementWithOwner,
  CreateKeyAchievementData,
  UpdateKeyAchievementData,
} from './types'

// ============================================================
// New Simplified Methods (userId-based)
// ============================================================

/**
 * Finds a KeyAchievement by ID with userId verification
 *
 * This is the preferred method for ownership verification.
 * Uses denormalized userId field - no JOINs required.
 *
 * @param id - The KeyAchievement ID
 * @param userId - The user ID to verify ownership
 * @returns KeyAchievement with progress if found and owned by user
 * @throws NotFoundError if not found or not owned by user
 */
export async function findByIdAndUserId(
  id: number,
  userId: string
): Promise<KeyAchievementDetailResult> {
  const achievement = await prisma.keyAchievement.findFirst({
    where: {
      id,
      userId, // Direct ownership check - no JOINs!
    },
  })

  if (!achievement) {
    throw new NotFoundError('KeyAchievement', id)
  }

  // Get question progress counts
  const questionCounts = await getQuestionCounts(id)

  // Get interviewPreparationId through minimal JOIN (still needed for webhooks)
  const interviewPreparationId = await getInterviewPreparationId(achievement)

  return {
    ...achievement,
    interviewPreparationId,
    totalQuestions: questionCounts.total,
    completedQuestions: questionCounts.completed,
  }
}

/**
 * Simplified ownership verification using denormalized userId
 *
 * @param keyAchievementId - Key achievement ID to verify
 * @param userId - Expected user ID
 * @returns true if valid
 * @throws NotFoundError if not found or not owned by user
 */
export async function verifyOwnershipByUserId(
  keyAchievementId: number,
  userId: string
): Promise<boolean> {
  const achievement = await prisma.keyAchievement.findFirst({
    where: {
      id: keyAchievementId,
      userId,
    },
    select: { id: true },
  })

  if (!achievement) {
    throw new NotFoundError('KeyAchievement', keyAchievementId)
  }

  return true
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Gets question counts for a specific KeyAchievement
 *
 * @param keyAchievementId - The KeyAchievement ID
 * @returns Object with total and completed question counts
 */
async function getQuestionCounts(
  keyAchievementId: number
): Promise<{ total: number; completed: number }> {
  const questions = await prisma.question.findMany({
    where: {
      keyAchievementId,
    },
    select: {
      answers: { select: { status: true } },
    },
  })

  return {
    total: questions.length,
    completed: questions.filter(q =>
      q.answers.some(a => a.status === AnswerStatus.EVALUATED)
    ).length,
  }
}

/**
 * Gets interviewPreparationId for a KeyAchievement
 *
 * Since interviewPreparationId is not denormalized yet, we need to
 * traverse the relationship chain. This is a minimal query.
 *
 * @param achievement - KeyAchievement with experienceIds
 * @returns interviewPreparationId or null
 */
async function getInterviewPreparationId(achievement: {
  careerExperienceId: number | null
  projectExperienceId: number | null
}): Promise<string | null> {
  if (achievement.careerExperienceId) {
    const career = await prisma.careerExperience.findUnique({
      where: { id: achievement.careerExperienceId },
      select: {
        interviewPreparationId: true,
      },
    })
    return career?.interviewPreparationId ?? null
  }

  if (achievement.projectExperienceId) {
    const project = await prisma.projectExperience.findUnique({
      where: { id: achievement.projectExperienceId },
      select: {
        interviewPreparationId: true,
      },
    })
    return project?.interviewPreparationId ?? null
  }

  return null
}

// ============================================================
// CRUD Operations
// ============================================================

/**
 * Gets a KeyAchievement by ID with owner information for authorization
 *
 * @refactored 2025-12-07: Simplified to use denormalized userId field (no more 4-level JOIN)
 * @param id - The KeyAchievement ID
 * @returns KeyAchievement with owner userId
 * @throws NotFoundError if not found
 */
export async function findById(id: number): Promise<KeyAchievementWithOwner> {
  const achievement = await prisma.keyAchievement.findUnique({
    where: { id },
  })

  if (!achievement) {
    throw new NotFoundError('KeyAchievement', id)
  }

  // Get interviewPreparationId through minimal JOIN
  const interviewPreparationId = await getInterviewPreparationId(achievement)

  return {
    ...achievement,
    userId: achievement.userId,
    interviewPreparationId,
  }
}

/**
 * Creates a new KeyAchievement
 *
 * @refactored 2025-12-07: Added userId support for denormalized ownership
 * @param data - The KeyAchievement data (must include userId)
 * @returns Created KeyAchievement
 * @throws ValidationError if the parent experience doesn't exist
 */
export async function create(
  data: CreateKeyAchievementData
): Promise<KeyAchievement> {
  const {
    userId,
    careerExperienceId,
    projectExperienceId,
    ...achievementData
  } = data

  // Verify the parent experience exists
  if (careerExperienceId) {
    const career = await prisma.careerExperience.findUnique({
      where: { id: careerExperienceId },
    })
    if (!career) {
      throw new ValidationError(
        `Career experience not found: ${careerExperienceId}`
      )
    }
  }

  if (projectExperienceId) {
    const project = await prisma.projectExperience.findUnique({
      where: { id: projectExperienceId },
    })
    if (!project) {
      throw new ValidationError(
        `Project experience not found: ${projectExperienceId}`
      )
    }
  }

  // Get the next orderIndex if not provided
  let orderIndex = achievementData.orderIndex
  if (orderIndex === undefined) {
    const maxOrder = await prisma.keyAchievement.aggregate({
      where: {
        OR: [
          { careerExperienceId: careerExperienceId ?? undefined },
          { projectExperienceId: projectExperienceId ?? undefined },
        ],
      },
      _max: { orderIndex: true },
    })
    orderIndex = (maxOrder._max.orderIndex ?? -1) + 1
  }

  return prisma.keyAchievement.create({
    data: {
      userId, // Denormalized ownership field
      ...achievementData,
      orderIndex,
      careerExperienceId: careerExperienceId ?? null,
      projectExperienceId: projectExperienceId ?? null,
    },
  })
}

/**
 * Updates an existing KeyAchievement
 *
 * @param id - The KeyAchievement ID
 * @param data - The update data
 * @returns Updated KeyAchievement
 * @throws NotFoundError if not found
 */
export async function update(
  id: number,
  data: UpdateKeyAchievementData
): Promise<KeyAchievement> {
  // Verify the achievement exists
  const existing = await prisma.keyAchievement.findUnique({
    where: { id },
  })

  if (!existing) {
    throw new NotFoundError('KeyAchievement', id)
  }

  return prisma.keyAchievement.update({
    where: { id },
    data,
  })
}

/**
 * Deletes a KeyAchievement
 *
 * @param id - The KeyAchievement ID
 * @throws NotFoundError if not found
 */
export async function delete_(id: number): Promise<void> {
  // Verify the achievement exists
  const existing = await prisma.keyAchievement.findUnique({
    where: { id },
  })

  if (!existing) {
    throw new NotFoundError('KeyAchievement', id)
  }

  await prisma.keyAchievement.delete({
    where: { id },
  })
}

/**
 * Key Achievement Service exports
 *
 * @refactored 2025-12-12: Added CRUD operations from interview-prep-detail
 * All methods now use denormalized userId for direct ownership verification
 */
export const keyAchievementService = {
  // Read operations
  findByIdAndUserId,
  findById,
  verifyOwnershipByUserId,
  // CRUD operations
  create,
  update,
  delete: delete_,
}
