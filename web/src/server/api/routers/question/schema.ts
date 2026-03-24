/**
 * Question Router Schemas
 *
 * Zod schemas for input validation in the Question router.
 */

import { z } from 'zod'
import { ExperienceType, QuestionCategory } from '@/generated/prisma/enums'

/**
 * Schema for listByExperience input
 *
 * - If keyAchievementId is provided, returns questions for that specific achievement
 * - If keyAchievementId is not provided, returns all questions for the experience
 * - Category filtering is handled client-side in the UI
 */
export const listByExperienceSchema = z.object({
  experienceType: z.enum([ExperienceType.CAREER, ExperienceType.PROJECT]),
  experienceId: z
    .number()
    .int()
    .positive('Experience ID must be a positive integer'),
  keyAchievementId: z
    .number()
    .int()
    .positive('Key achievement ID must be a positive integer')
    .optional(),
})

export type ListByExperienceInput = z.infer<typeof listByExperienceSchema>

/**
 * Schema for startGeneration input
 *
 * 단일 KeyAchievement에 대해 선택된 카테고리로 질문 생성 시작
 * - interviewPreparationId: 권한 검증용
 * - keyAchievementId: 질문 생성 대상
 * - questionCategories: 생성할 질문 카테고리 목록
 */
export const startQuestionGenerationSchema = z.object({
  keyAchievementId: z
    .number()
    .int()
    .positive('Key achievement ID must be a positive integer'),
  questionCategories: z
    .array(
      z.enum([
        QuestionCategory.TECHNICAL_DECISION,
        QuestionCategory.TECHNICAL_DEPTH,
        QuestionCategory.PROBLEM_SOLVING,
        QuestionCategory.SCALABILITY,
      ])
    )
    .min(1, 'At least one question category is required'),
})

export type StartQuestionGenerationInput = z.infer<
  typeof startQuestionGenerationSchema
>

/**
 * Schema for getById input
 *
 * Fetch a single question by its ID
 */
export const getByIdSchema = z.object({
  questionId: z.string().min(1, 'Question ID is required'),
})

export type GetByIdInput = z.infer<typeof getByIdSchema>

// ============================================
// Question CRUD Schemas
// ============================================

/**
 * Base schema for question data (shared fields)
 */
const questionDataSchema = z.object({
  text: z
    .string()
    .min(1, 'Question text is required')
    .max(2000, 'Question text too long'),
  category: z
    .enum([
      QuestionCategory.TECHNICAL_DECISION,
      QuestionCategory.TECHNICAL_DEPTH,
      QuestionCategory.PROBLEM_SOLVING,
      QuestionCategory.SCALABILITY,
    ])
    .nullable()
    .optional(),
  orderIndex: z.number().int().min(0).optional(),
})

/**
 * Schema for creating a single question
 *
 * Requires keyAchievementId to link to parent.
 * Unlike bulk AI generation, this is for manual user additions.
 */
export const createQuestionSchema = questionDataSchema.extend({
  keyAchievementId: z.number().int().positive('Key achievement ID is required'),
})

export type CreateQuestionSchemaInput = z.infer<typeof createQuestionSchema>

/**
 * Schema for updating an existing question
 */
export const updateQuestionSchema = z.object({
  id: z.string().min(1, 'Question ID is required'),
  data: questionDataSchema.partial(),
})

export type UpdateQuestionSchemaInput = z.infer<typeof updateQuestionSchema>

/**
 * Schema for deleting a question
 */
export const deleteQuestionSchema = z.object({
  id: z.string().min(1, 'Question ID is required'),
})

export type DeleteQuestionSchemaInput = z.infer<typeof deleteQuestionSchema>

// ============================================
// Today's Quest Selection Schema
// ============================================

/**
 * Schema for getTodaysQuest input
 *
 * Selects 3 questions (1 featured + 2 related) for daily practice.
 * Uses date-based seeding for consistent daily selection.
 *
 * @param interviewPreparationId - Interview preparation to select from
 * @param date - Client local date in YYYY-MM-DD format
 */
export const getTodaysQuestSchema = z.object({
  interviewPreparationId: z
    .string()
    .min(1, 'Interview preparation ID is required'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
})

export type GetTodaysQuestInput = z.infer<typeof getTodaysQuestSchema>
