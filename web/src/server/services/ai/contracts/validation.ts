import { z } from 'zod'
import { TRPCError } from '@trpc/server'

export function validateGraphInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  graphName: string
): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Invalid input for ${graphName}`,
        cause: error.message,
      })
    }
    throw error
  }
}

export function validateGraphOutput<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  graphName: string
): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`Invalid output from ${graphName}`, error.message)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'AI 서비스 응답 형식 오류',
      })
    }
    throw error
  }
}
