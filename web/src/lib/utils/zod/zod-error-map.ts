/**
 * Zod v4 Error Map Utility for i18n Support
 *
 * This utility creates a custom error map function for Zod v4 that integrates
 * with next-intl for internationalized validation error messages.
 *
 * @module zod-error-map
 */

import { JOB_POSTING_FIELDS } from '@/lib/schemas/job-posting.schema'
import { INTERVIEW_PREP_NEW_FIELDS } from '@/lib/schemas/interview-prep-new.schema'

/**
 * Zod validation issue type
 * Compatible with both Zod v3 and v4 error structures
 * Uses a flexible structure to accommodate various error types
 */
interface ValidationIssue {
  code: string
  message?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

/**
 * Translation function interface for Zod error map
 * Accepts any key and returns a string (compatible with next-intl Translator)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TranslationFn = (key: any) => string

/**
 * Creates a Zod v4 error map function for internationalization
 *
 * This function maps Zod validation error codes to translation keys,
 * allowing for localized error messages in forms.
 *
 * @param t - Translation function from next-intl's useTranslations hook
 * @returns Error map function compatible with Zod v4's error parameter
 *
 * @example
 * ```tsx
 * const t = useTranslations('forms.validation')
 * const form = useForm({
 *   resolver: zodResolver(schema, { error: createZodErrorMap(t) })
 * })
 * ```
 *
 * Supported error codes:
 * - invalid_type: Type mismatch errors
 * - too_small: Minimum length/value violations
 * - too_big: Maximum length/value violations
 * - Custom messages: Pre-translated keys starting with 'validation.'
 */
export function createZodErrorMap(
  t: TranslationFn
): (issue: ValidationIssue) => string | undefined {
  return (issue: ValidationIssue) => {
    // Handle custom error messages that are already translation keys
    // These are defined in the schema with keys like 'validation.companyRequired'
    if (
      issue.message &&
      typeof issue.message === 'string' &&
      issue.message.startsWith('validation.')
    ) {
      return t(issue.message)
    }

    // Get the field name from the path (e.g., ['companyName'] => 'companyName')
    const fieldName = issue.path?.[0]

    // Convert bigint to number for comparison (Zod v4 may use bigint)
    const toNumber = (val: unknown): number | undefined => {
      if (typeof val === 'number') return val
      if (typeof val === 'bigint') return Number(val)
      return undefined
    }

    // Map Zod error codes to field-specific translation keys
    switch (issue.code) {
      case 'invalid_type':
        // Handle required field errors (undefined input)
        if (issue.received === 'undefined' || issue.received === undefined) {
          // Map to field-specific required message
          if (fieldName === JOB_POSTING_FIELDS.companyName) {
            return t('validation.companyRequired')
          }
          if (fieldName === JOB_POSTING_FIELDS.jobTitle) {
            return t('validation.positionRequired')
          }
          if (fieldName === JOB_POSTING_FIELDS.jobDescription) {
            return t('validation.descriptionRequired')
          }
          // Interview prep new form fields
          if (fieldName === INTERVIEW_PREP_NEW_FIELDS.title) {
            return t('validation.titleRequired')
          }
          if (fieldName === INTERVIEW_PREP_NEW_FIELDS.jobTitle) {
            return t('validation.jobTitleRequired')
          }
          return t('validation.required')
        }
        return t('validation.invalidType')

      case 'too_small':
        // Handle minimum length violations for strings
        // In Zod v4, string length issues use 'origin' not 'type'
        if (issue.origin === 'string' || issue.type === 'string') {
          const minimum = toNumber(issue.minimum)
          // Map to field-specific minimum message
          if (
            fieldName === JOB_POSTING_FIELDS.jobDescription &&
            minimum === 20
          ) {
            return t('validation.descriptionRequired')
          }
          if (fieldName === JOB_POSTING_FIELDS.jobTitle && minimum === 3) {
            return t('validation.positionRequired')
          }
          if (fieldName === JOB_POSTING_FIELDS.companyName && minimum === 1) {
            return t('validation.companyRequired')
          }
          // Interview prep new form fields
          if (fieldName === INTERVIEW_PREP_NEW_FIELDS.title && minimum === 1) {
            return t('validation.titleRequired')
          }
          if (
            fieldName === INTERVIEW_PREP_NEW_FIELDS.jobTitle &&
            minimum === 1
          ) {
            return t('validation.jobTitleRequired')
          }
          return t('validation.tooShort')
        }
        // Handle array minimum length (experiences)
        if (issue.origin === 'array' || issue.type === 'array') {
          if (fieldName === INTERVIEW_PREP_NEW_FIELDS.experiences) {
            return t('validation.experienceRequired')
          }
        }
        return t('validation.tooSmall')

      case 'too_big':
        // Handle maximum length violations for strings
        // In Zod v4, string length issues use 'origin' not 'type'
        if (issue.origin === 'string' || issue.type === 'string') {
          const maximum = toNumber(issue.maximum)
          // Map to field-specific maximum message
          if (fieldName === JOB_POSTING_FIELDS.companyName && maximum === 50) {
            return t('validation.companyTooLong')
          }
          if (fieldName === JOB_POSTING_FIELDS.jobTitle && maximum === 50) {
            return t('validation.positionTooLong')
          }
          // Interview prep new form fields
          if (fieldName === INTERVIEW_PREP_NEW_FIELDS.title && maximum === 50) {
            return t('validation.titleTooLong')
          }
          if (
            fieldName === INTERVIEW_PREP_NEW_FIELDS.jobTitle &&
            maximum === 50
          ) {
            return t('validation.jobTitleTooLong')
          }
          return t('validation.tooLong')
        }
        return t('validation.tooBig')

      case 'invalid_string':
        // Handle string format validations (email, url, etc.)
        return t('validation.invalidFormat')

      case 'custom':
        // Handle custom refinement errors (e.g., experiences validation)
        if (fieldName === INTERVIEW_PREP_NEW_FIELDS.experiences) {
          return t('validation.experienceRequired')
        }
        return undefined

      default:
        // Return undefined to use Zod's default error message
        // This allows Zod to handle other error types naturally
        return undefined
    }
  }
}
