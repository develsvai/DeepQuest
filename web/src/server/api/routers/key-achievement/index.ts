/**
 * Key Achievement Router
 *
 * Handles HTTP/tRPC concerns for KeyAchievement endpoints.
 * Delegates business logic to the service layer.
 *
 * @example
 * // Client usage
 * const achievement = await trpc.keyAchievement.getById.query({ id: 123 })
 */

import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { keyAchievementService } from '@/server/services/key-achievement'
import { handleServiceError } from '@/server/services/common/trpc-error-handler'
import { prisma } from '@/lib/db/prisma'
import {
  getByIdSchema,
  createSchema,
  updateSchema,
  deleteSchema,
} from './schema'

export const keyAchievementRouter = createTRPCRouter({
  /**
   * Get a single KeyAchievement by ID
   *
   * Returns the achievement with STAR-L data and question progress.
   * Validates that the user owns the parent interview preparation.
   */
  getById: protectedProcedure
    .input(getByIdSchema)
    .query(async ({ ctx, input }) => {
      try {
        // Uses denormalized userId for ownership verification in single query
        return keyAchievementService.findByIdAndUserId(input.id, ctx.userId)
      } catch (error) {
        handleServiceError(error)
      }
    }),

  /**
   * Create a new KeyAchievement
   *
   * @refactored 2025-12-12: Moved from interview-prep-detail router
   * Pre-validates parent experience ownership before creation
   * Creates with userId denormalization
   */
  create: protectedProcedure
    .input(createSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Validate that either careerExperienceId or projectExperienceId is provided
        if (!input.careerExperienceId && !input.projectExperienceId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message:
              'Either careerExperienceId or projectExperienceId is required',
          })
        }

        // Pre-validate parent experience ownership BEFORE creation
        if (input.careerExperienceId) {
          const career = await prisma.careerExperience.findUnique({
            where: { id: input.careerExperienceId },
            select: {
              interviewPreparation: { select: { userId: true } },
            },
          })
          if (career?.interviewPreparation?.userId !== ctx.userId) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: 'You do not have access to this career experience',
            })
          }
        }

        if (input.projectExperienceId) {
          const project = await prisma.projectExperience.findUnique({
            where: { id: input.projectExperienceId },
            select: {
              interviewPreparation: { select: { userId: true } },
            },
          })
          if (project?.interviewPreparation?.userId !== ctx.userId) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: 'You do not have access to this project experience',
            })
          }
        }

        // Create with userId - no post-creation verification needed
        return await keyAchievementService.create({
          ...input,
          userId: ctx.userId,
        })
      } catch (error) {
        handleServiceError(error)
      }
    }),

  /**
   * Update an existing KeyAchievement
   *
   * @refactored 2025-12-12: Moved from interview-prep-detail router
   */
  update: protectedProcedure
    .input(updateSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify ownership
        const existing = await keyAchievementService.findById(input.id)

        if (existing.userId !== ctx.userId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have access to this key achievement',
          })
        }

        return await keyAchievementService.update(input.id, input.data)
      } catch (error) {
        handleServiceError(error)
      }
    }),

  /**
   * Delete a KeyAchievement
   *
   * @refactored 2025-12-12: Moved from interview-prep-detail router
   */
  delete: protectedProcedure
    .input(deleteSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify ownership
        const existing = await keyAchievementService.findById(input.id)

        if (existing.userId !== ctx.userId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have access to this key achievement',
          })
        }

        await keyAchievementService.delete(input.id)
        return { success: true }
      } catch (error) {
        handleServiceError(error)
      }
    }),
})
