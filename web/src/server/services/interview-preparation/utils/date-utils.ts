/**
 * Date Utilities for Interview Preparation Domain
 *
 * Pure functions for date parsing and calculation.
 * Used by resume-parsing.service.ts and experience-scoring.ts
 */

import { differenceInMonths } from 'date-fns'
import type { CareerExperienceV2 } from '@/server/services/ai/contracts/schemas/common'

/**
 * 날짜 문자열을 Date 객체로 파싱
 *
 * @param dateStr - YYYY-MM 또는 YYYY.MM 형식의 날짜 문자열
 * @returns Date 객체 또는 null
 */
export function parseDateString(dateStr: string | null): Date | null {
  if (!dateStr) return null

  const match = dateStr.match(/^(\d{4})[-.](\d{1,2})$/)
  if (!match) return null

  const year = parseInt(match[1], 10)
  const month = parseInt(match[2], 10) - 1

  if (month < 0 || month > 11) return null

  return new Date(year, month, 1)
}

/**
 * 겹치는 기간을 병합 (Interval Merging)
 *
 * @param intervals - 시작일, 종료일 튜플 배열
 * @returns 병합된 기간 배열
 */
export function mergeIntervals(intervals: [Date, Date][]): [Date, Date][] {
  if (intervals.length === 0) return []

  const sorted = [...intervals].sort((a, b) => a[0].getTime() - b[0].getTime())
  const merged: [Date, Date][] = [sorted[0]]

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i]
    const last = merged[merged.length - 1]

    if (current[0].getTime() <= last[1].getTime()) {
      last[1] = new Date(Math.max(last[1].getTime(), current[1].getTime()))
    } else {
      merged.push(current)
    }
  }

  return merged
}

/**
 * 총 경력 연수 계산 (중복 기간 제거)
 *
 * @param careers - CareerExperienceV2 배열 (AI 서버 응답 형식)
 * @returns 총 경력 연수 또는 null
 */
export function calculateTotalYearsOfExperience(
  careers: CareerExperienceV2[]
): number | null {
  const intervals: [Date, Date][] = []
  const now = new Date()

  for (const career of careers) {
    const startDate = parseDateString(career.duration?.startDate ?? null)
    if (!startDate) continue

    let endDate: Date
    if (career.duration?.isCurrent) {
      endDate = now
    } else {
      const parsed = parseDateString(career.duration?.endDate ?? null)
      if (!parsed) continue
      endDate = parsed
    }

    if (startDate.getTime() > endDate.getTime()) continue
    intervals.push([startDate, endDate])
  }

  if (intervals.length === 0) return null

  const merged = mergeIntervals(intervals)

  let totalMonths = 0
  for (const [start, end] of merged) {
    const months =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth())
    totalMonths += months
  }

  return Math.round(totalMonths / 12)
}

/**
 * 최신성 점수 계산을 위한 개월 수 계산
 *
 * @param endDate - 종료일 문자열 (YYYY-MM)
 * @param isCurrent - 현재 진행 중 여부
 * @param referenceDate - 기준일
 * @returns 기준일로부터 몇 개월 전인지 (isCurrent면 -1 반환)
 */
export function calculateMonthsAgo(
  endDate: string | null,
  isCurrent: boolean,
  referenceDate: Date
): number {
  if (isCurrent) return -1 // 현재 진행 중 표시

  if (!endDate) return Infinity // endDate 없으면 가장 오래됨

  const end = parseDateString(endDate)
  if (!end) return Infinity

  return differenceInMonths(referenceDate, end)
}
