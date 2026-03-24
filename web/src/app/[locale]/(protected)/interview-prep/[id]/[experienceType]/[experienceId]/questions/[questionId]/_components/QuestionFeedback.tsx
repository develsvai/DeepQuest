'use client'

import { useState } from 'react'
import { MessageSquareText } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty'
import { useTranslations } from 'next-intl'

import GuideAnswer from './FeedbackExampleView'
import FeedbackEvaluationView, {
  FeedbackSection,
} from './FeedbackEvaluationView'
import FeedbackEvaluationSkeleton from './FeedbackEvaluationSkeleton'
import FeedbackExampleSkeleton from './FeedbackExampleSkeleton'
import type {
  FeedbackV2,
  StructuredGuideAnswer,
} from '@/server/services/ai/contracts/schemas/questionFeedbackGen'

interface QuestionFeedbackProps {
  feedback: Partial<FeedbackV2> | null
  guideAnswer: Partial<StructuredGuideAnswer> | null
  isStreamingFeedback: boolean
  isStreamingGuideAnswer: boolean
}

export default function QuestionFeedback({
  feedback,
  guideAnswer,
  isStreamingFeedback,
  isStreamingGuideAnswer,
}: QuestionFeedbackProps) {
  const t = useTranslations('question-solve')
  const [openSections, setOpenSections] = useState<
    Record<FeedbackSection, boolean>
  >({
    strengths: true,
    weaknesses: true,
    suggestions: true,
  })

  const toggleSection = (section: FeedbackSection) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const sectionTitles = {
    strengths: t('feedback.strengths'),
    weaknesses: t('feedback.weaknesses'),
    suggestions: t('feedback.suggestions'),
  }

  const hasFeedback = feedback !== null
  const hasGuideAnswer = guideAnswer !== null
  const isEmpty =
    !hasFeedback &&
    !hasGuideAnswer &&
    !isStreamingFeedback &&
    !isStreamingGuideAnswer

  return (
    <div className='flex h-full flex-col space-y-4 p-4'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold'>{t('feedback.title')}</h2>
      </div>

      <div className='flex-1 overflow-hidden'>
        <ScrollArea className='h-full pr-4'>
          {isEmpty ? (
            <EmptyState
              title={t('feedback.emptyStateTitle')}
              description={t('feedback.emptyState')}
            />
          ) : (
            <FeedbackContent
              feedback={feedback}
              guideAnswer={guideAnswer}
              isStreamingFeedback={isStreamingFeedback}
              isStreamingGuideAnswer={isStreamingGuideAnswer}
              openSections={openSections}
              onToggleSection={toggleSection}
              sectionTitles={sectionTitles}
            />
          )}
        </ScrollArea>
      </div>
    </div>
  )
}

// --- Empty State ---

function EmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <Empty className='h-full border-0'>
      <EmptyHeader>
        <EmptyMedia variant='icon'>
          <MessageSquareText />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

// --- Feedback Content ---

interface FeedbackContentProps {
  feedback: Partial<FeedbackV2> | null
  guideAnswer: Partial<StructuredGuideAnswer> | null
  isStreamingFeedback: boolean
  isStreamingGuideAnswer: boolean
  openSections: Record<FeedbackSection, boolean>
  onToggleSection: (section: FeedbackSection) => void
  sectionTitles: Record<FeedbackSection, string>
}

function FeedbackContent({
  feedback,
  guideAnswer,
  isStreamingFeedback,
  isStreamingGuideAnswer,
  openSections,
  onToggleSection,
  sectionTitles,
}: FeedbackContentProps) {
  const t = useTranslations('question-solve')

  return (
    <div className='flex flex-col gap-8'>
      {/* Rating Section */}
      <section>
        <div className='mb-4 space-y-1'>
          <h3 className='font-semibold'>{t('feedback.rating')}</h3>
          <p className='text-sm text-muted-foreground'>
            {t('feedback.ratingDescription')}
          </p>
        </div>
        {isStreamingFeedback ? (
          <div className='animate-pulse space-y-2'>
            <div className='h-8 w-24 rounded bg-muted' />
            <div className='h-4 w-full rounded bg-muted' />
          </div>
        ) : feedback && feedback.rating ? (
          <div className='space-y-2'>
            <div className='flex items-center gap-2'>
              <RatingBadge level={feedback.rating.level} />
            </div>
            {feedback.rating.rationale.length > 0 && (
              <ul className='list-outside list-disc space-y-1 pl-8 text-sm text-muted-foreground'>
                {feedback.rating.rationale.map((rationale, index) => (
                  <li key={index}>{rationale}</li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </section>

      <Separator />

      {/* Evaluation Section */}
      <section>
        <div className='mb-4 space-y-1'>
          <h3 className='font-semibold'>{t('feedback.evaluation')}</h3>
          <p className='text-sm text-muted-foreground'>
            {t('feedback.evaluationDescription')}
          </p>
        </div>
        {isStreamingFeedback ? (
          <FeedbackEvaluationSkeleton />
        ) : feedback ? (
          <FeedbackEvaluationView
            feedback={{
              strengths: feedback.strengths,
              weaknesses: feedback.weaknesses,
              suggestions: feedback.suggestions,
            }}
            openSections={openSections}
            onToggleSection={onToggleSection}
            sectionTitles={sectionTitles}
            isStreaming={false}
          />
        ) : null}
      </section>

      <Separator />

      {/* Example Answer Section */}
      <section>
        {isStreamingGuideAnswer ? (
          <FeedbackExampleSkeleton />
        ) : guideAnswer ? (
          <GuideAnswer
            title={t('feedback.exampleAnswer')}
            description={t('feedback.exampleAnswerDescription')}
            structuredGuideAnswer={guideAnswer}
            isStreaming={false}
          />
        ) : null}
      </section>
    </div>
  )
}

// --- Rating Badge ---

function RatingBadge({ level }: { level: string }) {
  const colorMap: Record<string, string> = {
    DEEP: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    INTERMEDIATE:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    SURFACE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${colorMap[level] ?? 'bg-gray-100 text-gray-800'}`}
    >
      {level}
    </span>
  )
}
