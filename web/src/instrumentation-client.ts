/**
 * Client-side Instrumentation
 *
 * Initializes monitoring and analytics tools before the app becomes interactive.
 * Order matters: Sentry first (to capture init errors), then PostHog.
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 * @see https://posthog.com/docs/libraries/next-js
 */

import * as Sentry from '@sentry/nextjs'

import {
  createSentryConfig,
  detectEnvironment,
  getSamplingRates,
} from '../sentry.common.config'
import { initPostHog } from './lib/posthog-client'

// ===========================================
// 1. Sentry Initialization (Error Tracking)
// ===========================================
const commonConfig = createSentryConfig({ runtime: 'client' })
const environment = detectEnvironment()
const sampling = getSamplingRates(environment)

Sentry.init({
  ...commonConfig,

  // Client-specific integrations
  integrations: [
    Sentry.replayIntegration(),
    Sentry.browserTracingIntegration(),
    // Automatically capture console.warn and console.error
    // Note: console.log excluded to reduce noise in production
    Sentry.consoleLoggingIntegration({ levels: ['warn', 'error'] }),
    Sentry.feedbackIntegration({
      // Additional SDK configuration goes in here, for example:
      colorScheme: 'system',
      isEmailRequired: true,
    }),
  ],

  // Session Replay sampling rates (environment-specific)
  replaysSessionSampleRate: sampling.replaysSession,
  replaysOnErrorSampleRate: sampling.replaysOnError,

  // Enable logs to be sent to Sentry
  enableLogs: true,
})

// ===========================================
// 2. PostHog Initialization (Analytics)
// ===========================================
initPostHog()

// ===========================================
// 3. Router Transition Tracking (Sentry only)
// ===========================================

/**
 * Handle client-side router transitions for Sentry performance monitoring
 *
 * Note: PostHog pageview tracking is handled automatically via
 * `defaults: '2025-05-24'` which sets `capture_pageview: 'history_change'`
 * for SPA navigation tracking via the history API.
 *
 * @param url - Destination URL
 * @param navigationType - Type of navigation ('push' | 'replace' | 'traverse')
 */
export function onRouterTransitionStart(
  url: string,
  navigationType: 'push' | 'replace' | 'traverse'
): void {
  Sentry.captureRouterTransitionStart(url, navigationType)
}
