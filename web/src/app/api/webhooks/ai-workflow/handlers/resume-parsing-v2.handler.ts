/**
 * Resume Parsing V2 Webhook Handler
 *
 * AI 서버의 Resume Parsing V2 결과를 처리하는 핸들러
 * 단순화된 V2: 이력서 파싱 결과 저장만 수행
 *
 * V1에서 제거된 책임:
 * - StructuredJD 조회 없음
 * - Question Generation 트리거 없음
 * - InterviewPreparation 상태 업데이트 없음
 * - CandidateProfile 생성 없음 (deprecated)
 *
 * @see docs/refactoring/resume-parse-result-schema-refactoring.md
 */

import {
  ResumeParseResultV2Schema,
  type ResumeParseResultV2,
} from '@/server/services/ai/contracts/schemas/resumeParsingV2'
import { snakeToCamelCase } from '@/lib/utils/case-transform'
import type { WebhookPayload } from '../types/webhook.types'
import {
  resumeIngestionService,
  preparationService,
} from '@/server/services/interview-preparation'
import {
  webhookEventService,
  type WebhookEventWithPreparation,
} from '@/server/services/webhook-event'
import { autoQuestionGenerationService } from '@/server/services/question'
import { captureError, ErrorHandler, ErrorPhase } from '@/lib/error-tracking'

// ============= Types =============

/**
 * AI Server Resume Parsing V2 Output 구조
 */
interface ResumeParsingV2GraphOutput {
  resumeFilePath: string
  appliedPosition: string
  experienceNamesToAnalyze: string[]
  resumeParseResult: ResumeParseResultV2 | null
}

// ============= Main Handler =============

/**
 * Resume Parsing V2 결과 처리 핸들러
 *
 * 핵심 로직 (단순화):
 * 1. WebhookEvent 조회 및 검증
 * 2. AI 응답 데이터 변환 (snake_case → camelCase)
 * 3. 서비스 호출로 DB 저장 (트랜잭션)
 * 4. WebhookEvent 상태 업데이트 (SUCCESS/ERROR)
 */
export async function handleResumeParsingV2Result(
  runId: string,
  payload: WebhookPayload<ResumeParsingV2GraphOutput>
): Promise<void> {
  // Step 1: WebhookEvent 조회 (Service 활용)
  const webhookEvent =
    await webhookEventService.getByRunIdWithPreparation(runId)

  if (!webhookEvent) {
    const error = new Error('WebhookEvent not found')
    captureError(error, {
      handler: ErrorHandler.RESUME_PARSING_V2,
      extra: { runId },
    })
    throw error
  }

  if (!webhookEvent.preparationId) {
    const error = new Error('No preparationId associated with webhook event')
    captureError(error, {
      handler: ErrorHandler.RESUME_PARSING_V2,
      extra: { runId, webhookEventId: webhookEvent.id },
    })
    throw error
  }

  // Handle success/error cases
  if (payload.status === 'success' && payload.result) {
    await handleSuccessCase(webhookEvent, payload)
  } else if (payload.status === 'error') {
    await handleErrorCase(webhookEvent, payload, runId)
  }
}

// ============= Case Handlers =============

/**
 * 성공 케이스 처리
 */
async function handleSuccessCase(
  webhookEvent: WebhookEventWithPreparation,
  payload: WebhookPayload<ResumeParsingV2GraphOutput>
): Promise<void> {
  // Step 2: AI 응답 변환 (snake_case → camelCase)
  const transformedPayload = snakeToCamelCase(
    payload
  ) as WebhookPayload<ResumeParsingV2GraphOutput>

  // Payload 검증
  if (!transformedPayload.result) {
    const error = new Error('Payload result is missing')
    captureError(error, {
      handler: ErrorHandler.RESUME_PARSING_V2,
      extra: {
        preparationId: webhookEvent.preparationId,
        reason: 'payload-result-missing',
      },
    })
    throw error
  }

  const graphOutput = transformedPayload.result as ResumeParsingV2GraphOutput
  const resumeParseResult = graphOutput.resumeParseResult

  // if (isDevelopment()) {
  //   // reasign sample data
  //   resumeParseResult = SAMPLE_RESUME_PARSE_RESULT
  // }

  if (!resumeParseResult) {
    const error = new Error('Resume parse result is missing from payload')
    captureError(error, {
      handler: ErrorHandler.RESUME_PARSING_V2,
      extra: {
        preparationId: webhookEvent.preparationId,
        reason: 'resume-parse-result-missing',
      },
    })
    throw error
  }

  // Zod 스키마 검증
  const validationResult =
    ResumeParseResultV2Schema.safeParse(resumeParseResult)

  if (!validationResult.success) {
    const error = new Error('Invalid resume parsing result format')
    captureError(error, {
      handler: ErrorHandler.RESUME_PARSING_V2,
      extra: {
        preparationId: webhookEvent.preparationId,
        reason: 'schema-validation-failed',
        zodError: validationResult.error.issues,
      },
    })
    throw error
  }

  const resumeData = validationResult.data

  // Step 3: WebhookEvent 상태 업데이트 (Service 활용)
  await webhookEventService.markCompletedWithMetadata({
    id: webhookEvent.id,
    resultMetadata: {
      careerExperienceCount: resumeData.workExperiences.length,
      projectExperienceCount: resumeData.projectExperiences.length,
      keyAchievementCount:
        resumeData.workExperiences.reduce(
          (sum, exp) => sum + exp.keyAchievements.length,
          0
        ) +
        resumeData.projectExperiences.reduce(
          (sum, exp) => sum + exp.keyAchievements.length,
          0
        ),
    },
  })

  // Step 4: Service 호출로 DB 저장 (트랜잭션은 Service 내부에서 관리)
  const userId = webhookEvent.preparation!.userId
  await resumeIngestionService.processResumeParsingResult(
    webhookEvent.preparationId!,
    userId,
    resumeData
  )

  // Step 5: 자동 문제 생성 트리거
  // keyAchievements가 가장 많은 경험에 대해 TECHNICAL_DECISION 문제 생성
  try {
    const result =
      await autoQuestionGenerationService.triggerAutoQuestionGeneration({
        preparationId: webhookEvent.preparationId!,
        userId,
      })

    console.log(
      '[ResumeParsingV2Handler] Auto question generation triggered:',
      {
        preparationId: webhookEvent.preparationId,
        keyAchievementCount: result.keyAchievementCount,
        webhookEventCount: result.webhookEventIds.length,
      }
    )
  } catch (error) {
    // 문제 생성 실패해도 파싱 결과는 유지, READY 상태로 변경
    captureError(error, {
      handler: ErrorHandler.RESUME_PARSING_V2,
      userId: webhookEvent.preparation?.userId,
      extra: {
        preparationId: webhookEvent.preparationId,
        phase: ErrorPhase.AUTO_QUESTION_GENERATION,
      },
    })
    await preparationService.markAsReady(webhookEvent.preparationId!)
  }
}

/**
 * 에러 케이스 처리
 *
 * Updates both WebhookEvent and InterviewPreparation status to FAILED.
 */
async function handleErrorCase(
  webhookEvent: WebhookEventWithPreparation,
  payload: WebhookPayload,
  runId: string
): Promise<void> {
  const errorMessage = payload.error?.message ?? 'Unknown error'
  const errorCode = payload.error?.code ?? 'UNKNOWN'

  // 1. WebhookEvent 상태 업데이트 (Service 활용)
  await webhookEventService.markFailedWithMetadata({
    id: webhookEvent.id,
    error: payload.error || { message: errorMessage },
    errorMetadata: payload.error,
  })

  // 2. InterviewPreparation 상태를 FAILED로 업데이트
  if (webhookEvent.preparationId) {
    await preparationService.markAsFailed(
      webhookEvent.preparationId,
      errorMessage,
      errorCode
    )
  }

  captureError(payload.error || new Error('Resume parsing failed'), {
    handler: ErrorHandler.RESUME_PARSING_V2,
    userId: webhookEvent.preparation?.userId,
    extra: {
      preparationId: webhookEvent.preparationId,
      runId,
      errorDetails: payload.error,
    },
  })
}
