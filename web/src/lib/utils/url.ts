/**
 * URL Utilities
 *
 * Provides functions for getting base URLs in different environments.
 * Handles both client-side and server-side rendering with proper Vercel support.
 */

/**
 * Get the base URL for the application
 *
 * Works in both client-side and server-side contexts with proper
 * support for Vercel deployments (preview/production).
 *
 * @returns The base URL without trailing slash
 *
 * @example
 * ```typescript
 * // Client-side (browser)
 * const url = getBaseUrl() // "https://example.com"
 *
 * // Server-side (Vercel production)
 * const url = getBaseUrl() // "https://your-app.vercel.app"
 *
 * // Server-side (local development)
 * const url = getBaseUrl() // "http://localhost:3000"
 * ```
 */
export function getBaseUrl(): string {
  // Client-side: use window.location.origin
  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  // Server-side: check environment variables in priority order

  // 1. Explicit APP_URL (highest priority for custom domains)
  if (process.env.APP_URL) {
    return process.env.APP_URL
  }

  // 2. Vercel deployment URL (preview/production)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // 3. Development fallback
  const port = process.env.PORT ?? 3000
  return `http://localhost:${port}`
}

/**
 * Get the full API endpoint URL
 *
 * Combines base URL with API path to create full endpoint URL.
 *
 * @param path - API path (e.g., "/api/langgraph")
 * @returns Full API endpoint URL
 *
 * @example
 * ```typescript
 * // Client-side
 * const apiUrl = getApiUrl('/api/langgraph')
 * // "https://example.com/api/langgraph"
 *
 * // Server-side (Vercel)
 * const apiUrl = getApiUrl('/api/langgraph')
 * // "https://your-app.vercel.app/api/langgraph"
 * ```
 */
export function getApiUrl(path: string): string {
  const baseUrl = getBaseUrl()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${baseUrl}${normalizedPath}`
}

/**
 * Get the LangGraph proxy API URL
 *
 * Convenience function specifically for LangGraph proxy endpoint.
 *
 * @returns Full URL to LangGraph proxy endpoint
 *
 * @example
 * ```typescript
 * const thread = useStream({
 *   apiUrl: getLangGraphProxyUrl(),
 *   // ...
 * })
 * ```
 */
export function getLangGraphProxyUrl(): string {
  return getApiUrl('/api/langgraph')
}
