/**
 * Experience Service Types
 *
 * Experience 도메인 통합 타입 정의
 * - AI 질문 생성용 타입
 * - UI 상세 조회용 타입
 *
 * @note KeyAchievement types are imported from key-achievement domain (canonical source)
 */

import type { Prisma } from '@/generated/prisma/client'
import {
  ExperienceType,
  EmployeeType,
  ProjectType,
} from '@/generated/prisma/enums'
import type {
  CareerExperienceV2,
  ProjectExperienceV2,
} from '@/server/services/ai/contracts/schemas/common'
import type { OmittedExperienceFields } from '../common/experience-fields'
import type { KeyAchievementWithProgress } from '../key-achievement'

// Re-export for backward compatibility
export type { KeyAchievementWithProgress }

/**
 * AI 스키마 형태의 Experience 데이터
 *
 * Question Generation InputState.experience 와 1:1 매핑
 * - experienceType: 'CAREER' | 'PROJECT'
 * - details: CareerExperienceV2 | ProjectExperienceV2 (AI 스키마)
 */
export interface ExperienceForAI {
  experienceType: ExperienceType
  details: CareerExperienceV2 | ProjectExperienceV2
}

/**
 * 질문 생성용 Experience 조회 결과
 *
 * Experience + InterviewPreparation 정보 포함
 */
export interface ExperienceWithOwnership {
  /** AI 스키마 형태의 Experience */
  experience: ExperienceForAI
  /** 소유자 InterviewPreparation ID */
  interviewPreparationId: string
  /** 지원 직무 (InterviewPreparation.jobTitle) */
  appliedPosition: string
}

/**
 * 질문 생성용 Experience 조회 입력
 */
export interface GetForQuestionGenerationInput {
  experienceType: ExperienceType
  experienceId: number
}

// ============================================================================
// UI Detail Types (for Experience Detail Page)
// ============================================================================

/**
 * Career experience with key achievements included (full Prisma type)
 */
export type CareerWithAchievementsFull = Prisma.CareerExperienceGetPayload<{
  include: { keyAchievements: true }
}>

/**
 * Project experience with key achievements included (full Prisma type)
 */
export type ProjectWithAchievementsFull = Prisma.ProjectExperienceGetPayload<{
  include: { keyAchievements: true }
}>

/**
 * Career detail for UI (without unused fields, with achievement progress)
 */
export type CareerDetailWithAchievements = Omit<
  CareerWithAchievementsFull,
  OmittedExperienceFields | 'keyAchievements'
> & {
  keyAchievements: KeyAchievementWithProgress[]
}

/**
 * Project detail for UI (without unused fields, with achievement progress)
 */
export type ProjectDetailWithAchievements = Omit<
  ProjectWithAchievementsFull,
  OmittedExperienceFields | 'keyAchievements'
> & {
  keyAchievements: KeyAchievementWithProgress[]
}

/**
 * Union type for experience detail result
 * Discriminated union for type-safe handling in router and client
 */
export type ExperienceDetailResult =
  | {
      type: 'career'
      data: CareerDetailWithAchievements
      interviewPreparationId: string
    }
  | {
      type: 'project'
      data: ProjectDetailWithAchievements
      interviewPreparationId: string
    }

// ============================================================================
// Interview Prep Summary Types (for Interview Prep Detail Page)
// ============================================================================

/**
 * Career with achievements and question counts (deprecated fields omitted)
 * Used in InterviewPrepDetailResult for summary view
 */
export type CareerWithDetails = Omit<
  CareerWithAchievementsFull,
  OmittedExperienceFields
> & {
  totalQuestions: number
  completedQuestions: number
}

/**
 * Project with achievements and question counts (deprecated fields omitted)
 * Used in InterviewPrepDetailResult for summary view
 */
export type ProjectWithDetails = Omit<
  ProjectWithAchievementsFull,
  OmittedExperienceFields
> & {
  totalQuestions: number
  completedQuestions: number
}

// ============================================================================
// CRUD Input Types (for Create/Update operations)
// ============================================================================

/**
 * Input for creating a new CareerExperience
 */
export interface CreateCareerInput {
  company: string
  companyDescription: string
  employeeType?: EmployeeType | null
  jobLevel?: string | null
  startDate?: string | null
  endDate?: string | null
  isCurrent?: boolean
  techStack?: string[]
  architecture?: string | null
  architectureMermaid?: string | null
  position?: string[]
  links?: string[]
}

/**
 * Input for updating an existing CareerExperience
 */
export interface UpdateCareerInput {
  company?: string
  companyDescription?: string
  employeeType?: EmployeeType | null
  jobLevel?: string | null
  startDate?: string | null
  endDate?: string | null
  isCurrent?: boolean
  techStack?: string[]
  architecture?: string | null
  architectureMermaid?: string | null
  position?: string[]
  links?: string[]
}

/**
 * Input for creating a new ProjectExperience
 */
export interface CreateProjectInput {
  projectName: string
  projectDescription?: string | null
  projectType?: ProjectType | null
  teamSize?: number | null
  teamComposition?: string | null
  startDate?: string | null
  endDate?: string | null
  isCurrent?: boolean
  techStack?: string[]
  architecture?: string | null
  architectureMermaid?: string | null
  position?: string[]
  links?: string[]
}

/**
 * Input for updating an existing ProjectExperience
 */
export interface UpdateProjectInput {
  projectName?: string
  projectDescription?: string | null
  projectType?: ProjectType | null
  teamSize?: number | null
  teamComposition?: string | null
  startDate?: string | null
  endDate?: string | null
  isCurrent?: boolean
  techStack?: string[]
  architecture?: string | null
  architectureMermaid?: string | null
  position?: string[]
  links?: string[]
}
