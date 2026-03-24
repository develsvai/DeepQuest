/**
 * Reusable Loading State Component
 *
 * Provides consistent loading skeleton UI for different contexts
 * with customizable layout and sizing
 */

import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'

interface LoadingStateProps {
  variant?: 'page' | 'card' | 'minimal'
  showHeader?: boolean
  showContent?: boolean
  contentRows?: number
}

export default function LoadingState({
  variant = 'page',
  showHeader = true,
  showContent = true,
  contentRows = 3,
}: LoadingStateProps) {
  const containerClasses = {
    page: 'container mx-auto max-w-4xl px-4 py-6',
    card: 'p-6',
    minimal: 'p-4',
  }

  const headerHeight = {
    page: 'h-10',
    card: 'h-8',
    minimal: 'h-6',
  }

  const contentHeight = {
    page: 'h-96',
    card: 'h-48',
    minimal: 'h-24',
  }

  return (
    <div className={containerClasses[variant]}>
      <div className='space-y-6'>
        {showHeader && (
          <div className='space-y-2'>
            <Skeleton className={`${headerHeight[variant]} w-64`} />
            {variant === 'page' && <Skeleton className='h-4 w-48' />}
          </div>
        )}

        {showContent && (
          <div className='space-y-4'>
            {/* Main content skeleton */}
            <Skeleton className={`${contentHeight[variant]} w-full`} />

            {/* Additional rows for page variant */}
            {variant === 'page' &&
              Array.from({ length: contentRows }).map((_, index) => (
                <Skeleton key={`loading-row-${index}`} className='h-4 w-full' />
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Specialized loading states for common use cases
 */
export function ProblemSolvingLoadingState() {
  return (
    <LoadingState
      variant='page'
      showHeader={true}
      showContent={true}
      contentRows={2}
    />
  )
}

export function FeedbackLoadingState() {
  return (
    <LoadingState
      variant='card'
      showHeader={true}
      showContent={true}
      contentRows={4}
    />
  )
}

export function QuestionLoadingState() {
  return (
    <LoadingState
      variant='card'
      showHeader={false}
      showContent={true}
      contentRows={2}
    />
  )
}
