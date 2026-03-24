/**
 * Answer Domain Service
 *
 * Unified domain for Answer and Feedback operations.
 * Follows domain-centric architecture pattern.
 */

export { answerService } from './answer.service'
export { feedbackService } from './feedback.service'
export type {
  // Answer types
  SubmitAnswerInput,
  SubmitAnswerResult,
  GetWithFeedbackInput,
  AnswerWithFeedbackResult,
  AnswerData,
  FeedbackData,
  // Feedback types
  GetFeedbackGenInputInput,
  FeedbackV2Input,
  SaveFeedbackResultInput,
  SaveFeedbackResultResult,
} from './types'
