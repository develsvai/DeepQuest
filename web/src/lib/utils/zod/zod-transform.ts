import { z } from 'zod'
import { snakeToCamelCase } from '../case-transform'

/**
 * Parse snake_case data with automatic camelCase transformation
 */
export function parseSnakeCase<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): z.infer<T> {
  const transformed = snakeToCamelCase(data)
  return schema.parse(transformed)
}

/**
 * Safe parse snake_case data with automatic camelCase transformation
 */
export function safeParseSnakeCase<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
) {
  const transformed = snakeToCamelCase(data)
  return schema.safeParse(transformed)
}
