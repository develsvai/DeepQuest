/**
 * StatusBadge Component
 *
 * Displays completion status and rating badges for questions
 */

import React from 'react'
import { useTranslations } from 'next-intl'
import { CheckCircle, Circle, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { designTokens } from '@/components/design-system/core'
import type { Rating } from '@/generated/prisma/browser'

interface StatusBadgeProps {
  isCompleted: boolean
  rating?: Rating
  size?: 'sm' | 'md'
  className?: string
}

/**
 * Get rating display information
 */
function getRatingInfo(
  rating: Rating,
  t: ReturnType<typeof useTranslations>
): {
  label: string
  color: string
} {
  const ratingKey = rating.toLowerCase() as 'deep' | 'intermediate' | 'surface'
  return {
    label: t(`rating.${ratingKey}`),
    color: designTokens.colors.rating[ratingKey].DEFAULT,
  }
}

export function StatusBadge({
  isCompleted,
  rating,
  size = 'sm',
  className = '',
}: StatusBadgeProps) {
  const t = useTranslations('interview-prep.practice.question')
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'

  if (!isCompleted) {
    return (
      <div className={`flex items-center space-x-1 ${className}`}>
        <Circle
          className={iconSize}
          style={{ color: designTokens.colors.muted.foreground }}
        />
        <span
          className={`text-${size === 'sm' ? 'xs' : 'sm'} font-medium`}
          style={{ color: designTokens.colors.muted.foreground }}
        >
          {t('status.pending')}
        </span>
      </div>
    )
  }

  if (rating) {
    const ratingInfo = getRatingInfo(rating, t)

    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <CheckCircle
          className={iconSize}
          style={{ color: designTokens.colors.primary.DEFAULT }}
        />
        <Badge
          variant='outline'
          className={`${size === 'sm' ? 'text-xs' : 'text-sm'} border font-medium`}
          style={{
            color: ratingInfo.color,
            borderColor: ratingInfo.color,
            backgroundColor: designTokens.colors.muted.DEFAULT,
          }}
        >
          <Star className='mr-1 h-3 w-3' fill='currentColor' />
          {ratingInfo.label}
        </Badge>
      </div>
    )
  }

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <CheckCircle
        className={iconSize}
        style={{ color: designTokens.colors.primary.DEFAULT }}
      />
      <span
        className={`text-${size === 'sm' ? 'xs' : 'sm'} font-medium`}
        style={{ color: designTokens.colors.primary.DEFAULT }}
      >
        {t('status.completed')}
      </span>
    </div>
  )
}
