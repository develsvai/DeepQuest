/**
 * Feedback Evaluation Skeleton Component
 *
 * Loading skeleton for the evaluation view (strengths, weaknesses, suggestions)
 * Mimics the structure of CollapsibleFeedbackSection
 */

import React, { memo } from 'react'
import { Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { designTokens } from '@/components/design-system/core'

interface FeedbackEvaluationSkeletonProps {
  loadingMessage?: string | null
}

const FeedbackEvaluationSkeleton = memo(function FeedbackEvaluationSkeleton({
  loadingMessage,
}: FeedbackEvaluationSkeletonProps) {
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

      {/* Section skeletons (3 sections: strengths, weaknesses, suggestions) */}
      {[...Array(3)].map((_, sectionIndex) => (
        <div
          key={`section-skeleton-${sectionIndex}`}
          className='space-y-2'
          style={{
            backgroundColor: designTokens.colors.background,
            borderColor: designTokens.colors.border,
          }}
        >
          {/* Section header skeleton */}
          <div
            className='flex items-center justify-between rounded-lg p-3'
            style={{
              backgroundColor: designTokens.colors.background,
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: designTokens.colors.border,
            }}
          >
            <div className='flex items-center gap-2'>
              <Skeleton className='h-4 w-4 rounded-full' />
              <Skeleton className='h-4 w-32' />
            </div>
            <Skeleton className='h-4 w-4' />
          </div>

          {/* Section content skeleton (collapsed by default in skeleton) */}
          {/* Only show expanded state for first section */}
          {sectionIndex === 0 && (
            <div
              className='rounded-lg p-4'
              style={{
                backgroundColor: designTokens.colors.muted.DEFAULT + '50',
              }}
            >
              <div className='space-y-2'>
                {[...Array(5)].map((_, itemIndex) => (
                  <div
                    key={`item-skeleton-${itemIndex}`}
                    className='flex items-start gap-2'
                  >
                    <Skeleton className='mt-0.5 h-4 w-4 shrink-0 rounded-full' />
                    <Skeleton
                      className='h-4'
                      style={{
                        width: `${Math.random() * 20 + 70}%`,
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
})

export default FeedbackEvaluationSkeleton
