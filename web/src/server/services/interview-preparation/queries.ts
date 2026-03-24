/**
 * Interview Preparation Prisma Query Configurations
 *
 * Centralized Prisma Include/Select configurations for Interview Preparation queries.
 * Separated from types.ts for better separation of concerns.
 *
 * @usage Import these configs in service files for type-safe queries:
 * ```typescript
 * import { detailedPreparationInclude } from './queries'
 *
 * const result = await prisma.interviewPreparation.findUnique({
 *   where: { id },
 *   include: detailedPreparationInclude,
 * })
 * ```
 */

import type { Prisma } from '@/generated/prisma/client'

// ============================================================================
// Detailed View Query Config
// ============================================================================

/**
 * Include configuration for getDetailedById
 *
 * Returns full preparation with all nested relations:
 * - careers (sorted by keyAchievements count desc, endDate desc)
 * - projects (sorted by keyAchievements count desc, endDate desc)
 * - educations
 *
 * Note: Questions are accessed through KeyAchievement path (KeyAchievement → Question)
 */
export const detailedPreparationInclude = {
  careers: {
    orderBy: [
      { keyAchievements: { _count: 'desc' as const } },
      { endDate: 'desc' as const },
    ],
  },
  projects: {
    orderBy: [
      { keyAchievements: { _count: 'desc' as const } },
      { endDate: 'desc' as const },
    ],
  },
  educations: true,
} satisfies Prisma.InterviewPreparationInclude

// ============================================================================
// Dashboard List Query Config
// ============================================================================

/**
 * Include configuration for list (Dashboard view)
 *
 * Returns preparations with dashboard-relevant data:
 * - careers with keyAchievements and question completion
 * - projects with keyAchievements and question completion
 */
export const listPreparationInclude = {
  careers: {
    select: {
      id: true,
      company: true,
      jobLevel: true,
      position: true,
      techStack: true,
      keyAchievements: {
        select: {
          id: true,
          questions: {
            select: {
              answers: { select: { status: true } },
            },
          },
        },
      },
    },
    orderBy: [
      { keyAchievements: { _count: 'desc' as const } },
      { endDate: 'desc' as const },
    ],
  },
  projects: {
    select: {
      id: true,
      projectName: true,
      position: true,
      techStack: true,
      keyAchievements: {
        select: {
          id: true,
          questions: {
            select: {
              answers: { select: { status: true } },
            },
          },
        },
      },
    },
    orderBy: [
      { keyAchievements: { _count: 'desc' as const } },
      { endDate: 'desc' as const },
    ],
  },
} satisfies Prisma.InterviewPreparationInclude

// ============================================================================
// Sidebar Query Config
// ============================================================================

/**
 * Prisma select configuration for sidebar display
 * Minimal data fetching: only fields required for sidebar rendering
 */
export const sidebarPreparationSelect = {
  id: true,
  title: true,
  careers: {
    orderBy: { index: 'asc' as const },
    select: {
      id: true,
      company: true,
      keyAchievements: {
        orderBy: { orderIndex: 'asc' as const },
        select: {
          id: true,
          title: true,
          _count: { select: { questions: true } },
        },
      },
    },
  },
  projects: {
    orderBy: { index: 'asc' as const },
    select: {
      id: true,
      projectName: true,
      keyAchievements: {
        orderBy: { orderIndex: 'asc' as const },
        select: {
          id: true,
          title: true,
          _count: { select: { questions: true } },
        },
      },
    },
  },
} satisfies Prisma.InterviewPreparationSelect
