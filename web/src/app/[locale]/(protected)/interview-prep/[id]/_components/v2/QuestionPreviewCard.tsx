'use client'

/**
 * QuestionPreviewCard Component
 *
 * Compact question card for sidebar recommendations.
 * - Category badge + Rating badge
 * - Question text (truncated)
 * - Company name + arrow link
 */

import { ArrowUpRight, Settings2, Layers } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { routes } from '@/lib/routes'
import type {
  QuestionPreviewData,
  Rating,
} from '../InterviewPrepDetailV2.types'
import { CATEGORY_LABELS } from '../InterviewPrepDetailV2.constants'

// ═══════════════════════════════════════════════════════════════════════════
// Rating Badge Styles
// ═══════════════════════════════════════════════════════════════════════════

const ratingStyles: Record<
  Rating,
  { bg: string; text: string; label: string }
> = {
  SURFACE: {
    bg: 'bg-rating-surface/20',
    text: 'text-rating-surface-foreground',
    label: 'Surface',
  },
  INTERMEDIATE: {
    bg: 'bg-stone/10',
    text: 'text-stone',
    label: 'Solid',
  },
  DEEP: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    label: 'Deep',
  },
}

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

interface QuestionPreviewCardProps {
  question: QuestionPreviewData
  interviewPreparationId: string
}

export function QuestionPreviewCard({
  question,
  interviewPreparationId,
}: QuestionPreviewCardProps) {
  const {
    id,
    experienceType,
    experienceId,
    category,
    rating,
    questionText,
    companyName,
  } = question
  const href = routes.interviewPrep.questionDetail(
    interviewPreparationId,
    experienceType,
    experienceId,
    id
  )
  const categoryLabel = CATEGORY_LABELS[category] || category
  const ratingStyle = ratingStyles[rating]

  return (
    <Link href={href} className='block'>
      <Card className='group cursor-pointer rounded-xl border-0 bg-card shadow-lg shadow-black/5 transition-all hover:shadow-xl'>
        <CardContent className='flex h-full flex-col p-4'>
          {/* Header: Category + Rating */}
          <div className='mb-3 flex items-center justify-between'>
            <Badge
              variant='outline'
              className='gap-1 border-border bg-muted/50 text-xs text-foreground'
            >
              <Settings2 className='size-3 text-muted-foreground' />
              {categoryLabel}
            </Badge>
            <Badge
              variant='secondary'
              className={cn(
                'gap-1 text-xs font-medium',
                ratingStyle.bg,
                ratingStyle.text
              )}
            >
              {rating === 'DEEP' ? (
                <Layers className='size-3' />
              ) : (
                <span className='size-2 rounded-full bg-current' />
              )}
              {ratingStyle.label}
            </Badge>
          </div>

          {/* Question Text (Truncated) */}
          <p className='mb-4 line-clamp-3 flex-1 text-sm leading-relaxed text-foreground'>
            {questionText}
          </p>

          {/* Footer: Company + Arrow */}
          <div className='flex items-center justify-between'>
            <span className='text-sm text-muted-foreground'>{companyName}</span>
            <div className='flex size-8 items-center justify-center rounded-full bg-muted/50 text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary'>
              <ArrowUpRight className='size-4' />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
