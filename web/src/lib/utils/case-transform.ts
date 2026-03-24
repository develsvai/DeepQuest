import { z } from 'zod'

/**
 * Transform snake_case keys to camelCase recursively
 */
export function snakeToCamelCase<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(snakeToCamelCase) as T
  }

  if (typeof obj === 'object') {
    const transformed: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(obj)) {
      // Convert snake_case to camelCase
      const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
        letter.toUpperCase()
      )

      // Recursively transform nested objects
      transformed[camelKey] = snakeToCamelCase(value)
    }

    return transformed as T
  }

  return obj
}

/**
 * Wraps a Zod schema with snake_case to camelCase preprocessing
 *
 * @example
 * const UserSchema = z.object({
 *   firstName: z.string(),
 *   lastName: z.string(),
 * })
 *
 * // Accept snake_case input, validate as camelCase
 * const UserFromSnakeCase = withSnakeToCamelCase(UserSchema)
 * UserFromSnakeCase.parse({ first_name: 'John', last_name: 'Doe' })
 * // => { firstName: 'John', lastName: 'Doe' }
 *
 * @param schema - The Zod schema to wrap
 * @returns A new schema that accepts snake_case input and validates as camelCase
 */
export function withSnakeToCamelCase<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess(snakeToCamelCase, schema)
}

/**
 * Transform camelCase keys to snake_case recursively
 */
export function camelToSnakeCase<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(camelToSnakeCase) as T
  }

  if (typeof obj === 'object') {
    const transformed: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(obj)) {
      // Convert camelCase to snake_case
      // Pattern: lowercase followed by uppercase (preserves consecutive uppercase)
      const snakeKey = key.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase()

      // Recursively transform nested objects
      transformed[snakeKey] = camelToSnakeCase(value)
    }

    return transformed as T
  }

  return obj
}
