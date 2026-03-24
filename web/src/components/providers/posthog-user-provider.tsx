/**
 * PostHog User Context Provider
 * Identifies users in PostHog from Clerk authentication
 * @module components/providers/posthog-user-provider
 */

'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect, useRef } from 'react'
import posthog from 'posthog-js'

interface PostHogUserProviderProps {
  children: React.ReactNode
}

/**
 * Identifies users in PostHog from Clerk authentication.
 * Must be rendered as a child of ClerkProvider.
 *
 * Uses the Clerk user ID as the distinct_id for consistent tracking
 * across client and server-side events.
 *
 * @example
 * ```tsx
 * <ClerkProvider>
 *   <PostHogUserProvider>
 *     <App />
 *   </PostHogUserProvider>
 * </ClerkProvider>
 * ```
 */
export function PostHogUserProvider({ children }: PostHogUserProviderProps) {
  const { user, isLoaded } = useUser()
  const prevUserIdRef = useRef<string | null>(null)

  // Identify or reset user when auth state changes
  // Using useEffect here is appropriate as this syncs external auth state with PostHog
  useEffect(() => {
    if (!isLoaded) return

    if (user) {
      // Only identify if user changed (prevent duplicate identify calls)
      if (prevUserIdRef.current !== user.id) {
        posthog.identify(user.id, {
          email: user.primaryEmailAddress?.emailAddress,
          name: user.fullName,
          username: user.username,
          created_at: user.createdAt?.toISOString(),
        })
        prevUserIdRef.current = user.id
      }
    } else if (prevUserIdRef.current !== null) {
      // User logged out - reset PostHog
      posthog.reset()
      prevUserIdRef.current = null
    }
  }, [user, isLoaded])

  return <>{children}</>
}
