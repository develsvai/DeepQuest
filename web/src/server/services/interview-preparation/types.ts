/**
 * Interview Preparation Service Types
 *
 * Types for Interview Preparation domain operations.
 * - Preparation detail fetching
 * - Dashboard listing
 *
 * NOTE: Experience detail types are now in @/server/services/experience/types.ts
 *
 * Uses Prisma's inferred types for type safety.
 */

import type { Prisma } from '@/generated/prisma/client'
import { PreparationStatus } from '@/generated/prisma/enums'
import type {
  CareerWithDetails,
  ProjectWithDetails,
} from '@/server/services/experience'
import type { EducationData } from '@/server/services/education'
import type { QuestionProgress } from '@/server/services/common/question-progress'

// ============================================================================
// Query Configurations (re-exported from queries.ts)
// ============================================================================

// Query configs are now in queries.ts for separation of concerns
export {
  detailedPreparationInclude,
  listPreparationInclude,
  sidebarPreparationSelect,
} from './queries'

// ============================================================================
// Prisma Inferred Types
// ============================================================================

// Import query configs for type inference
import {
  detailedPreparationInclude as _detailedInclude,
  sidebarPreparationSelect as _sidebarSelect,
} from './queries'

/**
 * Detailed preparation with all relations (for getDetailedById)
 */
export type DetailedPreparation = Prisma.InterviewPreparationGetPayload<{
  include: typeof _detailedInclude
}>

// Re-export for backward compatibility
export type { EducationData }

// ============================================================================
// Dashboard Types
// ============================================================================

// Re-export QuestionProgress for consistency
export type { QuestionProgress }

/**
 * Career experience data for dashboard display
 */
export interface DashboardCareer {
  id: number
  company: string
  position: string[]
  techStack: string[]
  keyAchievementsCount: number
  totalQuestions: number
  completedQuestions: number
}

/**
 * Project experience data for dashboard display
 */
export interface DashboardProject {
  id: number
  projectName: string
  position: string[]
  techStack: string[]
  keyAchievementsCount: number
  totalQuestions: number
  completedQuestions: number
}

/**
 * Preparation data for dashboard display
 *
 * Pre-computed aggregations for UI consumption.
 */
export interface DashboardPreparation {
  id: string
  title: string
  jobTitle: string | null
  status: PreparationStatus
  createdAt: Date
  careers: DashboardCareer[]
  projects: DashboardProject[]
}

// ============================================================================
// Interview Prep Detail Types
// ============================================================================

/**
 * Question count by experience
 */
export interface ExperienceQuestionCount {
  experienceType: 'CAREER' | 'PROJECT'
  experienceId: number
  total: number
  completed: number
}

/**
 * Full interview preparation detail data
 *
 * Uses CareerWithDetails and ProjectWithDetails from experience domain.
 */
export interface InterviewPrepDetailResult {
  id: string
  userId: string
  title: string
  jobTitle: string | null
  summary: string[]
  yearsOfExperience: number | null
  status: string
  errorMessage: string | null
  errorCode: string | null
  totalQuestionGenTasks: number | null
  completedQuestionGenTasks: number | null
  careers: CareerWithDetails[]
  projects: ProjectWithDetails[]
  educations: EducationData[]
}

// ============================================================================
// Resume Parsing Result Types
// ============================================================================

/**
 * Result of processing resume parsing data
 *
 * Returned by preparationService.processResumeParsingResult()
 */
export interface SaveResumeResult {
  careerExperienceIds: number[]
  projectExperienceIds: number[]
  keyAchievementCount: number
}

// ============================================================================
// Create Types
// ============================================================================

/**
 * Input parameters for creating an interview preparation
 */
export interface CreateInterviewPrepParams {
  title: string
  jobTitle: string
  experienceNames?: string[]
  resumeFileId: string
  resumeFileUrl: string
  locale: string
}

/**
 * Result of creating an interview preparation
 */
export interface CreateInterviewPrepResult {
  success: boolean
  preparationId: string
}

// ============================================================================
// Sidebar Types
// ============================================================================

/**
 * Sidebar display types - Re-exported from component layer
 * Component types remain the source of truth for UI-specific structures
 */
export type {
  SidebarPreparation,
  SidebarExperience,
  SidebarKeyAchievement,
} from '@/components/layout/sidebar/recent-preparations/types'

/**
 * Input for listing preparations for sidebar display
 */
export interface ListForSidebarInput {
  userId: string
  limit?: number
}

/**
 * Inferred type from sidebarPreparationSelect (defined in queries.ts)
 */
export type PreparationForSidebar = Prisma.InterviewPreparationGetPayload<{
  select: typeof _sidebarSelect
}>

// ============================================================================
// Weekly Goal Types
// ============================================================================

/**
 * Daily completed question count for weekly goal display
 */
export interface DailyCompletedCount {
  date: string // YYYY-MM-DD
  completedGoals: number
}

/**
 * Weekly goal data from service layer
 */
export interface WeeklyGoalServiceResult {
  days: DailyCompletedCount[]
  weekStartDate: string // YYYY-MM-DD (Monday)
}

// ============================================================================
// Experience Selection Types (for Auto Question Generation)
// ============================================================================

/**
 * 점수 계산에 필요한 경험 데이터
 *
 * DB에서 조회한 Career/Project 경험을 점수 계산에 필요한 필드만 추출한 형태
 */
export interface ExperienceScoringData {
  experienceType: 'CAREER' | 'PROJECT'
  experienceId: number
  keyAchievementIds: number[]
  startDate: string | null
  endDate: string | null
  isCurrent: boolean
}

/**
 * 점수 계산 결과
 *
 * 디버깅 및 로깅을 위해 각 요소별 점수를 breakdown으로 포함
 */
export interface ExperienceScoreResult {
  totalScore: number
  breakdown: {
    recencyScore: number // 최신성 점수 (0-100)
    durationScore: number // 기간 점수 (0-100)
    achievementScore: number // 성과 개수 점수 (0-100)
  }
}
