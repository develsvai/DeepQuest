/**
 * Today's Quest Selection Service
 *
 * Main orchestrator for selecting Today's Quest questions.
 * Coordinates data fetching, seeding, and strategy execution.
 */

import { prisma } from '@/lib/db/prisma'
import type { Rating, AnswerStatus } from '@/generated/prisma/enums'
import { createDateSeeder } from './seeder'
import { selectFeatured, selectRelated } from './strategies'
import type {
  SelectTodaysQuestInput,
  TodaysQuestResult,
  QuestionWithContext,
  QuestContext,
} from './types'
import type { SelectionContext } from './strategies/types'

// ═══════════════════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Select Today's Quest questions for a user.
 *
 * Returns 1 featured quest + 2 related quests based on:
 * - Urgency scoring (empty/draft/surface answers prioritized)
 * - Date-based seeding (same result for same day)
 *
 * @param input - Selection parameters
 * @returns Today's quest result with featured + related questions
 */
export async function selectTodaysQuest(
  input: SelectTodaysQuestInput
): Promise<TodaysQuestResult> {
  const { interviewPreparationId, date, userId } = input

  // 1. Fetch all questions with context
  const questions = await fetchQuestionsWithContext(interviewPreparationId)

  // Handle edge case: no questions
  if (questions.length === 0) {
    return {
      featuredQuest: null,
      relatedQuests: [],
      meta: {
        selectionReason: 'NO_QUESTIONS',
        selectedDate: date,
        generatedAt: new Date(),
      },
    }
  }

  // 2. Create date-based seeder
  const seeder = createDateSeeder(userId, date)

  // 3. Build selection context
  const ctx: SelectionContext = {
    questions,
    seeder,
    interviewPreparationId,
  }

  // 4. Execute selection strategies
  const featuredQuest = selectFeatured(ctx)

  // Handle edge case: all questions completed
  if (!featuredQuest) {
    return {
      featuredQuest: null,
      relatedQuests: [],
      meta: {
        selectionReason: 'ALL_COMPLETED',
        selectedDate: date,
        generatedAt: new Date(),
      },
    }
  }

  // 5. Select related quests
  const relatedQuests = selectRelated(featuredQuest, ctx, 2)

  return {
    featuredQuest,
    relatedQuests,
    meta: {
      selectionReason: 'PRIORITY_BASED',
      selectedDate: date,
      generatedAt: new Date(),
    },
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Data Fetching
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch all questions for an interview preparation with full context.
 * Queries both career and project experiences.
 */
async function fetchQuestionsWithContext(
  interviewPreparationId: string
): Promise<QuestionWithContext[]> {
  // Fetch careers with key achievements and questions
  const careers = await prisma.careerExperience.findMany({
    where: { interviewPreparationId },
    select: {
      id: true,
      company: true,
      keyAchievements: {
        select: {
          id: true,
          title: true,
          questions: {
            where: { parentQuestionId: null }, // Top-level questions only
            select: {
              id: true,
              text: true,
              category: true,
              orderIndex: true,
              answers: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: {
                  id: true,
                  status: true,
                  submittedAt: true,
                  feedback: {
                    select: { rating: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  // Fetch projects with key achievements and questions
  const projects = await prisma.projectExperience.findMany({
    where: { interviewPreparationId },
    select: {
      id: true,
      projectName: true,
      keyAchievements: {
        select: {
          id: true,
          title: true,
          questions: {
            where: { parentQuestionId: null },
            select: {
              id: true,
              text: true,
              category: true,
              orderIndex: true,
              answers: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: {
                  id: true,
                  status: true,
                  submittedAt: true,
                  feedback: {
                    select: { rating: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  // Flatten into unified structure
  const careerQuestions = flattenExperienceQuestions(careers, 'CAREER')
  const projectQuestions = flattenExperienceQuestions(projects, 'PROJECT')

  return [...careerQuestions, ...projectQuestions]
}

// ═══════════════════════════════════════════════════════════════════════════
// Data Transformation
// ═══════════════════════════════════════════════════════════════════════════

type ExperienceWithQuestions = {
  id: number
  keyAchievements: {
    id: number
    title: string
    questions: {
      id: string
      text: string
      category: string | null
      orderIndex: number
      answers: {
        id: string
        status: string
        submittedAt: Date | null
        feedback: { rating: string } | null
      }[]
    }[]
  }[]
}

type CareerExperience = ExperienceWithQuestions & { company: string }
type ProjectExperience = ExperienceWithQuestions & { projectName: string }

/**
 * Flatten experience -> keyAchievement -> questions hierarchy
 * into flat array of QuestionWithContext.
 */
function flattenExperienceQuestions(
  experiences: (CareerExperience | ProjectExperience)[],
  type: 'CAREER' | 'PROJECT'
): QuestionWithContext[] {
  const questions: QuestionWithContext[] = []

  for (const exp of experiences) {
    const experienceName =
      type === 'CAREER'
        ? (exp as CareerExperience).company
        : (exp as ProjectExperience).projectName

    for (const ka of exp.keyAchievements) {
      for (const q of ka.questions) {
        const latestAnswer = q.answers[0]

        const context: QuestContext = {
          keyAchievementId: ka.id,
          keyAchievementTitle: ka.title,
          experienceType: type,
          experienceId: exp.id,
          experienceName,
        }

        questions.push({
          id: q.id,
          text: q.text,
          category: q.category as QuestionWithContext['category'],
          orderIndex: q.orderIndex,
          context,
          latestAnswer: latestAnswer
            ? {
                id: latestAnswer.id,
                status: latestAnswer.status as AnswerStatus,
                submittedAt: latestAnswer.submittedAt,
                rating: (latestAnswer.feedback?.rating as Rating) ?? null,
              }
            : null,
        })
      }
    }
  }

  return questions
}
