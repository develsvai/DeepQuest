/**
 * Today's Quest Selection Types
 *
 * Types for the Today's Quest 3-question selection feature.
 * Supports daily rotation based on (userId + date) seed.
 */

import type {
  QuestionCategory,
  AnswerStatus,
  Rating,
} from '@/generated/prisma/enums'

// ═══════════════════════════════════════════════════════════════════════════
// Input Types
// ═══════════════════════════════════════════════════════════════════════════

export interface SelectTodaysQuestInput {
  interviewPreparationId: string
  /** YYYY-MM-DD format (client local time) */
  date: string
  userId: string
}

// ═══════════════════════════════════════════════════════════════════════════
// Output Types
// ═══════════════════════════════════════════════════════════════════════════

export interface TodaysQuestResult {
  /** Featured quest - the most urgent question to practice */
  featuredQuest: FeaturedQuest | null
  /** Related questions for additional practice (exactly 2) */
  relatedQuests: RelatedQuest[]
  /** Selection metadata */
  meta: {
    selectionReason: SelectionReason
    /** The date used for selection seed */
    selectedDate: string
    generatedAt: Date
  }
}

export interface FeaturedQuest {
  id: string
  text: string
  category: QuestionCategory | null
  /** Why this question was selected as featured */
  urgencyReason: UrgencyReason
  /** Context from KeyAchievement and Experience */
  context: QuestContext
  /** Latest answer attempt info (if any) */
  lastAttempt: LastAttemptInfo | null
}

export interface RelatedQuest {
  id: string
  text: string
  category: QuestionCategory | null
  /** Relation to featured quest */
  relationReason: RelationReason
  /** Whether the question has a DEEP rating */
  isCompleted: boolean
}

export interface QuestContext {
  keyAchievementId: number
  keyAchievementTitle: string
  experienceType: 'CAREER' | 'PROJECT'
  experienceId: number
  /** Career: company name, Project: project name */
  experienceName: string
}

export interface LastAttemptInfo {
  answerId: string
  status: AnswerStatus
  rating: Rating | null
}

// ═══════════════════════════════════════════════════════════════════════════
// Enum Types
// ═══════════════════════════════════════════════════════════════════════════

/** Reasons why a question is considered urgent */
export type UrgencyReason =
  | 'NO_ANSWER' // Never attempted (highest priority)
  | 'DRAFT_ONLY' // Started but not submitted
  | 'SURFACE_RATING' // Feedback indicates shallow answer
  | 'INTERMEDIATE_RATING' // Can be improved further

/** Reasons why a question is related to the featured quest */
export type RelationReason =
  | 'SAME_ACHIEVEMENT' // Same KeyAchievement
  | 'SAME_EXPERIENCE' // Same Career/Project experience

/** Overall selection outcome reason */
export type SelectionReason =
  | 'PRIORITY_BASED' // Normal selection based on urgency
  | 'ALL_COMPLETED' // All questions have DEEP rating
  | 'NO_QUESTIONS' // No questions available

// ═══════════════════════════════════════════════════════════════════════════
// Internal Types (used within selection module)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Question with full context for selection processing.
 * This is the internal representation after fetching from DB.
 */
export interface QuestionWithContext {
  id: string
  text: string
  category: QuestionCategory | null
  orderIndex: number
  context: QuestContext
  /** Latest answer (most recent by createdAt) */
  latestAnswer: {
    id: string
    status: AnswerStatus
    submittedAt: Date | null
    rating: Rating | null
  } | null
}

/**
 * Urgency scores for prioritization.
 * Higher score = more urgent.
 */
export const URGENCY_SCORES = {
  NO_ANSWER: 100,
  DRAFT_ONLY: 80,
  SURFACE_RATING: 60,
  INTERMEDIATE_RATING: 40,
  DEEP_RATING: 0, // Completed, excluded from selection
} as const
