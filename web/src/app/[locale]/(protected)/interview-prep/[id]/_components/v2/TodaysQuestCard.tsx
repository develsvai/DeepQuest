'use client'

/**
 * TodaysQuestCard Component
 *
 * Main featured question card for Today's Quest section.
 * - Category badge
 * - Company name
 * - Question text (quoted style)
 * - Tags
 * - CTA button
 *
 * Note: RECOMMENDED badge and "Today's Quest" title are now displayed
 * as section title outside this card in InterviewPrepDetailV2.tsx
 */

import { Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { routes } from '@/lib/routes'
import type { TodaysQuestData } from '../InterviewPrepDetailV2.types'
import { CATEGORY_LABELS } from '../InterviewPrepDetailV2.constants'

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

interface TodaysQuestCardProps {
  question: TodaysQuestData
  interviewPreparationId: string
}

export function TodaysQuestCard({
  question,
  interviewPreparationId,
}: TodaysQuestCardProps) {
  const t = useTranslations('interview-prep.detail.v2.todaysQuest')
  const router = useRouter()
  const {
    id,
    experienceType,
    experienceId,
    category,
    companyName,
    questionText,
    tags,
  } = question
  const categoryLabel = CATEGORY_LABELS[category] || category

  const handleCtaClick = () => {
    router.push(
      routes.interviewPrep.questionDetail(
        interviewPreparationId,
        experienceType,
        experienceId,
        id
      )
    )
  }

  return (
    <Card className='h-full rounded-2xl border-0 bg-card shadow-xl shadow-black/5'>
      <CardContent className='flex h-full flex-col p-6'>
        {/* Category + Company */}
        <div className='mb-6 flex items-center justify-between'>
          <Badge
            variant='outline'
            className='rounded-full border-primary/30 bg-primary/5 px-3 py-1.5 text-sm font-semibold text-foreground'
          >
            <Sparkles className='mr-1.5 size-4 text-primary' />
            {categoryLabel}
          </Badge>
          <span className='text-base text-muted-foreground'>{companyName}</span>
        </div>

        {/* Question Text (Quoted Style) */}
        <div className='mb-8 flex-1'>
          <blockquote className='relative pl-6'>
            <span className='absolute -top-3 -left-3 font-serif text-6xl text-primary/20'>
              &ldquo;
            </span>
            <p className='text-xl leading-relaxed font-semibold text-foreground md:text-2xl'>
              {questionText}
            </p>
            <span className='absolute right-0 -bottom-6 font-serif text-6xl text-primary/20'>
              &rdquo;
            </span>
          </blockquote>
        </div>

        {/* Tags */}
        <div className='mb-8 flex flex-wrap gap-3'>
          {tags.map(tag => (
            <Badge
              key={tag}
              variant='outline'
              className='rounded-full px-3 py-1 text-sm font-semibold text-muted-foreground'
            >
              #{tag}
            </Badge>
          ))}
        </div>

        {/* CTA Section */}
        <div className='flex items-center gap-4'>
          <Button
            variant='default'
            size='lg'
            className='gap-2 px-6 font-semibold'
            onClick={handleCtaClick}
          >
            <Sparkles className='size-4' />
            {t('fillAnswer')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
