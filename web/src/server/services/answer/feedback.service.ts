/**
 * Feedback Service
 *
 * Handles feedback generation input preparation and saving.
 * Uses V2 schema with rating object (level + rationale).
 */

import { prisma } from '@/lib/db/prisma'
import { AnswerStatus, ExperienceType, Prisma } from '@/generated/prisma/client'
import { getPostHogClient } from '@/lib/posthog-server'
import { POSTHOG_EVENTS, POSTHOG_PERSON_PROPERTIES } from '@/lib/posthog-events'
import { NotFoundError } from '@/server/services/common/errors'
import type {
  GetFeedbackGenInputInput,
  SaveFeedbackResultInput,
  SaveFeedbackResultResult,
} from './types'
import type { QuestionFeedbackGenGraphInputV2 } from '@/server/services/ai/contracts/schemas/questionFeedbackGen'
import type {
  CareerExperienceBase,
  ProjectExperienceBase,
} from '@/server/services/ai/contracts/schemas/common'

// Prisma include for full context
const answerWithFullContextInclude = {
  question: {
    include: {
      keyAchievement: {
        include: {
          careerExperience: true,
          projectExperience: true,
        },
      },
    },
  },
} satisfies Prisma.AnswerInclude

type AnswerWithFullContext = Prisma.AnswerGetPayload<{
  include: typeof answerWithFullContextInclude
}>

/**
 * Verify answer ownership via Answer → Question → KeyAchievement → userId
 *
 * @returns Answer with full context for further processing
 * @throws NotFoundError if answer not found or user doesn't own it
 */
async function verifyAnswerOwnership(
  answerId: string,
  userId: string
): Promise<AnswerWithFullContext> {
  const answer = await prisma.answer.findUnique({
    where: { id: answerId },
    include: answerWithFullContextInclude,
  })

  if (!answer) {
    throw new NotFoundError('Answer', answerId)
  }

  // Verify via keyAchievement.userId
  const keyAchievement = answer.question.keyAchievement
  if (!keyAchievement || keyAchievement.userId !== userId) {
    // Treat as not found for security
    throw new NotFoundError('Answer', answerId)
  }

  return answer
}

/**
 * Map CareerExperience to AI schema (V2 Base - simplified)
 */
function mapCareerExperience(
  career: NonNullable<
    NonNullable<
      AnswerWithFullContext['question']['keyAchievement']
    >['careerExperience']
  >,
  achievement: NonNullable<AnswerWithFullContext['question']['keyAchievement']>
): CareerExperienceBase {
  return {
    company: career.company,
    companyDescription: career.companyDescription,
    jobLevel: career.jobLevel,
    position: career.position,
    techStack: career.techStack,
    architecture:
      career.architecture && career.architectureMermaid
        ? {
            description: career.architecture,
            mermaid: career.architectureMermaid,
          }
        : null,
    keyAchievement: {
      title: achievement.title,
      problems: achievement.problems,
      actions: achievement.actions,
      results: achievement.results,
      reflections: achievement.reflections,
    },
  }
}

/**
 * Map ProjectExperience to AI schema (V2 Base - simplified)
 */
function mapProjectExperience(
  project: NonNullable<
    NonNullable<
      AnswerWithFullContext['question']['keyAchievement']
    >['projectExperience']
  >,
  achievement: NonNullable<AnswerWithFullContext['question']['keyAchievement']>
): ProjectExperienceBase | null {
  // projectType is required for V2 Base schema
  if (!project.projectType) {
    return null
  }

  return {
    projectName: project.projectName,
    projectDescription: project.projectDescription,
    projectType: project.projectType,
    teamComposition: project.teamComposition,
    position: project.position,
    techStack: project.techStack,
    architecture:
      project.architecture && project.architectureMermaid
        ? {
            description: project.architecture,
            mermaid: project.architectureMermaid,
          }
        : null,
    keyAchievement: {
      title: achievement.title,
      problems: achievement.problems,
      actions: achievement.actions,
      results: achievement.results,
      reflections: achievement.reflections,
    },
  }
}

/**
 * Get feedback generation input (V2 schema)
 *
 * Prepares full context for LangGraph streaming
 *
 * @param input - answerId, userId
 * @returns V2 input schema for QUESTION_FEEDBACK_GEN graph
 */
async function getFeedbackGenInput(
  input: GetFeedbackGenInputInput
): Promise<QuestionFeedbackGenGraphInputV2> {
  const { answerId, userId } = input

  const answer = await verifyAnswerOwnership(answerId, userId)
  const { question } = answer
  const { keyAchievement } = question

  if (!keyAchievement) {
    throw new NotFoundError('KeyAchievement for answer', answerId)
  }

  // Determine experience type based on which relation exists
  const experienceType = keyAchievement.careerExperienceId
    ? ExperienceType.CAREER
    : ExperienceType.PROJECT

  // Map experiences to V2 schema
  let careerExperience: CareerExperienceBase | null = null
  let projectExperience: ProjectExperienceBase | null = null

  if (keyAchievement.careerExperience) {
    careerExperience = mapCareerExperience(
      keyAchievement.careerExperience,
      keyAchievement
    )
  }

  if (keyAchievement.projectExperience) {
    projectExperience = mapProjectExperience(
      keyAchievement.projectExperience,
      keyAchievement
    )
  }

  return {
    experienceType,
    careerExperience,
    projectExperience,
    question: {
      content: question.text,
      category: question.category ?? undefined,
    },
    answer: answer.text,
    isGuideAnswerEnabled: true,
  }
}

/**
 * Save feedback result after streaming completes
 *
 * Always creates a new Feedback for each Answer (1:1 relationship).
 * Since each attempt creates a new Answer, this always creates a new Feedback.
 *
 * @param input - answerId, feedback (V2), guideAnswer, userId
 * @returns Status of what was saved
 */
async function saveFeedbackResult(
  input: SaveFeedbackResultInput
): Promise<SaveFeedbackResultResult> {
  const { answerId, feedback, guideAnswer, userId } = input

  // Verify ownership
  await verifyAnswerOwnership(answerId, userId)

  let feedbackSaved = false
  let guideAnswerSaved = false

  // Use transaction for atomic updates
  await prisma.$transaction(async tx => {
    // Create new feedback if provided
    if (feedback) {
      await tx.feedback.create({
        data: {
          answerId,
          strengths: feedback.strengths,
          weaknesses: feedback.weaknesses,
          suggestions: feedback.suggestions,
          rating: feedback.rating.level,
          ratingRationale: feedback.rating.rationale,
          generatedAt: new Date(),
          // Include guideAnswer if provided
          ...(guideAnswer && {
            guideAnswer: guideAnswer as unknown as Prisma.InputJsonValue,
          }),
        },
      })
      feedbackSaved = true
      guideAnswerSaved = !!guideAnswer
    }

    // Update answer status to EVALUATED if feedback was saved
    if (feedbackSaved) {
      await tx.answer.update({
        where: { id: answerId },
        data: { status: AnswerStatus.EVALUATED },
      })
    }
  })

  // PostHog Survey Property 설정
  if (feedbackSaved) {
    await setFeedbackSurveyProperties(userId)
  }

  return { feedbackSaved, guideAnswerSaved }
}

/**
 * 피드백 저장 후 PostHog Person Property 설정
 * - 첫 피드백: first_feedback_received = true
 * - 매 피드백: feedback_count 업데이트
 * - 3회 이상: nps_eligible = true
 */
async function setFeedbackSurveyProperties(userId: string): Promise<void> {
  const feedbackCount = await prisma.feedback.count({
    where: {
      answer: {
        question: {
          keyAchievement: { userId },
        },
      },
    },
  })

  const posthog = getPostHogClient()
  if (!posthog) return

  if (feedbackCount === 1) {
    posthog.capture({
      distinctId: userId,
      event: POSTHOG_EVENTS.SURVEY.FIRST_FEEDBACK_RECEIVED,
      properties: {
        $set: { [POSTHOG_PERSON_PROPERTIES.FEEDBACK_COUNT]: feedbackCount },
        $set_once: {
          [POSTHOG_PERSON_PROPERTIES.FIRST_FEEDBACK_RECEIVED]: true,
        },
      },
    })
  } else if (feedbackCount >= 3) {
    posthog.capture({
      distinctId: userId,
      event: POSTHOG_EVENTS.SURVEY.NPS_ELIGIBLE,
      properties: {
        $set: {
          [POSTHOG_PERSON_PROPERTIES.FEEDBACK_COUNT]: feedbackCount,
          [POSTHOG_PERSON_PROPERTIES.NPS_ELIGIBLE]: true,
        },
      },
    })
  } else {
    posthog.capture({
      distinctId: userId,
      event: POSTHOG_EVENTS.QUESTION.FEEDBACK_RECEIVED,
      properties: {
        $set: { [POSTHOG_PERSON_PROPERTIES.FEEDBACK_COUNT]: feedbackCount },
      },
    })
  }
}

export const feedbackService = {
  getFeedbackGenInput,
  saveFeedbackResult,
}
