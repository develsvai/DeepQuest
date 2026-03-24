/**
 * QuestionNumberBadge Component
 *
 * Displays question number
 */

import React from 'react'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { designTokens } from '@/components/design-system/core'

interface QuestionNumberBadgeProps {
  number: number
  isSubQuestion?: boolean
}

export function QuestionNumberBadge({
  number,
  isSubQuestion = false,
}: QuestionNumberBadgeProps) {
  const t = useTranslations('interview-prep.practice.question')

  return (
    <div className='flex items-center space-x-2'>
      <Badge
        variant='outline'
        className='font-medium'
        style={{
          backgroundColor: designTokens.colors.primary.DEFAULT,
          color: designTokens.colors.primary.foreground,
          borderColor: designTokens.colors.primary.DEFAULT,
        }}
      >
        {isSubQuestion
          ? t('subQuestionNumber', { number })
          : t('questionNumber', { number })}
      </Badge>
    </div>
  )
}
