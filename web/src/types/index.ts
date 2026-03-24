/**
 * Centralized type exports
 * Import types from this file to ensure consistency across the application
 */

// User types
export type { User } from './user'

// Interview types
export type {
  InterviewStatus,
  QuestionCategory,
  ExperienceType,
  PreparationSummary,
  STARAnalysis,
  CareerExperience,
  ProjectExperience,
  Experience,
  PreparationDetail,
  FollowUpQuestionOption,
  Question,
  Answer,
  StructuredJobDescription,
} from './interview'

// API types
export type { ApiResponse, PaginatedResponse, ApiError } from './api'
