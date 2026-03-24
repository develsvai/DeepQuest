/**
 * Sidebar Service
 *
 * Service for sidebar data retrieval and transformation.
 * Provides minimal data needed for sidebar rendering.
 */

import { PreparationStatus } from '@/generated/prisma/enums'
import { prisma } from '@/lib/db/prisma'
import {
  sidebarPreparationSelect,
  type ListForSidebarInput,
  type SidebarPreparation,
  type SidebarExperience,
  type PreparationForSidebar,
} from './types'

/**
 * Transform Prisma result to SidebarPreparation type
 *
 * @param prep - Prisma query result
 * @returns Transformed sidebar preparation data
 */
function transformToSidebarPreparation(
  prep: PreparationForSidebar
): SidebarPreparation {
  const experiences: SidebarExperience[] = [
    // Career experiences
    ...prep.careers.map(career => ({
      id: career.id,
      type: 'CAREER' as const,
      name: career.company,
      questionCount: career.keyAchievements.reduce(
        (sum, ka) => sum + ka._count.questions,
        0
      ),
      keyAchievements: career.keyAchievements.map(ka => ({
        id: ka.id,
        title: ka.title,
      })),
    })),
    // Project experiences
    ...prep.projects.map(project => ({
      id: project.id,
      type: 'PROJECT' as const,
      name: project.projectName,
      questionCount: project.keyAchievements.reduce(
        (sum, ka) => sum + ka._count.questions,
        0
      ),
      keyAchievements: project.keyAchievements.map(ka => ({
        id: ka.id,
        title: ka.title,
      })),
    })),
  ]

  const totalQuestions = experiences.reduce(
    (sum, exp) => sum + exp.questionCount,
    0
  )

  return {
    id: prep.id,
    title: prep.title,
    totalQuestions,
    experiences,
  }
}

/**
 * List preparations for sidebar display
 *
 * Fetches minimal data needed for sidebar rendering:
 * - Preparation id, title
 * - Experience id, name
 * - KeyAchievement id, title
 * - Question counts per keyAchievement
 *
 * Only includes READY and ANALYZING status preparations.
 *
 * @param input - userId and optional limit
 * @returns Array of SidebarPreparation
 */
async function listForSidebar(
  input: ListForSidebarInput
): Promise<SidebarPreparation[]> {
  const { userId, limit = 10 } = input

  const preparations = await prisma.interviewPreparation.findMany({
    where: {
      userId,
      status: {
        in: [PreparationStatus.READY, PreparationStatus.ANALYZING],
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: limit,
    select: sidebarPreparationSelect,
  })

  return preparations.map(transformToSidebarPreparation)
}

export const sidebarService = {
  listForSidebar,
}
