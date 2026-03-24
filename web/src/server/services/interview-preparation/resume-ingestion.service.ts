/**
 * Resume Ingestion Service
 *
 * Ingests AI-parsed resume data into the InterviewPreparation aggregate.
 * Handles Career, Project, Education, and KeyAchievement creation.
 *
 * "Ingestion" 용어 선택 이유:
 * - "Parsing"은 AI 서버에서 수행되는 작업
 * - 이 서비스는 파싱된 결과를 "수집/저장"하는 역할
 *
 * ## DDD 설계 결정
 *
 * Q: 왜 careerService, projectService 등 별도 도메인 서비스로 분리하지 않았는가?
 *
 * A: CareerExperience, ProjectExperience, KeyAchievement는 InterviewPreparation
 *    외부에서 독립적으로 생성되지 않음 (schema.prisma 참고: 항상 preparationId 필수).
 *    따라서 Aggregate Root가 직접 하위 Entity를 생성하는 것이 DDD 원칙에 부합.
 *
 * ## 아키텍처 진화 방향 (CQRS 고려)
 *
 * 현재: 단일 서비스 파일 (옵션 A - 책임 기반 네이밍)
 * 향후: 복잡도 증가 시 commands/ 디렉토리로 분리 가능
 *
 * @see workflow-tracker.service.ts 헤더 주석 참고
 */

import type {
  Prisma,
  CareerExperience,
  ProjectExperience,
} from '@/generated/prisma/client'
import { DegreeType } from '@/generated/prisma/enums'
import { prisma } from '@/lib/db/prisma'
import { calculateTotalYearsOfExperience } from './utils/date-utils'
import type {
  ResumeParseResultV2,
  EducationV2,
} from '@/server/services/ai/contracts/schemas/resumeParsingV2'
import type {
  CareerExperienceV2,
  ProjectExperienceV2,
  KeyAchievement,
} from '@/server/services/ai/contracts/schemas/common'
import type { SaveResumeResult } from './types'

// ============================================================================
// Main Service Function
// ============================================================================

/**
 * Resume 파싱 결과를 InterviewPreparation에 저장
 *
 * Aggregate Root(InterviewPreparation)가 하위 Entity 생성을 orchestrate:
 * - InterviewPreparation: summary, yearsOfExperience 업데이트
 * - CandidateEducation: 학력 정보 생성
 * - CareerExperience: 경력 + KeyAchievements 생성
 * - ProjectExperience: 프로젝트 + KeyAchievements 생성
 *
 * @param preparationId - InterviewPreparation ID
 * @param userId - User ID (KeyAchievement 소유권용)
 * @param data - AI 서버에서 파싱된 이력서 데이터
 * @returns 생성된 Entity ID들과 통계
 */
async function processResumeParsingResult(
  preparationId: string,
  userId: string,
  data: ResumeParseResultV2
): Promise<SaveResumeResult> {
  return prisma.$transaction(async tx => {
    // 1. InterviewPreparation 업데이트 (summary + yearsOfExperience)
    // Note: status는 PENDING 유지, 자동 문제 생성 완료 후 READY로 변경됨
    const yearsOfExperience = calculateTotalYearsOfExperience(
      data.workExperiences
    )
    await tx.interviewPreparation.update({
      where: { id: preparationId },
      data: {
        summary: data.summary, // string[] from Zod schema (default: [])
        yearsOfExperience,
      },
    })

    // 2. CandidateEducation 일괄 생성
    if (data.educations.length > 0) {
      await tx.candidateEducation.createMany({
        data: data.educations.map((education: EducationV2) => ({
          interviewPreparationId: preparationId,
          institution: education.institution,
          degree: mapDegreeType(education.degree),
          major: education.major,
          startDate: education.duration?.startDate ?? null,
          endDate: education.duration?.endDate ?? null,
          description: education.description ?? '',
        })),
      })
    }

    // 3. Global index 계산 (keyAchievements 개수 기준 내림차순)
    const { careerIndexMap, projectIndexMap } = calculateGlobalExperienceIndex(
      data.workExperiences,
      data.projectExperiences
    )

    // 4. CareerExperience + KeyAchievements 저장
    const careerExperienceIds = await saveCareerExperiences(
      tx,
      preparationId,
      userId,
      data.workExperiences,
      careerIndexMap
    )

    // 5. ProjectExperience + KeyAchievements 저장
    const projectExperienceIds = await saveProjectExperiences(
      tx,
      preparationId,
      userId,
      data.projectExperiences,
      projectIndexMap
    )

    // KeyAchievement 총 개수 계산
    const keyAchievementCount =
      data.workExperiences.reduce(
        (sum, c) => sum + c.keyAchievements.length,
        0
      ) +
      data.projectExperiences.reduce(
        (sum, p) => sum + p.keyAchievements.length,
        0
      )

    return {
      careerExperienceIds,
      projectExperienceIds,
      keyAchievementCount,
    }
  })
}

// ============================================================================
// Internal Helper Functions
// ============================================================================

/**
 * CareerExperience + KeyAchievements 저장
 */
async function saveCareerExperiences(
  tx: Prisma.TransactionClient,
  preparationId: string,
  userId: string,
  careers: CareerExperienceV2[],
  indexMap: Map<number, number>
): Promise<number[]> {
  if (careers.length === 0) return []

  const createdCareers = await tx.careerExperience.createManyAndReturn({
    data: careers.map((career, i) => ({
      interviewPreparationId: preparationId,
      company: career.company,
      companyDescription: career.companyDescription ?? '',
      employeeType: career.employeeType,
      jobLevel: career.jobLevel,
      startDate: career.duration?.startDate ?? null,
      endDate: career.duration?.endDate ?? null,
      isCurrent: career.duration?.isCurrent ?? false,
      techStack: career.techStack,
      architecture: career.architecture?.description ?? null,
      architectureMermaid: career.architecture?.mermaid ?? null,
      position: career.position,
      links: career.links,
      index: indexMap.get(i) ?? 0,
    })),
  })

  // KeyAchievements 저장
  for (let i = 0; i < createdCareers.length; i++) {
    const career = createdCareers[i]
    const keyAchievements = careers[i].keyAchievements
    if (keyAchievements.length > 0) {
      await saveKeyAchievements(
        tx,
        career.id,
        'career',
        userId,
        keyAchievements
      )
    }
  }

  return createdCareers.map((c: CareerExperience) => c.id)
}

/**
 * ProjectExperience + KeyAchievements 저장
 */
async function saveProjectExperiences(
  tx: Prisma.TransactionClient,
  preparationId: string,
  userId: string,
  projects: ProjectExperienceV2[],
  indexMap: Map<number, number>
): Promise<number[]> {
  if (projects.length === 0) return []

  const createdProjects = await tx.projectExperience.createManyAndReturn({
    data: projects.map((project, i) => ({
      interviewPreparationId: preparationId,
      projectName: project.projectName,
      projectDescription: project.projectDescription,
      projectType: project.projectType,
      teamComposition: project.teamComposition,
      teamSize: null,
      startDate: project.duration?.startDate ?? null,
      endDate: project.duration?.endDate ?? null,
      isCurrent: project.duration?.isCurrent ?? false,
      techStack: project.techStack,
      architecture: project.architecture?.description ?? null,
      architectureMermaid: project.architecture?.mermaid ?? null,
      position: project.position,
      links: project.links,
      index: indexMap.get(i) ?? 0,
    })),
  })

  // KeyAchievements 저장
  for (let i = 0; i < createdProjects.length; i++) {
    const project = createdProjects[i]
    const keyAchievements = projects[i].keyAchievements
    if (keyAchievements.length > 0) {
      await saveKeyAchievements(
        tx,
        project.id,
        'project',
        userId,
        keyAchievements
      )
    }
  }

  return createdProjects.map((p: ProjectExperience) => p.id)
}

/**
 * KeyAchievements 일괄 저장
 */
async function saveKeyAchievements(
  tx: Prisma.TransactionClient,
  experienceId: number,
  experienceType: 'career' | 'project',
  userId: string,
  achievements: KeyAchievement[]
): Promise<void> {
  await tx.keyAchievement.createMany({
    data: achievements.map((achievement, index) => ({
      userId,
      careerExperienceId: experienceType === 'career' ? experienceId : null,
      projectExperienceId: experienceType === 'project' ? experienceId : null,
      title: achievement.title,
      problems: achievement.problems,
      actions: achievement.actions,
      results: achievement.results,
      reflections: achievement.reflections,
      orderIndex: index,
    })),
  })
}

/**
 * AI 서버 degree 문자열을 Prisma DegreeType enum으로 변환
 */
function mapDegreeType(degree: string | null): DegreeType | null {
  if (!degree) return null

  const normalized = degree.toUpperCase().trim()

  if (Object.values(DegreeType).includes(normalized as DegreeType)) {
    return normalized as DegreeType
  }

  const mapping: Record<string, DegreeType> = {
    BACHELOR: DegreeType.BACHELOR,
    "BACHELOR'S": DegreeType.BACHELOR,
    BS: DegreeType.BACHELOR,
    BA: DegreeType.BACHELOR,
    MASTER: DegreeType.MASTER,
    "MASTER'S": DegreeType.MASTER,
    MS: DegreeType.MASTER,
    MA: DegreeType.MASTER,
    MBA: DegreeType.MASTER,
    DOCTOR: DegreeType.DOCTOR,
    DOCTORATE: DegreeType.DOCTOR,
    PHD: DegreeType.DOCTOR,
    'PH.D': DegreeType.DOCTOR,
    ASSOCIATE: DegreeType.ASSOCIATE,
    'HIGH SCHOOL': DegreeType.HIGH_SCHOOL,
    HIGHSCHOOL: DegreeType.HIGH_SCHOOL,
  }

  return mapping[normalized] ?? DegreeType.OTHER
}

/**
 * 글로벌 experience index 계산
 *
 * Career와 Project를 합쳐서 keyAchievements 개수 기준
 * 내림차순으로 정렬한 뒤 글로벌 인덱스 계산
 */
function calculateGlobalExperienceIndex(
  careers: CareerExperienceV2[],
  projects: ProjectExperienceV2[]
): {
  careerIndexMap: Map<number, number>
  projectIndexMap: Map<number, number>
} {
  type ExperienceForIndexing = {
    type: 'career' | 'project'
    originalIndex: number
    achievementCount: number
  }

  const allExperiences: ExperienceForIndexing[] = [
    ...careers.map((c, i) => ({
      type: 'career' as const,
      originalIndex: i,
      achievementCount: c.keyAchievements?.length ?? 0,
    })),
    ...projects.map((p, i) => ({
      type: 'project' as const,
      originalIndex: i,
      achievementCount: p.keyAchievements?.length ?? 0,
    })),
  ]

  allExperiences.sort((a, b) => b.achievementCount - a.achievementCount)

  const careerIndexMap = new Map<number, number>()
  const projectIndexMap = new Map<number, number>()

  allExperiences.forEach((exp, globalIndex) => {
    if (exp.type === 'career') {
      careerIndexMap.set(exp.originalIndex, globalIndex)
    } else {
      projectIndexMap.set(exp.originalIndex, globalIndex)
    }
  })

  return { careerIndexMap, projectIndexMap }
}

export const resumeIngestionService = {
  processResumeParsingResult,
}
