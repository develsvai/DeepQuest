/**
 * Education Service Types
 *
 * Types for CandidateEducation CRUD operations.
 */

import type { Prisma } from '@/generated/prisma/client'
import { DegreeType } from '@/generated/prisma/enums'

/**
 * Base CandidateEducation data type
 */
export type EducationData = Prisma.CandidateEducationGetPayload<object>

/**
 * Input for creating a new CandidateEducation
 */
export interface CreateEducationInput {
  institution: string
  degree?: DegreeType | null
  major?: string | null
  startDate?: string | null
  endDate?: string | null
  description: string
}

/**
 * Input for updating an existing CandidateEducation
 */
export interface UpdateEducationInput {
  institution?: string
  degree?: DegreeType | null
  major?: string | null
  startDate?: string | null
  endDate?: string | null
  description?: string
}
