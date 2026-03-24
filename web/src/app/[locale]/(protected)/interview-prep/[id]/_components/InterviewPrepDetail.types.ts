/**
 * Types for InterviewPrepDetail Components
 *
 * Re-exports types from service layer for consistency.
 * Deprecated fields are already omitted in service layer types.
 */

import type { Prisma } from '@/generated/prisma/client'
import type { EducationData as EducationDataType } from '@/server/services/interview-preparation'

import type {
  CareerWithDetails as CareerWithDetailsType,
  ProjectWithDetails as ProjectWithDetailsType,
} from '@/server/services/experience'

// Re-export enums from Prisma for convenience
export {
  ExperienceType,
  EmployeeType,
  ProjectType,
  DegreeType,
} from '@/generated/prisma/enums'

// Re-export types from service layer (with deprecated fields omitted)
export type CareerWithDetails = CareerWithDetailsType
export type ProjectWithDetails = ProjectWithDetailsType
export type EducationData = EducationDataType

/**
 * Key achievement from STAR-L methodology
 */
export type KeyAchievementData = Prisma.KeyAchievementGetPayload<object>

/**
 * Header section data extracted from InterviewPreparation
 */
export interface HeaderData {
  title: string
  jobTitle: string | null
  yearsOfExperience: number | null
  summary: string[]
}
