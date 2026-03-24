import { z } from 'zod'

/**
 * User schema for runtime validation
 * Provides type safety and validation for user data across the application
 */
export const userSchema = z.object({
  name: z.string().optional(),
  email: z.email().optional(),
  imageUrl: z.url().optional(),
})

/**
 * Inferred types from schemas
 */
export type User = z.infer<typeof userSchema>

/**
 * Utility function to validate user data at runtime
 * @param data - User data to validate
 * @returns Validated user data or null if invalid
 */
export function validateUser(data: unknown): User | null {
  const result = userSchema.safeParse(data)
  return result.success ? result.data : null
}
