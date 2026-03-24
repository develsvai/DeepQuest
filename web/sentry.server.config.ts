/**
 * Server-side Sentry configuration
 * 
 * This file configures the initialization of Sentry on the server.
 * The config you add here will be used whenever the server handles a request.
 * 
 * Uses custom configuration from sentry.common.config.ts for:
 * - Environment-aware sampling rates
 * - Error filtering (analytics, hydration errors)
 * - Sensitive data sanitization
 * - Runtime context enrichment
 * 
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from '@sentry/nextjs'
import { createSentryConfig } from './sentry.common.config'

// Apply custom configuration with server runtime
const serverConfig = createSentryConfig({ runtime: 'server' })

Sentry.init({
  ...serverConfig,

  // Server-specific overrides
  // Enable logs to be sent to Sentry
  enableLogs: true,
})
