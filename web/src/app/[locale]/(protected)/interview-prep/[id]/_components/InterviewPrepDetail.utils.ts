/**
 * Utility functions for InterviewPrepDetail component
 *
 * Contains:
 * - Generic cache field updater for optimistic updates
 * - Data mapper functions (Entity → Input) for simplified handlers
 */

import type { InterviewPrepDetailResult } from '@/server/services/interview-preparation/types'
import type {
  CareerWithDetails,
  ProjectWithDetails,
} from '@/server/services/experience'
import type { EducationData } from '@/server/services/interview-preparation'
import type {
  CreateCareerInput,
  UpdateCareerInput,
  CreateProjectInput,
  UpdateProjectInput,
  CreateEducationInput,
  UpdateEducationInput,
} from '@/server/api/routers/interview-preparation/schema'
import { EmployeeType, DegreeType } from '@/generated/prisma/enums'

// ============================================================================
// Cache Update Helpers
// ============================================================================

type ListFields = 'careers' | 'projects' | 'educations'

/**
 * Generic cache field updater for InterviewPrepDetailResult
 *
 * Replaces the 3 separate updateXxxInCache helpers with a single generic function.
 *
 * @example
 * updateCacheField(data, 'careers', careers => careers.filter(c => c.id !== id))
 * updateCacheField(data, 'projects', projects => [...projects, newProject])
 */
export function updateCacheField<K extends ListFields>(
  data: InterviewPrepDetailResult,
  field: K,
  updater: (items: InterviewPrepDetailResult[K]) => InterviewPrepDetailResult[K]
): InterviewPrepDetailResult {
  return { ...data, [field]: updater(data[field]) }
}

// ============================================================================
// Data Mapper Functions
// ============================================================================

/**
 * Extract update input from CareerWithDetails
 *
 * Removes computed/server-only fields (id, timestamps, question counts)
 * to create a clean input for create/update operations.
 */
export function careerToInput(
  career: CareerWithDetails
): CreateCareerInput['data'] {
  return {
    company: career.company,
    companyDescription: career.companyDescription ?? '',
    employeeType: career.employeeType,
    jobLevel: career.jobLevel,
    startDate: career.startDate,
    endDate: career.endDate,
    isCurrent: career.isCurrent,
    techStack: career.techStack,
    architecture: career.architecture,
    architectureMermaid: career.architectureMermaid,
    position: career.position,
    links: career.links,
  }
}

/**
 * Extract update input from ProjectWithDetails
 *
 * Removes computed/server-only fields (id, timestamps, question counts)
 * to create a clean input for create/update operations.
 */
export function projectToInput(
  project: ProjectWithDetails
): CreateProjectInput['data'] {
  return {
    projectName: project.projectName,
    projectDescription: project.projectDescription,
    projectType: project.projectType,
    teamSize: project.teamSize,
    teamComposition: project.teamComposition,
    startDate: project.startDate,
    endDate: project.endDate,
    isCurrent: project.isCurrent,
    techStack: project.techStack,
    architecture: project.architecture,
    architectureMermaid: project.architectureMermaid,
    position: project.position,
    links: project.links,
  }
}

/**
 * Extract update input from EducationData
 *
 * Removes server-only fields (id, interviewPreparationId)
 * to create a clean input for create/update operations.
 */
export function educationToInput(
  education: EducationData
): CreateEducationInput['data'] {
  return {
    institution: education.institution,
    degree: education.degree,
    major: education.major,
    startDate: education.startDate,
    endDate: education.endDate,
    description: education.description ?? '',
  }
}

// ============================================================================
// Optimistic Object Creators
// ============================================================================

/**
 * Create optimistic CareerWithDetails for immediate UI update
 *
 * Uses temporary ID (Date.now()) that will be replaced after server response.
 */
export function createOptimisticCareer(
  input: CreateCareerInput['data']
): CareerWithDetails {
  const now = new Date()
  return {
    id: Date.now(), // Temporary ID
    company: input.company,
    companyDescription: input.companyDescription,
    employeeType: input.employeeType ?? null,
    jobLevel: input.jobLevel ?? null,
    startDate: input.startDate ?? null,
    endDate: input.endDate ?? null,
    isCurrent: input.isCurrent ?? false,
    techStack: input.techStack ?? [],
    architecture: input.architecture ?? null,
    architectureMermaid: input.architectureMermaid ?? null,
    position: input.position ?? [],
    links: input.links ?? [],
    keyAchievements: [],
    totalQuestions: 0,
    completedQuestions: 0,
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Create optimistic ProjectWithDetails for immediate UI update
 *
 * Uses temporary ID (Date.now()) that will be replaced after server response.
 */
export function createOptimisticProject(
  input: CreateProjectInput['data']
): ProjectWithDetails {
  const now = new Date()
  return {
    id: Date.now(), // Temporary ID
    projectName: input.projectName,
    projectDescription: input.projectDescription ?? null,
    projectType: input.projectType ?? null,
    teamSize: input.teamSize ?? null,
    teamComposition: input.teamComposition ?? null,
    startDate: input.startDate ?? null,
    endDate: input.endDate ?? null,
    isCurrent: input.isCurrent ?? false,
    techStack: input.techStack ?? [],
    architecture: input.architecture ?? null,
    architectureMermaid: input.architectureMermaid ?? null,
    position: input.position ?? [],
    links: input.links ?? [],
    keyAchievements: [],
    totalQuestions: 0,
    completedQuestions: 0,
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Create optimistic EducationData for immediate UI update
 *
 * Uses temporary ID (Date.now()) that will be replaced after server response.
 */
export function createOptimisticEducation(
  input: CreateEducationInput['data'],
  preparationId: string
): EducationData {
  return {
    id: Date.now(), // Temporary ID
    interviewPreparationId: preparationId,
    institution: input.institution,
    degree: input.degree ?? null,
    major: input.major ?? null,
    startDate: input.startDate ?? null,
    endDate: input.endDate ?? null,
    description: input.description,
  }
}

// ============================================================================
// Empty Object Creators (for Dialog initial state)
// ============================================================================

/**
 * Create empty Career data for new experience dialog
 *
 * Note: Deprecated fields (situation, task, action, result, importance, index, resumeId)
 * are omitted from CareerWithDetails type
 */
export function createEmptyCareer(): CareerWithDetails {
  const now = new Date()
  return {
    id: Date.now(),
    company: '',
    companyDescription: '',
    position: [],
    employeeType: EmployeeType.FULL_TIME,
    jobLevel: null,
    startDate: null,
    endDate: null,
    isCurrent: false,
    techStack: [],
    architecture: null,
    architectureMermaid: null,
    links: [],
    createdAt: now,
    updatedAt: now,
    keyAchievements: [],
    totalQuestions: 0,
    completedQuestions: 0,
  }
}

/**
 * Create empty Education data for new education dialog
 *
 * @param interviewPreparationId - InterviewPreparation ID (직접 연결)
 */
export function createEmptyEducation(
  interviewPreparationId: string
): EducationData {
  return {
    id: Date.now(),
    interviewPreparationId,
    institution: '',
    degree: DegreeType.BACHELOR,
    major: null,
    startDate: null,
    endDate: null,
    description: '',
  }
}

// ============================================================================
// Type Re-exports for Consumer Convenience
// ============================================================================

export type { UpdateCareerInput, UpdateProjectInput, UpdateEducationInput }
