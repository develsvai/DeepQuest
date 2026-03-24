/**
 * Question Service Types
 *
 * Domain types for Question service layer.
 * Based on Prisma Question model with additional computed fields.
 */

import type { QuestionCategory, ExperienceType } from '@/generated/prisma/enums'

/**
 * Question list item for display
 */
export interface QuestionListItem {
  id: string
  text: string
  category: QuestionCategory | null
  isCompleted: boolean
  orderIndex: number
  keyAchievementId: number | null
}

/**
 * Input for listing questions by experience
 *
 * - If keyAchievementId is provided, returns questions for that specific achievement
 * - If keyAchievementId is not provided, returns all questions for the experience
 */
export interface ListByExperienceInput {
  experienceType: ExperienceType
  experienceId: number
  keyAchievementId?: number
}

/**
 * Result for listing questions (grouped by category)
 */
export interface ListQuestionsResult {
  questionsByCategory: Partial<Record<QuestionCategory, QuestionListItem[]>>
  total: number
}

// ============= Question Generation Types =============

/**
 * Input for starting question generation
 *
 * 단일 KeyAchievement에 대해 선택된 카테고리로 질문 생성 시작
 *
 * @refactored 2025-12-05: Added userId for direct ownership verification
 * @see docs/refactoring/key-achievement-userid-denormalization.md
 */
export interface StartQuestionGenerationInput {
  /** 질문 생성 대상 KeyAchievement ID */
  keyAchievementId: number
  /** 사용자가 선택한 질문 카테고리 목록 */
  questionCategories: QuestionCategory[]
  /** 요청 사용자 ID (ownership 검증용) */
  userId: string
}

/**
 * Result for starting question generation
 *
 * LangGraph 실행 정보 반환
 */
export interface StartQuestionGenerationResult {
  /** LangGraph Run ID */
  runId: string
  /** LangGraph Thread ID */
  threadId: string
  /** WebhookEvent 레코드 ID (추적용) */
  webhookEventId: string
}

// ============= Question Create Types =============

/**
 * Generated question from AI
 *
 * AI 서버에서 생성된 질문 데이터
 */
export interface GeneratedQuestionInput {
  /** 질문 내용 */
  content: string
  /** 질문 카테고리 */
  category: QuestionCategory | null
}

/**
 * Input for creating multiple questions
 *
 * Webhook 핸들러에서 AI 생성 질문을 일괄 저장할 때 사용
 * Question은 keyAchievementId에만 직접 종속 (interviewPreparationId 사용 안함)
 */
export interface CreateManyQuestionsInput {
  /** 질문이 속한 KeyAchievement ID */
  keyAchievementId: number
  /** 생성된 질문 목록 */
  questions: GeneratedQuestionInput[]
}

/**
 * Result for creating multiple questions
 */
export interface CreateManyQuestionsResult {
  /** 생성된 질문 수 */
  count: number
}

// ============= Single Question CRUD Types =============

/**
 * Input for creating a single question (user manual addition)
 *
 * Different from CreateManyQuestionsInput which is for AI bulk generation.
 */
export interface CreateQuestionInput {
  /** 질문이 속한 KeyAchievement ID */
  keyAchievementId: number
  /** 질문 내용 */
  text: string
  /** 질문 카테고리 (선택) */
  category?: QuestionCategory | null
  /** 정렬 순서 (미지정시 자동 계산) */
  orderIndex?: number
}

/**
 * Input for updating an existing question
 */
export interface UpdateQuestionInput {
  /** 질문 내용 */
  text?: string
  /** 질문 카테고리 */
  category?: QuestionCategory | null
  /** 정렬 순서 */
  orderIndex?: number
}

/**
 * Question with userId for ownership verification
 *
 * Used internally for authorization checks.
 * Question → KeyAchievement → userId 체인으로 소유권 확인.
 */
export interface QuestionWithOwner {
  id: string
  keyAchievementId: number | null
  text: string
  category: QuestionCategory | null
  orderIndex: number
  /** KeyAchievement에서 가져온 userId */
  userId: string | null
}

// ============= Auto Question Generation Types =============

/**
 * Input for auto question generation (called from resume parsing handler)
 *
 * 이력서 분석 완료 후 자동으로 문제 생성을 시작할 때 사용
 */
export interface AutoQuestionGenerationInput {
  /** Interview preparation ID */
  preparationId: string
  /** 요청 사용자 ID */
  userId: string
}

/**
 * Result for auto question generation trigger
 *
 * 자동 문제 생성 트리거 결과
 */
export interface AutoQuestionGenerationResult {
  /** 자동 생성 대상 keyAchievement 개수 */
  keyAchievementCount: number
  /** 생성된 webhookEvent ID 목록 */
  webhookEventIds: string[]
}

/**
 * Extended input for auto question generation (internal use)
 *
 * Extends StartQuestionGenerationInput with preparation tracking fields
 */
export interface AutoStartGenerationInput extends StartQuestionGenerationInput {
  /** Interview preparation ID (자동 생성 추적용) */
  preparationId: string
  /** 현재 문제 생성 작업 인덱스 (0-based) */
  questionGenIndex: number
  /** 전체 문제 생성 작업 개수 */
  totalQuestionGens: number
}

/**
 * WebhookEvent metadata for auto question generation
 *
 * Extends standard question generation metadata with preparation tracking
 */
export interface AutoQuestionGenMetadata {
  /** KeyAchievement ID */
  keyAchievementId: number
  /** Experience type */
  experienceType: ExperienceType
  /** Experience ID */
  experienceId: number
  /** Question categories */
  questionCategories: QuestionCategory[]
  /** Interview preparation ID (자동 생성 시에만 존재) */
  preparationId?: string
  /** 현재 문제 생성 작업 인덱스 */
  questionGenIndex?: number
  /** 전체 문제 생성 작업 개수 */
  totalQuestionGens?: number
}
