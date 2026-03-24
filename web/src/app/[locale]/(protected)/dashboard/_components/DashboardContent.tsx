'use client'

import { useTranslations } from 'next-intl'
import { useCallback, useRef } from 'react'
import { toast } from 'sonner'
import posthog from 'posthog-js'
import { POSTHOG_EVENTS } from '@/lib/posthog-events'

import { routes } from '@/lib/routes'

import { api } from '@/trpc/react'
import { EmptyDashboard } from './EmptyDashboard'
import { PreparationItem } from './PreparationItem'

// ==========================================
// Component
// ==========================================

/**
 * DashboardContent - Main content area for dashboard page
 *
 * Uses tRPC + React Query Suspense pattern:
 * - Server prefetches data into QueryClient cache
 * - HydrateClient hydrates client-side cache
 * - useSuspenseQuery suspends until data is available
 * - Suspense boundary in page.tsx shows skeleton while loading
 *
 * Renders either:
 * - Empty state when no preparations exist
 * - List of PreparationItem cards when preparations exist
 */
export function DashboardContent() {
  const t = useTranslations('common.toast')
  const utils = api.useUtils()
  const hasTrackedViewRef = useRef(false)

  // useSuspenseQuery suspends until data is available
  // Suspense boundary in page.tsx shows DashboardListSkeleton during loading
  const [preparations] = api.interviewPreparation.list.useSuspenseQuery()

  // PostHog: Track dashboard view (only once per component mount)
  if (!hasTrackedViewRef.current) {
    posthog.capture(POSTHOG_EVENTS.DASHBOARD.VIEWED, {
      preparation_count: preparations.length,
    })
    hasTrackedViewRef.current = true
  }

  // Mutation for deleting a preparation
  // Confirmation dialog is handled by ActionCard's destructive variant
  const deletePreparationMutation =
    api.interviewPreparation.deletePreparation.useMutation({
      onSuccess: () => {
        toast.success(t('preparationDeleted'))
        // Invalidate queries to refresh UI
        utils.interviewPreparation.list.invalidate()
        utils.interviewPreparation.listForSidebar.invalidate()
      },
      onError: error => {
        console.error(error)
      },
    })

  const handleDelete = useCallback(
    (id: string) => {
      // PostHog: Track interview preparation deletion (churn signal)
      posthog.capture(POSTHOG_EVENTS.PREPARATION.DELETED, {
        preparation_id: id,
      })
      deletePreparationMutation.mutate({ id })
    },
    [deletePreparationMutation]
  )

  // Show empty state if no preparations
  if (preparations.length === 0) {
    return <EmptyDashboard />
  }

  return (
    <div className='space-y-6'>
      {/* Preparation Cards */}
      <div className='space-y-4'>
        {preparations.map(preparation => (
          <PreparationItem
            key={preparation.id}
            preparation={preparation}
            onDelete={handleDelete}
            practiceHref={routes.interviewPrep.detail(preparation.id)}
          />
        ))}
      </div>
    </div>
  )
}
