'use client'

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
import { ko } from 'date-fns/locale'
import { TrendingUp, Flame, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

interface PreparationStats {
  completedQuestions: number
  totalQuestions: number
}

interface WeeklyStreakDay {
  day: string // 월, 화, 수, ...
  shortDay: string // M, T, W, ...
  date: Date
  hasActivity: boolean
  isToday: boolean
  isFuture: boolean
}

interface WeeklyStreakData {
  currentStreak: number
  weekDays: WeeklyStreakDay[]
  weekLabel: string
  baseDate: Date
}

interface ProgressStatsSectionProps {
  title?: string
  preparationStats: PreparationStats
  weeklyStreak: WeeklyStreakData
}

// ═══════════════════════════════════════════════════════════════════════════
// Date Utilities (date-fns based)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate week number within the month (1-5)
 * Uses Monday as start of week (weekStartsOn: 1)
 */
function getWeekOfMonth(date: Date): number {
  const firstDayOfMonth = startOfMonth(date)
  const weekOfYear = getWeek(date, { weekStartsOn: 1 })
  const weekOfFirstDay = getWeek(firstDayOfMonth, { weekStartsOn: 1 })
  return Math.max(1, weekOfYear - weekOfFirstDay + 1)
}

/**
 * Generate week label (예: "26년 1월 2주차")
 */
function getWeekLabel(date: Date): string {
  const year = date.getFullYear() % 100
  const month = date.getMonth() + 1
  const weekOfMonth = getWeekOfMonth(date)
  return `${year}년 ${month}월 ${weekOfMonth}주차`
}

/**
 * Generate weekly streak data for a specific date
 * Week starts on Monday (weekStartsOn: 1)
 */
export function generateWeeklyStreakForDate(
  baseDate: Date,
  activityDates?: Date[]
): WeeklyStreakData {
  const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(baseDate, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })
  const today = new Date()

  const weekDays: WeeklyStreakDay[] = days.map(date => {
    const dayOfWeek = date.getDay()
    const mondayBasedIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1

    // Activity logic: check against activityDates if provided, otherwise use mock pattern
    let hasActivity: boolean
    if (activityDates) {
      hasActivity = activityDates.some(actDate => isSameDay(actDate, date))
    } else {
      // Mock: active on Mon-Thu if date is today or before
      hasActivity =
        (isBefore(date, today) || isSameDay(date, today)) &&
        mondayBasedIndex >= 0 &&
        mondayBasedIndex <= 3
    }

    const isToday = isSameDay(date, today)
    const isFuture = !isToday && !isBefore(date, today)

    return {
      day: format(date, 'EEE', { locale: ko }), // "월", "화", ...
      shortDay: format(date, 'EEEEE', { locale: ko }), // "월", "화", ...
      date,
      hasActivity,
      isToday,
      isFuture,
    }
  })

  // Count streak (consecutive days with activity up to today)
  const currentStreak = weekDays.filter(
    d => d.hasActivity && !d.isFuture
  ).length

  return {
    currentStreak,
    weekDays,
    weekLabel: getWeekLabel(baseDate),
    baseDate,
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Components
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 면접 준비 완성도 카드
 */
function PreparationCompletionCard({ stats }: { stats: PreparationStats }) {
  const { completedQuestions, totalQuestions } = stats
  const percentage =
    totalQuestions > 0
      ? Math.round((completedQuestions / totalQuestions) * 100)
      : 0
  const remaining = totalQuestions - completedQuestions

  return (
    <Card className='flex-1 border-0 bg-card shadow-xl shadow-black/5'>
      <CardHeader className='pb-2'>
        <CardTitle className='text-sm font-medium text-muted-foreground'>
          면접 준비 완성도
        </CardTitle>
        <CardAction>
          <div className='flex size-8 items-center justify-center rounded-lg bg-feedback-suggestions/10'>
            <TrendingUp className='size-4 text-feedback-suggestions' />
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className='space-y-3'>
        <div className='flex items-baseline gap-2'>
          <span className='text-3xl font-bold text-foreground'>
            {percentage}%
          </span>
          <span className='text-sm text-muted-foreground'>
            ({completedQuestions}/{totalQuestions} 문제)
          </span>
        </div>
        <Progress
          value={percentage}
          className='h-2 bg-feedback-suggestions/20 [&>[data-slot=progress-indicator]]:bg-feedback-suggestions'
        />
        <p className='text-sm text-muted-foreground'>
          목표까지 {remaining}문제 남았어요
        </p>
      </CardContent>
    </Card>
  )
}

/**
 * Weekly Streak 카드 (with week navigation)
 */
function WeeklyStreakCard({
  data,
  onWeekChange,
}: {
  data: WeeklyStreakData
  onWeekChange?: (newDate: Date) => void
}) {
  const { currentStreak, weekDays, weekLabel, baseDate } = data

  const handlePrevWeek = useCallback(() => {
    onWeekChange?.(subWeeks(baseDate, 1))
  }, [baseDate, onWeekChange])

  const handleNextWeek = useCallback(() => {
    onWeekChange?.(addWeeks(baseDate, 1))
  }, [baseDate, onWeekChange])

  return (
    <Card className='flex-1 border-0 bg-card shadow-xl shadow-black/5'>
      <CardContent className='p-5'>
        {/* 주차 네비게이션 */}
        <div className='mb-4 flex items-center justify-center gap-4'>
          <button
            type='button'
            onClick={handlePrevWeek}
            className='flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
            aria-label='이전 주'
          >
            <ChevronLeft className='size-5' />
          </button>
          <span className='min-w-[120px] text-center text-sm font-medium text-foreground'>
            {weekLabel}
          </span>
          <button
            type='button'
            onClick={handleNextWeek}
            className='flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
            aria-label='다음 주'
          >
            <ChevronRight className='size-5' />
          </button>
        </div>

        {/* 메인 컨텐츠: Flame Badge + 캘린더 */}
        <div className='flex items-center gap-6'>
          {/* 왼쪽: Flame Badge */}
          <div className='flex flex-col items-center gap-1'>
            <div
              className={cn(
                'flex size-12 items-center justify-center rounded-xl transition-all',
                currentStreak > 0 ? 'bg-primary' : 'bg-muted'
              )}
            >
              <Flame
                className={cn(
                  'size-6',
                  currentStreak > 0
                    ? 'text-primary-foreground'
                    : 'text-muted-foreground'
                )}
                fill={currentStreak > 0 ? 'currentColor' : 'none'}
              />
            </div>
            <div className='text-center'>
              <span className='text-lg font-bold text-primary'>
                {currentStreak}일
              </span>
              <p className='text-xs text-muted-foreground'>연속 학습</p>
            </div>
          </div>

          {/* 구분선 */}
          <div className='h-16 w-px bg-border' />

          {/* 오른쪽: 요일별 캘린더 */}
          <div className='flex flex-1 items-center justify-between'>
            {weekDays.map((day, index) => (
              <div
                key={index}
                className={cn(
                  'relative flex flex-col items-center gap-2 rounded-lg px-2 py-1',
                  day.isToday && 'bg-primary/10'
                )}
              >
                <span
                  className={cn(
                    'text-xs font-medium',
                    day.isToday
                      ? 'text-primary'
                      : day.isFuture
                        ? 'text-muted-foreground/40'
                        : 'text-muted-foreground'
                  )}
                >
                  {day.day}
                </span>
                <div
                  className={cn(
                    'flex size-9 items-center justify-center rounded-full transition-all',
                    day.hasActivity
                      ? 'bg-primary'
                      : day.isFuture
                        ? 'border-2 border-dashed border-muted-foreground/20'
                        : 'bg-muted/50'
                  )}
                >
                  {day.hasActivity && (
                    <Flame
                      className='size-4 text-primary-foreground'
                      fill='currentColor'
                    />
                  )}
                </div>
                {day.isToday && (
                  <span className='absolute -bottom-3 text-[10px] font-medium text-primary'>
                    오늘
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Progress Stats Section (Stateful version with week navigation)
 */
export function ProgressStatsSection({
  title = '학습 현황',
  preparationStats,
  weeklyStreak: initialWeeklyStreak,
}: ProgressStatsSectionProps) {
  const [weeklyStreak, setWeeklyStreak] =
    useState<WeeklyStreakData>(initialWeeklyStreak)

  const handleWeekChange = useCallback((newDate: Date) => {
    setWeeklyStreak(generateWeeklyStreakForDate(newDate))
  }, [])

  return (
    <section className='space-y-4'>
      <h2 className='text-lg font-semibold text-foreground'>{title}</h2>
      <div className='flex gap-4'>
        <PreparationCompletionCard stats={preparationStats} />
        <WeeklyStreakCard data={weeklyStreak} onWeekChange={handleWeekChange} />
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Mock data for development/preview
// ═══════════════════════════════════════════════════════════════════════════

export const mockProgressStats: PreparationStats = {
  completedQuestions: 15,
  totalQuestions: 24,
}

export const mockWeeklyStreak: WeeklyStreakData = generateWeeklyStreakForDate(
  new Date()
)
