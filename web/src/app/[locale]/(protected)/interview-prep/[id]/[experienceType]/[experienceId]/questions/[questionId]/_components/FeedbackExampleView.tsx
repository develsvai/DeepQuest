/**
 * Feedback Example View Component
 *
 * Displays structured example answer with highlighted sections
 */

import { memo } from 'react'
import { designTokens } from '@/components/design-system/core'
import HighlightedExample from './HighlightedExample'
import type { StructuredGuideAnswer } from '@/server/services/ai/contracts/schemas/questionFeedbackGen'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface GuideAnswerProps {
  structuredGuideAnswer?: Partial<StructuredGuideAnswer> | null
  title: string
  description: string
  isStreaming: boolean
}

const GuideAnswer = memo(function GuideAnswer({
  structuredGuideAnswer,
  title,
  description,
  isStreaming,
}: GuideAnswerProps) {
  const t = useTranslations(
    'interview-prep.practice.problemSolving.feedback.streaming'
  )
  return (
    <div className='space-y-4'>
      <div className='space-y-3'>
        <h3 className='font-semibold'>{title}</h3>
        <p
          className='text-sm'
          style={{ color: designTokens.colors.muted.foreground }}
        >
          {description}
        </p>
      </div>
      {structuredGuideAnswer?.paragraphs && (
        <HighlightedExample paragraphs={structuredGuideAnswer.paragraphs} />
      )}
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

export default GuideAnswer
