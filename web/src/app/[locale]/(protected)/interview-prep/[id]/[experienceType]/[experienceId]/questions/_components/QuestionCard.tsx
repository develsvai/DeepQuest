/**
 * QuestionCard Component
 *
 * Displays a question card with number badge, category, status, and solve button.
 * Uses QuestionListItem type from question service.
 */

'use client'

import { useTranslations } from 'next-intl'
import { PlayCircle } from 'lucide-react'
import { LinkButton } from '@/components/ui/custom/link-button'
import { CategoryBadge } from '@/components/ui/category-badge'
import {
  ActionCard,
  ActionCardHeader,
  ActionCardContent,
  ActionCardFooter,
  createEditDeleteActions,
} from '@/components/ui/custom/action-card'
import { designTokens } from '@/components/design-system/core'
import { QuestionNumberBadge } from '../../_components/QuestionNumberBadge'
import { StatusBadge } from '../../_components/StatusBadge'
import type { QuestionListItem } from '@/server/services/question'

interface QuestionCardProps {
  question: QuestionListItem
  questionIndex: number
  /** Href for solve/review page */
  solveHref: string
  /** Callback when edit action is triggered */
  onEdit?: (question: QuestionListItem) => void
  /** Callback when delete action is triggered */
  onDelete?: (questionId: string) => void
}

export function QuestionCard({
  question,
  questionIndex,
  solveHref,
  onEdit,
  onDelete,
}: QuestionCardProps) {
  const t = useTranslations('questions')

  // Create edit/delete actions only if both callbacks are provided
  const cardActions =
    onEdit && onDelete
      ? createEditDeleteActions({
          onEdit: () => onEdit(question),
          onDelete: () => onDelete(question.id),
        })
      : undefined

  return (
    <ActionCard className='transition-all duration-200 hover:shadow-md'>
      <ActionCardHeader
        title={
          <div className='flex items-center space-x-2'>
            <QuestionNumberBadge number={questionIndex} />
            {question.category && (
              <CategoryBadge category={question.category} size='sm' />
            )}
          </div>
        }
        headerRight={
          <StatusBadge isCompleted={question.isCompleted} size='md' />
        }
        actions={cardActions}
      />

      <ActionCardContent>
        <p
          className='text-base leading-relaxed'
          style={{ color: designTokens.colors.foreground }}
        >
          {question.text}
        </p>
      </ActionCardContent>

      <ActionCardFooter
        actions={
          <LinkButton
            href={solveHref}
            variant={question.isCompleted ? 'outline' : 'default'}
            size='sm'
            className='ml-auto gap-1.5'
          >
            <PlayCircle className='h-4 w-4' />
            {question.isCompleted ? t('action.review') : t('action.solve')}
          </LinkButton>
        }
      />
    </ActionCard>
  )
}
