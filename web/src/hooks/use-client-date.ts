'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLocale } from 'next-intl'

/**
 * Converts next-intl locale to Intl.DateTimeFormat locale
 *
 * @param nextIntlLocale - next-intl locale (Locale from @/lib/schemas/locale.schema)
 * @returns Intl.DateTimeFormat compatible locale ('ko-KR' | 'en-US')
 */
function convertNextIntlLocale(nextIntlLocale: string): string {
  switch (nextIntlLocale) {
    case 'ko':
      return 'ko-KR'
    case 'en':
      return 'en-US'
    default:
      return nextIntlLocale // Return as-is if unknown
  }
}

/**
 * Options for formatting dates
 */
interface DateFormatOptions {
  /** Locale for formatting (e.g., 'ko-KR', 'en-US') */
  locale?: string
  /** Intl.DateTimeFormat options */
  options?: Intl.DateTimeFormatOptions
}

/**
 * Client-safe date formatting hook that prevents hydration mismatch
 *
 * This hook ensures that dates are only formatted on the client side,
 * preventing SSR/CSR mismatches due to timezone differences.
 *
 * The hook returns an empty string during SSR and formats the date
 * after the component mounts on the client using the browser's timezone.
 *
 * @param dateString - ISO date string to format
 * @param formatOptions - Formatting options (locale and Intl.DateTimeFormat options)
 * @returns Formatted date string (empty during SSR, formatted after mount)
 *
 * @example
 * ```tsx
 * function MyComponent({ createdAt }: { createdAt: string }) {
 *   const formattedDate = useClientFormattedDate(createdAt, {
 *     locale: 'ko-KR',
 *     options: {
 *       month: 'short',
 *       day: 'numeric',
 *       hour: '2-digit',
 *       minute: '2-digit',
 *     }
 *   })
 *
 *   return <span>{formattedDate}</span> // Empty during SSR, formatted after mount
 * }
 * ```
 */
export function useClientFormattedDate(
  dateString: string | undefined | null,
  formatOptions: DateFormatOptions = {}
): string {
  const { locale = 'ko-KR', options = {} } = formatOptions
  const [formattedDate, setFormattedDate] = useState<string>('')

  // Stabilize options object reference using value-based comparison
  // We use JSON.stringify for deep comparison since options is a new object on each render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableOptions = useMemo(() => options, [JSON.stringify(options)])

  useEffect(() => {
    if (!dateString) {
      setFormattedDate('')
      return
    }

    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      setFormattedDate(dateString)
      return
    }

    const formatted = new Intl.DateTimeFormat(locale, stableOptions).format(
      date
    )
    setFormattedDate(formatted)
  }, [dateString, locale, stableOptions])

  return formattedDate
}

/**
 * Client-safe date range formatting hook
 *
 * Formats a date range (startDate - endDate) using the browser's timezone.
 * Returns an empty string during SSR to prevent hydration mismatch.
 *
 * @param startDate - ISO start date string
 * @param endDate - ISO end date string
 * @param formatOptions - Formatting options (locale and Intl.DateTimeFormat options)
 * @returns Formatted date range string (e.g., "2024년 1월 - 2024년 12월")
 *
 * @example
 * ```tsx
 * function DateRangeDisplay({ start, end }: { start: string, end: string }) {
 *   const dateRange = useClientFormattedDateRange(start, end, {
 *     locale: 'ko-KR',
 *     options: { year: 'numeric', month: 'short' }
 *   })
 *
 *   return <span>{dateRange}</span>
 * }
 * ```
 */
export function useClientFormattedDateRange(
  startDate: string | undefined | null,
  endDate: string | undefined | null,
  formatOptions: DateFormatOptions = {}
): string {
  const { locale = 'ko-KR', options = {} } = formatOptions
  const [formattedRange, setFormattedRange] = useState<string>('')

  // Stabilize options object reference using value-based comparison
  // We use JSON.stringify for deep comparison since options is a new object on each render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableOptions = useMemo(() => options, [JSON.stringify(options)])

  useEffect(() => {
    if (!startDate || !endDate) {
      setFormattedRange('')
      return
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setFormattedRange(`${startDate} - ${endDate}`)
      return
    }

    // Format using browser's timezone
    const formatter = new Intl.DateTimeFormat(locale, stableOptions)
    const startFormatted = formatter.format(start)
    const endFormatted = formatter.format(end)

    setFormattedRange(`${startFormatted} - ${endFormatted}`)
  }, [startDate, endDate, locale, stableOptions])

  return formattedRange
}

/**
 * Client-safe date formatting hook with next-intl integration
 *
 * This hook automatically uses the locale from next-intl context and
 * prevents hydration mismatch by formatting dates only on the client side.
 *
 * @param dateString - ISO date string to format
 * @param options - Intl.DateTimeFormat options (locale is automatically set)
 * @returns Formatted date string (empty during SSR, formatted after mount)
 *
 * @example
 * ```tsx
 * function MyComponent({ createdAt }: { createdAt: string }) {
 *   const formattedDate = useClientFormattedDateWithIntl(createdAt, {
 *     month: 'short',
 *     day: 'numeric',
 *     hour: '2-digit',
 *     minute: '2-digit',
 *   })
 *
 *   return <span>{formattedDate}</span>
 * }
 * ```
 */
export function useClientFormattedDateWithIntl(
  dateString: string | undefined | null,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const nextIntlLocale = useLocale()
  const locale = convertNextIntlLocale(nextIntlLocale)

  return useClientFormattedDate(dateString, { locale, options })
}

/**
 * Client-safe date range formatting hook with next-intl integration
 *
 * This hook automatically uses the locale from next-intl context and
 * prevents hydration mismatch by formatting dates only on the client side.
 *
 * @param startDate - ISO start date string
 * @param endDate - ISO end date string
 * @param options - Intl.DateTimeFormat options (locale is automatically set)
 * @returns Formatted date range string (e.g., "2024년 1월 - 2024년 12월")
 *
 * @example
 * ```tsx
 * function DateRangeDisplay({ start, end }: { start: string, end: string }) {
 *   const dateRange = useClientFormattedDateRangeWithIntl(start, end, {
 *     year: 'numeric',
 *     month: 'short'
 *   })
 *
 *   return <span>{dateRange}</span>
 * }
 * ```
 */
export function useClientFormattedDateRangeWithIntl(
  startDate: string | undefined | null,
  endDate: string | undefined | null,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const nextIntlLocale = useLocale()
  const locale = convertNextIntlLocale(nextIntlLocale)

  return useClientFormattedDateRange(startDate, endDate, { locale, options })
}
