/**
 * Feedback Example Skeleton Component
 *
 * Loading skeleton for the example answer view
 * Mimics the structure of FeedbackExampleView with HighlightedExample
 */

import React, { memo } from 'react'
import { Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { designTokens } from '@/components/design-system/core'

interface FeedbackExampleSkeletonProps {
  loadingMessage?: string | null
}

const FeedbackExampleSkeleton = memo(function FeedbackExampleSkeleton({
  loadingMessage,
}: FeedbackExampleSkeletonProps) {
  return (
    <div className='space-y-4'>
      {/* Loading message */}
      {loadingMessage && (
        <div
          className='mb-4 flex items-center gap-2 text-sm'
          style={{ color: designTokens.colors.muted.foreground }}
        >
          <Loader2 className='h-4 w-4 animate-spin' />
          <span>{loadingMessage}</span>
        </div>
      )}

      {/* Title and description skeleton */}
      <div className='space-y-3'>
        <Skeleton className='h-5 w-48' />
        <Skeleton className='h-4 w-full' />
        <Skeleton className='h-4 w-3/4' />
      </div>

      {/* Highlighted example paragraphs skeleton */}
      <div
        className='rounded-lg p-4'
        style={{ backgroundColor: designTokens.colors.muted.DEFAULT }}
      >
        <div className='space-y-2'>
          {[...Array(5)].map((_, paragraphIndex) => (
            <div
              key={`paragraph-skeleton-${paragraphIndex}`}
              className='rounded-sm'
              style={{
                padding: '8px 12px',
                backgroundColor:
                  paragraphIndex % 2 === 0
                    ? designTokens.colors.muted.DEFAULT
                    : designTokens.colors.accent.DEFAULT,
              }}
            >
              <Skeleton
                className='h-4'
                style={{
                  width: `${Math.random() * 30 + 60}%`,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

export default FeedbackExampleSkeleton
