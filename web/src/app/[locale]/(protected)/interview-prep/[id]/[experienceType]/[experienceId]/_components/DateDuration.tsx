/**
 * DateDuration Component
 *
 * Reusable component for displaying date range and duration
 */

import React from 'react'
import { useTranslations } from 'next-intl'
import { Calendar } from 'lucide-react'
import { designTokens } from '@/components/design-system/core'
import { useClientFormattedDateRangeWithIntl } from '@/hooks/use-client-date'

interface DateDurationProps {
  startDate: string
  endDate: string
}

/**
 * Calculate duration between dates using translations
 */
function calculateDuration(
  startDate: string,
  endDate: string,
  t: ReturnType<typeof useTranslations>
): string {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffInMonths =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth())

  const years = Math.floor(diffInMonths / 12)
  const months = diffInMonths % 12

  if (years === 0) {
    return t('experience.duration.monthsOnly', { months })
  }
  if (months === 0) {
    return t('experience.duration.yearsOnly', { years })
  }
  return t('experience.duration.yearsMonths', { years, months })
}

export function DateDuration({ startDate, endDate }: DateDurationProps) {
  const t = useTranslations('interview-prep.practice')

  // Format date range using client-safe hook with automatic next-intl locale (prevents hydration mismatch)
  const dateRange = useClientFormattedDateRangeWithIntl(startDate, endDate, {
    year: 'numeric',
    month: 'short',
  })

  const duration = calculateDuration(startDate, endDate, t)

  return (
    <div className='flex items-center space-x-2 text-sm'>
      <Calendar
        className='h-4 w-4'
        style={{ color: designTokens.colors.muted.foreground }}
      />
      <span style={{ color: designTokens.colors.muted.foreground }}>
        {dateRange} ({duration})
      </span>
    </div>
  )
}
