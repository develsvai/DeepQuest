'use client'

import { useTranslations } from 'next-intl'
import { memo } from 'react'

import { CircularProgress } from '@/components/ui/circular-progress'
import { usePreparationProgress } from '@/hooks/use-preparation-progress'

/**
 * Skeleton component for PreparationItem's ActionCardContent
 *
 * Displays placeholder UI while AI is processing the interview preparation.
 * Shows circular progress that animates from 0% to 85% over ~120 seconds,
 * then jumps to 100% when preparation completes.
 */
function PreparationContentSkeletonBase() {
  const t = useTranslations('dashboard.preparationItem')

  // Progress animation: 0% → 85% over 120 seconds
  const { progress, state } = usePreparationProgress({
    isActive: true,
    maxProgress: 85,
    durationMs: 120_000,
  })

  return (
    <div className='space-y-4'>
      {/* Progress Section */}
      <div className='flex flex-col items-center justify-center gap-3 py-4'>
        <CircularProgress
          value={progress}
          size='lg'
          showLabel
          aria-label={t('progress.ariaLabel', { value: Math.round(progress) })}
          progressClassName={
            state === 'completing'
              ? 'stroke-green-500 transition-colors duration-300'
              : undefined
          }
        />
        <span className='text-sm text-muted-foreground'>
          {t('progress.analyzing')}
        </span>
      </div>
    </div>
  )
}

export const PreparationContentSkeleton = memo(PreparationContentSkeletonBase)
