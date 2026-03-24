'use client'

/**
 * ExperienceCard Component
 *
 * Experience card with progress tracking and key achievements.
 * - Header: Company/project name + type badge
 * - Key achievements section
 * - Question progress bar
 * - CTA button
 */

import { useParams } from 'next/navigation'
import { Building2, FileText, Clock, ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { routes } from '@/lib/routes'
import { cn } from '@/lib/utils'

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface ExperienceData {
  id: number
  name: string
  position: string
  duration: string
  type: 'career' | 'project'
  keyAchievements: string[]
  totalQuestions: number
  answeredQuestions: number
}

interface ExperienceCardProps {
  experience: ExperienceData
}

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

export function ExperienceCard({ experience }: ExperienceCardProps) {
  const t = useTranslations('interview-prep.detail.v2.experienceCard')
  const params = useParams<{ id: string }>()
  const {
    id,
    name,
    position,
    duration,
    type,
    keyAchievements,
    totalQuestions,
    answeredQuestions,
  } = experience

  const progress = Math.round((answeredQuestions / totalQuestions) * 100)
  const isComplete = progress === 100

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-background/60 p-6 transition-all duration-300',
        'hover:border-primary/30 hover:shadow-xl'
      )}
    >
      {/* Header */}
      <header className='mb-4'>
        <div className='mb-2 flex items-start justify-between gap-3'>
          {/* Name */}
          <h3 className='line-clamp-2 text-lg leading-tight font-bold text-foreground'>
            {name}
          </h3>
          {/* Type badge */}
          <Badge
            variant={type === 'career' ? 'default' : 'secondary'}
            className='shrink-0 gap-1 px-2.5 py-1 text-xs font-medium'
          >
            {type === 'career' ? (
              <Building2 className='size-3.5' />
            ) : (
              <FileText className='size-3.5' />
            )}
            {t(type)}
          </Badge>
        </div>
        {/* Position */}
        <p className='line-clamp-1 text-base font-medium text-muted-foreground'>
          {position}
        </p>
        {/* Duration */}
        <span className='mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground/70'>
          <Clock className='size-3.5' />
          {duration}
        </span>
      </header>

      {/* Key Achievements */}
      <section className='mb-5 flex-1'>
        <h4 className='mb-2.5 text-xs font-semibold tracking-wider text-primary uppercase'>
          {t('keyAchievements')}
        </h4>
        {/* List of achievements */}
        <ul className='space-y-2'>
          {keyAchievements.map((achievement, index) => (
            <li
              key={index}
              className='line-clamp-2 text-sm leading-relaxed text-foreground/80'
            >
              <span className='mr-2 text-primary'>•</span>
              {achievement}
            </li>
          ))}
        </ul>
      </section>

      {/* Progress */}
      <section className='mb-5'>
        <header className='mb-2 flex items-center justify-between'>
          <span className='text-sm font-medium text-muted-foreground'>
            {t('questionProgress')}
          </span>
          <span
            className={cn(
              'text-sm font-bold',
              isComplete ? 'text-primary' : 'text-foreground'
            )}
          >
            {answeredQuestions}
            <span className='text-muted-foreground'>/{totalQuestions}</span>
          </span>
        </header>
        <Progress
          value={progress}
          className={cn(
            'h-2.5 bg-muted/50',
            isComplete && '[&>div]:bg-primary'
          )}
        />
      </section>

      {/* CTA */}
      <footer>
        <Button variant='solid' className='w-full' asChild>
          <Link href={routes.interviewPrep.experience(params.id, type, id)}>
            {t('viewDetails')}
            <ArrowRight className='size-4 transition-transform group-hover:translate-x-0.5' />
          </Link>
        </Button>
      </footer>
    </article>
  )
}
