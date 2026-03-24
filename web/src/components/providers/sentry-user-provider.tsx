/**
 * Sentry User Context Provider
 * Sets Sentry user context from Clerk authentication
 * @module components/providers/sentry-user-provider
 */

'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

interface SentryUserProviderProps {
  children: React.ReactNode
}

/**
 * Sets Sentry user context from Clerk authentication.
 * Must be rendered as a child of ClerkProvider.
 *
 * @example
 * ```tsx
 * <ClerkProvider>
 *   <SentryUserProvider>
 *     <App />
 *   </SentryUserProvider>
 * </ClerkProvider>
 * ```
 */
export function SentryUserProvider({ children }: SentryUserProviderProps) {
  const { user, isLoaded } = useUser()

  useEffect(() => {
    if (isLoaded) {
      if (user) {
        // Set minimal user context for privacy compliance
        // Only user ID is sent to respect GDPR
        Sentry.setUser({
          id: user.id,
        })
      } else {
        // User logged out - clear user context
        Sentry.setUser(null)
      }
    }
  }, [user, isLoaded])

  return <>{children}</>
}
