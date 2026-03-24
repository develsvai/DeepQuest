'use client'

import * as React from 'react'
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

interface MonthPickerProps {
  /** Selected value in YYYY-MM format (e.g., "2024-03") */
  value?: string
  /** Callback when month is selected, returns YYYY-MM format */
  onChange?: (value: string) => void
  /** Placeholder text when no value is selected */
  placeholder?: string
  /** Disable the picker */
  disabled?: boolean
  /** Additional class names for the trigger button */
  className?: string
  /** Minimum selectable date in YYYY-MM format */
  minDate?: string
  /** Maximum selectable date in YYYY-MM format */
  maxDate?: string
}

/**
 * MonthPicker component for selecting year and month
 * Returns date in YYYY-MM format
 */
function MonthPicker({
  value,
  onChange,
  placeholder = 'Select month',
  disabled = false,
  className,
  minDate,
  maxDate,
}: MonthPickerProps) {
  const [open, setOpen] = React.useState(false)

  // Parse current value or use current date as default view
  const parseValue = React.useCallback((val?: string) => {
    if (!val) return null
    const [year, month] = val.split('-').map(Number)
    if (isNaN(year) || isNaN(month)) return null
    return { year, month }
  }, [])

  const parsed = parseValue(value)
  const [viewYear, setViewYear] = React.useState(
    parsed?.year ?? new Date().getFullYear()
  )

  // Reset view year when value changes
  React.useEffect(() => {
    if (parsed?.year) {
      setViewYear(parsed.year)
    }
  }, [parsed?.year])

  const handleSelect = (month: number) => {
    const formattedMonth = String(month).padStart(2, '0')
    onChange?.(`${viewYear}-${formattedMonth}`)
    setOpen(false)
  }

  const formatDisplay = (val?: string) => {
    if (!val) return null
    const parsedVal = parseValue(val)
    if (!parsedVal) return val
    return `${parsedVal.year}.${String(parsedVal.month).padStart(2, '0')}`
  }

  const isMonthDisabled = (month: number) => {
    const currentDate = `${viewYear}-${String(month).padStart(2, '0')}`

    if (minDate && currentDate < minDate) return true
    if (maxDate && currentDate > maxDate) return true

    return false
  }

  const canGoPrevYear = React.useMemo(() => {
    if (!minDate) return true
    const [minYear] = minDate.split('-').map(Number)
    return viewYear > minYear
  }, [minDate, viewYear])

  const canGoNextYear = React.useMemo(() => {
    if (!maxDate) return true
    const [maxYear] = maxDate.split('-').map(Number)
    return viewYear < maxYear
  }, [maxDate, viewYear])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className='mr-2 size-4' />
          {formatDisplay(value) ?? placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-64 p-3' align='start'>
        {/* Year Navigation */}
        <div className='mb-4 flex items-center justify-between'>
          <Button
            variant='ghost'
            size='icon'
            className='size-7'
            onClick={() => setViewYear(y => y - 1)}
            disabled={!canGoPrevYear}
          >
            <ChevronLeftIcon className='size-4' />
          </Button>
          <span className='text-sm font-medium'>{viewYear}</span>
          <Button
            variant='ghost'
            size='icon'
            className='size-7'
            onClick={() => setViewYear(y => y + 1)}
            disabled={!canGoNextYear}
          >
            <ChevronRightIcon className='size-4' />
          </Button>
        </div>

        {/* Month Grid */}
        <div className='grid grid-cols-3 gap-2'>
          {MONTHS.map((monthName, index) => {
            const monthNum = index + 1
            const isSelected =
              parsed?.year === viewYear && parsed?.month === monthNum
            const isDisabled = isMonthDisabled(monthNum)

            return (
              <Button
                key={monthName}
                variant={isSelected ? 'default' : 'ghost'}
                size='sm'
                className={cn(
                  'h-9',
                  isSelected && 'bg-primary text-primary-foreground'
                )}
                onClick={() => handleSelect(monthNum)}
                disabled={isDisabled}
              >
                {monthName}
              </Button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { MonthPicker }
export type { MonthPickerProps }
