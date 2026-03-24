/**
 * Experience and Practice Question Types
 *
 * Type definitions for experience data and practice questions
 * used in the interview preparation practice flow.
 */

import { Rating } from '@/generated/prisma/enums'
import { Question } from '@/generated/prisma/browser'

/**
 * Re-export Experience types from interview.ts for consistency
 */
export type {
  Experience,
  CareerExperience,
  ProjectExperience,
} from './interview'

/**
 * Practice Question interface for the practice session
 * Note: followUpQuestions is always an empty array as per requirements
 */
export interface PracticeQuestion extends Omit<
  Question,
  | 'createdAt'
  | 'completedAt'
  | 'interviewPreparation'
  | 'parentQuestion'
  | 'followUpQuestions'
  | 'answers'
> {
  order: number
  isCompleted: boolean
  rating?: Rating
  estimatedTime?: number
  relatedExperience?: string
  followUpQuestions: [] // Always empty array as per requirements
  depth: number
}
