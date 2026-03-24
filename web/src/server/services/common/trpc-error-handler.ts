/**
 * tRPC Error Handler
 *
 * Transforms domain errors to TRPCError for consistent error handling.
 * Use this in router procedures to convert service layer errors.
 */

import { TRPCError } from '@trpc/server'
import {
  NotFoundError,
  ConflictError,
  ValidationError,
  ForbiddenError,
} from './errors'

/**
 * Transform domain errors to TRPCError
 *
 * Maps domain error types to appropriate HTTP status codes:
 * - NotFoundError → NOT_FOUND (404)
 * - ConflictError → CONFLICT (409)
 * - ValidationError → BAD_REQUEST (400)
 * - ForbiddenError → FORBIDDEN (403)
 * - TRPCError → pass through
 * - Other → INTERNAL_SERVER_ERROR (500)
 *
 * @param error - The error thrown by service layer
 * @throws TRPCError with appropriate code
 */
export function handleServiceError(error: unknown): never {
  // Development: Log full error for debugging
  if (process.env.NODE_ENV === 'development') {
    console.error('[Service Error]', error)
  }

  if (error instanceof NotFoundError) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: error.message,
    })
  }

  if (error instanceof ConflictError) {
    throw new TRPCError({
      code: 'CONFLICT',
      message: error.message,
    })
  }

  if (error instanceof ValidationError) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: error.message,
    })
  }

  if (error instanceof ForbiddenError) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: error.message,
    })
  }

  if (error instanceof TRPCError) {
    throw error
  }

  // Unexpected errors (DB 연결 실패, Prisma 오류 등)
  // 개발 환경에서는 원인 메시지 노출 → "Caused by: undefined" 대신 실제 에러 확인 가능
  const isDev = process.env.NODE_ENV === 'development'
  const causeMessage =
    isDev && error instanceof Error ? error.message : undefined

  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message:
      causeMessage ?? 'An unexpected error occurred',
    cause: error,
  })
}
