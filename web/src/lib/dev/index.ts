/**
 * Development Utilities Entry Point
 *
 * This module provides centralized exports for all development-only utilities.
 * These exports are designed to be tree-shaken in production builds.
 *
 * @module lib/dev
 */

// Development environment utilities
export { isDevelopment, devOnly, getEnvValue } from './utils'

// Sample data for testing
export { SAMPLE_JOB_DATA, DEV_TEST_FILE_CONFIG } from './sample-data'

// Re-export types
export type { JobPostingFormData } from '@/lib/schemas/job-posting.schema'
