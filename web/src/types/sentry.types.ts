/**
 * Sentry configuration types
 * @module types/sentry.types
 */

/**
 * Sentry environment types
 */
export type SentryEnvironment = 'development' | 'staging' | 'production'

/**
 * Sentry runtime types
 */
export type SentryRuntime = 'client' | 'server' | 'edge'

/**
 * Sampling rates configuration
 */
export interface SamplingRates {
  readonly traces: number
  readonly replaysSession: number
  readonly replaysOnError: number
  readonly profilesSample: number
}

/**
 * Sentry configuration options
 */
export interface SentryConfigOptions {
  runtime: SentryRuntime
  environment?: SentryEnvironment
}

/**
 * Sentry environment constants
 */
export const SENTRY_ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
} as const

/**
 * Environment-specific sampling configurations
 */
export const SAMPLING_CONFIG: Record<SentryEnvironment, SamplingRates> = {
  development: {
    traces: 1.0, // 100% - see everything in development
    replaysSession: 1.0, // 100% - full visibility
    replaysOnError: 1.0, // 100%
    profilesSample: 1.0, // 100%
  },
  staging: {
    traces: 0.2, // 20% - reasonable coverage
    replaysSession: 0.1, // 10%
    replaysOnError: 1.0, // 100% when errors occur
    profilesSample: 0.5, // 50%
  },
  production: {
    traces: 0.5, // 50% - MVP stage: higher sampling for early issue detection
    replaysSession: 0.05, // 5% - UX insights for small user base
    replaysOnError: 1.0, // 100% when errors occur
    profilesSample: 0.3, // 30% - performance bottleneck detection
  },
} as const
