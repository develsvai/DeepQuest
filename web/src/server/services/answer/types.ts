/**
 * Answer Domain Service Types
 *
 * TypeScript types for Answer and Feedback operations.
 */

import { AnswerStatus, Rating } from '@/generated/prisma/enums'
import type { StructuredGuideAnswer } from '@/server/services/ai/contracts/schemas/questionFeedbackGen'

// ============= Answer Service Types =============

export interface SubmitAnswerInput {
  questionId: string
  answerText: string
  userId: string
}

export interface SubmitAnswerResult {
  id: string
  questionId: string
  text: string
  status: AnswerStatus
  submittedAt: Date | null
}

export interface GetWithFeedbackInput {
  questionId: string
  userId: string
}

export interface AnswerData {
  id: string
  questionId: string
  text: string
  status: AnswerStatus
  version: number
  startedAt: Date
  submittedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface FeedbackData {
  id: string
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
  rating: Rating
  ratingRationale: string[]
  generatedAt: Date
  guideAnswer: StructuredGuideAnswer | null
}

export interface AnswerWithFeedbackResult {
  answer: AnswerData | null
  feedback: FeedbackData | null
}

// ============= Feedback Service Types =============

export interface GetFeedbackGenInputInput {
  answerId: string
  userId: string
}

/**
 * V2 Feedback input with rating object (level + rationale)
 */
export interface FeedbackV2Input {
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
  rating: {
    level: Rating
    rationale: string[]
  }
}

export interface SaveFeedbackResultInput {
  answerId: string
  feedback?: FeedbackV2Input
  guideAnswer?: StructuredGuideAnswer
  userId: string
}

export interface SaveFeedbackResultResult {
  feedbackSaved: boolean
  guideAnswerSaved: boolean
}

// ============= Attempts List Types =============

export interface ListAttemptsInput {
  questionId: string
  userId: string
}

export interface AttemptSummary {
  id: string
  attemptNumber: number
  submittedAt: Date | null
  status: AnswerStatus
  hasEvaluated: boolean
}

export interface ListAttemptsResult {
  attempts: AttemptSummary[]
}

export interface GetAttemptByIdInput {
  answerId: string
  userId: string
}
