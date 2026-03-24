/**
 * InterviewPrepDetailV2 Types
 *
 * Shared types for V2 dashboard-style Interview Prep Detail page.
 * Uses mock data for UI mockup implementation.
 */

import type { QuestionCategory } from '@/generated/prisma/enums'

// ═══════════════════════════════════════════════════════════════════════════
// Rating Types (matches schema)
// ═══════════════════════════════════════════════════════════════════════════

export type Rating = 'SURFACE' | 'INTERMEDIATE' | 'DEEP'

export const RatingLabels: Record<Rating, string> = {
  SURFACE: 'Surface',
  INTERMEDIATE: 'Solid',
  DEEP: 'Deep',
}

// ═══════════════════════════════════════════════════════════════════════════
// Today's Quest Types
// ═══════════════════════════════════════════════════════════════════════════

export interface TodaysQuestData {
  id: string
  experienceId: number
  experienceType: 'career' | 'project'
  category: QuestionCategory
  companyName: string
  questionText: string
  tags: string[]
}

// ═══════════════════════════════════════════════════════════════════════════
// Question Preview Types
// ═══════════════════════════════════════════════════════════════════════════

export interface QuestionPreviewData {
  id: string
  experienceId: number
  experienceType: 'career' | 'project'
  category: QuestionCategory
  rating: Rating
  questionText: string
  companyName: string
}

// ═══════════════════════════════════════════════════════════════════════════
// Experience Progress Types
// ═══════════════════════════════════════════════════════════════════════════

export interface ExperienceProgressData {
  id: number
  type: 'career' | 'project'
  name: string
  period: string // e.g., "2023.01 - 2024.06"
  role: string // e.g., "Backend Developer"
  completedQuestions: number
  totalQuestions: number
}

// ═══════════════════════════════════════════════════════════════════════════
// Stats Types (reused from ProgressStatsSection)
// ═══════════════════════════════════════════════════════════════════════════

export interface TodayGoalData {
  solved: number
  total: number
}
