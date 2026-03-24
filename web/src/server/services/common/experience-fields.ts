/**
 * Common Experience Field Types
 *
 * Defines fields to omit from Prisma types for UI usage.
 * These are internal or unnecessary fields for UI rendering.
 */

/**
 * Fields to omit from Experience types (Career/Project) for UI
 *
 * @description
 * - index: Internal ordering field
 * - interviewPreparationId: FK reference, returned separately in API responses
 */
export type OmittedExperienceFields = 'index' | 'interviewPreparationId'
