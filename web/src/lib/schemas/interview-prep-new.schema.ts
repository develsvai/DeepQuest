/**
 * Interview Prep New Form Schema
 *
 * Zod validation schema for the new interview preparation form.
 * Message-free schema - i18n error messages handled by zod-error-map.ts
 *
 * @module interview-prep-new.schema
 */

import { z } from 'zod'

/**
 * Field name constants for type-safe field references in error mapping
 */
export const INTERVIEW_PREP_NEW_FIELDS = {
  title: 'title',
  jobTitle: 'jobTitle',
  experiences: 'experiences',
} as const satisfies Record<string, string>

export type InterviewPrepNewFieldName =
  (typeof INTERVIEW_PREP_NEW_FIELDS)[keyof typeof INTERVIEW_PREP_NEW_FIELDS]

/**
 * Experience item schema for dynamic field array
 */
export const experienceItemSchema = z.object({
  id: z.string(),
  name: z.string(),
})

export type ExperienceItem = z.infer<typeof experienceItemSchema>

/**
 * Interview prep new form schema (message-free for i18n)
 *
 * Validation rules:
 * - title: required, max 50 chars
 * - jobTitle: required, max 50 chars
 * - experiences: at least one with non-empty name
 *
 * Note: File upload validation is handled separately by useFileUpload hook
 */
export const interviewPrepNewFormSchema = z.object({
  title: z.string().min(1).max(50),
  jobTitle: z.string().min(1).max(50),
  experiences: z
    .array(experienceItemSchema)
    .min(1)
    .refine(experiences => experiences.some(e => e.name.trim().length > 0), {
      path: ['experiences'],
    }),
})

export type InterviewPrepNewFormData = z.infer<
  typeof interviewPrepNewFormSchema
>
