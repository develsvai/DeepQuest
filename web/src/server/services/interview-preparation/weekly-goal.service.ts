/**
 * Weekly Goal Service
 *
 * Service for weekly goal tracking and statistics.
 * Aggregates completed questions by submittedAt date.
 */

import {
  startOfWeek,
  endOfWeek,
  parseISO,
  format,
  eachDayOfInterval,
} from 'date-fns'
import { AnswerStatus } from '@/generated/prisma/enums'
import { prisma } from '@/lib/db/prisma'
import type { DailyCompletedCount, WeeklyGoalServiceResult } from './types'

/**
 * Get weekly completed question counts for an interview preparation
 *
 * Aggregates completed questions (Answer.status = EVALUATED) by submittedAt date.
 * Returns counts for each day of the week (Monday to Sunday).
 *
 * Data path:
 * InterviewPreparation → Career/Project → KeyAchievement → Question → Answer
 *
 * @param preparationId - Interview preparation ID
 * @param weekStartDate - Monday of the target week in YYYY-MM-DD format (optional, defaults to current week's Monday)
 * @returns Daily completed counts for the week
 */
async function getWeeklyGoalData(
  preparationId: string,
  weekStartDate?: string
): Promise<WeeklyGoalServiceResult> {
  // 1. Calculate week boundaries (Monday 00:00:00 to Sunday 23:59:59)
  const monday = weekStartDate
    ? startOfWeek(parseISO(weekStartDate), { weekStartsOn: 1 })
    : startOfWeek(new Date(), { weekStartsOn: 1 })
  const sunday = endOfWeek(monday, { weekStartsOn: 1 })

  // 2. Query completed answers within the date range
  // Filter by preparation through the relation chain
  const completedAnswers = await prisma.answer.findMany({
    where: {
      status: AnswerStatus.EVALUATED,
      submittedAt: {
        gte: monday,
        lte: sunday,
      },
      question: {
        keyAchievement: {
          OR: [
            { careerExperience: { interviewPreparationId: preparationId } },
            { projectExperience: { interviewPreparationId: preparationId } },
          ],
        },
      },
    },
    select: {
      submittedAt: true,
    },
  })

  // 3. Group by date and count
  const countByDate = new Map<string, number>()
  for (const answer of completedAnswers) {
    if (answer.submittedAt) {
      const dateKey = format(answer.submittedAt, 'yyyy-MM-dd')
      countByDate.set(dateKey, (countByDate.get(dateKey) ?? 0) + 1)
    }
  }

  // 4. Build result array for 7 days (Monday to Sunday)
  const days: DailyCompletedCount[] = eachDayOfInterval({
    start: monday,
    end: sunday,
  }).map(date => ({
    date: format(date, 'yyyy-MM-dd'),
    completedGoals: countByDate.get(format(date, 'yyyy-MM-dd')) ?? 0,
  }))

  return {
    days,
    weekStartDate: format(monday, 'yyyy-MM-dd'),
  }
}

export const weeklyGoalService = {
  getWeeklyGoalData,
}
