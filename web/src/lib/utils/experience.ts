/**
 * Utility functions for experience data processing
 */

import { designTokens } from '@/components/design-system/core'

/**
 * Calculates duration between two dates in human-readable format
 */
export function calculateDuration(
  startDate: string,
  endDate: string,
  t: (key: string) => string
): string {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffInMonths =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth())

  const years = Math.floor(diffInMonths / 12)
  const months = diffInMonths % 12

  if (years === 0) return `${months}${t('duration.months')}`
  if (months === 0) return `${years}${t('duration.years')}`
  return `${years}${t('duration.years')} ${months}${t('duration.months')}`
}

/**
 * Gets progress color based on completion percentage
 */
export function getProgressColor(progress: number): string {
  if (progress >= 80) return designTokens.colors.primary.DEFAULT
  if (progress >= 50) return designTokens.colors.chart[2]
  return designTokens.colors.muted.foreground
}
