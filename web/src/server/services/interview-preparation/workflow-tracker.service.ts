/**
 * Workflow Tracker Service
 *
 * Tracks the progress of Interview Preparation workflow stages.
 * Manages experience selection for auto-generation and task completion state.
 *
 * Responsibilities:
 * - selectBestExperienceForAutoQuestionGen: 최적 경험 선택 알고리즘
 * - initQuestionGenTasks: 작업 수 초기화
 * - incrementCompletedQuestionGenTask: 완료 작업 증가
 * - checkAndFinalizeQuestionGeneration: 완료 체크 및 READY 상태 전환
 *
 * ## 아키텍처 진화 방향 (CQRS 고려)
 *
 * 현재: 단일 서비스 파일 (옵션 A - 책임 기반 네이밍)
 * 향후: 복잡도 증가 시 commands/ 디렉토리로 분리 가능
 *
 * @example 향후 구조 (옵션 B - CQRS 패턴)
 * ```
 * interview-preparation/
 * ├── commands/
 * │   ├── track-workflow.ts     # 이 파일의 내용
 * │   └── ingest-resume.ts      # resume-ingestion의 내용
 * ├── queries/
 * │   ├── sidebar.ts
 * │   └── weekly-goal.ts
 * ```
 */

import { PreparationStatus } from '@/generated/prisma/enums'
import { prisma } from '@/lib/db/prisma'
import { getPostHogClient } from '@/lib/posthog-server'
import { POSTHOG_EVENTS, POSTHOG_PERSON_PROPERTIES } from '@/lib/posthog-events'
import { calculateExperienceScore } from './utils/experience-scoring'
import type { ExperienceScoringData } from './types'

// ============================================================================
// Experience Selection
// ============================================================================

/**
 * 자동 문제 생성을 위한 최적 경험 선택
 *
 * 점수 기반 선택: 최신성(40%) + 기간(25%) + keyAchievements 개수(35%)
 *
 * - 최신성: endDate가 최근일수록, isCurrent=true면 최고점
 * - 기간: startDate~endDate 기간이 길수록 높은 점수
 * - keyAchievements: 개수가 많을수록 높은 점수 (상대 정규화)
 *
 * keyAchievements가 0인 경험은 필터링됩니다.
 *
 * @param preparationId - Interview preparation ID
 * @returns 선택된 경험 정보 또는 null
 */
async function selectBestExperienceForAutoQuestionGen(
  preparationId: string
): Promise<{
  experienceType: 'CAREER' | 'PROJECT'
  experienceId: number
  keyAchievementIds: number[]
} | null> {
  const referenceDate = new Date()

  // Career experiences 조회 (날짜 필드 포함)
  const careers = await prisma.careerExperience.findMany({
    where: { interviewPreparationId: preparationId },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      isCurrent: true,
      keyAchievements: {
        select: { id: true },
      },
    },
  })

  // Project experiences 조회 (날짜 필드 포함)
  const projects = await prisma.projectExperience.findMany({
    where: { interviewPreparationId: preparationId },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      isCurrent: true,
      keyAchievements: {
        select: { id: true },
      },
    },
  })

  // 통합 및 keyAchievements > 0 필터링
  const allExperiences: ExperienceScoringData[] = [
    ...careers.map(c => ({
      experienceType: 'CAREER' as const,
      experienceId: c.id,
      keyAchievementIds: c.keyAchievements.map(ka => ka.id),
      startDate: c.startDate,
      endDate: c.endDate,
      isCurrent: c.isCurrent,
    })),
    ...projects.map(p => ({
      experienceType: 'PROJECT' as const,
      experienceId: p.id,
      keyAchievementIds: p.keyAchievements.map(ka => ka.id),
      startDate: p.startDate,
      endDate: p.endDate,
      isCurrent: p.isCurrent,
    })),
  ].filter(exp => exp.keyAchievementIds.length > 0)

  // 경험이 없거나 모두 keyAchievements가 0개면 null 반환
  if (allExperiences.length === 0) return null

  // 성과 개수 최대값 계산 (상대 정규화용)
  const maxAchievementCount = Math.max(
    ...allExperiences.map(exp => exp.keyAchievementIds.length)
  )

  // 점수 계산 및 정렬
  const scored = allExperiences.map(exp => ({
    experience: exp,
    score: calculateExperienceScore(exp, referenceDate, maxAchievementCount),
  }))

  // 내림차순 정렬 후 최고점 선택
  scored.sort((a, b) => b.score.totalScore - a.score.totalScore)
  const best = scored[0]

  return {
    experienceType: best.experience.experienceType,
    experienceId: best.experience.experienceId,
    keyAchievementIds: best.experience.keyAchievementIds,
  }
}

// ============================================================================
// Task State Management
// ============================================================================

/**
 * 문제 생성 작업 초기화
 *
 * 총 작업 수를 설정하고 완료된 작업 수를 0으로 초기화합니다.
 * 이 함수 호출 시 Supabase Realtime으로 클라이언트에 전파됩니다.
 *
 * @param preparationId - Interview preparation ID
 * @param totalTasks - 전체 문제 생성 작업 수
 */
async function initQuestionGenTasks(
  preparationId: string,
  totalTasks: number
): Promise<void> {
  await prisma.interviewPreparation.update({
    where: { id: preparationId },
    data: {
      totalQuestionGenTasks: totalTasks,
      completedQuestionGenTasks: 0,
    },
  })
}

/**
 * 완료된 문제 생성 작업 수 증가
 *
 * 원자적으로 completedQuestionGenTasks를 1 증가시킵니다.
 * 이 함수 호출 시 Supabase Realtime으로 클라이언트에 전파됩니다.
 *
 * @param preparationId - Interview preparation ID
 */
async function incrementCompletedQuestionGenTask(
  preparationId: string
): Promise<void> {
  await prisma.interviewPreparation.update({
    where: { id: preparationId },
    data: {
      completedQuestionGenTasks: {
        increment: 1,
      },
    },
  })
}

/**
 * 문제 생성 완료 체크 및 최종 상태 업데이트
 *
 * completedQuestionGenTasks === totalQuestionGenTasks인 경우
 * status를 READY로 변경합니다.
 *
 * @param preparationId - Interview preparation ID
 */
async function checkAndFinalizeQuestionGeneration(
  preparationId: string
): Promise<void> {
  const preparation = await prisma.interviewPreparation.findUnique({
    where: { id: preparationId },
    select: {
      totalQuestionGenTasks: true,
      completedQuestionGenTasks: true,
      status: true,
      userId: true,
    },
  })

  if (!preparation) return

  // 이미 READY 상태인 경우 스킵
  if (preparation.status === PreparationStatus.READY) return

  // totalTasks가 설정되지 않은 경우 스킵
  if (preparation.totalQuestionGenTasks === null) return

  // 모든 작업이 완료된 경우 READY로 변경
  if (
    preparation.completedQuestionGenTasks !== null &&
    preparation.completedQuestionGenTasks >= preparation.totalQuestionGenTasks
  ) {
    await prisma.interviewPreparation.update({
      where: { id: preparationId },
      data: {
        status: PreparationStatus.READY,
      },
    })

    // PostHog Survey Property 설정
    await setFirstPrepCompletedProperty(preparation.userId)
  }
}

/**
 * 첫 분석 완료 시 PostHog Person Property 설정
 *
 * Race Condition 방어: count >= 1이면 이벤트 발송
 * - 동시에 여러 prep이 READY가 되어도 최소 1회는 이벤트 발송됨
 * - PostHog $set_once가 멱등성을 보장하므로 중복 발송되어도 첫 번째만 기록됨
 */
async function setFirstPrepCompletedProperty(userId: string): Promise<void> {
  const readyPrepCount = await prisma.interviewPreparation.count({
    where: { userId, status: PreparationStatus.READY },
  })

  if (readyPrepCount < 1) return

  const posthog = getPostHogClient()
  if (!posthog) return

  posthog.capture({
    distinctId: userId,
    event: POSTHOG_EVENTS.SURVEY.FIRST_PREP_COMPLETED,
    properties: {
      $set_once: {
        [POSTHOG_PERSON_PROPERTIES.FIRST_PREP_COMPLETED]: true,
        [POSTHOG_PERSON_PROPERTIES.FIRST_PREP_COMPLETED_AT]:
          new Date().toISOString(),
      },
    },
  })
}

export const workflowTrackerService = {
  selectBestExperienceForAutoQuestionGen,
  initQuestionGenTasks,
  incrementCompletedQuestionGenTask,
  checkAndFinalizeQuestionGeneration,
}
