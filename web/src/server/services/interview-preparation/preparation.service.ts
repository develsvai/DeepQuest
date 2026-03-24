/**
 * Interview Preparation Service
 *
 * Core CRUD service for Interview Preparation domain.
 * Handles:
 * - Creating new preparations with resume parsing
 * - Fetching detailed preparation data
 * - Listing preparations for dashboard
 * - Status management (ready, failed)
 *
 * Pure business logic without HTTP/tRPC concerns.
 *
 * Related services (separated for SRP):
 * - resumeIngestionService: AI resume parsing result ingestion
 * - workflowTrackerService: Workflow progress tracking
 * - sidebarService: Sidebar data fetching
 * - weeklyGoalService: Weekly goal statistics
 */

import type { PrismaClient } from '@/generated/prisma/client'
import { PreparationStatus, AnswerStatus } from '@/generated/prisma/enums'
import { prisma } from '@/lib/db/prisma'
import { NotFoundError } from '@/server/services/common/errors'
import { calculateQuestionProgress } from '@/server/services/common/question-progress'
import { GraphName } from '@/server/services/ai/langgraph/types/graphs'
import type { ResumeParsingV2Input } from '@/server/services/ai/contracts/schemas/resumeParsingV2'
import { langGraphService } from '../ai/langgraph/service'
import {
  listPreparationInclude,
  type DashboardPreparation,
  type InterviewPrepDetailResult,
  type ExperienceQuestionCount,
  type CreateInterviewPrepParams,
  type CreateInterviewPrepResult,
} from './types'
import type {
  CareerWithDetails,
  ProjectWithDetails,
} from '@/server/services/experience'

// ============================================================================
// Verification Operations
// ============================================================================

/**
 * Verify that an interview preparation exists
 *
 * Simple existence check without ownership verification.
 * Use this when authorization is already done at Router layer.
 *
 * @param id - Interview preparation ID
 * @throws NotFoundError if not found
 */
export async function verifyExists(id: string): Promise<void> {
  const preparation = await prisma.interviewPreparation.findUnique({
    where: { id },
    select: { id: true },
  })
  if (!preparation) {
    throw new NotFoundError('InterviewPreparation', id)
  }
}

/**
 * Verify ownership of an interview preparation by user ID
 *
 * @param id - Interview preparation ID
 * @param userId - User ID
 * @returns true if valid
 * @throws NotFoundError if not found or not owned by user
 */
export async function verifyOwnershipByUserId(
  id: string,
  userId: string
): Promise<boolean> {
  const preparation = await prisma.interviewPreparation.findUnique({
    where: { id, userId },
  })
  if (!preparation) {
    throw new NotFoundError('InterviewPreparation', id)
  }
  return true
}

// ============================================================================
// Create Operations
// ============================================================================

/**
 * Creates a new InterviewPreparation and starts Resume Parsing workflow
 *
 * Steps:
 * 1. Create DB record (title, jobTitle)
 * 2. Start Resume Parsing via LangGraph
 * 3. Create WebhookEvent for tracking
 *
 * @param prismaClient - Prisma client instance
 * @param userId - User ID (Clerk)
 * @param params - Creation parameters
 * @returns Created preparationId and runId
 */
async function create(
  prismaClient: PrismaClient,
  userId: string,
  params: CreateInterviewPrepParams
): Promise<CreateInterviewPrepResult> {
  // Create DB record
  const preparation = await prismaClient.interviewPreparation.create({
    data: {
      userId,
      title: params.title,
      jobTitle: params.jobTitle,
      resumeFile: { connect: { id: params.resumeFileId } },
      status: 'PENDING',
    },
  })

  const resumeInput: ResumeParsingV2Input = {
    resumeFilePath: params.resumeFileUrl,
    appliedPosition: params.jobTitle,
    experienceNamesToAnalyze: params.experienceNames ?? [],
  }

  const run = await langGraphService.runResumeParser(
    resumeInput,
    preparation.id,
    params.locale
  )

  // Create WebhookEvent for tracking
  await prismaClient.webhookEvent.create({
    data: {
      userId,
      preparationId: preparation.id,
      runId: run.run_id,
      threadId: run.thread_id,
      graphName: GraphName.RESUME_PARSER,
      status: 'RUNNING',
      metadata: {
        resumeFileUrl: params.resumeFileUrl,
        locale: params.locale,
        startedAt: new Date().toISOString(),
      },
    },
  })

  return {
    success: true,
    preparationId: preparation.id,
  }
}

// ============================================================================
// Read Operations
// ============================================================================

/**
 * Fetches detailed interview preparation data by ID
 *
 * Returns preparation with careers, projects, educations, and question counts.
 *
 * @param id - The interview preparation ID
 * @returns Full preparation data with question counts
 * @throws NotFoundError if preparation doesn't exist
 */
async function getById(id: string): Promise<InterviewPrepDetailResult> {
  const preparation = await prisma.interviewPreparation.findUnique({
    where: { id },
    include: {
      careers: {
        include: { keyAchievements: true },
        orderBy: [{ index: 'asc' }, { endDate: 'desc' }],
      },
      projects: {
        include: { keyAchievements: true },
        orderBy: [{ index: 'asc' }, { endDate: 'desc' }],
      },
      educations: {
        orderBy: { endDate: 'desc' },
      },
    },
  })

  if (!preparation) {
    throw new NotFoundError('InterviewPreparation', id)
  }

  // Fetch question counts per experience
  const questionCounts = await getExperienceQuestionCounts(id)

  // Build question count lookup map
  const countMap = new Map<string, { total: number; completed: number }>()
  for (const count of questionCounts) {
    const key = `${count.experienceType}-${count.experienceId}`
    countMap.set(key, { total: count.total, completed: count.completed })
  }

  // Map careers with question counts (omit internal fields)
  const careers: CareerWithDetails[] = (preparation.careers ?? []).map(
    (career): CareerWithDetails => {
      const counts = countMap.get(`CAREER-${career.id}`) ?? {
        total: 0,
        completed: 0,
      }
      const {
        index: _idx,
        interviewPreparationId: _ipid,
        ...careerData
      } = career
      return {
        ...careerData,
        totalQuestions: counts.total,
        completedQuestions: counts.completed,
      }
    }
  )

  // Map projects with question counts (omit internal fields)
  const projects: ProjectWithDetails[] = (preparation.projects ?? []).map(
    (project): ProjectWithDetails => {
      const counts = countMap.get(`PROJECT-${project.id}`) ?? {
        total: 0,
        completed: 0,
      }
      const {
        index: _idx,
        interviewPreparationId: _ipid,
        ...projectData
      } = project
      return {
        ...projectData,
        totalQuestions: counts.total,
        completedQuestions: counts.completed,
      }
    }
  )

  return {
    id: preparation.id,
    userId: preparation.userId,
    title: preparation.title,
    jobTitle: preparation.jobTitle,
    summary: preparation.summary,
    yearsOfExperience: preparation.yearsOfExperience,
    status: preparation.status,
    errorMessage: preparation.errorMessage,
    errorCode: preparation.errorCode,
    totalQuestionGenTasks: preparation.totalQuestionGenTasks,
    completedQuestionGenTasks: preparation.completedQuestionGenTasks,
    careers,
    projects,
    educations: preparation.educations ?? [],
  }
}

/**
 * Lists all interview preparations for a user
 *
 * Returns pre-computed dashboard data with aggregated stats.
 *
 * @param userId - The user ID to filter by
 * @returns List of preparations with dashboard-ready data
 */
async function listByUserId(userId: string): Promise<DashboardPreparation[]> {
  const preparations = await prisma.interviewPreparation.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: listPreparationInclude,
  })

  return preparations.map(prep => ({
    id: prep.id,
    title: prep.title,
    jobTitle: prep.jobTitle,
    status: prep.status,
    createdAt: prep.createdAt,
    careers: prep.careers.map(c => ({
      id: c.id,
      company: c.company,
      position: c.position,
      techStack: c.techStack,
      keyAchievementsCount: c.keyAchievements.length,
      ...calculateQuestionProgress(c.keyAchievements),
    })),
    projects: prep.projects.map(p => ({
      id: p.id,
      projectName: p.projectName,
      position: p.position,
      techStack: p.techStack,
      keyAchievementsCount: p.keyAchievements.length,
      ...calculateQuestionProgress(p.keyAchievements),
    })),
  }))
}

/**
 * Lists pending interview preparation IDs for a user
 *
 * Used for Realtime subscription to track in-progress preparations.
 *
 * @param userId - The user ID to filter by
 * @returns Object with array of preparation IDs
 */
async function listPending(userId: string): Promise<{ ids: string[] }> {
  const preparations = await prisma.interviewPreparation.findMany({
    where: {
      userId,
      status: PreparationStatus.PENDING,
    },
    select: { id: true },
  })
  return { ids: preparations.map(p => p.id) }
}

// ============================================================================
// Update Operations
// ============================================================================

/**
 * Header data returned after update
 */
export interface UpdateHeaderResult {
  id: string
  title: string
  jobTitle: string | null
  yearsOfExperience: number | null
  summary: string[]
}

/**
 * Update header data for an interview preparation
 *
 * Allows partial updates to: title, jobTitle, yearsOfExperience, summary
 *
 * @param id - Interview preparation ID
 * @param data - Partial header data to update
 * @returns Updated header fields
 */
async function updateHeader(
  id: string,
  data: {
    title?: string
    jobTitle?: string | null
    yearsOfExperience?: number | null
    summary?: string[]
  }
): Promise<UpdateHeaderResult> {
  const updated = await prisma.interviewPreparation.update({
    where: { id },
    data: {
      title: data.title,
      jobTitle: data.jobTitle,
      yearsOfExperience: data.yearsOfExperience,
      summary: data.summary,
    },
    select: {
      id: true,
      title: true,
      jobTitle: true,
      yearsOfExperience: true,
      summary: true,
    },
  })

  return updated
}

// ============================================================================
// Status Update Operations
// ============================================================================

/**
 * Mark an interview preparation as failed
 *
 * Called when AI processing (resume parsing) fails.
 * Updates status to FAILED and stores error details.
 *
 * @param preparationId - Interview preparation ID
 * @param errorMessage - Human-readable error message
 * @param errorCode - Structured error code for client handling
 */
async function markAsFailed(
  preparationId: string,
  errorMessage: string,
  errorCode: string
): Promise<void> {
  await prisma.interviewPreparation.update({
    where: { id: preparationId },
    data: {
      status: PreparationStatus.FAILED,
      errorMessage,
      errorCode,
    },
  })
}

/**
 * Mark an interview preparation as ready
 *
 * Called when all processing (resume parsing + auto question generation) completes.
 *
 * @param preparationId - Interview preparation ID
 */
async function markAsReady(preparationId: string): Promise<void> {
  await prisma.interviewPreparation.update({
    where: { id: preparationId },
    data: {
      status: PreparationStatus.READY,
    },
  })
}

// ============================================================================
// Delete Operations
// ============================================================================

/**
 * Delete an interview preparation and all related data
 *
 * Cascade deletes (via Prisma schema onDelete: Cascade):
 * - CareerExperience → KeyAchievements → Questions → Answers
 * - ProjectExperience → KeyAchievements → Questions → Answers
 * - CandidateEducation
 * - FileUpload (resumeFile)
 * - StructuredJD
 * - WebhookEvents
 *
 * @param id - Interview preparation ID
 */
async function deletePreparation(id: string): Promise<void> {
  await prisma.interviewPreparation.delete({
    where: { id },
  })
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets question counts grouped by experience type and ID
 *
 * Refactored to use KeyAchievement path:
 * Experience -> KeyAchievement -> Question
 */
async function getExperienceQuestionCounts(
  preparationId: string
): Promise<ExperienceQuestionCount[]> {
  const results: ExperienceQuestionCount[] = []

  // Get career experiences with their question counts via KeyAchievements
  const careers = await prisma.careerExperience.findMany({
    where: { interviewPreparationId: preparationId },
    select: {
      id: true,
      keyAchievements: {
        select: {
          questions: {
            select: {
              answers: { select: { status: true } },
            },
          },
        },
      },
    },
  })

  for (const career of careers) {
    const questions = career.keyAchievements.flatMap(ka => ka.questions)
    results.push({
      experienceType: 'CAREER',
      experienceId: career.id,
      total: questions.length,
      completed: questions.filter(q =>
        q.answers.some(a => a.status === AnswerStatus.EVALUATED)
      ).length,
    })
  }

  // Get project experiences with their question counts via KeyAchievements
  const projects = await prisma.projectExperience.findMany({
    where: { interviewPreparationId: preparationId },
    select: {
      id: true,
      keyAchievements: {
        select: {
          questions: {
            select: {
              answers: { select: { status: true } },
            },
          },
        },
      },
    },
  })

  for (const project of projects) {
    const questions = project.keyAchievements.flatMap(ka => ka.questions)
    results.push({
      experienceType: 'PROJECT',
      experienceId: project.id,
      total: questions.length,
      completed: questions.filter(q =>
        q.answers.some(a => a.status === AnswerStatus.EVALUATED)
      ).length,
    })
  }

  return results
}

// ============================================================================
// Export Service Object
// ============================================================================

export const preparationService = {
  // Verification
  verifyExists,
  verifyOwnershipByUserId,
  // Core CRUD
  create,
  getById,
  listByUserId,
  listPending,
  updateHeader,
  // Status management
  markAsFailed,
  markAsReady,
  // Delete
  deletePreparation,
}
