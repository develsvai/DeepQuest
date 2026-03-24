'use client'

/**
 * Supabase Realtime subscription hook for InterviewPreparation status changes
 *
 * Subscribes to UPDATE events on the interview_preparations table filtered by userId.
 * Used to detect when AI processing completes (PENDING → READY or PENDING → FAILED).
 *
 * @example
 * const { isSubscribed, status } = usePreparationStatusSubscription({
 *   userId: 'user_123',
 *   onStatusChange: (event) => {
 *     if (event.status === 'READY') {
 *       // Handle completion
 *     }
 *   },
 * })
 */

import { useEffect, useState, useRef } from 'react'
import { createBrowserSupabaseClient } from '@/lib/db/supabase/hooks/clientSupabase'
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'
import { PreparationStatus } from '@/generated/prisma/enums'
import { snakeToCamelCase } from '@/lib/utils/case-transform'

/**
 * Payload for InterviewPreparation status change events
 *
 * Note: interview_preparations table uses camelCase column names (e.g., userId, jobTitle)
 * unlike webhook_events which uses snake_case (e.g., user_id).
 * snakeToCamelCase is still applied for consistency but has no effect on camelCase columns.
 */
export interface PreparationStatusPayload {
  id: string
  userId: string
  status: PreparationStatus
  title: string
  jobTitle: string | null
  errorMessage: string | null
  errorCode: string | null
  updatedAt: string
  // Auto question generation tracking fields
  /** Total number of question generation tasks (set after resume parsing) */
  totalQuestionGenTasks: number | null
  /** Number of completed question generation tasks */
  completedQuestionGenTasks: number | null
}

export type ConnectionStatus =
  | 'CONNECTING'
  | 'CONNECTED'
  | 'DISCONNECTED'
  | 'ERROR'

export interface UsePreparationStatusSubscriptionOptions {
  /** User ID for server-side filtering (from Clerk auth) */
  userId: string | undefined
  /** Callback when preparation status changes */
  onStatusChange?: (event: PreparationStatusPayload) => void
  /** Callback when connection is restored (for data resync) */
  onReconnect?: () => void
  /** Enable/disable subscription (default: true) */
  enabled?: boolean
}

export interface UsePreparationStatusSubscriptionReturn {
  /** Whether subscription is currently active */
  isSubscribed: boolean
  /** Current connection status */
  status: ConnectionStatus
  /** Last error if any */
  error: Error | null
}

/**
 * Hook for subscribing to InterviewPreparation status changes via Supabase Realtime
 *
 * Features:
 * - Server-side filtering by userId (Supabase filter)
 * - Callback ref pattern to prevent unnecessary reconnections
 * - Proper cleanup on unmount
 */
export function usePreparationStatusSubscription(
  options: UsePreparationStatusSubscriptionOptions
): UsePreparationStatusSubscriptionReturn {
  const { userId, onStatusChange, onReconnect, enabled = true } = options

  const [status, setStatus] = useState<ConnectionStatus>('DISCONNECTED')
  const [error, setError] = useState<Error | null>(null)

  // Use refs to maintain stable references
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabaseRef = useRef<SupabaseClient | null>(null)

  // Track if we've been connected before (to distinguish reconnection from initial connection)
  const wasConnectedRef = useRef(false)

  // Callback ref pattern: prevents useEffect from re-running when callback changes
  const onStatusChangeRef = useRef(onStatusChange)
  useEffect(() => {
    onStatusChangeRef.current = onStatusChange
  }, [onStatusChange])

  const onReconnectRef = useRef(onReconnect)
  useEffect(() => {
    onReconnectRef.current = onReconnect
  }, [onReconnect])

  useEffect(() => {
    // Don't subscribe if disabled or no userId
    if (!enabled || !userId) {
      setStatus('DISCONNECTED')
      return
    }

    // Create Supabase client if not exists
    if (!supabaseRef.current) {
      supabaseRef.current = createBrowserSupabaseClient()
    }

    const supabase = supabaseRef.current
    setStatus('CONNECTING')

    // Create channel with userId-based subscription
    // Note: interview_preparations table uses camelCase column name "userId" (not snake_case)
    const channelName = `interview-preparations:${userId}`
    const filter = `userId=eq.${userId}`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'interview_preparations',
          filter,
        },
        payload => {
          const event = snakeToCamelCase(
            payload.new
          ) as PreparationStatusPayload

          // Call the status change handler
          onStatusChangeRef.current?.(event)
        }
      )
      .subscribe((subscriptionStatus, err) => {
        if (subscriptionStatus === 'SUBSCRIBED') {
          // Detect reconnection (was connected before, now connected again)
          if (wasConnectedRef.current) {
            onReconnectRef.current?.()
          }
          wasConnectedRef.current = true
          setStatus('CONNECTED')
          setError(null)
        } else if (subscriptionStatus === 'CHANNEL_ERROR') {
          setStatus('ERROR')
          setError(err ?? new Error('Channel subscription failed'))
        } else if (subscriptionStatus === 'CLOSED') {
          setStatus('DISCONNECTED')
        }
      })

    channelRef.current = channel

    // Cleanup function
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      // Reset connection tracking on cleanup
      wasConnectedRef.current = false
    }
  }, [userId, enabled])

  // Handle visibility change: sync data when tab becomes visible and not connected
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === 'visible' &&
        enabled &&
        status !== 'CONNECTED'
      ) {
        // Tab became visible but not connected - trigger data sync
        onReconnectRef.current?.()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enabled, status])

  return {
    isSubscribed: status === 'CONNECTED',
    status,
    error,
  }
}
