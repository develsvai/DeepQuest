'use client'

/**
 * Weekly Goal Widget Component
 *
 * 통합된 주간 목표 위젯:
 * - 3개의 동심원으로 일일 목표 진행률 표시
 * - 주차 네비게이션 (좌우 화살표 + 캘린더 드롭다운)
 * - 요일 라벨이 동심원 위에 표시
 */

import { useState, useMemo, useCallback } from 'react'
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  getWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  isBefore,
  addWeeks,
  subWeeks,
} from 'date-fns'
import { ko, enUS, type Locale } from 'date-fns/locale'
import { useTranslations, useLocale } from 'next-intl'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { api } from '@/trpc/react'

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

interface DailyGoalProgress {
  date: Date
  dayLabel: string // "월", "화", ...
  completedGoals: number // 0-3
  isToday: boolean
  isFuture: boolean
}

interface WeeklyGoalData {
  weekLabel: string // "26년 1월 2주차"
  days: DailyGoalProgress[]
  baseDate: Date
}

interface WeeklyGoalWidgetProps {
  interviewPreparationId: string
  className?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TranslateFunction = any

// ═══════════════════════════════════════════════════════════════════════════
// Utilities
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate week number within month (1-5)
 */
function getWeekOfMonth(date: Date): number {
  const firstDayOfMonth = startOfMonth(date)
  const weekOfYear = getWeek(date, { weekStartsOn: 1 })
  const weekOfFirstDay = getWeek(firstDayOfMonth, { weekStartsOn: 1 })
  return Math.max(1, weekOfYear - weekOfFirstDay + 1)
}

/**
 * Generate week label using translation function
 */
function getWeekLabel(date: Date, t: TranslateFunction): string {
  const year = date.getFullYear() % 100
  const month = date.getMonth() + 1
  const weekOfMonth = getWeekOfMonth(date)
  return t('weekLabel', { year, month, week: weekOfMonth })
}

/**
 * Transform API data to UI display format
 */
function transformToWeeklyGoalData(
  baseDate: Date,
  apiDays: Array<{ date: string; completedGoals: number }>,
  t: TranslateFunction,
  dateFnsLocale: Locale
): WeeklyGoalData {
  const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(baseDate, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })
  const today = new Date()

  // Create lookup map for API data
  const completedMap = new Map(apiDays.map(d => [d.date, d.completedGoals]))

  const dailyData: DailyGoalProgress[] = days.map(date => {
    const dateKey = format(date, 'yyyy-MM-dd')
    const isToday = isSameDay(date, today)
    const isFuture = !isToday && !isBefore(date, today)

    // Get completed count from API data, cap at 3 for UI display
    const rawCompleted = completedMap.get(dateKey) ?? 0
    const completedGoals = isFuture ? 0 : Math.min(rawCompleted, 3)

    return {
      date,
      dayLabel: format(date, 'EEEEE', { locale: dateFnsLocale }), // "월", "화", ... or "M", "T", ...
      completedGoals,
      isToday,
      isFuture,
    }
  })

  return {
    weekLabel: getWeekLabel(baseDate, t),
    days: dailyData,
    baseDate,
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ConcentricCircles Component
// ═══════════════════════════════════════════════════════════════════════════

interface ConcentricCirclesProps {
  completed: number
  isToday: boolean
  isFuture: boolean
}

/**
 * 3개의 동심원으로 일일 목표 진행률 표시
 * - 바깥→안쪽 순으로 채워짐
 * - 각 원 사이에 간격(bg-card)으로 구분
 */
function ConcentricCircles({ completed, isFuture }: ConcentricCirclesProps) {
  /**
   * Get circle style based on fill level
   * @param level - 1 (outer), 2 (middle), 3 (inner)
   */
  const getCircleStyle = (level: number) => {
    const isFilled = completed >= level

    if (isFilled) {
      return 'bg-primary'
    }
    if (isFuture) {
      return 'border border-dashed border-muted-foreground/30 bg-transparent'
    }
    return 'bg-muted'
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full',
        'size-10', // Outer circle (40px)
        getCircleStyle(1)
      )}
    >
      {/* Gap ring */}
      <div className='flex size-8 items-center justify-center rounded-full bg-card'>
        <div
          className={cn(
            'flex items-center justify-center rounded-full',
            'size-6', // Middle circle (24px)
            getCircleStyle(2)
          )}
        >
          {/* Gap ring */}
          <div className='flex size-4 items-center justify-center rounded-full bg-card'>
            <div
              className={cn(
                'rounded-full',
                'size-2.5', // Inner circle (10px)
                getCircleStyle(3)
              )}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// WeeklyGoalWidget
// ═══════════════════════════════════════════════════════════════════════════

export function WeeklyGoalWidget({
  interviewPreparationId,
  className,
}: WeeklyGoalWidgetProps) {
  const t = useTranslations('interview-prep.detail.v2.weeklyGoal')
  const locale = useLocale()
  const dateFnsLocale = locale === 'ko' ? ko : enUS

  const [baseDate, setBaseDate] = useState(() => new Date())
  const [calendarOpen, setCalendarOpen] = useState(false)

  // Calculate week start date for query
  const weekStartDate = useMemo(() => {
    const monday = startOfWeek(baseDate, { weekStartsOn: 1 })
    return format(monday, 'yyyy-MM-dd')
  }, [baseDate])

  // Fetch real data from API
  const { data } = api.interviewPreparation.getWeeklyGoalData.useQuery({
    interviewPreparationId,
    weekStartDate,
  })

  // Transform API data to UI format
  const weekData = useMemo(
    () =>
      transformToWeeklyGoalData(baseDate, data?.days ?? [], t, dateFnsLocale),
    [baseDate, data?.days, t, dateFnsLocale]
  )

  const handlePrevWeek = useCallback(() => {
    setBaseDate(prev => subWeeks(prev, 1))
  }, [])

  const handleNextWeek = useCallback(() => {
    setBaseDate(prev => addWeeks(prev, 1))
  }, [])

  const handleDateSelect = useCallback((date: Date | undefined) => {
    if (date) {
      setBaseDate(date)
      setCalendarOpen(false)
    }
  }, [])

  return (
    <Card
      className={cn('border-0 bg-card shadow-xl shadow-black/5', className)}
    >
      <CardContent className='p-4'>
        {/* Header */}
        <div className='mb-3 flex items-center gap-2'>
          <CalendarIcon className='size-4 text-muted-foreground' />
          <span className='text-xs font-semibold tracking-wide text-muted-foreground'>
            WEEKLY STREAK
          </span>
        </div>

        {/* Week Navigation */}
        <div className='mb-4 flex items-center justify-center gap-3'>
          <button
            type='button'
            onClick={handlePrevWeek}
            className='flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
            aria-label={t('prevWeek')}
          >
            <ChevronLeft className='size-4' />
          </button>

          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <button
                type='button'
                className='flex items-center gap-1 text-sm font-medium text-foreground transition-colors hover:text-primary'
              >
                {weekData.weekLabel}
                <ChevronDown className='size-4' />
              </button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0' align='center'>
              <Calendar
                mode='single'
                selected={baseDate}
                onSelect={handleDateSelect}
                locale={dateFnsLocale}
              />
            </PopoverContent>
          </Popover>

          <button
            type='button'
            onClick={handleNextWeek}
            className='flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
            aria-label={t('nextWeek')}
          >
            <ChevronRight className='size-4' />
          </button>
        </div>

        {/* Days Grid */}
        <div className='flex items-center justify-between'>
          {weekData.days.map((day, index) => (
            <div key={index} className='flex flex-col items-center gap-2'>
              {/* Day Label (위) */}
              <span
                className={cn(
                  'text-[10px] font-medium',
                  day.isToday
                    ? 'text-primary'
                    : day.isFuture
                      ? 'text-muted-foreground/50'
                      : 'text-muted-foreground'
                )}
              >
                {day.dayLabel}
              </span>

              {/* Concentric Circles */}
              <div
                className={cn('rounded-lg p-1', day.isToday && 'bg-primary/10')}
              >
                <ConcentricCircles
                  completed={day.completedGoals}
                  isToday={day.isToday}
                  isFuture={day.isFuture}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
