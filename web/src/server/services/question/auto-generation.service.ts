/**
 * Auto Question Generation Service
 *
 * 이력서 분석 완료 후 자동으로 문제를 생성하는 오케스트레이션 서비스
 *
 * Flow:
 * 1. workflowTrackerService.selectBestExperienceForAutoQuestionGen() 호출
 * 2. workflowTrackerService.initQuestionGenTasks() 호출
 * 3. 각 keyAchievement에 대해 startAutoGeneration() 호출 (병렬)
 */

import { QuestionCategory, ExperienceType } from '@/generated/prisma/enums'
import { prisma } from '@/lib/db/prisma'
import { keyAchievementService } from '@/server/services/key-achievement'
import { experienceService } from '@/server/services/experience'
import { webhookEventService } from '@/server/services/webhook-event'
import { langGraphService } from '@/server/services/ai/langgraph/service'
import { GraphName } from '@/server/services/ai/langgraph/types/graphs'
import {
  workflowTrackerService,
  preparationService,
} from '@/server/services/interview-preparation'
import type { KeyAchievementQuestionGenInput } from '@/server/services/ai/contracts/schemas/keyAchievementQuestionGen'
import type {
  AutoQuestionGenerationInput,
  AutoQuestionGenerationResult,
} from './types'

/**
 * KeyAchievement를 AI 스키마에 맞게 변환
 */
function toAIKeyAchievement(achievement: {
  title: string
  problems: string[]
  actions: string[]
  results: string[]
  reflections: string[]
}) {
  return {
    title: achievement.title,
    problems: achievement.problems,
    actions: achievement.actions,
    results: achievement.results,
    reflections: achievement.reflections,
  }
}

/**
 * 단일 KeyAchievement에 대해 질문 생성 시작 (자동 생성용)
 *
 * @param keyAchievementId - KeyAchievement ID
 * @param userId - User ID
 * @param experienceType - Experience type
 * @param experienceId - Experience ID
 * @param preparationId - Interview preparation ID
 * @param questionGenIndex - 현재 작업 인덱스
 * @param totalQuestionGens - 전체 작업 개수
 * @returns webhookEventId
 */
async function startAutoGeneration(
  keyAchievementId: number,
  userId: string,
  experienceType: 'CAREER' | 'PROJECT',
  experienceId: number,
  preparationId: string,
  questionGenIndex: number,
  totalQuestionGens: number
): Promise<string> {
  // 1. KeyAchievement 조회
  const achievement = await keyAchievementService.findByIdAndUserId(
    keyAchievementId,
    userId
  )

  // 2. Experience 조회
  const experienceData = await experienceService.getForQuestionGeneration({
    experienceType:
      experienceType === 'CAREER'
        ? ExperienceType.CAREER
        : ExperienceType.PROJECT,
    experienceId,
  })

  // 3. 기존 질문 조회 (중복 방지)
  const existingQuestions = await prisma.question.findMany({
    where: { keyAchievementId },
    select: { text: true, category: true },
  })

  const formattedExistingQuestions = existingQuestions.map(q => ({
    content: q.text,
    category: q.category,
  }))

  // 4. AI 입력 데이터 조합 (TECHNICAL_DECISION 카테고리만)
  const questionCategories = [QuestionCategory.TECHNICAL_DECISION]

  const aiInput: KeyAchievementQuestionGenInput = {
    appliedPosition: experienceData.appliedPosition,
    experience: experienceData.experience,
    keyAchievement: toAIKeyAchievement(achievement),
    questionCategories,
    existingQuestions:
      formattedExistingQuestions.length > 0 ? formattedExistingQuestions : null,
  }

  // 5. LangGraph 실행
  const run = await langGraphService.runQuestionGen(
    aiInput,
    String(keyAchievementId)
  )

  // 6. WebhookEvent 레코드 생성 (자동 생성 메타데이터 포함)
  const webhookEvent = await webhookEventService.create({
    userId,
    graphName: GraphName.QUESTION_GEN,
    runId: run.run_id,
    threadId: run.thread_id,
    preparationId, // InterviewPreparation과 연결
    metadata: {
      keyAchievementId,
      experienceType:
        experienceType === 'CAREER'
          ? ExperienceType.CAREER
          : ExperienceType.PROJECT,
      experienceId,
      questionCategories,
      // Auto generation tracking fields
      preparationId,
      questionGenIndex,
      totalQuestionGens,
    },
  })

  return webhookEvent.id
}

/**
 * 자동 문제 생성 트리거
 *
 * 이력서 분석 완료 후 자동으로 문제를 생성합니다:
 * 1. keyAchievements가 가장 많은 경험 1개 선택
 * 2. 해당 경험의 각 keyAchievement에 대해 TECHNICAL_DECISION 문제 생성 요청
 * 3. 진행 상황 추적을 위한 필드 초기화
 *
 * @param input - preparationId, userId
 * @returns 자동 생성 대상 keyAchievement 개수 및 webhookEvent ID 목록
 */
async function triggerAutoQuestionGeneration(
  input: AutoQuestionGenerationInput
): Promise<AutoQuestionGenerationResult> {
  const { preparationId, userId } = input

  // 1. 최적 경험 선택 (keyAchievements 최다)
  const bestExperience =
    await workflowTrackerService.selectBestExperienceForAutoQuestionGen(
      preparationId
    )

  // keyAchievements가 없으면 바로 READY로 마킹
  if (!bestExperience || bestExperience.keyAchievementIds.length === 0) {
    await preparationService.markAsReady(preparationId)
    return {
      keyAchievementCount: 0,
      webhookEventIds: [],
    }
  }

  const { experienceType, experienceId, keyAchievementIds } = bestExperience
  const totalTasks = keyAchievementIds.length

  // 2. 문제 생성 작업 초기화 (totalTasks 설정, completedTasks = 0)
  // 이 시점에서 Supabase Realtime으로 클라이언트에 전파됨 (파싱 완료 표시)
  await workflowTrackerService.initQuestionGenTasks(preparationId, totalTasks)

  // 3. 각 keyAchievement에 대해 문제 생성 요청 (병렬)
  const generationPromises = keyAchievementIds.map((keyAchievementId, index) =>
    startAutoGeneration(
      keyAchievementId,
      userId,
      experienceType,
      experienceId,
      preparationId,
      index,
      totalTasks
    )
  )

  // 병렬 처리 - 일부 실패해도 계속 진행
  const results = await Promise.allSettled(generationPromises)

  const webhookEventIds: string[] = []
  let failedCount = 0

  results.forEach(result => {
    if (result.status === 'fulfilled') {
      webhookEventIds.push(result.value)
    } else {
      failedCount++
      console.error(
        '[AutoQuestionGeneration] Failed to start generation:',
        result.reason
      )
    }
  })

  // 실패한 작업도 "완료"로 처리하여 데드락 방지
  // WebhookEvent가 생성되지 않은 작업은 웹훅이 호출되지 않으므로
  // 여기서 직접 completed 카운트를 증가시킴
  if (failedCount > 0) {
    for (let i = 0; i < failedCount; i++) {
      await workflowTrackerService.incrementCompletedQuestionGenTask(
        preparationId
      )
    }
    // 모든 작업이 실패한 경우 즉시 READY 상태 전환 체크
    await workflowTrackerService.checkAndFinalizeQuestionGeneration(
      preparationId
    )
  }

  return {
    keyAchievementCount: totalTasks,
    webhookEventIds,
  }
}

export const autoQuestionGenerationService = {
  triggerAutoQuestionGeneration,
}
