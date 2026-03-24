/**
 * Experience Service
 *
 * Experience 도메인 통합 서비스
 * - AI 질문 생성용
 * - UI 상세 조회용
 */

export { experienceService } from './experience.service'
export type {
  // AI types
  ExperienceForAI,
  ExperienceWithOwnership,
  GetForQuestionGenerationInput,
  // UI detail types
  KeyAchievementWithProgress,
  CareerDetailWithAchievements,
  ProjectDetailWithAchievements,
  ExperienceDetailResult,
  // Interview prep summary types
  CareerWithDetails,
  ProjectWithDetails,
  // CRUD input types
  CreateCareerInput,
  UpdateCareerInput,
  CreateProjectInput,
  UpdateProjectInput,
} from './types'
