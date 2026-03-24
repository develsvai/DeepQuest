import { z } from 'zod'

/**
 * Job posting form field names
 * Use these constants for type-safe field name references across validation,
 * error mapping, and form implementations.
 *
 * @example
 * ```typescript
 * // In error map:
 * if (fieldName === JOB_POSTING_FIELDS.companyName) {
 *   return t('validation.companyRequired')
 * }
 * ```
 */
export const JOB_POSTING_FIELDS = {
  companyName: 'companyName',
  jobTitle: 'jobTitle',
  jobDescription: 'jobDescription',
} as const satisfies Record<string, string>

/**
 * TypeScript type for job posting field names
 * Ensures type safety when referencing field names
 */
export type JobPostingFieldName =
  (typeof JOB_POSTING_FIELDS)[keyof typeof JOB_POSTING_FIELDS]

/**
 * Base job posting schema used across all layers (form, API, AI)
 * Provides consistent validation rules and field names
 */
export const jobPostingSchema = z.object({
  companyName: z
    .string()
    .min(1, 'Company name is required')
    .max(200, 'Company name too long'),

  jobTitle: z
    .string()
    .min(1, 'Job title is required')
    .max(200, 'Job title too long'),

  jobDescription: z.string().min(1, 'Job description is required'),
})

/**
 * TypeScript type for job posting data
 */
export type JobPosting = z.infer<typeof jobPostingSchema>

/**
 * Schema for frontend forms with localized validation messages
 * Error messages are handled by the error map (see zod-error-map.ts)
 * to support i18n translation
 */
export const jobPostingFormSchema = z.object({
  companyName: z.string().min(1).max(50),
  jobTitle: z.string().min(3).max(50),
  jobDescription: z.string().min(20),
})

/**
 * TypeScript type for form data
 */
export type JobPostingFormData = z.infer<typeof jobPostingFormSchema>
