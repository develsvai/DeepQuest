/**
 * Interview Preparation Router Schemas
 *
 * Consolidated Zod schemas for Interview Preparation domain operations.
 * Includes schemas for:
 * - Creating new preparations
 * - Fetching preparation details
 * - Fetching experience details
 */

import { z } from 'zod'
import { EmployeeType, ProjectType, DegreeType } from '@/generated/prisma/enums'

// ============================================================================
// Create Schemas
// ============================================================================

/**
 * InterviewPrep creation input schema
 *
 * Field mappings:
 * - title → DB title (project identifier)
 * - jobTitle → DB jobTitle, AI applied_position
 * - experienceNames → AI experience_names_to_analyze (not stored in DB)
 * - resumeFileId → DB resumeFile connection
 * - resumeFileUrl → AI resume_file_path
 */
export const createInputSchema = z.object({
  title: z.string().min(1, 'Title is required').max(50, 'Title is too long'),
  jobTitle: z
    .string()
    .min(1, 'Job title is required')
    .max(50, 'Job title is too long'),
  experienceNames: z
    .array(z.string().min(1))
    .min(1, 'At least one experience is required'),
  resumeFileId: z.cuid('Invalid resume file ID'),
  resumeFileUrl: z.url('Invalid resume file URL'),
  locale: z.string().min(2).max(10),
})

export type CreateInput = z.infer<typeof createInputSchema>

/**
 * InterviewPrep creation output schema
 */
export const createOutputSchema = z.object({
  success: z.boolean(),
  preparationId: z.cuid(),
})

export type CreateOutput = z.infer<typeof createOutputSchema>

// ============================================================================
// Get By ID Schemas
// ============================================================================

/**
 * Input schema for getById procedure
 */
export const getByIdInputSchema = z.object({
  id: z.cuid('Invalid interview preparation ID format'),
})

export type GetByIdInput = z.infer<typeof getByIdInputSchema>

// ============================================================================
// Experience Detail Schemas
// ============================================================================

/**
 * Experience type enum for API input
 */
export const experienceTypeSchema = z.enum(['career', 'project'])

/**
 * Input schema for getExperienceById procedure
 */
export const getExperienceByIdInputSchema = z.object({
  interviewPreparationId: z.cuid('Invalid interview preparation ID format'),
  experienceType: experienceTypeSchema,
  experienceId: z
    .number()
    .int()
    .positive('Experience ID must be a positive integer'),
})

export type GetExperienceByIdInput = z.infer<
  typeof getExperienceByIdInputSchema
>

// ============================================================================
// Sidebar Schemas
// ============================================================================

/**
 * Default limit for sidebar preparations list
 *
 * IMPORTANT: This constant must be used in both:
 * - Server: prefetch({ limit: SIDEBAR_DEFAULT_LIMIT })
 * - Client: useSuspenseQuery({ limit: SIDEBAR_DEFAULT_LIMIT })
 *
 * Using {} with Zod .default() causes query key mismatch between
 * server prefetch and client hydration, resulting in auth errors on refresh.
 */
export const SIDEBAR_DEFAULT_LIMIT = 10

/**
 * Input schema for listForSidebar procedure
 */
export const listForSidebarInputSchema = z.object({
  limit: z
    .number()
    .int()
    .positive()
    .max(50)
    .optional()
    .default(SIDEBAR_DEFAULT_LIMIT),
})

export type ListForSidebarInput = z.infer<typeof listForSidebarInputSchema>

// ============================================================================
// Update Header Schemas
// ============================================================================

/**
 * Schema for updating interview preparation header data
 *
 * Allows partial updates to: title, jobTitle, yearsOfExperience, summary
 */
export const updateHeaderInputSchema = z.object({
  id: z.cuid('Invalid interview preparation ID'),
  data: z.object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(50, 'Title is too long')
      .optional(),
    jobTitle: z.string().max(50, 'Job title is too long').nullable().optional(),
    yearsOfExperience: z.number().int().min(0).max(50).nullable().optional(),
    summary: z.array(z.string()).optional(),
  }),
})

export type UpdateHeaderInput = z.infer<typeof updateHeaderInputSchema>

// ============================================================================
// Career CRUD Schemas
// ============================================================================

/**
 * Schema for creating a new CareerExperience
 *
 * Required field: company, companyDescription
 * Optional fields include employeeType, jobLevel, dates, techStack, etc.
 */
export const createCareerInputSchema = z.object({
  interviewPreparationId: z.cuid('Invalid interview preparation ID'),
  data: z.object({
    company: z
      .string()
      .min(1, 'Company name is required')
      .max(100, 'Company name is too long'),
    companyDescription: z.string().max(500, 'Company description is too long'),
    employeeType: z.enum(EmployeeType).nullable().optional(),
    jobLevel: z.string().max(50, 'Job level is too long').nullable().optional(),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}$/, 'Start date must be in YYYY-MM format')
      .nullable()
      .optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}$/, 'End date must be in YYYY-MM format')
      .nullable()
      .optional(),
    isCurrent: z.boolean().optional().default(false),
    techStack: z.array(z.string()).optional().default([]),
    architecture: z
      .string()
      .max(1000, 'Architecture description is too long')
      .nullable()
      .optional(),
    architectureMermaid: z
      .string()
      .max(5000, 'Architecture diagram is too long')
      .nullable()
      .optional(),
    position: z.array(z.string()).optional().default([]),
    links: z.array(z.url('Invalid URL format')).optional().default([]),
  }),
})

export type CreateCareerInput = z.infer<typeof createCareerInputSchema>

/**
 * Schema for updating an existing CareerExperience
 *
 * All fields are optional for partial updates
 */
export const updateCareerInputSchema = z.object({
  id: z.number().int().positive('Career ID must be a positive integer'),
  data: z.object({
    company: z
      .string()
      .min(1, 'Company name is required')
      .max(100, 'Company name is too long')
      .optional(),
    companyDescription: z
      .string()
      .max(500, 'Company description is too long')
      .optional(),
    employeeType: z.enum(EmployeeType).nullable().optional(),
    jobLevel: z.string().max(50, 'Job level is too long').nullable().optional(),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}$/, 'Start date must be in YYYY-MM format')
      .nullable()
      .optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}$/, 'End date must be in YYYY-MM format')
      .nullable()
      .optional(),
    isCurrent: z.boolean().optional(),
    techStack: z.array(z.string()).optional(),
    architecture: z
      .string()
      .max(1000, 'Architecture description is too long')
      .nullable()
      .optional(),
    architectureMermaid: z
      .string()
      .max(5000, 'Architecture diagram is too long')
      .nullable()
      .optional(),
    position: z.array(z.string()).optional(),
    links: z.array(z.url('Invalid URL format')).optional(),
  }),
})

export type UpdateCareerInput = z.infer<typeof updateCareerInputSchema>

/**
 * Schema for deleting a CareerExperience
 */
export const deleteCareerInputSchema = z.object({
  id: z.number().int().positive('Career ID must be a positive integer'),
})

export type DeleteCareerInput = z.infer<typeof deleteCareerInputSchema>

// ============================================================================
// Project CRUD Schemas
// ============================================================================

/**
 * Schema for creating a new ProjectExperience
 *
 * Required field: projectName
 * Optional fields include projectDescription, projectType, teamSize, etc.
 */
export const createProjectInputSchema = z.object({
  interviewPreparationId: z.cuid('Invalid interview preparation ID'),
  data: z.object({
    projectName: z
      .string()
      .min(1, 'Project name is required')
      .max(100, 'Project name is too long'),
    projectDescription: z
      .string()
      .max(500, 'Project description is too long')
      .nullable()
      .optional(),
    projectType: z.enum(ProjectType).nullable().optional(),
    teamSize: z
      .number()
      .int()
      .min(1, 'Team size must be at least 1')
      .max(1000, 'Team size is too large')
      .nullable()
      .optional(),
    teamComposition: z
      .string()
      .max(200, 'Team composition is too long')
      .nullable()
      .optional(),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}$/, 'Start date must be in YYYY-MM format')
      .nullable()
      .optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}$/, 'End date must be in YYYY-MM format')
      .nullable()
      .optional(),
    isCurrent: z.boolean().optional().default(false),
    techStack: z.array(z.string()).optional().default([]),
    architecture: z
      .string()
      .max(1000, 'Architecture description is too long')
      .nullable()
      .optional(),
    architectureMermaid: z
      .string()
      .max(5000, 'Architecture diagram is too long')
      .nullable()
      .optional(),
    position: z.array(z.string()).optional().default([]),
    links: z.array(z.url('Invalid URL format')).optional().default([]),
  }),
})

export type CreateProjectInput = z.infer<typeof createProjectInputSchema>

/**
 * Schema for updating an existing ProjectExperience
 *
 * All fields are optional for partial updates
 */
export const updateProjectInputSchema = z.object({
  id: z.number().int().positive('Project ID must be a positive integer'),
  data: z.object({
    projectName: z
      .string()
      .min(1, 'Project name is required')
      .max(100, 'Project name is too long')
      .optional(),
    projectDescription: z
      .string()
      .max(500, 'Project description is too long')
      .nullable()
      .optional(),
    projectType: z.enum(ProjectType).nullable().optional(),
    teamSize: z
      .number()
      .int()
      .min(1, 'Team size must be at least 1')
      .max(1000, 'Team size is too large')
      .nullable()
      .optional(),
    teamComposition: z
      .string()
      .max(200, 'Team composition is too long')
      .nullable()
      .optional(),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}$/, 'Start date must be in YYYY-MM format')
      .nullable()
      .optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}$/, 'End date must be in YYYY-MM format')
      .nullable()
      .optional(),
    isCurrent: z.boolean().optional(),
    techStack: z.array(z.string()).optional(),
    architecture: z
      .string()
      .max(1000, 'Architecture description is too long')
      .nullable()
      .optional(),
    architectureMermaid: z
      .string()
      .max(5000, 'Architecture diagram is too long')
      .nullable()
      .optional(),
    position: z.array(z.string()).optional(),
    links: z.array(z.url('Invalid URL format')).optional(),
  }),
})

export type UpdateProjectInput = z.infer<typeof updateProjectInputSchema>

/**
 * Schema for deleting a ProjectExperience
 */
export const deleteProjectInputSchema = z.object({
  id: z.number().int().positive('Project ID must be a positive integer'),
})

export type DeleteProjectInput = z.infer<typeof deleteProjectInputSchema>

// ============================================================================
// Education CRUD Schemas
// ============================================================================

/**
 * Schema for creating a new CandidateEducation
 *
 * Required fields: institution, description
 * Optional fields include degree, major, dates
 */
export const createEducationInputSchema = z.object({
  interviewPreparationId: z.cuid('Invalid interview preparation ID'),
  data: z.object({
    institution: z
      .string()
      .min(1, 'Institution name is required')
      .max(100, 'Institution name is too long'),
    degree: z.enum(DegreeType).nullable().optional(),
    major: z.string().max(100, 'Major is too long').nullable().optional(),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}$/, 'Start date must be in YYYY-MM format')
      .nullable()
      .optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}$/, 'End date must be in YYYY-MM format')
      .nullable()
      .optional(),
    description: z.string().max(500, 'Description is too long'),
  }),
})

export type CreateEducationInput = z.infer<typeof createEducationInputSchema>

/**
 * Schema for updating an existing CandidateEducation
 *
 * All fields are optional for partial updates
 */
export const updateEducationInputSchema = z.object({
  id: z.number().int().positive('Education ID must be a positive integer'),
  data: z.object({
    institution: z
      .string()
      .min(1, 'Institution name is required')
      .max(100, 'Institution name is too long')
      .optional(),
    degree: z.enum(DegreeType).nullable().optional(),
    major: z.string().max(100, 'Major is too long').nullable().optional(),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}$/, 'Start date must be in YYYY-MM format')
      .nullable()
      .optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}$/, 'End date must be in YYYY-MM format')
      .nullable()
      .optional(),
    description: z.string().max(500, 'Description is too long').optional(),
  }),
})

export type UpdateEducationInput = z.infer<typeof updateEducationInputSchema>

/**
 * Schema for deleting a CandidateEducation
 */
export const deleteEducationInputSchema = z.object({
  id: z.number().int().positive('Education ID must be a positive integer'),
})

export type DeleteEducationInput = z.infer<typeof deleteEducationInputSchema>

// ============================================================================
// Delete Preparation Schema
// ============================================================================

/**
 * Schema for deleting an InterviewPreparation
 *
 * Cascade deletes all related data:
 * - CareerExperience, ProjectExperience, CandidateEducation
 * - KeyAchievements, Questions, Answers
 * - FileUpload, StructuredJD, WebhookEvents
 */
export const deletePreparationInputSchema = z.object({
  id: z.cuid('Invalid interview preparation ID'),
})

export type DeletePreparationInput = z.infer<
  typeof deletePreparationInputSchema
>

// ============================================================================
// Weekly Goal Data Schema
// ============================================================================

/**
 * Schema for getWeeklyGoalData input
 *
 * Retrieves daily completed question counts for a week.
 * Uses Answer.submittedAt date for aggregation.
 *
 * @param interviewPreparationId - Interview preparation ID
 * @param weekStartDate - Monday of the target week in YYYY-MM-DD format (optional, defaults to current week)
 */
export const getWeeklyGoalDataInputSchema = z.object({
  interviewPreparationId: z.cuid('Invalid interview preparation ID'),
  weekStartDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
})

export type GetWeeklyGoalDataInput = z.infer<
  typeof getWeeklyGoalDataInputSchema
>
