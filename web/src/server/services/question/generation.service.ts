/**
 * Question Generation Service
 *
 * KeyAchievement 기반 질문 생성 비즈니스 로직
 * - KeyAchievement 및 관련 Experience 데이터 조회
 * - AI 스키마에 맞게 데이터 변환
 * - LangGraphService 호출
 * - WebhookEvent 레코드 생성
 */

import { ExperienceType } from '@/generated/prisma/enums'
import { prisma } from '@/lib/db/prisma'
import { ValidationError } from '@/server/services/common/errors'
import { keyAchievementService } from '@/server/services/key-achievement'
import { experienceService } from '@/server/services/experience'
import { webhookEventService } from '@/server/services/webhook-event'
import { langGraphService } from '@/server/services/ai/langgraph/service'
import { GraphName } from '@/server/services/ai/langgraph/types/graphs'
import type { KeyAchievementQuestionGenInput } from '@/server/services/ai/contracts/schemas/keyAchievementQuestionGen'
import type {
  StartQuestionGenerationInput,
  StartQuestionGenerationResult,
} from './types'

/**
 * KeyAchievement에서 experienceType과 experienceId 추출
 *
 * KeyAchievement는 careerExperienceId 또는 projectExperienceId 중 하나만 가짐
 */
function extractExperienceInfo(achievement: {
  careerExperienceId: number | null
  projectExperienceId: number | null
}): { experienceType: ExperienceType; experienceId: number } {
  if (achievement.careerExperienceId !== null) {
    return {
      experienceType: ExperienceType.CAREER,
      experienceId: achievement.careerExperienceId,
    }
  }

  if (achievement.projectExperienceId !== null) {
    return {
      experienceType: ExperienceType.PROJECT,
      experienceId: achievement.projectExperienceId,
    }
  }

  throw new ValidationError('KeyAchievement has no associated experience')
}

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
 * 기존 질문 조회 (중복 방지용)
 *
 * @param keyAchievementId - KeyAchievement ID
 * @returns 기존 질문 목록 (content, category)
 */
async function getExistingQuestions(keyAchievementId: number) {
  const questions = await prisma.question.findMany({
    where: { keyAchievementId },
    select: {
      text: true,
      category: true,
    },
  })

  return questions.map(q => ({
    content: q.text,
    category: q.category,
  }))
}

/**
 * 질문 생성 시작
 *
 * 1. KeyAchievement 조회 + ownership 확인 (userId 기반 - 단일 쿼리)
 * 2. Experience 조회 (AI 스키마 형태)
 * 3. 기존 질문 조회 (중복 방지)
 * 4. AI 입력 데이터 조합
 * 5. LangGraphService 호출
 * 6. WebhookEvent 레코드 생성
 *
 * @refactored 2025-12-05: Use findByIdAndUserId for direct ownership verification
 * @see docs/refactoring/key-achievement-userid-denormalization.md
 *
 * @param input - keyAchievementId, questionCategories, userId
 * @returns runId, threadId, webhookEventId
 * @throws NotFoundError if KeyAchievement or Experience not found, or not owned by user
 * @throws ValidationError if questionCategories is empty
 */
async function startGeneration(
  input: StartQuestionGenerationInput
): Promise<StartQuestionGenerationResult> {
  const { keyAchievementId, questionCategories, userId } = input

  // 입력 검증
  if (!questionCategories || questionCategories.length === 0) {
    throw new ValidationError('At least one question category is required')
  }

  // 1. KeyAchievement 조회 + ownership 검증 (단일 쿼리로 처리)
  // Uses denormalized userId field - no 4-level JOINs needed
  const achievement = await keyAchievementService.findByIdAndUserId(
    keyAchievementId,
    userId
  )

  // 2. Experience 정보 추출 및 조회
  const { experienceType, experienceId } = extractExperienceInfo(achievement)

  const experienceData = await experienceService.getForQuestionGeneration({
    experienceType,
    experienceId,
  })

  // 3. 기존 질문 조회 (중복 방지)
  const existingQuestions = await getExistingQuestions(keyAchievementId)

  // 4. AI 입력 데이터 조합
  const aiInput: KeyAchievementQuestionGenInput = {
    appliedPosition: experienceData.appliedPosition,
    experience: experienceData.experience,
    keyAchievement: toAIKeyAchievement(achievement),
    questionCategories: questionCategories,
    existingQuestions: existingQuestions.length > 0 ? existingQuestions : null,
  }

  // 5. LangGraph 실행
  const run = await langGraphService.runQuestionGen(
    aiInput,
    String(keyAchievementId)
  )

  // 6. WebhookEvent 레코드 생성 (추적용)
  const webhookEvent = await webhookEventService.create({
    userId,
    graphName: GraphName.QUESTION_GEN,
    runId: run.run_id,
    threadId: run.thread_id,
    metadata: {
      keyAchievementId,
      experienceType,
      experienceId,
      questionCategories,
    },
  })

  return {
    runId: run.run_id,
    threadId: run.thread_id,
    webhookEventId: webhookEvent.id,
  }
}

export const questionGenerationService = {
  startGeneration,
}
