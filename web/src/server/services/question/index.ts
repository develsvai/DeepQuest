/**
 * Question Service
 *
 * Domain-based service for question operations.
 */

export { questionService } from './question.service'
export { questionGenerationService } from './generation.service'
export { autoQuestionGenerationService } from './auto-generation.service'
export type {
  QuestionListItem,
  ListByExperienceInput,
  ListQuestionsResult,
  StartQuestionGenerationInput,
  StartQuestionGenerationResult,
  // Question Create Types (V2 Webhook Handler용)
  GeneratedQuestionInput,
  CreateManyQuestionsInput,
  CreateManyQuestionsResult,
  // Single Question CRUD Types
  CreateQuestionInput,
  UpdateQuestionInput,
  QuestionWithOwner,
  // Auto Question Generation Types
  AutoQuestionGenerationInput,
  AutoQuestionGenerationResult,
  AutoStartGenerationInput,
  AutoQuestionGenMetadata,
} from './types'

// Today's Quest Selection
export { selectTodaysQuest } from './selection'
export type {
  SelectTodaysQuestInput,
  TodaysQuestResult,
  FeaturedQuest,
  RelatedQuest,
} from './selection'
