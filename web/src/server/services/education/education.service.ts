/**
 * Education Service
 *
 * Handles CRUD operations for CandidateEducation.
 */

import { prisma } from '@/lib/db/prisma'
import { NotFoundError } from '@/server/services/common/errors'
import { withNotFoundHandler } from '@/server/services/common/prisma-errors'
import { preparationService } from '@/server/services/interview-preparation'
import type {
  EducationData,
  CreateEducationInput,
  UpdateEducationInput,
} from './types'

/**
 * Creates a new CandidateEducation
 *
 * @param interviewPreparationId - The interview preparation ID to attach this education to
 * @param data - Education creation data
 * @returns Created education data
 * @throws NotFoundError if interview preparation doesn't exist
 */
async function createEducation(
  interviewPreparationId: string,
  data: CreateEducationInput
): Promise<EducationData> {
  // Verify interview preparation exists (domain-oriented delegation)
  await preparationService.verifyExists(interviewPreparationId)

  // Create education
  return await prisma.candidateEducation.create({
    data: {
      interviewPreparationId,
      ...data,
    },
  })
}

/**
 * Updates an existing CandidateEducation
 *
 * @param id - Education ID to update
 * @param data - Education update data
 * @returns Updated education data
 * @throws NotFoundError if education doesn't exist
 */
async function updateEducation(
  id: number,
  data: UpdateEducationInput
): Promise<EducationData> {
  return withNotFoundHandler('CandidateEducation', id, () =>
    prisma.candidateEducation.update({ where: { id }, data })
  )
}

/**
 * Deletes a CandidateEducation
 *
 * @param id - Education ID to delete
 * @throws NotFoundError if education doesn't exist
 */
async function deleteEducation(id: number): Promise<void> {
  await withNotFoundHandler('CandidateEducation', id, () =>
    prisma.candidateEducation.delete({ where: { id } })
  )
}

/**
 * Verifies user ownership of a CandidateEducation
 *
 * Fetches the education to get interviewPreparationId, then verifies ownership.
 * Use this before update/delete operations.
 *
 * @param id - Education ID
 * @param userId - User ID to verify ownership
 * @returns The interviewPreparationId for further use
 * @throws NotFoundError if education doesn't exist
 * @throws NotFoundError if preparation not found or not owned by user
 */
async function verifyOwnership(id: number, userId: string): Promise<string> {
  const education = await prisma.candidateEducation.findUnique({
    where: { id },
    select: { interviewPreparationId: true },
  })

  if (!education) {
    throw new NotFoundError('CandidateEducation', id)
  }

  await preparationService.verifyOwnershipByUserId(
    education.interviewPreparationId,
    userId
  )

  return education.interviewPreparationId
}

export const educationService = {
  createEducation,
  updateEducation,
  deleteEducation,
  verifyOwnership,
}
