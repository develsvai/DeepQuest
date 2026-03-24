'use client'

import React, { useState, memo } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { designTokens } from '@/components/design-system/core'

export interface StarRatingProps {
  value: 1 | 2 | 3 // Current rating
  onChange?: (value: 1 | 2 | 3) => void // Optional edit handler
  disabled?: boolean // Read-only mode or loading state
  size?: 'sm' | 'md' | 'lg' // Size variants
}

const sizeMap = {
  sm: 16,
  md: 20,
  lg: 24,
} as const

export const StarRating = memo(function StarRating({
  value,
  onChange,
  disabled = false,
  size = 'md',
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)
  const isInteractive = !disabled && !!onChange
  const iconSize = sizeMap[size]

  const handleClick = (starIndex: 1 | 2 | 3) => {
    if (!isInteractive) return
    onChange(starIndex)
  }

  const handleMouseEnter = (starIndex: number) => {
    if (!isInteractive) return
    setHoverValue(starIndex)
  }

  const handleMouseLeave = () => {
    if (!isInteractive) return
    setHoverValue(null)
  }

  const displayValue = hoverValue ?? value

  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5',
        isInteractive && 'cursor-pointer'
      )}
      onMouseLeave={handleMouseLeave}
      role={isInteractive ? 'radiogroup' : 'img'}
      aria-label={`${value} out of 3 stars`}
    >
      {[1, 2, 3].map(starIndex => {
        const isFilled = starIndex <= displayValue

        return (
          <button
            key={starIndex}
            type='button'
            onClick={() => handleClick(starIndex as 1 | 2 | 3)}
            onMouseEnter={() => handleMouseEnter(starIndex)}
            disabled={disabled}
            className={cn(
              'focus-visible:ring-2 focus-visible:ring-offset-2',
              isInteractive &&
                'cursor-pointer transition-transform duration-150 hover:scale-110',
              disabled && 'cursor-not-allowed opacity-50'
            )}
            style={{
              color: isFilled
                ? designTokens.colors.primary.DEFAULT
                : designTokens.colors.muted.foreground,
            }}
            aria-label={`Rate ${starIndex} out of 3 stars`}
            aria-pressed={isInteractive ? starIndex === value : undefined}
            role={isInteractive ? 'radio' : undefined}
            aria-checked={isInteractive ? starIndex === value : undefined}
          >
            <Star
              size={iconSize}
              fill={isFilled ? 'currentColor' : 'none'}
              strokeWidth={2}
            />
          </button>
        )
      })}
    </div>
  )
})
