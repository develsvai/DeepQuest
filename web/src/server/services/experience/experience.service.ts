/**
 * Experience Service
 *
 * Experience 도메인 통합 서비스
 * - AI 질문 생성을 위한 데이터 조회 및 변환
 * - UI 상세 페이지용 데이터 조회 (question progress 포함)
 */

import type { Prisma } from '@/generated/prisma/client'
import { AnswerStatus, ExperienceType } from '@/generated/prisma/enums'
import { prisma } from '@/lib/db/prisma'
import { NotFoundError } from '@/server/services/common/errors'
import { withNotFoundHandler } from '@/server/services/common/prisma-errors'
import { calculateQuestionProgress } from '@/server/services/common/question-progress'
import { preparationService } from '@/server/services/interview-preparation'
import type {
  CareerExperienceV2,
  ProjectExperienceV2,
  Duration,
  Architecture,
  KeyAchievement,
} from '@/server/services/ai/contracts/schemas/common'
import type {
  ExperienceWithOwnership,
  GetForQuestionGenerationInput,
  CareerDetailWithAchievements,
  ProjectDetailWithAchievements,
  ExperienceDetailResult,
  CreateCareerInput,
  UpdateCareerInput,
  CreateProjectInput,
  UpdateProjectInput,
  CareerWithDetails,
  ProjectWithDetails,
} from './types'

// ============= Prisma Select Configurations (AI) =============

/**
 * Career Experience 조회용 Select 설정 (AI 질문 생성용)
 * InterviewPreparation 직접 연결
 */
const careerSelectForAI = {
  id: true,
  company: true,
  companyDescription: true,
  employeeType: true,
  jobLevel: true,
  startDate: true,
  endDate: true,
  isCurrent: true,
  techStack: true,
  architecture: true,
  architectureMermaid: true,
  position: true,
  links: true,
  keyAchievements: {
    orderBy: { orderIndex: 'asc' as const },
    select: {
      title: true,
      problems: true,
      actions: true,
      results: true,
      reflections: true,
    },
  },
  interviewPreparation: {
    select: {
      id: true,
      jobTitle: true,
    },
  },
} satisfies Prisma.CareerExperienceSelect

/**
 * Project Experience 조회용 Select 설정
 * InterviewPreparation 직접 연결
 */
const projectSelectForAI = {
  id: true,
  projectName: true,
  projectDescription: true,
  projectType: true,
  teamSize: true,
  teamComposition: true,
  startDate: true,
  endDate: true,
  isCurrent: true,
  techStack: true,
  architecture: true,
  architectureMermaid: true,
  position: true,
  links: true,
  keyAchievements: {
    orderBy: { orderIndex: 'asc' as const },
    select: {
      title: true,
      problems: true,
      actions: true,
      results: true,
      reflections: true,
    },
  },
  interviewPreparation: {
    select: {
      id: true,
      jobTitle: true,
    },
  },
} satisfies Prisma.ProjectExperienceSelect

// Inferred types from Prisma select
type CareerForAI = Prisma.CareerExperienceGetPayload<{
  select: typeof careerSelectForAI
}>
type ProjectForAI = Prisma.ProjectExperienceGetPayload<{
  select: typeof projectSelectForAI
}>

// ============= Transform Functions =============

/**
 * Prisma 날짜 필드를 AI Duration 객체로 변환
 */
function toDuration(
  startDate: string | null,
  endDate: string | null,
  isCurrent: boolean
): Duration | null {
  if (!startDate && !endDate && !isCurrent) {
    return null
  }
  return {
    startDate: startDate,
    endDate: endDate,
    isCurrent: isCurrent,
  }
}

/**
 * Prisma Architecture 필드를 AI Architecture 객체로 변환
 */
function toArchitecture(
  description: string | null,
  mermaid: string | null
): Architecture | null {
  if (!description) {
    return null
  }
  return {
    description: description,
    mermaid: mermaid,
  }
}

/**
 * Prisma KeyAchievement를 AI KeyAchievement로 변환
 */
function toKeyAchievements(
  achievements: {
    title: string
    problems: string[]
    actions: string[]
    results: string[]
    reflections: string[]
  }[]
): KeyAchievement[] {
  return achievements.map(a => ({
    title: a.title,
    problems: a.problems,
    actions: a.actions,
    results: a.results,
    reflections: a.reflections,
  }))
}

/**
 * Prisma CareerExperience를 AI CareerExperienceV2로 변환
 */
function toCareerExperienceV2(career: CareerForAI): CareerExperienceV2 {
  return {
    company: career.company,
    companyDescription: career.companyDescription,
    employeeType: career.employeeType,
    jobLevel: career.jobLevel,
    duration: toDuration(career.startDate, career.endDate, career.isCurrent),
    techStack: career.techStack,
    architecture: toArchitecture(
      career.architecture,
      career.architectureMermaid
    ),
    position: career.position,
    links: career.links,
    keyAchievements: toKeyAchievements(career.keyAchievements),
  }
}

/**
 * Prisma ProjectExperience를 AI ProjectExperienceV2로 변환
 */
function toProjectExperienceV2(project: ProjectForAI): ProjectExperienceV2 {
  return {
    projectName: project.projectName,
    projectDescription: project.projectDescription,
    projectType: project.projectType,
    teamComposition: project.teamComposition,
    duration: toDuration(project.startDate, project.endDate, project.isCurrent),
    techStack: project.techStack,
    architecture: toArchitecture(
      project.architecture,
      project.architectureMermaid
    ),
    position: project.position,
    links: project.links,
    keyAchievements: toKeyAchievements(project.keyAchievements),
  }
}

// ============= Service Methods =============

/**
 * Career Experience를 AI 스키마 형태로 조회
 *
 * @param careerExperienceId - Career Experience ID
 * @returns AI 스키마 형태의 Experience + ownership 정보
 * @throws NotFoundError if career experience or interview preparation not found
 */
async function getCareerForQuestionGeneration(
  careerExperienceId: number
): Promise<ExperienceWithOwnership> {
  const career = await prisma.careerExperience.findUnique({
    where: { id: careerExperienceId },
    select: careerSelectForAI,
  })

  if (!career) {
    throw new NotFoundError('CareerExperience', careerExperienceId)
  }

  if (!career.interviewPreparation) {
    throw new NotFoundError(
      'InterviewPreparation for Career',
      careerExperienceId
    )
  }

  return {
    experience: {
      experienceType: ExperienceType.CAREER,
      details: toCareerExperienceV2(career),
    },
    interviewPreparationId: career.interviewPreparation.id,
    appliedPosition: career.interviewPreparation.jobTitle ?? '',
  }
}

/**
 * Project Experience를 AI 스키마 형태로 조회
 *
 * @param projectExperienceId - Project Experience ID
 * @returns AI 스키마 형태의 Experience + ownership 정보
 * @throws NotFoundError if project experience or interview preparation not found
 */
async function getProjectForQuestionGeneration(
  projectExperienceId: number
): Promise<ExperienceWithOwnership> {
  const project = await prisma.projectExperience.findUnique({
    where: { id: projectExperienceId },
    select: projectSelectForAI,
  })

  if (!project) {
    throw new NotFoundError('ProjectExperience', projectExperienceId)
  }

  if (!project.interviewPreparation) {
    throw new NotFoundError(
      'InterviewPreparation for Project',
      projectExperienceId
    )
  }

  return {
    experience: {
      experienceType: 'PROJECT',
      details: toProjectExperienceV2(project),
    },
    interviewPreparationId: project.interviewPreparation.id,
    appliedPosition: project.interviewPreparation.jobTitle ?? '',
  }
}

/**
 * Experience를 AI 스키마 형태로 조회 (질문 생성용)
 *
 * Prisma 데이터를 AI InputState.experience 스키마에 맞게 변환
 * - duration 객체 생성 (startDate/endDate/isCurrent)
 * - architecture 객체 생성 (description/mermaid)
 * - keyAchievements 변환
 *
 * @param input - experienceType과 experienceId
 * @returns AI 스키마 형태의 Experience + ownership 정보
 * @throws NotFoundError if experience or interview preparation not found
 */
async function getForQuestionGeneration(
  input: GetForQuestionGenerationInput
): Promise<ExperienceWithOwnership> {
  const { experienceType, experienceId } = input

  if (experienceType === ExperienceType.CAREER) {
    return getCareerForQuestionGeneration(experienceId)
  } else {
    return getProjectForQuestionGeneration(experienceId)
  }
}

// ============= Prisma Select Configurations (UI) =============

/**
 * Select configuration for keyAchievements with question progress (UI용)
 * Includes questions to calculate totalQuestions and completedQuestions.
 */
const keyAchievementsSelectForUI = {
  orderBy: { orderIndex: 'asc' as const },
  include: {
    questions: {
      select: {
        answers: { select: { status: true } },
      },
    },
  },
} as const

/**
 * Select configuration for career experience (UI용)
 */
const careerSelectForUI = {
  id: true,
  company: true,
  companyDescription: true,
  employeeType: true,
  jobLevel: true,
  startDate: true,
  endDate: true,
  isCurrent: true,
  techStack: true,
  architecture: true,
  architectureMermaid: true,
  position: true,
  links: true,
  createdAt: true,
  updatedAt: true,
  keyAchievements: keyAchievementsSelectForUI,
  interviewPreparationId: true,
} satisfies Prisma.CareerExperienceSelect

/**
 * Select configuration for project experience (UI용)
 */
const projectSelectForUI = {
  id: true,
  projectName: true,
  projectDescription: true,
  projectType: true,
  teamSize: true,
  teamComposition: true,
  startDate: true,
  endDate: true,
  isCurrent: true,
  techStack: true,
  architecture: true,
  architectureMermaid: true,
  position: true,
  links: true,
  createdAt: true,
  updatedAt: true,
  keyAchievements: keyAchievementsSelectForUI,
  interviewPreparationId: true,
} satisfies Prisma.ProjectExperienceSelect

// Inferred types from Prisma select (UI)
type CareerForUI = Prisma.CareerExperienceGetPayload<{
  select: typeof careerSelectForUI
}>
// Note: ProjectForUI shares same keyAchievements structure as CareerForUI

// ============= Transform Functions (UI) =============

/**
 * Transforms keyAchievements by adding question progress counts.
 * Calculates totalQuestions and completedQuestions from included questions.
 * Completion is determined by Answer.status === EVALUATED (SSoT pattern).
 */
function transformKeyAchievementsForUI(
  achievements: CareerForUI['keyAchievements']
) {
  return achievements.map(achievement => {
    const { questions, ...achievementData } = achievement
    return {
      ...achievementData,
      totalQuestions: questions.length,
      completedQuestions: questions.filter(q =>
        q.answers.some(a => a.status === AnswerStatus.EVALUATED)
      ).length,
    }
  })
}

/**
 * Generic transform for UI experience data
 * Extracts interviewPreparationId and transforms keyAchievements
 */
function transformExperienceForUI<
  T extends {
    interviewPreparationId: string
    keyAchievements: CareerForUI['keyAchievements']
  },
>(
  experience: T
): {
  data: Omit<T, 'interviewPreparationId' | 'keyAchievements'> & {
    keyAchievements: ReturnType<typeof transformKeyAchievementsForUI>
  }
  interviewPreparationId: string
} {
  const { interviewPreparationId, keyAchievements, ...experienceData } =
    experience
  return {
    data: {
      ...experienceData,
      keyAchievements: transformKeyAchievementsForUI(keyAchievements),
    },
    interviewPreparationId,
  }
}

// ============= Service Methods (UI) =============

/**
 * Gets career experience by ID with key achievements (UI용)
 *
 * @param careerExperienceId - The career experience ID
 * @returns Career detail with achievements and preparation ID
 * @throws NotFoundError if career experience doesn't exist
 */
async function getCareerById(careerExperienceId: number): Promise<{
  data: CareerDetailWithAchievements
  interviewPreparationId: string
}> {
  const career = await prisma.careerExperience.findUnique({
    where: { id: careerExperienceId },
    select: careerSelectForUI,
  })

  if (!career) {
    throw new NotFoundError('CareerExperience', careerExperienceId)
  }

  return transformExperienceForUI(career)
}

/**
 * Gets project experience by ID with key achievements (UI용)
 *
 * @param projectExperienceId - The project experience ID
 * @returns Project detail with achievements and preparation ID
 * @throws NotFoundError if project experience doesn't exist
 */
async function getProjectById(projectExperienceId: number): Promise<{
  data: ProjectDetailWithAchievements
  interviewPreparationId: string
}> {
  const project = await prisma.projectExperience.findUnique({
    where: { id: projectExperienceId },
    select: projectSelectForUI,
  })

  if (!project) {
    throw new NotFoundError('ProjectExperience', projectExperienceId)
  }

  return transformExperienceForUI(project)
}

/**
 * Gets experience detail by type and ID (UI용)
 * Returns a discriminated union for type-safe handling
 *
 * @param experienceType - 'career' or 'project'
 * @param experienceId - The experience ID
 * @returns Experience detail result with type discriminator
 */
async function getExperienceById(
  experienceType: 'career' | 'project',
  experienceId: number
): Promise<ExperienceDetailResult> {
  if (experienceType === 'career') {
    const result = await getCareerById(experienceId)
    return { type: 'career', ...result }
  } else {
    const result = await getProjectById(experienceId)
    return { type: 'project', ...result }
  }
}

// ============= Prisma Select Configurations (CRUD) =============

/**
 * Select configuration for career experience with details (CRUD operations)
 * Includes achievements with question progress for return values
 */
const careerSelectForCRUD = {
  id: true,
  company: true,
  companyDescription: true,
  employeeType: true,
  jobLevel: true,
  startDate: true,
  endDate: true,
  isCurrent: true,
  techStack: true,
  architecture: true,
  architectureMermaid: true,
  position: true,
  links: true,
  createdAt: true,
  updatedAt: true,
  keyAchievements: {
    orderBy: { orderIndex: 'asc' as const },
    include: {
      questions: {
        select: {
          answers: { select: { status: true } },
        },
      },
    },
  },
} satisfies Prisma.CareerExperienceSelect

/**
 * Select configuration for project experience with details (CRUD operations)
 * Includes achievements with question progress for return values
 */
const projectSelectForCRUD = {
  id: true,
  projectName: true,
  projectDescription: true,
  projectType: true,
  teamSize: true,
  teamComposition: true,
  startDate: true,
  endDate: true,
  isCurrent: true,
  techStack: true,
  architecture: true,
  architectureMermaid: true,
  position: true,
  links: true,
  createdAt: true,
  updatedAt: true,
  keyAchievements: {
    orderBy: { orderIndex: 'asc' as const },
    include: {
      questions: {
        select: {
          answers: { select: { status: true } },
        },
      },
    },
  },
} satisfies Prisma.ProjectExperienceSelect

// Inferred types from Prisma select (CRUD)
type CareerForCRUD = Prisma.CareerExperienceGetPayload<{
  select: typeof careerSelectForCRUD
}>
// Note: ProjectForCRUD shares same keyAchievements structure as CareerForCRUD

// ============= Transform Functions (CRUD) =============

/**
 * Adds question progress to experience data
 * Generic helper that works with both Career and Project experiences
 */
function addQuestionProgress<
  T extends { keyAchievements: CareerForCRUD['keyAchievements'] },
>(experience: T): T & { totalQuestions: number; completedQuestions: number } {
  return {
    ...experience,
    ...calculateQuestionProgress(experience.keyAchievements),
  }
}

// ============= CRUD Service Methods (Career) =============

/**
 * Creates a new CareerExperience
 *
 * @param interviewPreparationId - The interview preparation ID to attach this career to
 * @param data - Career creation data
 * @returns Created career with details
 * @throws NotFoundError if interview preparation doesn't exist
 */
async function createCareer(
  interviewPreparationId: string,
  data: CreateCareerInput
): Promise<CareerWithDetails> {
  // Verify interview preparation exists (domain-oriented delegation)
  await preparationService.verifyExists(interviewPreparationId)

  // Create career experience
  const career = await prisma.careerExperience.create({
    data: {
      interviewPreparationId,
      ...data,
    },
    select: careerSelectForCRUD,
  })

  return addQuestionProgress(career)
}

/**
 * Updates an existing CareerExperience
 *
 * @param id - Career experience ID to update
 * @param data - Career update data
 * @returns Updated career with details
 * @throws NotFoundError if career experience doesn't exist
 */
async function updateCareer(
  id: number,
  data: UpdateCareerInput
): Promise<CareerWithDetails> {
  return withNotFoundHandler('CareerExperience', id, async () => {
    const career = await prisma.careerExperience.update({
      where: { id },
      data,
      select: careerSelectForCRUD,
    })
    return addQuestionProgress(career)
  })
}

/**
 * Deletes a CareerExperience
 * Cascade delete will handle related keyAchievements and questions
 *
 * @param id - Career experience ID to delete
 * @throws NotFoundError if career experience doesn't exist
 */
async function deleteCareer(id: number): Promise<void> {
  await withNotFoundHandler('CareerExperience', id, () =>
    prisma.careerExperience.delete({ where: { id } })
  )
}

// ============= CRUD Service Methods (Project) =============

/**
 * Creates a new ProjectExperience
 *
 * @param interviewPreparationId - The interview preparation ID to attach this project to
 * @param data - Project creation data
 * @returns Created project with details
 * @throws NotFoundError if interview preparation doesn't exist
 */
async function createProject(
  interviewPreparationId: string,
  data: CreateProjectInput
): Promise<ProjectWithDetails> {
  // Verify interview preparation exists (domain-oriented delegation)
  await preparationService.verifyExists(interviewPreparationId)

  // Create project experience
  const project = await prisma.projectExperience.create({
    data: {
      interviewPreparationId,
      ...data,
    },
    select: projectSelectForCRUD,
  })

  return addQuestionProgress(project)
}

/**
 * Updates an existing ProjectExperience
 *
 * @param id - Project experience ID to update
 * @param data - Project update data
 * @returns Updated project with details
 * @throws NotFoundError if project experience doesn't exist
 */
async function updateProject(
  id: number,
  data: UpdateProjectInput
): Promise<ProjectWithDetails> {
  return withNotFoundHandler('ProjectExperience', id, async () => {
    const project = await prisma.projectExperience.update({
      where: { id },
      data,
      select: projectSelectForCRUD,
    })
    return addQuestionProgress(project)
  })
}

/**
 * Deletes a ProjectExperience
 * Cascade delete will handle related keyAchievements and questions
 *
 * @param id - Project experience ID to delete
 * @throws NotFoundError if project experience doesn't exist
 */
async function deleteProject(id: number): Promise<void> {
  await withNotFoundHandler('ProjectExperience', id, () =>
    prisma.projectExperience.delete({ where: { id } })
  )
}

// ============= Ownership Verification =============

/**
 * Verifies user ownership of a CareerExperience
 *
 * Fetches the career to get interviewPreparationId, then verifies ownership.
 * Use this before update/delete operations.
 *
 * @param id - Career experience ID
 * @param userId - User ID to verify ownership
 * @returns The interviewPreparationId for further use
 * @throws NotFoundError if career doesn't exist
 * @throws NotFoundError if preparation not found or not owned by user
 */
async function verifyCareerOwnership(
  id: number,
  userId: string
): Promise<string> {
  const career = await prisma.careerExperience.findUnique({
    where: { id },
    select: { interviewPreparationId: true },
  })

  if (!career) {
    throw new NotFoundError('CareerExperience', id)
  }

  await preparationService.verifyOwnershipByUserId(
    career.interviewPreparationId,
    userId
  )

  return career.interviewPreparationId
}

/**
 * Verifies user ownership of a ProjectExperience
 *
 * Fetches the project to get interviewPreparationId, then verifies ownership.
 * Use this before update/delete operations.
 *
 * @param id - Project experience ID
 * @param userId - User ID to verify ownership
 * @returns The interviewPreparationId for further use
 * @throws NotFoundError if project doesn't exist
 * @throws NotFoundError if preparation not found or not owned by user
 */
async function verifyProjectOwnership(
  id: number,
  userId: string
): Promise<string> {
  const project = await prisma.projectExperience.findUnique({
    where: { id },
    select: { interviewPreparationId: true },
  })

  if (!project) {
    throw new NotFoundError('ProjectExperience', id)
  }

  await preparationService.verifyOwnershipByUserId(
    project.interviewPreparationId,
    userId
  )

  return project.interviewPreparationId
}

export const experienceService = {
  // AI 질문 생성용
  getForQuestionGeneration,
  getCareerForQuestionGeneration,
  getProjectForQuestionGeneration,
  // UI 상세 조회용
  getCareerById,
  getProjectById,
  getExperienceById,
  // CRUD - Career
  createCareer,
  updateCareer,
  deleteCareer,
  // CRUD - Project
  createProject,
  updateProject,
  deleteProject,
  // Ownership verification
  verifyCareerOwnership,
  verifyProjectOwnership,
}
