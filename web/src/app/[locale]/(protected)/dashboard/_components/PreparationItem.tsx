'use client'

import { FileText, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

import {
  ActionCard,
  ActionCardContent,
  ActionCardFooter,
  ActionCardHeader,
  type ActionCardAction,
} from '@/components/ui/custom/action-card'
import { Badge } from '@/components/ui/badge'
import { LinkButton } from '@/components/ui/custom/link-button'
import { PreparationStatus } from '@/generated/prisma/browser'

/**
 * Status to translation key mapping
 * Uses explicit mapping to ensure type safety with next-intl
 */
const STATUS_KEY_MAP = {
  [PreparationStatus.PENDING]: 'pending',
  [PreparationStatus.VALIDATING]: 'validating',
  [PreparationStatus.ANALYZING]: 'analyzing',
  [PreparationStatus.READY]: 'ready',
  [PreparationStatus.FAILED]: 'failed',
  [PreparationStatus.ARCHIVED]: 'archived',
} as const satisfies Record<PreparationStatus, string>
import { useClientFormattedDateWithIntl } from '@/hooks/use-client-date'
import { useIsPreparationPending } from '@/lib/stores/interview-preparation-store'

import { ExperienceItem } from './ExperienceItem'
import { PreparationContentSkeleton } from './PreparationContentSkeleton'

// ==========================================
// Types
// ==========================================

/**
 * Career experience data shape from tRPC
 */
interface CareerExperience {
  id: number
  company: string
  position: string[]
  techStack: string[]
  keyAchievementsCount: number
  totalQuestions: number
  completedQuestions: number
}

/**
 * Project experience data shape from tRPC
 */
interface ProjectExperience {
  id: number
  projectName: string
  position: string[]
  techStack: string[]
  keyAchievementsCount: number
  totalQuestions: number
  completedQuestions: number
}

/**
 * Preparation data required for this component
 */
interface PreparationData {
  id: string
  title: string
  jobTitle: string | null
  status: PreparationStatus
  createdAt: Date
  careers: CareerExperience[]
  projects: ProjectExperience[]
}

/**
 * Props for PreparationItem component
 */
interface PreparationItemProps {
  /** Preparation data */
  preparation: PreparationData
  /** Handler for delete action */
  onDelete?: (id: string) => void
  /** Practice page href */
  practiceHref: string
}

// ==========================================
// Helper Functions
// ==========================================

/**
 * Get status badge variant based on preparation status
 */
function getStatusBadgeVariant(
  status: PreparationStatus
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case PreparationStatus.READY:
      return 'default'
    case PreparationStatus.FAILED:
      return 'destructive'
    case PreparationStatus.PENDING:
    case PreparationStatus.VALIDATING:
    case PreparationStatus.ANALYZING:
      return 'secondary'
    case PreparationStatus.ARCHIVED:
      return 'outline'
    default:
      return 'secondary'
  }
}

// ==========================================
// Component
// ==========================================

/**
 * PreparationItem - Dashboard card showing interview preparation summary
 *
 * Displays:
 * - Header: Title, job title, status, date, actions
 * - Body: List of experiences (careers + projects) with progress
 * - Footer: Practice button
 */
function PreparationItem({
  preparation,
  onDelete,
  practiceHref,
}: PreparationItemProps) {
  const t = useTranslations('dashboard')
  const tPrep = useTranslations('dashboard.preparationItem')

  // Check if this preparation is currently being processed (pending in Zustand store)
  const isPending = useIsPreparationPending(preparation.id)

  // Format date - convert Date to ISO string for hook
  const dateString =
    preparation.createdAt instanceof Date
      ? preparation.createdAt.toISOString()
      : preparation.createdAt
  const formattedDate = useClientFormattedDateWithIntl(dateString, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  // Create action items for dropdown
  const actions: ActionCardAction[] = useMemo(() => {
    const items: ActionCardAction[] = []

    if (onDelete) {
      items.push({
        label: tPrep('delete'),
        icon: <Trash2 className='mr-2 h-4 w-4' />,
        onClick: () => onDelete(preparation.id),
        variant: 'destructive',
      })
    }

    return items
  }, [preparation.id, onDelete, tPrep])

  // Check if practice is available (only READY status)
  const canPractice = preparation.status === PreparationStatus.READY

  // Combine all experiences for display
  const hasExperiences =
    preparation.careers.length > 0 || preparation.projects.length > 0

  return (
    <ActionCard>
      {/* Header */}
      <ActionCardHeader
        leadingIcon={<FileText className='h-6 w-6 text-muted-foreground' />}
        title={preparation.title}
        subtitle={preparation.jobTitle}
        actions={actions.length > 0 ? actions : undefined}
        headerRight={
          <div className='flex flex-col items-end gap-1'>
            <Badge variant={getStatusBadgeVariant(preparation.status)}>
              {tPrep(
                `status.${STATUS_KEY_MAP[preparation.status]}` as
                  | 'status.pending'
                  | 'status.validating'
                  | 'status.analyzing'
                  | 'status.ready'
                  | 'status.failed'
                  | 'status.archived'
              )}
            </Badge>
            <span className='text-xs text-muted-foreground'>
              {formattedDate}
            </span>
          </div>
        }
      />

      {/* Body - Experience List or Skeleton */}
      <ActionCardContent>
        {isPending ? (
          <PreparationContentSkeleton />
        ) : (
          hasExperiences && (
            <div className='space-y-3'>
              {/* Section Label */}
              <h4 className='flex items-center gap-2 text-sm font-medium tracking-wide text-muted-foreground uppercase'>
                {tPrep('analyzedScope')}
              </h4>

              {/* Experience Items */}
              <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
                {/* Career Experiences */}
                {preparation.careers.map(career => (
                  <ExperienceItem
                    key={`career-${career.id}`}
                    type='career'
                    name={career.company}
                    role={career.position.length > 0 ? career.position : null}
                    techStack={career.techStack}
                    keyAchievementsCount={career.keyAchievementsCount}
                    totalQuestions={career.totalQuestions}
                    completedQuestions={career.completedQuestions}
                  />
                ))}

                {/* Project Experiences */}
                {preparation.projects.map(project => (
                  <ExperienceItem
                    key={`project-${project.id}`}
                    type='project'
                    name={project.projectName}
                    role={project.position.length > 0 ? project.position : null}
                    techStack={project.techStack}
                    keyAchievementsCount={project.keyAchievementsCount}
                    totalQuestions={project.totalQuestions}
                    completedQuestions={project.completedQuestions}
                  />
                ))}
              </div>
            </div>
          )
        )}
      </ActionCardContent>

      {/* Footer - Practice Button */}
      <ActionCardFooter>
        <LinkButton
          href={practiceHref}
          className='w-full'
          disabled={!canPractice}
        >
          {t('actions.practice')}
        </LinkButton>
      </ActionCardFooter>
    </ActionCard>
  )
}

export { PreparationItem }
export type {
  PreparationItemProps,
  PreparationData,
  CareerExperience,
  ProjectExperience,
}
