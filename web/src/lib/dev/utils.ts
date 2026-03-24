/**
 * Development Environment Utilities
 *
 * This module provides utilities for development-only features.
 * These utilities are designed to be tree-shaken in production builds.
 *
 * @module lib/dev/utils
 */

/**
 * Check if the application is running in development mode
 *
 * @returns true if NODE_ENV is 'development'
 */
export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development'
}

/**
 * Conditional execution for development environment only
 *
 * @param fn - Function to execute in development mode
 * @returns Result of fn() if in development, undefined otherwise
 *
 * @example
 * ```typescript
 * devOnly(() => {
 *   console.log('This only runs in development')
 * })
 * ```
 */
export const devOnly = <T>(fn: () => T): T | undefined => {
  if (isDevelopment()) {
    return fn()
  }
  return undefined
}

/**
 * Get a value based on environment
 *
 * @param devValue - Value to return in development
 * @param prodValue - Value to return in production
 * @returns devValue if in development, prodValue otherwise
 *
 * @example
 * ```typescript
 * const apiUrl = getEnvValue(
 *   'http://localhost:3000',
 *   'https://api.production.com'
 * )
 * ```
 */
export const getEnvValue = <T>(devValue: T, prodValue: T): T => {
  return isDevelopment() ? devValue : prodValue
}
