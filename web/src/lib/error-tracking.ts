/**
 * Error Tracking Utility
 *
 * Sentry + PostHog 통합 에러 캡처 유틸리티
 * API routes, Webhook handlers, LangGraph proxy에서 사용
 *
 * 핵심 기능:
 * 1. Sentry: 상세 스택트레이스 + 에러 분류
 * 2. PostHog: 사용자 행동과 연결된 에러 이벤트
 * 3. 서버 로그: 개발 환경 디버깅
 *
 * @example
 * ```typescript
 * // Webhook handler에서 사용
 * try {
 *   await processWebhook(payload)
 * } catch (error) {
 *   captureError(error, {
 *     handler: 'webhook-processor',
 *     extra: { workflowType, runId },
 *   })
 *   return Response.json({ error: 'Internal server error' }, { status: 500 })
 * }
 * ```
 */

import * as Sentry from '@sentry/nextjs'
import { getPostHogClient } from './posthog-server'

/**
 * Error Handler 이름 상수
 * Sentry 태그 및 로그 필터링에 사용
 */
export const ErrorHandler = {
  // Webhooks
  WEBHOOK_PROCESSOR: 'webhook-processor',
  CLERK_WEBHOOK: 'clerk-webhook',

  // AI Workflow Handlers
  RESUME_PARSING_V2: 'resume-parsing-v2-handler',
  QUESTION_GENERATION_V2: 'question-generation-v2-handler',

  // Proxy
  LANGGRAPH_PROXY: 'langgraph-proxy',

  // Services
  LANGGRAPH_SERVICE: 'langgraph-service',
} as const

export type ErrorHandlerType = (typeof ErrorHandler)[keyof typeof ErrorHandler]

/**
 * Error Phase 상수
 * 에러 발생 단계를 나타내는 extra.phase 값
 */
export const ErrorPhase = {
  // Resume Parsing
  AUTO_QUESTION_GENERATION: 'auto-question-generation',

  // Question Generation
  QUESTION_SAVE: 'question-save',
  PROGRESS_UPDATE: 'progress-update',
} as const

export type ErrorPhaseType = (typeof ErrorPhase)[keyof typeof ErrorPhase]

/**
 * Error context for tracking
 */
export interface ErrorContext {
  /** Handler or module name (e.g., 'webhook-processor', 'clerk-webhook') */
  handler: string
  /** User ID for user-correlated errors */
  userId?: string
  /** Additional data for debugging */
  extra?: Record<string, unknown>
  /** Custom tags for filtering in Sentry */
  tags?: Record<string, string>
}

/**
 * Sentry + PostHog 통합 에러 캡처
 *
 * 모든 API routes, webhook handlers에서 catch 블록에서 호출
 *
 * @param error - 캡처할 에러
 * @param context - 에러 컨텍스트 정보
 */
export function captureError(error: unknown, context: ErrorContext): void {
  const { handler, userId, extra, tags } = context

  // 1. Sentry (상세 스택트레이스)
  Sentry.captureException(error, {
    tags: {
      handler,
      ...tags,
    },
    extra,
    ...(userId && { user: { id: userId } }),
  })

  // 2. PostHog (사용자 행동 연결)
  const posthog = getPostHogClient()
  if (posthog && userId) {
    posthog.captureException(error, userId, {
      handler,
      ...extra,
    })
  }

  // 3. 서버 로그 유지
  console.error(`[${handler}] Error:`, error)
}

/**
 * 에러 캡처를 포함한 함수 래퍼
 *
 * 비동기 함수를 감싸서 에러 발생 시 자동으로 캡처
 *
 * @param fn - 실행할 비동기 함수
 * @param context - 에러 컨텍스트
 * @returns 함수 결과 또는 에러 throw
 *
 * @example
 * ```typescript
 * const result = await withErrorTracking(
 *   () => processWebhook(payload),
 *   { handler: 'webhook-processor' }
 * )
 * ```
 */
export async function withErrorTracking<T>(
  fn: () => Promise<T>,
  context: ErrorContext
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    captureError(error, context)
    throw error
  }
}
