/**
 * PostHog Client-side Utilities
 *
 * Centralized PostHog client initialization and configuration.
 * Provides high cohesion for analytics logic with low coupling to consumers.
 *
 * @module lib/posthog-client
 * @see https://posthog.com/docs/libraries/next-js
 */

import posthog from 'posthog-js'

import { routing } from '@/i18n/routing'

// ===========================================
// Configuration
// ===========================================

/**
 * PostHog initialization options
 * Extracted for reusability and testability
 */
const POSTHOG_CONFIG = {
  // Reverse proxy to bypass ad blockers (configured in next.config.ts)
  apiHost: '/ingest',
  uiHost: 'https://us.posthog.com',
  // PostHog defaults version for consistent behavior
  // Includes: capture_pageview: 'history_change', capture_pageleave: true
  defaultsVersion: '2025-05-24',
} as const

/**
 * Regex pattern to match and capture locale prefixes in URLs
 * Generated from routing.locales for consistency with next-intl
 */
const LOCALE_PREFIX_REGEX = new RegExp(
  `^/(${routing.locales.join('|')})(?=/|$)`
)

// ===========================================
// URL Normalization & Locale Extraction
// ===========================================

interface LocaleUrlResult {
  /** URL with locale prefix removed */
  normalizedUrl: string
  /** Extracted locale (e.g., 'ko', 'en') or null if not found */
  locale: string | null
}

/**
 * Extract locale and normalize URL path for analytics
 *
 * next-intl creates URLs like /ko/dashboard and /en/dashboard.
 * This extracts the locale and normalizes paths for unified page analytics
 * while preserving locale information for segmentation.
 *
 * @param url - Full URL or pathname
 * @returns Object with normalized URL and extracted locale
 *
 * @example
 * extractLocaleAndNormalize('/ko/dashboard')
 * // { normalizedUrl: '/dashboard', locale: 'ko' }
 *
 * extractLocaleAndNormalize('/en/interview-prep/123')
 * // { normalizedUrl: '/interview-prep/123', locale: 'en' }
 *
 * extractLocaleAndNormalize('/dashboard')
 * // { normalizedUrl: '/dashboard', locale: null }
 */
function extractLocaleAndNormalize(url: string): LocaleUrlResult {
  try {
    const urlObj = new URL(url, 'http://placeholder')
    const match = urlObj.pathname.match(LOCALE_PREFIX_REGEX)
    const locale = match ? match[1] : null

    urlObj.pathname = urlObj.pathname.replace(LOCALE_PREFIX_REGEX, '')
    // Ensure root path
    if (urlObj.pathname === '') {
      urlObj.pathname = '/'
    }

    // Return full URL if it was absolute, otherwise just pathname + search
    const normalizedUrl = url.startsWith('http')
      ? urlObj.href
      : urlObj.pathname + urlObj.search + urlObj.hash

    return { normalizedUrl, locale }
  } catch {
    // Fallback: simple string extraction and replacement
    const match = url.match(LOCALE_PREFIX_REGEX)
    const locale = match ? match[1] : null
    const normalizedUrl = url.replace(LOCALE_PREFIX_REGEX, '') || '/'
    return { normalizedUrl, locale }
  }
}

// ===========================================
// Initialization
// ===========================================

/**
 * Initialize PostHog client
 *
 * Should be called once at application startup (instrumentation-client.ts).
 * Safe to call multiple times - PostHog handles duplicate initialization.
 *
 * Features:
 * - Automatic SPA pageview tracking via history API
 * - Locale-normalized URLs (removes /ko, /en prefix for unified metrics)
 * - Locale property extraction (enables language-based segmentation)
 * - Reverse proxy to bypass ad blockers
 * - Privacy-respecting (honors Do Not Track)
 *
 * @example
 * ```typescript
 * // In instrumentation-client.ts
 * import { initPostHog } from '@/lib/posthog-client'
 * initPostHog()
 * ```
 */
export function initPostHog(): void {
  // Dev 환경에서는 PostHog 완전 비활성화
  if (process.env.NODE_ENV === 'development') {
    return
  }

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY

  if (!apiKey) {
    return
  }

  posthog.init(apiKey, {
    api_host: POSTHOG_CONFIG.apiHost,
    ui_host: POSTHOG_CONFIG.uiHost,

    // defaults '2025-05-24' includes:
    // - capture_pageview: 'history_change' (automatic SPA tracking)
    // - capture_pageleave: true
    defaults: POSTHOG_CONFIG.defaultsVersion,

    // Event capture settings
    capture_exceptions: true,

    // Privacy settings
    respect_dnt: true,

    // URL normalization & locale extraction for i18n analytics
    // - Normalizes URLs: /ko/dashboard → /dashboard (unified page metrics)
    // - Extracts locale: adds 'locale' property for language segmentation
    before_send: event => {
      if (!event) return event

      let extractedLocale: string | null = null

      // Extract locale from $current_url and normalize
      if (event.properties?.$current_url) {
        const { normalizedUrl, locale } = extractLocaleAndNormalize(
          event.properties.$current_url
        )
        event.properties.$current_url = normalizedUrl
        if (locale) extractedLocale = locale
      }

      // Normalize $pathname as well
      if (event.properties?.$pathname) {
        const { normalizedUrl, locale } = extractLocaleAndNormalize(
          event.properties.$pathname
        )
        event.properties.$pathname = normalizedUrl
        // Use pathname locale if URL locale wasn't found
        if (!extractedLocale && locale) extractedLocale = locale
      }

      // Add locale as a separate property for segmentation
      // Enables filtering/breakdown by language in PostHog dashboards
      if (extractedLocale) {
        event.properties.locale = extractedLocale
      }

      return event
    },
  })
}
