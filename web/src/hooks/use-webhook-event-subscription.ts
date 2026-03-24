'use client'

/**
 * Supabase Realtime subscription hook for WebhookEvent status changes
 *
 * Subscribes to UPDATE events on the webhook_events table filtered by userId.
 * Used to detect when AI workflow operations complete (SUCCESS/ERROR).
 *
 * @example
 * const { isSubscribed, status } = useWebhookEventSubscription({
 *   userId: 'user_123',
 *   graphName: 'question_gen',
 *   onStatusChange: (event) => {
 *     if (event.status === 'SUCCESS') {
 *       // Handle completion
 *     }
 *   },
 * })
 */

import { useEffect, useState, useRef } from 'react'
import { createBrowserSupabaseClient } from '@/lib/db/supabase/hooks/clientSupabase'
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'
import { WebhookStatus } from '@/generated/prisma/enums'
import type { QuestionGenMetadata } from '@/app/api/webhooks/ai-workflow/handlers/question-generation-v2.handler'
import { snakeToCamelCase } from '@/lib/utils/case-transform'

/**
 * Supabase Realtime returns snake_case column names
 * This matches the database schema directly
 * Convert snake_case to camelCase using snakeToCamelCase
 */
export interface WebhookEventRealtimePayload {
  id: string
  userId: string
  graphName: string
  runId: string
  threadId: string
  status: WebhookStatus
  createdAt: string
  completedAt: string | null
  error: unknown | null
  metadata: QuestionGenMetadata
  preparationId: string | null
}

export type ConnectionStatus =
  | 'CONNECTING'
  | 'CONNECTED'
  | 'DISCONNECTED'
  | 'ERROR'

export interface UseWebhookEventSubscriptionOptions {
  /** User ID for server-side filtering (from Clerk auth) */
  userId: string | undefined
  /** Graph name for client-side filtering (e.g., 'question_gen') */
  graphName?: string
  /** Callback when webhook event status changes */
  onStatusChange?: (event: WebhookEventRealtimePayload) => void
  /** Callback when connection is restored (for data resync) */
  onReconnect?: () => void
  /** Enable/disable subscription (default: true) */
  enabled?: boolean
}

export interface UseWebhookEventSubscriptionReturn {
  /** Whether subscription is currently active */
  isSubscribed: boolean
  /** Current connection status */
  status: ConnectionStatus
  /** Last error if any */
  error: Error | null
}

/**
 * Hook for subscribing to WebhookEvent status changes via Supabase Realtime
 *
 * Features:
 * - Server-side filtering by userId (Supabase filter)
 * - Client-side filtering by graphName (callback filter)
 * - Callback ref pattern to prevent unnecessary reconnections
 * - Proper cleanup on unmount
 */
export function useWebhookEventSubscription(
  options: UseWebhookEventSubscriptionOptions
): UseWebhookEventSubscriptionReturn {
  const {
    userId,
    graphName,
    onStatusChange,
    onReconnect,
    enabled = true,
  } = options

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

  // GraphName ref for client-side filtering
  const graphNameRef = useRef(graphName)
  useEffect(() => {
    graphNameRef.current = graphName
  }, [graphName])

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
    const channelName = `webhook-events:${userId}`
    const filter = `user_id=eq.${userId}`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'webhook_events',
          filter,
        },
        payload => {
          const event = snakeToCamelCase(
            payload.new
          ) as WebhookEventRealtimePayload

          // Client-side graphName filtering
          // (Supabase Realtime only allows one filter per subscription)
          if (
            graphNameRef.current &&
            event.graphName !== graphNameRef.current
          ) {
            return
          }

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
