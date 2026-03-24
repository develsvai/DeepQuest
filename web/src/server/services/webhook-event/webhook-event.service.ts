/**
 * WebhookEvent Service
 *
 * LangGraph 워크플로우 실행 추적을 위한 WebhookEvent 도메인 서비스
 * - 생성: AI 워크플로우 실행 시작 시
 * - 조회: Webhook 수신 시 runId로 조회
 * - 업데이트: 워크플로우 완료/실패 시 상태 업데이트
 */

import { prisma } from '@/lib/db/prisma'
import { WebhookStatus } from '@/generated/prisma/enums'
import type { Prisma } from '@/generated/prisma/client'
import { NotFoundError } from '@/server/services/common/errors'
import {
  webhookEventWithPreparationInclude,
  type CreateWebhookEventInput,
  type CreateWebhookEventResult,
  type MarkCompletedWithMetadataInput,
  type MarkFailedWithMetadataInput,
  type WebhookEventUpdateResult,
  type WebhookEventWithMetadata,
  type WebhookEventWithPreparation,
} from './types'

/**
 * WebhookEvent 생성
 *
 * LangGraph 워크플로우 실행 시작 시 호출
 * - runId, threadId로 추후 webhook 수신 시 매칭
 * - metadata에 추가 정보 저장 (keyAchievementId 등)
 *
 * @param input - 생성 입력 데이터
 * @returns 생성된 WebhookEvent 기본 정보
 */
async function create(
  input: CreateWebhookEventInput
): Promise<CreateWebhookEventResult> {
  const webhookEvent = await prisma.webhookEvent.create({
    data: {
      userId: input.userId,
      preparationId: input.preparationId,
      graphName: input.graphName,
      runId: input.runId,
      threadId: input.threadId,
      status: WebhookStatus.PENDING,
      metadata: input.metadata,
    },
    select: {
      id: true,
      runId: true,
      threadId: true,
      status: true,
    },
  })

  return webhookEvent
}

/**
 * runId로 WebhookEvent 조회
 *
 * Webhook 수신 시 runId로 해당 이벤트 조회
 *
 * @param runId - LangGraph run ID
 * @returns WebhookEvent (metadata 포함) 또는 null
 */
async function getByRunId(
  runId: string
): Promise<WebhookEventWithMetadata | null> {
  return prisma.webhookEvent.findFirst({
    where: { runId },
  })
}

/**
 * runId로 WebhookEvent 조회 (필수)
 *
 * @param runId - LangGraph run ID
 * @returns WebhookEvent
 * @throws NotFoundError if not found
 */
async function getByRunIdOrThrow(
  runId: string
): Promise<WebhookEventWithMetadata> {
  const event = await getByRunId(runId)

  if (!event) {
    throw new NotFoundError('WebhookEvent', runId)
  }

  return event
}

/**
 * WebhookEvent 상태를 SUCCESS로 업데이트
 *
 * 워크플로우 정상 완료 시 호출
 *
 * @param id - WebhookEvent ID
 * @returns 업데이트된 WebhookEvent
 */
async function markCompleted(id: string): Promise<WebhookEventUpdateResult> {
  return prisma.webhookEvent.update({
    where: { id },
    data: {
      status: WebhookStatus.SUCCESS,
      completedAt: new Date(),
    },
    select: {
      id: true,
      status: true,
      completedAt: true,
      error: true,
    },
  })
}

/**
 * WebhookEvent 상태를 ERROR로 업데이트
 *
 * 워크플로우 실패 시 호출
 *
 * @param id - WebhookEvent ID
 * @param error - 에러 정보 (JSON으로 저장)
 * @returns 업데이트된 WebhookEvent
 */
async function markFailed(
  id: string,
  error: unknown
): Promise<WebhookEventUpdateResult> {
  const errorData =
    error instanceof Error
      ? { message: error.message, name: error.name }
      : { message: String(error) }

  return prisma.webhookEvent.update({
    where: { id },
    data: {
      status: WebhookStatus.ERROR,
      completedAt: new Date(),
      error: errorData,
    },
    select: {
      id: true,
      status: true,
      completedAt: true,
      error: true,
    },
  })
}

/**
 * WebhookEvent 상태를 RUNNING으로 업데이트
 *
 * 워크플로우 처리 시작 시 호출 (선택적)
 *
 * @param id - WebhookEvent ID
 * @returns 업데이트된 WebhookEvent
 */
async function markRunning(id: string): Promise<WebhookEventUpdateResult> {
  return prisma.webhookEvent.update({
    where: { id },
    data: {
      status: WebhookStatus.RUNNING,
    },
    select: {
      id: true,
      status: true,
      completedAt: true,
      error: true,
    },
  })
}

// ============================================================================
// Query Methods with Relations
// ============================================================================

/**
 * runId로 WebhookEvent 조회 (Preparation 관계 포함)
 *
 * Resume parsing 등 userId가 필요한 핸들러용
 *
 * @param runId - LangGraph run ID
 * @returns WebhookEvent with preparation relation or null
 */
async function getByRunIdWithPreparation(
  runId: string
): Promise<WebhookEventWithPreparation | null> {
  return prisma.webhookEvent.findFirst({
    where: { runId },
    include: webhookEventWithPreparationInclude,
  })
}

/**
 * runId로 WebhookEvent 조회 (Preparation 포함, 필수)
 *
 * @param runId - LangGraph run ID
 * @returns WebhookEvent with preparation
 * @throws NotFoundError if not found
 */
async function getByRunIdWithPreparationOrThrow(
  runId: string
): Promise<WebhookEventWithPreparation> {
  const event = await getByRunIdWithPreparation(runId)

  if (!event) {
    throw new NotFoundError('WebhookEvent', runId)
  }

  return event
}

// ============================================================================
// Completion Methods with Metadata
// ============================================================================

/**
 * WebhookEvent를 SUCCESS로 업데이트 (메타데이터 병합)
 *
 * 기존 metadata를 유지하면서 결과 정보 추가
 *
 * @param input - ID and result metadata
 * @returns Updated WebhookEvent
 */
async function markCompletedWithMetadata(
  input: MarkCompletedWithMetadataInput
): Promise<WebhookEventUpdateResult> {
  const { id, resultMetadata } = input

  // Fetch current metadata to merge
  const current = await prisma.webhookEvent.findUnique({
    where: { id },
    select: { metadata: true },
  })

  const mergedMetadata = {
    ...((current?.metadata as object) || {}),
    completedAt: new Date().toISOString(),
    result: resultMetadata,
  } as Prisma.InputJsonValue

  return prisma.webhookEvent.update({
    where: { id },
    data: {
      status: WebhookStatus.SUCCESS,
      completedAt: new Date(),
      metadata: mergedMetadata,
    },
    select: {
      id: true,
      status: true,
      completedAt: true,
      error: true,
    },
  })
}

/**
 * WebhookEvent를 ERROR로 업데이트 (메타데이터 병합)
 *
 * 기존 metadata를 유지하면서 에러 정보 추가
 *
 * @param input - ID, error, and optional error metadata
 * @returns Updated WebhookEvent
 */
async function markFailedWithMetadata(
  input: MarkFailedWithMetadataInput
): Promise<WebhookEventUpdateResult> {
  const { id, error, errorMetadata } = input

  // Normalize error data
  const errorData =
    error instanceof Error
      ? { message: error.message, name: error.name }
      : typeof error === 'object' && error !== null
        ? error
        : { message: String(error) }

  // Fetch current metadata to merge
  const current = await prisma.webhookEvent.findUnique({
    where: { id },
    select: { metadata: true },
  })

  const mergedMetadata = {
    ...((current?.metadata as object) || {}),
    completedAt: new Date().toISOString(),
    error: errorMetadata ?? errorData,
  } as Prisma.InputJsonValue

  return prisma.webhookEvent.update({
    where: { id },
    data: {
      status: WebhookStatus.ERROR,
      completedAt: new Date(),
      error: errorData as Prisma.InputJsonValue,
      metadata: mergedMetadata,
    },
    select: {
      id: true,
      status: true,
      completedAt: true,
      error: true,
    },
  })
}

export const webhookEventService = {
  // Create
  create,
  // Query (basic)
  getByRunId,
  getByRunIdOrThrow,
  // Query (with relations)
  getByRunIdWithPreparation,
  getByRunIdWithPreparationOrThrow,
  // Status updates (simple)
  markCompleted,
  markFailed,
  markRunning,
  // Status updates (with metadata)
  markCompletedWithMetadata,
  markFailedWithMetadata,
}
