/**
 * Interview preparation related type definitions
 */

import { Rating } from '@/generated/prisma/enums'

/**
 * Interview preparation status mapped for UI usage
 */
export type InterviewStatus = 'PROCESSING' | 'READY' | 'FAILED'

/**
 * Question categories for interview questions
 */
export type QuestionCategory = 'career' | 'project' | 'technical' | 'behavioral'

/**
 * Experience types for interview preparation detail
 */
export type ExperienceType = 'career' | 'project'

/**
 * Interview preparation summary for list display
 */
/**
 * Structured job description data from AI analysis
 */
export interface StructuredJobDescription {
  id: string
  cultureAndValues: string[]
  teamIntroduction: string[]
  coreServiceProduct: string[]
  techStack: string[]
  responsibilities: string[]
  qualifications: {
    required: string[]
    preferred?: string[]
  }
}

export interface PreparationSummary {
  id: string
  userId: string
  companyName: string
  jobTitle: string
  jobDescription?: string
  status: InterviewStatus
  progress: number
  questionsCount: number
  completedCount: number
  createdAt: string
  updatedAt: string
  structuredJD?: {
    responsibilities?: string[]
    techStack?: string[]
    cultureAndValues?: string[]
    coreServiceProduct?: string[]
  }
}

/**
 * STAR methodology analysis for experiences
 */
export interface STARAnalysis {
  situation: string
  task: string
  action: string
  result: string
}

/**
 * Career experience entry with STAR analysis
 */
export interface CareerExperience {
  id: string
  type: 'career'
  company: string
  position: string
  startDate: string
  endDate: string
  description: string
  responsibilities: string[]
  technologies: string[]
  situations: string[]
  tasks: string[]
  actions: string[]
  achievements: string[]
  relatedQuestions: number
  completedQuestions: number
  progress: number
}

/**
 * Project experience entry with STAR analysis
 */
export interface ProjectExperience {
  id: string
  type: 'project'
  title: string
  organization?: string
  startDate: string
  endDate: string
  description: string
  responsibilities: string[]
  technologies: string[]
  situations: string[]
  tasks: string[]
  actions: string[]
  achievements: string[]
  relatedQuestions: number
  completedQuestions: number
  progress: number
}

/**
 * Union type for all experience types
 */
export type Experience = CareerExperience | ProjectExperience

/**
 * Detailed interview preparation data for detail page
 */
export interface PreparationDetail extends PreparationSummary {
  experiences: Experience[]
  totalExperiences: number
  completedExperiences: number
  experienceProgress: number
  structuredJobDescription?: StructuredJobDescription
}

/**
 * Follow-up question option during selection phase
 */
export interface FollowUpQuestionOption {
  id: string
  questionText: string
  category: QuestionCategory
}

/**
 * Interview question data
 */
export interface Question {
  id: string
  preparationId: string
  text: string
  category: QuestionCategory
  order: number
  isCompleted: boolean
  rating?: Rating
  parentQuestionId?: string
  depth: number
}

/**
 * User's answer to a question
 */
export interface Answer {
  id: string
  questionId: string
  text: string
  audioUrl?: string
  duration?: number
  createdAt: string
}
