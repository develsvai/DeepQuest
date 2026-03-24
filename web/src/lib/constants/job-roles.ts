/**
 * Job Role Constants
 *
 * Type-safe job role keys for interview preparation.
 * Display labels are managed via i18n (locales/{ko,en}/interview-prep.json).
 *
 * @see locales/ko/interview-prep.json - Korean translations (workspace.jobRoles)
 * @see locales/en/interview-prep.json - English translations (workspace.jobRoles)
 */

/**
 * Job role keys for i18n lookup
 *
 * These keys map to translations in interview-prep.json under workspace.jobRoles.
 *
 * @example
 * ```tsx
 * import { JOB_ROLE_KEYS } from '@/lib/constants/job-roles'
 * import { useTranslations } from 'next-intl'
 *
 * const t = useTranslations('interview-prep.new')
 * const roles = JOB_ROLE_KEYS.map(key => ({
 *   key,
 *   label: t(`jobRoles.${key}`)
 * }))
 * ```
 */
export const JOB_ROLE_KEYS = [
  'backend',
  'frontend',
  'fullstack',
  'devops',
  'aiAgentEngineer',
  'dataEngineer',
  'dataScientist',
] as const

/**
 * Job role key type
 *
 * Use this type to ensure type-safe job role handling.
 */
export type JobRoleKey = (typeof JOB_ROLE_KEYS)[number]
