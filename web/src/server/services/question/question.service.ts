/**
 * Question Service
 *
 * Business logic for question operations.
 * Pure domain logic without HTTP/tRPC concerns.
 */

import { prisma } from '@/lib/db/prisma'
import {
  AnswerStatus,
  ExperienceType,
  QuestionCategory,
} from '@/generated/prisma/enums'
import type { Question } from '@/generated/prisma/client'
import { NotFoundError, ForbiddenError } from '@/server/services/common/errors'
import { keyAchievementService } from '@/server/services/key-achievement'
import type {
  ListByExperienceInput,
  ListQuestionsResult,
  QuestionListItem,
  CreateManyQuestionsInput,
  CreateManyQuestionsResult,
  CreateQuestionInput,
  UpdateQuestionInput,
  QuestionWithOwner,
} from './types'

/**
 * Check if a question is completed based on answer status
 * A question is completed when it has at least one EVALUATED answer
 */
function isQuestionCompleted(
  answers: ReadonlyArray<{ status: AnswerStatus }>
): boolean {
  return answers.some(a => a.status === AnswerStatus.EVALUATED)
}

/**
 * Get KeyAchievement IDs for a specific experience
 */
async function getKeyAchievementIds(
  experienceType: ExperienceType,
  experienceId: number
): Promise<number[]> {
  const whereClause =
    experienceType === ExperienceType.CAREER
      ? { careerExperienceId: experienceId }
      : { projectExperienceId: experienceId }

  const keyAchievements = await prisma.keyAchievement.findMany({
    where: whereClause,
    select: { id: true },
  })

  return keyAchievements.map(ka => ka.id)
}

/**
 * List questions by experience
 *
 * If keyAchievementId is provided, returns questions for that specific achievement.
 * Otherwise, returns all questions for the experience (via all its key achievements).
 *
 * Category filtering is handled client-side in the UI.
 *
 * @param input - Query parameters
 * @returns List of questions with metadata
 */
export async function listByExperience(
  input: ListByExperienceInput
): Promise<ListQuestionsResult> {
  const { experienceType, experienceId, keyAchievementId } = input

  // Build where clause based on whether keyAchievementId is provided
  let keyAchievementIds: number[]

  if (keyAchievementId !== undefined) {
    // Specific key achievement
    keyAchievementIds = [keyAchievementId]
  } else {
    // All key achievements for the experience
    keyAchievementIds = await getKeyAchievementIds(experienceType, experienceId)
  }

  if (keyAchievementIds.length === 0) {
    return {
      questionsByCategory: {},
      total: 0,
    }
  }

  // Query questions with answers for completion check
  const questions = await prisma.question.findMany({
    where: {
      keyAchievementId: { in: keyAchievementIds },
      parentQuestionId: null, // Only top-level questions (not follow-ups)
    },
    select: {
      id: true,
      text: true,
      category: true,
      orderIndex: true,
      keyAchievementId: true,
      answers: {
        select: { status: true },
      },
    },
    orderBy: [
      { category: 'asc' },
      { keyAchievementId: 'asc' },
      { orderIndex: 'asc' },
    ],
  })

  // Group by category with computed isCompleted
  const questionsByCategory = questions.reduce<
    Partial<Record<QuestionCategory, QuestionListItem[]>>
  >((acc, q) => {
    if (!q.category) return acc

    const category = q.category
    const list = acc[category] ?? []
    list.push({
      id: q.id,
      text: q.text,
      category: q.category,
      isCompleted: isQuestionCompleted(q.answers),
      orderIndex: q.orderIndex,
      keyAchievementId: q.keyAchievementId,
    })
    acc[category] = list
    return acc
  }, {})

  return {
    questionsByCategory,
    total: questions.length,
  }
}

/**
 * Create multiple questions for a KeyAchievement
 *
 * AI 서버에서 생성된 질문들을 일괄 저장
 * Question은 keyAchievementId에만 직접 종속 (interviewPreparationId 사용 안함)
 *
 * @param input - keyAchievementId와 질문 목록
 * @returns 생성된 질문 수
 */
export async function createMany(
  input: CreateManyQuestionsInput
): Promise<CreateManyQuestionsResult> {
  const { keyAchievementId, questions } = input

  const result = await prisma.question.createMany({
    data: questions.map((q, index) => ({
      keyAchievementId,
      text: q.content,
      category: q.category,
      orderIndex: index,
    })),
  })

  return { count: result.count }
}

/**
 * Get a single question by ID
 *
 * @param questionId - The question ID to fetch
 * @returns Question data or null if not found
 */
export async function getById(
  questionId: string
): Promise<QuestionListItem | null> {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: {
      id: true,
      text: true,
      category: true,
      orderIndex: true,
      keyAchievementId: true,
      answers: {
        select: { status: true },
      },
    },
  })

  if (!question) return null

  return {
    id: question.id,
    text: question.text,
    category: question.category,
    isCompleted: isQuestionCompleted(question.answers),
    orderIndex: question.orderIndex,
    keyAchievementId: question.keyAchievementId,
  }
}

// ============= Single Question CRUD =============

/**
 * Find a question by ID with owner information
 *
 * Traverses Question → KeyAchievement to get userId for ownership verification.
 *
 * @param questionId - The question ID
 * @returns Question with userId
 * @throws NotFoundError if not found
 */
export async function findById(questionId: string): Promise<QuestionWithOwner> {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: {
      keyAchievement: {
        select: { userId: true },
      },
    },
  })

  if (!question) {
    throw new NotFoundError('Question', questionId)
  }

  return {
    id: question.id,
    keyAchievementId: question.keyAchievementId,
    text: question.text,
    category: question.category,
    orderIndex: question.orderIndex,
    userId: question.keyAchievement?.userId ?? null,
  }
}

/**
 * Verify question ownership
 *
 * Internal helper to check if user owns the question.
 *
 * @param questionId - The question ID
 * @param userId - The user ID to verify
 * @returns Question with owner info
 * @throws NotFoundError if not found
 * @throws ForbiddenError if not owned by user
 */
async function verifyQuestionOwnership(
  questionId: string,
  userId: string
): Promise<QuestionWithOwner> {
  const question = await findById(questionId)

  if (question.userId !== userId) {
    throw new ForbiddenError('You do not have access to this question')
  }

  return question
}

/**
 * Create a single question
 *
 * Verifies keyAchievement ownership before creation.
 * Auto-calculates orderIndex if not provided.
 *
 * @param input - Question creation data
 * @param userId - The requesting user ID
 * @returns Created question
 * @throws NotFoundError if keyAchievement not found
 * @throws ForbiddenError if not owned by user
 */
export async function create(
  input: CreateQuestionInput,
  userId: string
): Promise<Question> {
  const { keyAchievementId, text, category, orderIndex } = input

  // Verify keyAchievement ownership
  await keyAchievementService.verifyOwnershipByUserId(keyAchievementId, userId)

  // Calculate orderIndex if not provided
  let finalOrderIndex = orderIndex
  if (finalOrderIndex === undefined) {
    const maxOrder = await prisma.question.aggregate({
      where: {
        keyAchievementId,
        parentQuestionId: null, // Only top-level questions
      },
      _max: { orderIndex: true },
    })
    finalOrderIndex = (maxOrder._max.orderIndex ?? -1) + 1
  }

  return prisma.question.create({
    data: {
      keyAchievementId,
      text,
      category: category ?? null,
      orderIndex: finalOrderIndex,
    },
  })
}

/**
 * Update an existing question
 *
 * Verifies ownership before update.
 *
 * @param questionId - The question ID
 * @param data - Update data
 * @param userId - The requesting user ID
 * @returns Updated question
 * @throws NotFoundError if not found
 * @throws ForbiddenError if not owned by user
 */
export async function update(
  questionId: string,
  data: UpdateQuestionInput,
  userId: string
): Promise<Question> {
  // Verify ownership
  await verifyQuestionOwnership(questionId, userId)

  return prisma.question.update({
    where: { id: questionId },
    data,
  })
}

/**
 * Delete a question
 *
 * Verifies ownership before deletion.
 * Answers are cascade-deleted by Prisma.
 *
 * @param questionId - The question ID
 * @param userId - The requesting user ID
 * @throws NotFoundError if not found
 * @throws ForbiddenError if not owned by user
 */
export async function deleteQuestion(
  questionId: string,
  userId: string
): Promise<void> {
  // Verify ownership
  await verifyQuestionOwnership(questionId, userId)

  await prisma.question.delete({
    where: { id: questionId },
  })
}

export const questionService = {
  // Read operations
  getById,
  findById,
  listByExperience,
  // Create operations
  create,
  createMany,
  // Update operations
  update,
  // Delete operations
  delete: deleteQuestion,
}
