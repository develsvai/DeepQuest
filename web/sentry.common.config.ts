/**
 * Common Sentry configuration shared across all runtimes
 * @module sentry.common.config
 */

import type {
  BrowserOptions,
  NodeOptions,
  EdgeOptions,
  ErrorEvent,
  EventHint,
} from '@sentry/nextjs'
import type {
  SentryEnvironment,
  SentryRuntime,
  SamplingRates,
  SentryConfigOptions,
} from '@/types/sentry.types'
import { SAMPLING_CONFIG } from '@/types/sentry.types'

/**
 * Detect current environment
 * Priority: NEXT_PUBLIC_SENTRY_ENV > VERCEL_ENV > NODE_ENV
 */
export function detectEnvironment(): SentryEnvironment {
  // 1. Explicit environment variable (highest priority)
  if (process.env.NEXT_PUBLIC_SENTRY_ENV) {
    return process.env.NEXT_PUBLIC_SENTRY_ENV as SentryEnvironment
  }

  // 2. Vercel environment detection
  if (process.env.VERCEL_ENV === 'production') return 'production'
  if (process.env.VERCEL_ENV === 'preview') return 'staging'

  // 3. NODE_ENV fallback
  if (process.env.NODE_ENV === 'production') return 'production'
  if (process.env.NODE_ENV === 'test') return 'development'

  // 4. Default to development
  return 'development'
}

/**
 * Get Sentry DSN from environment variables
 * Throws in production if DSN is not configured (unless SENTRY_ALLOW_EMPTY_DSN=true)
 */
export function getSentryDSN(): string {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
  const env = detectEnvironment()
  const allowEmptyDsn =
    process.env.SENTRY_ALLOW_EMPTY_DSN === 'true' || env !== 'production'

  if (!dsn) {
    if (!allowEmptyDsn) {
      throw new Error('NEXT_PUBLIC_SENTRY_DSN is required in production')
    }
    console.warn('Sentry DSN not configured, Sentry will be disabled')
    return ''
  }

  return dsn
}

/**
 * Get sampling rates based on environment
 */
export function getSamplingRates(
  environment: SentryEnvironment
): SamplingRates {
  return SAMPLING_CONFIG[environment]
}

/**
 * Check if error should be filtered out
 */
function shouldFilterError(event: ErrorEvent, hint: EventHint): boolean {
  const error = hint.originalException

  // Filter out network errors from ad blockers or analytics
  // Only filter if the FAILED URL itself is analytics-related, not just any breadcrumb
  if (error instanceof Error && error.message.includes('Failed to fetch')) {
    // Get the actual failed URL from the most recent fetch breadcrumb
    const breadcrumbs = event.breadcrumbs || []
    const lastFetchBreadcrumb = [...breadcrumbs]
      .reverse()
      .find(b => b.category === 'fetch' || b.category === 'xhr')

    if (lastFetchBreadcrumb?.data?.url) {
      const failedUrl = lastFetchBreadcrumb.data.url as string
      const isAnalyticsUrl =
        failedUrl.includes('google-analytics') ||
        failedUrl.includes('facebook.com') ||
        failedUrl.includes('doubleclick.net') ||
        failedUrl.includes('googletagmanager.com') ||
        failedUrl.includes('analytics.google.com') ||
        failedUrl.includes('_vercel/insights')

      // Only filter if the failed URL is analytics-related
      if (isAnalyticsUrl) return true
    }
  }

  // Filter development-only hydration errors
  if (process.env.NODE_ENV === 'development') {
    if (error instanceof Error && error.message.includes('Hydration')) {
      console.warn('Hydration error filtered:', error)
      return true
    }
  }

  return false
}

/**
 * Sanitize sensitive data from events
 */
function sanitizeSensitiveData(event: ErrorEvent): void {
  // Remove sensitive query parameters
  if (
    event.request?.query_string &&
    typeof event.request.query_string === 'string'
  ) {
    const sensitiveParams = [
      'token',
      'api_key',
      'apiKey',
      'password',
      'secret',
      'auth',
    ]
    let queryString = event.request.query_string
    sensitiveParams.forEach(param => {
      if (queryString.includes(param)) {
        queryString = queryString.replace(
          new RegExp(`${param}=[^&]*`, 'gi'),
          `${param}=[REDACTED]`
        )
      }
    })
    event.request.query_string = queryString
  }

  // Sanitize breadcrumbs
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
      if (breadcrumb.data?.email) {
        breadcrumb.data.email = '[REDACTED]'
      }
      if (breadcrumb.data?.password) {
        breadcrumb.data.password = '[REDACTED]'
      }
      return breadcrumb
    })
  }

  // Remove sensitive headers
  if (event.request?.headers) {
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'x-api-key',
      'x-auth-token',
    ]
    sensitiveHeaders.forEach(header => {
      if (event.request!.headers![header]) {
        event.request!.headers![header] = '[REDACTED]'
      }
    })
  }

  // Sanitize API keys in error messages
  if (event.message) {
    event.message = event.message.replace(/sk-[a-zA-Z0-9]+/g, 'sk-[REDACTED]')
    event.message = event.message.replace(
      /pk_test_[a-zA-Z0-9]+/g,
      'pk_test_[REDACTED]'
    )
    event.message = event.message.replace(
      /pk_live_[a-zA-Z0-9]+/g,
      'pk_live_[REDACTED]'
    )
  }
}

/**
 * Add runtime-specific context to events
 */
function addRuntimeContext(event: ErrorEvent, runtime: SentryRuntime): void {
  event.tags = {
    ...event.tags,
    runtime,
  }

  // Add client-specific context
  if (runtime === 'client' && typeof window !== 'undefined') {
    event.contexts = {
      ...event.contexts,
      browser: {
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      },
    }
  }
}

/**
 * Enrich event with additional context
 */
function enrichEventContext(event: ErrorEvent, hint: EventHint): void {
  // Add custom fingerprinting for better error grouping
  if (hint.originalException instanceof Error) {
    const error = hint.originalException

    // Group similar Next.js errors together
    if (error.message.includes('NEXT_')) {
      event.fingerprint = ['nextjs', error.message.split(':')[0] ?? 'unknown']
    }
  }

  // Add environment-specific tags
  event.tags = {
    ...event.tags,
    deployment: detectEnvironment(),
  }
}

/**
 * Create beforeSend hook with runtime-specific logic
 */
export function createBeforeSendHook(runtime: SentryRuntime) {
  return (event: ErrorEvent, hint: EventHint): ErrorEvent | null => {
    // 1. Filter out known non-actionable errors
    if (shouldFilterError(event, hint)) {
      return null
    }

    // 2. Sanitize sensitive data
    sanitizeSensitiveData(event)

    // 3. Add runtime-specific context
    addRuntimeContext(event, runtime)

    // 4. Enrich with additional context
    enrichEventContext(event, hint)

    return event
  }
}

/**
 * Create common Sentry configuration
 */
type CommonSentryOptions = Partial<BrowserOptions & NodeOptions & EdgeOptions>

export function createSentryConfig(
  options: SentryConfigOptions
): CommonSentryOptions {
  const environment = options.environment ?? detectEnvironment()
  const sampling = getSamplingRates(environment)

  return {
    dsn: getSentryDSN(),
    environment,

    // Release tracking (using Vercel Git SHA or fallback)
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'unknown',

    // Disable debug mode to reduce console noise
    debug: false,

    // Disable in development to reduce noise
    enabled: environment !== 'development',

    // Sampling rates
    tracesSampleRate: sampling.traces,

    // Privacy: disable automatic PII sending
    sendDefaultPii: false,

    // beforeSend hook
    beforeSend: createBeforeSendHook(options.runtime),

    // Attach stack traces to all messages
    attachStacktrace: true,

    // Maximum breadcrumbs to capture
    maxBreadcrumbs: 50,

    // Initial scope configuration
    initialScope: {
      tags: {
        runtime: options.runtime,
        deployment: environment,
      },
    },
  }
}
