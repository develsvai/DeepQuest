/**
 * Reusable Rating Badge Component
 *
 * Displays feedback ratings with consistent styling and color mapping
 * based on the design token system
 */

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { designTokens } from '@/components/design-system/core'
import type { Rating } from '@/generated/prisma/browser'

interface RatingBadgeProps {
  rating: Rating
  label: string
  variant?: 'default' | 'outline'
}

export default function RatingBadge({
  rating,
  label,
  variant = 'default',
}: RatingBadgeProps) {
  const getRatingColors = (rating: Rating) => {
    switch (rating) {
      case 'DEEP':
        return {
          bg: designTokens.colors.rating.deep.DEFAULT,
          text: designTokens.colors.rating.deep.foreground,
        }
      case 'INTERMEDIATE':
        return {
          bg: designTokens.colors.rating.intermediate.DEFAULT,
          text: designTokens.colors.rating.intermediate.foreground,
        }
      case 'SURFACE':
        return {
          bg: designTokens.colors.rating.surface.DEFAULT,
          text: designTokens.colors.rating.surface.foreground,
        }
      default:
        return {
          bg: designTokens.colors.muted.DEFAULT,
          text: designTokens.colors.muted.foreground,
        }
    }
  }

  const colors = getRatingColors(rating)

  if (variant === 'outline') {
    return (
      <Badge
        variant='outline'
        style={{
          borderColor: colors.bg,
          color: colors.bg,
        }}
      >
        {label}
      </Badge>
    )
  }

  return (
    <Badge
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
      }}
    >
      {label}
    </Badge>
  )
}

/**
 * Status Badge Component
 *
 * For displaying various status states with appropriate colors
 */
type StatusType =
  | 'success'
  | 'warning'
  | 'info'
  | 'error'
  | 'processing'
  | 'ready'
  | 'failed'

interface StatusBadgeProps {
  status: StatusType
  label: string
  variant?: 'default' | 'outline'
}

export function StatusBadge({
  status,
  label,
  variant = 'default',
}: StatusBadgeProps) {
  const getStatusColor = (status: StatusType) => {
    return (
      designTokens.colors.status[status] || designTokens.colors.muted.DEFAULT
    )
  }

  const color = getStatusColor(status)

  if (variant === 'outline') {
    return (
      <Badge
        variant='outline'
        style={{
          borderColor: color,
          color: color,
        }}
      >
        {label}
      </Badge>
    )
  }

  return (
    <Badge
      style={{
        backgroundColor: color,
        color: designTokens.colors.foreground,
      }}
    >
      {label}
    </Badge>
  )
}
