/**
 * Experience Scoring Utilities
 *
 * Pure functions for calculating experience selection scores.
 * Used by question-gen.service.ts for auto question generation.
 *
 * Scoring formula: 최신성(40%) + 기간(25%) + keyAchievements 개수(35%) = 100%
 */

import { differenceInMonths } from 'date-fns'
import { parseDateString } from './date-utils'
import type { ExperienceScoringData, ExperienceScoreResult } from '../types'

// ============================================================================
// Constants
// ============================================================================

/**
 * 자동 질문 생성 대상 경험 선택 가중치
 *
 * 최신성(40%) + 기간(25%) + keyAchievements 개수(35%) = 100%
 */
export const EXPERIENCE_SELECTION_WEIGHTS = {
  RECENCY: 0.4, // 최신성 40%
  DURATION: 0.25, // 기간 25%
  ACHIEVEMENTS: 0.35, // 성과 개수 35%
} as const

/**
 * 점수 정규화 기준값
 */
export const SCORE_NORMALIZATION = {
  /** 최신성: 60개월(5년) 이상 전이면 0점 */
  MAX_MONTHS_FOR_RECENCY: 60,
  /** 기간: 60개월(5년) 이상이면 만점 */
  MAX_MONTHS_FOR_DURATION: 60,
} as const

// ============================================================================
// Score Calculation Functions
// ============================================================================

/**
 * 최신성 점수 계산 (0-100)
 *
 * - isCurrent=true: 100점 (현재 진행 중)
 * - endDate가 현재에 가까울수록 높은 점수
 * - 60개월(5년) 이상 전이면 0점
 *
 * @param endDate - 종료일 (YYYY-MM 형식)
 * @param isCurrent - 현재 진행 중 여부
 * @param referenceDate - 기준일 (보통 현재 날짜)
 */
export function calculateRecencyScore(
  endDate: string | null,
  isCurrent: boolean,
  referenceDate: Date
): number {
  // 현재 진행 중이면 최고점
  if (isCurrent) return 100

  // endDate가 없으면 최저점
  if (!endDate) return 0

  const end = parseDateString(endDate)
  if (!end) return 0

  // 현재로부터 몇 개월 전인지 계산
  const monthsAgo = differenceInMonths(referenceDate, end)

  // 음수(미래)인 경우 최고점 처리
  if (monthsAgo < 0) return 100

  // 5년 이상 전이면 0점
  const { MAX_MONTHS_FOR_RECENCY } = SCORE_NORMALIZATION
  if (monthsAgo >= MAX_MONTHS_FOR_RECENCY) return 0

  // 선형 정규화: 최근일수록 100점에 가까움
  return Math.round(
    ((MAX_MONTHS_FOR_RECENCY - monthsAgo) / MAX_MONTHS_FOR_RECENCY) * 100
  )
}

/**
 * 기간 점수 계산 (0-100)
 *
 * - startDate ~ endDate 기간이 길수록 높은 점수
 * - isCurrent=true면 현재 날짜까지 계산
 * - 60개월(5년) 이상이면 만점
 *
 * @param startDate - 시작일 (YYYY-MM 형식)
 * @param endDate - 종료일 (YYYY-MM 형식)
 * @param isCurrent - 현재 진행 중 여부
 * @param referenceDate - 기준일 (보통 현재 날짜)
 */
export function calculateDurationScore(
  startDate: string | null,
  endDate: string | null,
  isCurrent: boolean,
  referenceDate: Date
): number {
  // startDate가 없으면 0점
  if (!startDate) return 0

  const start = parseDateString(startDate)
  if (!start) return 0

  // endDate 결정: isCurrent면 현재 날짜, 아니면 endDate 파싱
  const end = isCurrent ? referenceDate : parseDateString(endDate)
  if (!end) return 0

  // 기간 계산 (개월 수)
  const months = differenceInMonths(end, start)
  if (months <= 0) return 0

  // 5년 이상이면 만점
  const { MAX_MONTHS_FOR_DURATION } = SCORE_NORMALIZATION
  if (months >= MAX_MONTHS_FOR_DURATION) return 100

  // 선형 정규화
  return Math.round((months / MAX_MONTHS_FOR_DURATION) * 100)
}

/**
 * 성과 개수 점수 계산 (0-100)
 *
 * - 상대 정규화: (개수 / 최대개수) * 100
 * - 0개면 0점 (사전 필터링 대상)
 *
 * @param count - 해당 경험의 keyAchievements 개수
 * @param maxCount - 전체 경험 중 최대 keyAchievements 개수
 */
export function calculateAchievementScore(
  count: number,
  maxCount: number
): number {
  if (count === 0 || maxCount === 0) return 0
  return Math.round((count / maxCount) * 100)
}

/**
 * 경험 선택 점수 계산 (통합)
 *
 * 최신성(40%) + 기간(25%) + keyAchievements(35%) 가중 합산
 *
 * @param experience - 점수 계산 대상 경험 데이터
 * @param referenceDate - 기준일
 * @param maxAchievementCount - 전체 경험 중 최대 keyAchievements 개수
 */
export function calculateExperienceScore(
  experience: ExperienceScoringData,
  referenceDate: Date,
  maxAchievementCount: number
): ExperienceScoreResult {
  const recencyScore = calculateRecencyScore(
    experience.endDate,
    experience.isCurrent,
    referenceDate
  )

  const durationScore = calculateDurationScore(
    experience.startDate,
    experience.endDate,
    experience.isCurrent,
    referenceDate
  )

  const achievementScore = calculateAchievementScore(
    experience.keyAchievementIds.length,
    maxAchievementCount
  )

  // 가중 합산
  const totalScore =
    recencyScore * EXPERIENCE_SELECTION_WEIGHTS.RECENCY +
    durationScore * EXPERIENCE_SELECTION_WEIGHTS.DURATION +
    achievementScore * EXPERIENCE_SELECTION_WEIGHTS.ACHIEVEMENTS

  return {
    totalScore: Math.round(totalScore * 100) / 100, // 소수점 2자리
    breakdown: {
      recencyScore,
      durationScore,
      achievementScore,
    },
  }
}
