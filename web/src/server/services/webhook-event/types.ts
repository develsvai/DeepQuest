/**
 * WebhookEvent Service Types
 *
 * LangGraph 워크플로우 실행 추적을 위한 WebhookEvent 도메인 타입
 */

import type {
  WebhookEvent,
  WebhookStatus,
  Prisma,
} from '@/generated/prisma/client'

/**
 * WebhookEvent 생성 입력
 */
export interface CreateWebhookEventInput {
  /** 사용자 ID (Realtime 구독용) */
  userId: string
  /** InterviewPreparation ID (optional) */
  preparationId?: string
  /** LangGraph graph name */
  graphName: string
  /** LangGraph run ID */
  runId: string
  /** LangGraph thread ID */
  threadId: string
  /** 추가 메타데이터 (JSON) - Prisma InputJsonValue 호환 */
  metadata?: Prisma.InputJsonValue
}

/**
 * WebhookEvent 생성 결과
 */
export interface CreateWebhookEventResult {
  id: string
  runId: string
  threadId: string
  status: WebhookStatus
}

/**
 * WebhookEvent 상태 업데이트 결과
 */
export type WebhookEventUpdateResult = Pick<
  WebhookEvent,
  'id' | 'status' | 'completedAt' | 'error'
>

/**
 * WebhookEvent 조회 결과 (metadata 포함)
 */
export type WebhookEventWithMetadata = WebhookEvent

// ============================================================================
// Query Types with Relations
// ============================================================================

/**
 * Include configuration for WebhookEvent with Preparation relation
 */
export const webhookEventWithPreparationInclude = {
  preparation: true,
} as const satisfies Prisma.WebhookEventInclude

/**
 * WebhookEvent with Preparation relation (for handlers needing userId)
 */
export type WebhookEventWithPreparation = Prisma.WebhookEventGetPayload<{
  include: typeof webhookEventWithPreparationInclude
}>

// ============================================================================
// Completion Input Types
// ============================================================================

/**
 * Input for marking webhook as completed with metadata
 *
 * @example
 * ```typescript
 * await webhookEventService.markCompletedWithMetadata({
 *   id: webhookEvent.id,
 *   resultMetadata: {
 *     careerExperienceCount: 3,
 *     projectExperienceCount: 2,
 *   },
 * })
 * ```
 */
export interface MarkCompletedWithMetadataInput {
  /** WebhookEvent ID */
  id: string
  /** Result metadata to merge with existing metadata */
  resultMetadata: Record<string, unknown>
}

/**
 * Input for marking webhook as failed with metadata
 *
 * @example
 * ```typescript
 * await webhookEventService.markFailedWithMetadata({
 *   id: webhookEvent.id,
 *   error: payload.error,
 *   errorMetadata: payload.error,
 * })
 * ```
 */
export interface MarkFailedWithMetadataInput {
  /** WebhookEvent ID */
  id: string
  /** Error information (will be stored in error column) */
  error: unknown
  /** Optional error metadata to merge (defaults to normalized error) */
  errorMetadata?: unknown
}
