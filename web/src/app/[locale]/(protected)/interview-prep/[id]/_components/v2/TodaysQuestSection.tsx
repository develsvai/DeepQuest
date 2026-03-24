'use client'

/**
 * TodaysQuestSection Component
 *
 * Connects Today's Quest API to UI components.
 * - Fetches today's quest data using tRPC useSuspenseQuery
 * - Transforms API response to UI component props
 * - Handles empty states (no questions, all completed)
 *
 * Data Flow:
 * 1. Server Component prefetches with server date
 * 2. This component uses client's local date for query
 * 3. TanStack Query handles cache hit/miss automatically
 */

import { ChevronRight, Zap } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { routes } from '@/lib/routes'
import { api } from '@/trpc/react'
import { TodaysQuestCard } from './TodaysQuestCard'
import { QuestionPreviewCard } from './QuestionPreviewCard'
import { transformFeaturedToUI, transformRelatedToUI } from './transforms'
import type {
  SelectionReason,
  RelatedQuest,
} from '@/server/services/question/selection/types'

// ═══════════════════════════════════════════════════════════════════════════
// Props
// ═══════════════════════════════════════════════════════════════════════════

interface TodaysQuestSectionProps {
  interviewPreparationId: string
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════

export function TodaysQuestSection({
  interviewPreparationId,
}: TodaysQuestSectionProps) {
  const t = useTranslations('interview-prep.detail.v2.todaysQuestSection')
  // Client's local date (YYYY-MM-DD format)
  // Note: This may differ from server date due to timezone
  // TanStack Query will refetch if query key (including date) differs from prefetch
  const clientDate = new Date().toISOString().split('T')[0]

  // useSuspenseQuery returns a tuple [data, queryResult]
  const [data] = api.question.getTodaysQuest.useSuspenseQuery({
    interviewPreparationId,
    date: clientDate,
  })

  const { featuredQuest, relatedQuests, meta } = data

  // Handle empty states
  if (!featuredQuest) {
    return <EmptyQuestState reason={meta.selectionReason} />
  }

  // Transform API response to UI types
  const todaysQuestData = transformFeaturedToUI(featuredQuest)
  const recommendedQuestions = relatedQuests.map((q: RelatedQuest) =>
    transformRelatedToUI(q)
  )

  return (
    <section>
      {/* Section Title */}
      <div className='mb-6 flex items-center gap-4'>
        <Badge className='gap-1.5 rounded-full bg-stone px-3 py-1.5 text-sm font-semibold text-stone-foreground'>
          <Zap className='size-3.5' fill='currentColor' />
          RECOMMENDED
        </Badge>
        <h2 className='text-2xl font-bold text-stone'>Today&apos;s Quest</h2>
      </div>

      {/* Main Content Grid */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        {/* Left: Today's Quest (2/3) */}
        <div className='lg:col-span-2'>
          <TodaysQuestCard
            question={todaysQuestData}
            interviewPreparationId={interviewPreparationId}
          />
        </div>

        {/* Right: Recommended Questions (1/3) */}
        <div className='space-y-4'>
          {recommendedQuestions.map(question => (
            <QuestionPreviewCard
              key={question.id}
              question={question}
              interviewPreparationId={interviewPreparationId}
            />
          ))}

          {/* View All Link */}
          <Button variant='outline' className='w-full' asChild>
            <Link
              href={routes.interviewPrep.questions(
                interviewPreparationId,
                todaysQuestData.experienceType,
                todaysQuestData.experienceId
              )}
            >
              {t('viewAll')}
              <ChevronRight className='size-4' />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Empty State Component
// ═══════════════════════════════════════════════════════════════════════════

interface EmptyQuestStateProps {
  reason: SelectionReason
}

function EmptyQuestState({ reason }: EmptyQuestStateProps) {
  const t = useTranslations('interview-prep.detail.v2.todaysQuestSection')
  return (
    <div className='rounded-xl bg-muted/50 p-8 text-center'>
      {reason === 'ALL_COMPLETED' ? (
        <>
          <h3 className='text-lg font-semibold'>{t('allCompleted.title')}</h3>
          <p className='text-muted-foreground'>{t('allCompleted.message')}</p>
        </>
      ) : (
        <>
          <h3 className='text-lg font-semibold'>{t('noQuestions.title')}</h3>
          <p className='text-muted-foreground'>{t('noQuestions.message')}</p>
        </>
      )}
    </div>
  )
}
