/**
 * Feedback Evaluation View Component
 *
 * Displays the evaluation sections: strengths, weaknesses, and suggestions
 * Shows streaming indicator when feedback is being generated
 */

'use client'

import React, { memo } from 'react'
import { CheckCircle, AlertCircle, Lightbulb, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { designTokens } from '@/components/design-system/core'
import CollapsibleFeedbackSection from './shared/CollapsibleFeedbackSection'
import type { AnswerWithFeedbackOutput } from '@/server/api/routers/answer/schema'

export type FeedbackSection = 'strengths' | 'weaknesses' | 'suggestions'

interface FeedbackEvaluationViewProps {
  feedback: Partial<
    Pick<
      NonNullable<AnswerWithFeedbackOutput['feedback']>,
      'strengths' | 'weaknesses' | 'suggestions' | 'rating'
    >
  >
  openSections: Record<FeedbackSection, boolean>
  onToggleSection: (section: FeedbackSection) => void
  sectionTitles: {
    strengths: string
    weaknesses: string
    suggestions: string
  }
  isStreaming?: boolean
}

const FeedbackEvaluationView = memo(function FeedbackEvaluationView({
  feedback,
  openSections,
  onToggleSection,
  sectionTitles,
  isStreaming = false,
}: FeedbackEvaluationViewProps) {
  const t = useTranslations(
    'interview-prep.practice.problemSolving.feedback.streaming'
  )

  return (
    <div className='space-y-4'>
      {/* Strengths Section */}
      <CollapsibleFeedbackSection
        title={sectionTitles.strengths}
        items={feedback.strengths}
        icon={CheckCircle}
        iconColor={designTokens.colors.feedback.strengths}
        textColor={designTokens.colors.feedback.strengths}
        isOpen={openSections.strengths}
        onOpenChange={() => onToggleSection('strengths')}
      />

      {/* Weaknesses Section */}
      <CollapsibleFeedbackSection
        title={sectionTitles.weaknesses}
        items={feedback.weaknesses}
        icon={AlertCircle}
        iconColor={designTokens.colors.feedback.improvements}
        textColor={designTokens.colors.feedback.improvements}
        isOpen={openSections.weaknesses}
        onOpenChange={() => onToggleSection('weaknesses')}
      />

      {/* Suggestions Section */}
      <CollapsibleFeedbackSection
        title={sectionTitles.suggestions}
        items={feedback.suggestions}
        icon={Lightbulb}
        iconColor={designTokens.colors.feedback.suggestions}
        textColor={designTokens.colors.feedback.suggestions}
        isOpen={openSections.suggestions}
        onOpenChange={() => onToggleSection('suggestions')}
      />

      {/* Streaming Indicator */}
      {isStreaming && (
        <div
          className='mt-4 flex items-center gap-2 text-sm'
          style={{ color: designTokens.colors.muted.foreground }}
        >
          <Loader2 className='h-4 w-4 animate-spin' />
          <span>{t('generatingFeedback')}</span>
        </div>
      )}
    </div>
  )
})

export default FeedbackEvaluationView
