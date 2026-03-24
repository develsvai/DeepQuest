/**
 * Interview Preparation Service
 *
 * Barrel export for Interview Preparation domain services.
 *
 * ## 서비스 구조 (옵션 A: 책임 기반 네이밍)
 *
 * - preparationService: Core CRUD operations (create, read, update, delete)
 * - resumeIngestionService: AI 파싱 결과 수집/저장
 * - workflowTrackerService: 워크플로우 진행 상태 추적 (경험 선택, 작업 완료 추적)
 * - sidebarService: Sidebar 데이터 조회 (Read Model)
 * - weeklyGoalService: 주간 목표 통계 조회 (Read Model)
 *
 * ## 아키텍처 진화 방향 (옵션 B: CQRS 패턴)
 *
 * 복잡도가 증가하면 commands/queries 디렉토리로 분리 고려:
 *
 * ```
 * interview-preparation/
 * ├── preparation.service.ts     # Core CRUD (유지)
 * ├── commands/
 * │   ├── ingest-resume.ts       # resumeIngestionService
 * │   └── track-workflow.ts      # workflowTrackerService
 * ├── queries/
 * │   ├── sidebar.ts             # sidebarService
 * │   └── weekly-goal.ts         # weeklyGoalService
 * ```
 *
 * NOTE: Experience detail operations are in @/server/services/experience
 */

// ============================================================================
// Service Exports
// ============================================================================

export { preparationService } from './preparation.service'
export { resumeIngestionService } from './resume-ingestion.service'
export { workflowTrackerService } from './workflow-tracker.service'
export { sidebarService } from './sidebar.service'
export { weeklyGoalService } from './weekly-goal.service'

// ============================================================================
// Type Exports
// ============================================================================

export type {
  // Dashboard types
  DetailedPreparation,
  DashboardPreparation,
  DashboardCareer,
  DashboardProject,
  QuestionProgress,
  // Interview Prep Detail types (includes re-exported CareerWithDetails, ProjectWithDetails)
  InterviewPrepDetailResult,
  EducationData,
  ExperienceQuestionCount,
  // Create types
  CreateInterviewPrepParams,
  CreateInterviewPrepResult,
  // Resume Parsing Result types
  SaveResumeResult,
  // Sidebar types
  ListForSidebarInput,
  SidebarPreparation,
  SidebarExperience,
  SidebarKeyAchievement,
  // Weekly Goal types
  DailyCompletedCount,
  WeeklyGoalServiceResult,
  // Experience Scoring types
  ExperienceScoringData,
  ExperienceScoreResult,
} from './types'
