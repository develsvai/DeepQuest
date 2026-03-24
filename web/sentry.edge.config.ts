/**
 * Edge runtime Sentry configuration
 * 
 * This file configures the initialization of Sentry for edge features 
 * (middleware, edge routes, and so on).
 * Note that this config is unrelated to the Vercel Edge Runtime and is 
 * also required when running locally.
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

// Apply custom configuration with edge runtime
const edgeConfig = createSentryConfig({ runtime: 'edge' })

Sentry.init({
  ...edgeConfig,

  // Edge-specific overrides
  // Enable logs to be sent to Sentry
  enableLogs: true,
})
