import { memo } from 'react'

import {
  ActionCard,
  ActionCardContent,
  ActionCardFooter,
  ActionCardHeader,
} from '@/components/ui/custom/action-card'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// ==========================================
// Sub-components
// ==========================================

/**
 * Skeleton for individual ExperienceItem card
 * Mirrors the layout of ExperienceItem component
 */
function ExperienceItemSkeleton() {
  return (
    <Card className='py-4'>
      <CardContent className='flex items-center gap-4 py-0'>
        {/* Left Section - Experience Info */}
        <div className='min-w-0 flex-1 space-y-2'>
          {/* Name with Icon */}
          <div className='flex items-center gap-2'>
            <Skeleton className='h-4 w-4 shrink-0' />
            <Skeleton className='h-5 w-32' />
          </div>

          {/* Role/Position */}
          <div className='pl-6'>
            <Skeleton className='h-4 w-24' />
          </div>

          {/* Tech Stack Badges */}
          <div className='flex flex-wrap gap-1.5 pl-6'>
            <Skeleton className='h-5 w-14 rounded-full' />
            <Skeleton className='h-5 w-16 rounded-full' />
            <Skeleton className='h-5 w-12 rounded-full' />
          </div>

          {/* Key Achievements Count */}
          <div className='flex items-center gap-1.5 pl-6'>
            <Skeleton className='h-4 w-4' />
            <Skeleton className='h-4 w-20' />
          </div>
        </div>

        {/* Right Section - Circular Progress placeholder */}
        <div className='flex shrink-0 flex-col items-center gap-1'>
          <Skeleton className='h-12 w-12 rounded-full' />
          <Skeleton className='h-3 w-8' />
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Skeleton for a single PreparationItem card
 * Mirrors the layout of PreparationItem component
 */
function PreparationItemSkeleton() {
  return (
    <ActionCard>
      {/* Header Skeleton */}
      <ActionCardHeader
        leadingIcon={<Skeleton className='h-6 w-6' />}
        title={<Skeleton className='h-5 w-48' />}
        subtitle={<Skeleton className='h-4 w-32' />}
        headerRight={
          <div className='flex flex-col items-end gap-1'>
            <Skeleton className='h-5 w-16 rounded-full' />
            <Skeleton className='h-3 w-20' />
          </div>
        }
      />

      {/* Content Skeleton - mirrors PreparationItem body */}
      <ActionCardContent>
        <div className='space-y-3'>
          {/* Section Label */}
          <Skeleton className='h-4 w-28' />

          {/* Experience Items Grid - 2 columns on md+ */}
          <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
            <ExperienceItemSkeleton />
            <ExperienceItemSkeleton />
          </div>
        </div>
      </ActionCardContent>

      {/* Footer Skeleton */}
      <ActionCardFooter>
        <Skeleton className='h-10 w-full' />
      </ActionCardFooter>
    </ActionCard>
  )
}

// ==========================================
// Main Component
// ==========================================

/**
 * Dashboard list loading skeleton
 *
 * Displays placeholder cards while interview preparation data is loading.
 * Used as Suspense fallback in the dashboard page.
 * Shows 3 skeleton cards to indicate loading state.
 */
function DashboardListSkeletonBase() {
  return (
    <div className='space-y-4'>
      {[1, 2].map(i => (
        <PreparationItemSkeleton key={i} />
      ))}
    </div>
  )
}

export const DashboardListSkeleton = memo(DashboardListSkeletonBase)
