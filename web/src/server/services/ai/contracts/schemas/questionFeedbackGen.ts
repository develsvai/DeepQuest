/**
 * Question Feedback Generation Workflow Contract Types
 * Source: ai/src/graphs/question_feedback_gen/state.py, schema.py
 */

import { z } from 'zod'
import { ExperienceTypeZod, RatingZod } from '@/lib/db/utils/prisma-to-zod'

import {
  CareerExperienceBaseSchema,
  ProjectExperienceBaseSchema,
} from './common'
import { QuestionSchema } from './common'
// ============= Input Schema V2 =============

/**
 * QuestionFeedbackGenInputSchemaV2 - 피드백 생성 입력 스키마 (v2)
 * Source: ai/src/graphs/question_feedback_gen/state.py - InputState
 *
 * v1과의 차이점:
 * - locale 필드 제거
 * - Experience 스키마 간소화 (CareerExperienceBaseSchema, ProjectExperienceBaseSchema 사용)
 */
export const QuestionFeedbackGenInputSchemaV2 = z.object({
  experienceType: ExperienceTypeZod, // 경험 유형 ('CAREER' 또는 'PROJECT')
  careerExperience: CareerExperienceBaseSchema.nullable().default(null), // 경력 경험
  projectExperience: ProjectExperienceBaseSchema.nullable().default(null), // 프로젝트 경험
  question: QuestionSchema, // 면접 질문
  isGuideAnswerEnabled: z.boolean().default(true), // GuideAnswer 생성 여부
  answer: z.string(), // 질문에 대한 사용자의 답변
})

export type QuestionFeedbackGenGraphInputV2 = z.infer<
  typeof QuestionFeedbackGenInputSchemaV2
>
// ============= Output Schema V2 Components =============

/**
 * RatingSchemaV2 - 평가 등급 스키마 (v2)
 * Source: ai/src/graphs/question_feedback_gen/schema.py - Rating
 *
 * v1과의 차이점:
 * - 단순 enum에서 객체로 변경
 * - rationale 필드 추가 (평가 이유 설명)
 */
export const RatingSchemaV2 = z.object({
  level: RatingZod, // 평가 등급 (DEEP/INTERMEDIATE/SURFACE)
  rationale: z.array(z.string()), // 해당 등급을 준 핵심 이유들
})

export type RatingV2 = z.infer<typeof RatingSchemaV2>

/**
 * FeedbackSchemaV2 - 피드백 스키마 (v2)
 * Source: ai/src/graphs/question_feedback_gen/schema.py - Feedback
 *
 * v1과의 차이점:
 * - rating 필드가 단순 enum에서 RatingSchemaV2 객체로 변경
 * - rationale을 통해 평가 이유를 상세히 제공
 */
export const FeedbackSchemaV2 = z.object({
  strengths: z.array(z.string()), // 답변의 강점들
  weaknesses: z.array(z.string()), // 답변의 약점들
  suggestions: z.array(z.string()), // 개선 제안들
  rating: RatingSchemaV2, // 평가 등급 및 이유 (v2)
})

export type FeedbackV2 = z.infer<typeof FeedbackSchemaV2>

export const StructuredGuideAnswerParagraphSchema = z.object({
  structureSectionName: z.string(), // 섹션 이름 (예: "Situation: Context", "Action: Implementation")
  content: z.string(), // 해당 섹션의 상세 내용
})

export type Paragraph = z.infer<typeof StructuredGuideAnswerParagraphSchema>

export const StructuredGuideAnswerSchema = z.object({
  paragraphs: z.array(StructuredGuideAnswerParagraphSchema), // 섹션별로 구조화된 가이드 답변
})

export type StructuredGuideAnswerParagraph = z.infer<
  typeof StructuredGuideAnswerParagraphSchema
>
export type StructuredGuideAnswer = z.infer<typeof StructuredGuideAnswerSchema>

export const QuestionFeedbackGenStateSchemaV2 =
  QuestionFeedbackGenInputSchemaV2.extend({
    feedback: FeedbackSchemaV2,
    structuredGuideAnswer: StructuredGuideAnswerSchema,
  })

export type QuestionFeedbackGenStateV2 = z.infer<
  typeof QuestionFeedbackGenStateSchemaV2
>

// ============= Complete Output Schema V2 =============

/**
 * QuestionFeedbackGenOutputSchemaV2 - 피드백 생성 출력 스키마 (v2)
 * Source: ai/src/graphs/question_feedback_gen/state.py - OutputState
 *
 * v1과의 차이점:
 * - feedback의 rating 필드가 객체로 변경 (level + rationale)
 */
export const QuestionFeedbackGenOutputSchemaV2 = z.object({
  feedback: FeedbackSchemaV2.nullable(), // 피드백 (v2 - rating에 rationale 포함)
  structuredGuideAnswer: StructuredGuideAnswerSchema.nullish(), // AI 생성 구조화된 가이드 답변
})

export type QuestionFeedbackGenGraphOutputV2 = z.infer<
  typeof QuestionFeedbackGenOutputSchemaV2
>
