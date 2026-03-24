/**
 * Prisma Error Handling Utilities
 *
 * Helpers for handling Prisma-specific errors and converting them
 * to domain errors. Optimizes DB operations by eliminating
 * redundant existence checks.
 */

import { Prisma } from '@/generated/prisma/client'
import { NotFoundError } from './errors'

/**
 * Prisma error code for "Record to update/delete not found"
 * @see https://www.prisma.io/docs/reference/api-reference/error-reference#p2025
 */
const PRISMA_NOT_FOUND_CODE = 'P2025'

/**
 * Checks if an error is a Prisma "not found" error (P2025)
 *
 * @param error - The error to check
 * @returns true if it's a Prisma P2025 error
 */
export function isPrismaNotFoundError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === PRISMA_NOT_FOUND_CODE
  )
}

/**
 * Wraps a Prisma operation and converts P2025 errors to NotFoundError
 *
 * This eliminates the need for a separate findUnique check before update/delete,
 * reducing DB calls by 50% for these operations.
 *
 * @param entityName - Entity name for error message (e.g., 'CareerExperience')
 * @param id - Entity ID for error message
 * @param operation - The Prisma operation to execute
 * @returns The result of the operation
 * @throws NotFoundError if the record doesn't exist
 *
 * @example
 * ```typescript
 * // Before: 2 DB calls
 * const exists = await prisma.career.findUnique({ where: { id } })
 * if (!exists) throw new NotFoundError('Career', id)
 * await prisma.career.update({ where: { id }, data })
 *
 * // After: 1 DB call
 * await withNotFoundHandler('Career', id, () =>
 *   prisma.career.update({ where: { id }, data })
 * )
 * ```
 */
export async function withNotFoundHandler<T>(
  entityName: string,
  id: number | string,
  operation: () => Promise<T>
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      throw new NotFoundError(entityName, id)
    }
    throw error
  }
}
