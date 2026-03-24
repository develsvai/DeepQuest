/**
 * Question Generation V2 Webhook Handler
 *
 * KeyAchievement 기반 질문 생성 결과를 처리하는 V2 핸들러
 * V1(배치 처리)을 완전히 대체
 *
 * 주요 특징:
 * - Domain Service 활용 (webhookEventService, questionService)
 * - Question은 keyAchievementId에만 직접 종속
 * - 단일 KeyAchievement 단위로 질문 저장
 *
 * @see docs/plans/question-generation-api-plan.md - Phase 5
 */

import { webhookEventService } from '@/server/services/webhook-event'
import {
  questionService,
  type AutoQuestionGenMetadata,
} from '@/server/services/question'
import { workflowTrackerService } from '@/server/services/interview-preparation'
import { snakeToCamelCase } from '@/lib/utils/case-transform'
import {
  KeyAchievementQuestionGenOutputSchema,
  type KeyAchievementQuestionGenOutput,
} from '@/server/services/ai/contracts/schemas/keyAchievementQuestionGen'
import type { WebhookPayload } from '../types/webhook.types'
import { captureError, ErrorHandler, ErrorPhase } from '@/lib/error-tracking'

// ============= Types =============

/**
 * Metadata stored in WebhookEvent (from generation.service.ts)
 */
export interface QuestionGenMetadata {
  keyAchievementId: number
  experienceType: 'CAREER' | 'PROJECT'
  experienceId: number
  questionCategories: string[]
}

// ============= Main Handler =============

/**
 * Question Generation V2 결과 처리 핸들러
 *
 * 처리 흐름:
 * 1. WebhookEvent 조회 (Domain Service)
 * 2. 성공/에러 분기 처리
 * 3. 질문 저장 (keyAchievementId 종속)
 * 4. WebhookEvent 상태 업데이트
 */
export async function handleQuestionGenerationV2Result(
  runId: string,
  payload: WebhookPayload<KeyAchievementQuestionGenOutput>
): Promise<void> {
  // Step 1: WebhookEvent 조회 (Domain Service 활용)
  const webhookEvent = await webhookEventService.getByRunIdOrThrow(runId)

  // Step 2: 성공/에러 분기
  if (payload.status === 'success' && payload.result) {
    await handleSuccessCase(webhookEvent.id, webhookEvent.metadata, payload)
  } else if (payload.status === 'error') {
    await handleErrorCase(webhookEvent.id, payload, runId)
  }
}

// ============= Case Handlers =============

/**
 * 성공 케이스 처리
 *
 * 1. 처리 시작 표시 (markRunning)
 * 2. AI 응답 변환 + 스키마 검증
 * 3. 질문 저장 (questionService.createMany)
 * 4. 완료 표시 (markCompleted)
 */
async function handleSuccessCase(
  webhookEventId: string,
  metadata: unknown,
  payload: WebhookPayload<KeyAchievementQuestionGenOutput>
): Promise<void> {
  // 처리 시작 표시
  await webhookEventService.markRunning(webhookEventId)

  try {
    // AI 응답 변환 (snake_case → camelCase)
    const transformedResult = snakeToCamelCase(payload.result)

    // 스키마 검증
    const validationResult =
      KeyAchievementQuestionGenOutputSchema.safeParse(transformedResult)

    if (!validationResult.success) {
      const error = new Error('Invalid question generation result format')
      captureError(error, {
        handler: ErrorHandler.QUESTION_GENERATION_V2,
        extra: {
          webhookEventId,
          reason: 'schema-validation-failed',
          zodError: validationResult.error.issues,
        },
      })
      throw error
    }

    const { questions } = validationResult.data

    // Metadata에서 keyAchievementId 추출
    const { keyAchievementId } = metadata as QuestionGenMetadata

    if (!keyAchievementId) {
      throw new Error('keyAchievementId not found in webhook metadata')
    }

    // 질문 저장 (keyAchievementId만 사용)
    await questionService.createMany({
      keyAchievementId,
      questions: questions.map(q => ({
        content: q.content,
        category: q.category ?? null,
      })),
    })

    // 완료 표시
    await webhookEventService.markCompleted(webhookEventId)

    // 자동 생성 케이스: progress 업데이트
    await handleAutoGenerationProgress(metadata as AutoQuestionGenMetadata)
  } catch (error) {
    // 에러 캡처 (Sentry + PostHog)
    const typedMetadata = metadata as QuestionGenMetadata
    captureError(error, {
      handler: ErrorHandler.QUESTION_GENERATION_V2,
      extra: {
        webhookEventId,
        keyAchievementId: typedMetadata?.keyAchievementId,
        experienceType: typedMetadata?.experienceType,
        phase: ErrorPhase.QUESTION_SAVE,
      },
    })

    // 에러 발생 시 실패 표시
    await webhookEventService.markFailed(webhookEventId, error)

    // 자동 생성 케이스: 에러여도 progress 업데이트 (부분 성공 허용)
    await handleAutoGenerationProgress(metadata as AutoQuestionGenMetadata)

    throw error
  }
}

/**
 * 에러 케이스 처리
 *
 * WebhookEvent 상태를 ERROR로 업데이트
 */
async function handleErrorCase(
  webhookEventId: string,
  payload: WebhookPayload,
  runId: string
): Promise<void> {
  await webhookEventService.markFailed(webhookEventId, payload.error)

  captureError(payload.error || new Error('Question generation failed'), {
    handler: ErrorHandler.QUESTION_GENERATION_V2,
    extra: {
      webhookEventId,
      runId,
      errorDetails: payload.error,
    },
  })
}

// ============= Auto Generation Progress =============

/**
 * 자동 생성 케이스 progress 업데이트
 *
 * metadata에 preparationId가 있는 경우 (자동 생성 케이스):
 * 1. completedQuestionGenTasks 증가
 * 2. 모든 작업 완료 시 READY 상태로 변경
 *
 * @param metadata - WebhookEvent metadata
 */
async function handleAutoGenerationProgress(
  metadata: AutoQuestionGenMetadata
): Promise<void> {
  // 자동 생성 케이스가 아니면 스킵
  if (!metadata.preparationId) return

  try {
    // 완료된 작업 수 증가 (Realtime으로 클라이언트에 전파됨)
    await workflowTrackerService.incrementCompletedQuestionGenTask(
      metadata.preparationId
    )

    // 모든 작업 완료 시 READY 상태로 변경
    await workflowTrackerService.checkAndFinalizeQuestionGeneration(
      metadata.preparationId
    )
  } catch (error) {
    // progress 업데이트 실패는 캡처하고 무시 (질문 저장은 성공했으므로)
    captureError(error, {
      handler: ErrorHandler.QUESTION_GENERATION_V2,
      extra: {
        preparationId: metadata.preparationId,
        phase: ErrorPhase.PROGRESS_UPDATE,
      },
    })
  }
}
