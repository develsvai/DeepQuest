/**
 * Key Achievement Router Schemas
 *
 * Zod schemas for input validation in the KeyAchievement router.
 */

import { z } from 'zod'

/**
 * Schema for getById input
 */
export const getByIdSchema = z.object({
  id: z.number().int().positive('ID must be a positive integer'),
})

export type GetByIdInput = z.infer<typeof getByIdSchema>

// ==========================================
// CRUD Schemas
// ==========================================

/**
 * Base schema for KeyAchievement data (without ID)
 */
const keyAchievementDataSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title too long'),
  problems: z.array(z.string()).default([]),
  actions: z.array(z.string()).default([]),
  results: z.array(z.string()).default([]),
  reflections: z.array(z.string()).default([]),
  orderIndex: z.number().int().min(0).optional(),
})

/**
 * Schema for creating a new KeyAchievement
 * Requires either careerExperienceId or projectExperienceId (polymorphic relation)
 */
export const createSchema = keyAchievementDataSchema
  .extend({
    careerExperienceId: z.number().int().positive().optional(),
    projectExperienceId: z.number().int().positive().optional(),
  })
  .refine(
    data =>
      data.careerExperienceId !== undefined ||
      data.projectExperienceId !== undefined,
    { message: 'Either careerExperienceId or projectExperienceId is required' }
  )
  .refine(
    data =>
      !(
        data.careerExperienceId !== undefined &&
        data.projectExperienceId !== undefined
      ),
    {
      message: 'Cannot specify both careerExperienceId and projectExperienceId',
    }
  )

export type CreateInput = z.infer<typeof createSchema>

/**
 * Schema for updating an existing KeyAchievement
 */
export const updateSchema = z.object({
  id: z.number().int().positive('Invalid KeyAchievement ID'),
  data: keyAchievementDataSchema.partial(),
})

export type UpdateInput = z.infer<typeof updateSchema>

/**
 * Schema for deleting a KeyAchievement
 */
export const deleteSchema = z.object({
  id: z.number().int().positive('Invalid KeyAchievement ID'),
})

export type DeleteInput = z.infer<typeof deleteSchema>
