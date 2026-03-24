'use client'

/**
 * HeaderSection Component
 *
 * Displays date and motivational headline for Interview Prep V2.
 * - Date: Localized format (Korean: "1월 8일 목요일", English: "January 8, Friday")
 * - Title: Daily rotating motivational messages with "깊이 있는 개발자/Deep Developer" highlighted
 */

import { getDayOfYear } from 'date-fns'
import { useFormatter, useTranslations } from 'next-intl'

/** Number of headline variations */
const HEADLINE_COUNT = 3

interface HeaderSectionProps {
  /** Optional custom date (defaults to today) */
  date?: Date
}

export function HeaderSection({ date = new Date() }: HeaderSectionProps) {
  const t = useTranslations('interview-prep.header')
  const format = useFormatter()

  const formattedDate = format.dateTime(date, {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  const headlineIndex = (getDayOfYear(date) % HEADLINE_COUNT) as 0 | 1 | 2
  const highlight = t('highlight')
  const line1 = t(`headlines.${headlineIndex}.line1` as const)
  const line2 = t(`headlines.${headlineIndex}.line2` as const)

  // Split line1 around the highlight text for styling
  const highlightIndex = line1.indexOf(highlight)
  const hasHighlight = highlightIndex !== -1

  return (
    <header className='mb-6'>
      <p className='mb-1 text-sm text-muted-foreground'>{formattedDate}</p>
      <h1 className='text-5xl leading-tight font-bold text-foreground'>
        {hasHighlight ? (
          <>
            {line1.slice(0, highlightIndex)}
            <span className='text-primary'>{highlight}</span>
            {line1.slice(highlightIndex + highlight.length)}
          </>
        ) : (
          line1
        )}
        <br />
        {line2}
      </h1>
    </header>
  )
}
