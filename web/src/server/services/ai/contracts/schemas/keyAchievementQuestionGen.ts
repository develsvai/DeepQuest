/**
 * KeyAchievement-based Question Generation Workflow Contract Types
 *
 * Python Source: ai/src/graphs/question_gen/state.py
 *
 * 단일 KeyAchievement를 기반으로 질문을 생성하는 워크플로우
 * - 기존 배치 방식(experiences 배열)과 다르게 개별 KeyAchievement 단위로 처리
 * - TopicSelectionDialog에서 선택된 카테고리로 질문 생성
 */

import { z } from 'zod'
import {
  ExperienceTypeZod,
  QuestionCategoryZod,
} from '@/lib/db/utils/prisma-to-zod'
import {
  CareerExperienceV2Schema,
  ProjectExperienceV2Schema,
  QuestionSchema,
  KeyAchievementSchema,
} from './common'

// ============= Experience Wrapper Schema =============
/**
 * Experience 스키마 (AI InputState.experience와 매핑)
 *
 * Python: ai/src/graphs/question_gen/state.py - Experience
 * - experience_type → experienceType
 * - details → details (CareerExperience | ProjectExperience)
 */
export const QuestionGenExperienceSchema = z.object({
  experienceType: ExperienceTypeZod, // 'CAREER' or 'PROJECT'
  details: z.union([CareerExperienceV2Schema, ProjectExperienceV2Schema]),
})

export type QuestionGenExperience = z.infer<typeof QuestionGenExperienceSchema>

export type GeneratedQuestion = z.infer<typeof QuestionSchema>

// ============= Input Schema =============
/**
 * KeyAchievement 기반 질문 생성 입력 스키마
 *
 * Python: ai/src/graphs/question_gen/state.py - InputState
 * - applied_position → appliedPosition
 * - experience → experience
 * - key_achievement → keyAchievement
 * - question_categories → questionCategories
 * - existing_questions → existingQuestions (optional)
 */
export const KeyAchievementQuestionGenInputSchema = z.object({
  /** 지원 직무 (면접 준비 시 설정) */
  appliedPosition: z.string(),

  /** 해당 KeyAchievement가 속한 경험 정보 */
  experience: QuestionGenExperienceSchema,

  /** 질문 생성 대상 KeyAchievement */
  keyAchievement: KeyAchievementSchema,

  /** 사용자가 선택한 질문 카테고리 목록 */
  questionCategories: z.array(QuestionCategoryZod),

  /** 기존 질문 목록 (중복 방지용) */
  existingQuestions: z.array(QuestionSchema).nullable().optional(),
})

export type KeyAchievementQuestionGenInput = z.infer<
  typeof KeyAchievementQuestionGenInputSchema
>

// ============= Output Schema =============
/**
 * KeyAchievement 기반 질문 생성 출력 스키마
 *
 * Python: ai/src/graphs/question_gen/state.py - GraphState
 * - questions: 생성된 질문 목록
 */
export const KeyAchievementQuestionGenOutputSchema = z.object({
  /** 생성된 질문 목록 */
  questions: z.array(QuestionSchema),
})

export type KeyAchievementQuestionGenOutput = z.infer<
  typeof KeyAchievementQuestionGenOutputSchema
>
