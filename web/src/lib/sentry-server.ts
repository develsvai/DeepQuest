/**
 * Sentry server-side utilities
 * @module lib/sentry-server
 */

import { auth } from '@clerk/nextjs/server'
import * as Sentry from '@sentry/nextjs'

/**
 * Sets Sentry user context from Clerk authentication for server-side operations.
 * Call this in server components, actions, or API routes that need user context.
 *
 * @example
 * ```tsx
 * // In server component
 * export default async function DashboardPage() {
 *   await setSentryUserFromClerk()
 *   // ... rest of component
 * }
 * ```
 *
 * @example
 * ```ts
 * // In server action
 * export async function submitForm(data: FormData) {
 *   await setSentryUserFromClerk()
 *   // ... rest of action
 * }
 * ```
 */
export async function setSentryUserFromClerk(): Promise<void> {
  const { userId } = await auth()

  if (userId) {
    Sentry.setUser({ id: userId })
  } else {
    Sentry.setUser(null)
  }
}
