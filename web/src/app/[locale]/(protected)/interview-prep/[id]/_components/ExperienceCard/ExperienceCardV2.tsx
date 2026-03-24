'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Briefcase,
  ChevronRight,
  Code,
  FolderGit2,
  Layers,
  MessageSquare,
} from 'lucide-react'

import {
  ActionCard,
  ActionCardHeader,
  ActionCardContent,
  ActionCardFooter,
  createEditDeleteActions,
} from '@/components/ui/custom/action-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LinkButton } from '@/components/ui/custom/link-button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import { ExperienceDialog } from './ExperienceDialog'
import type {
  CareerWithDetails,
  ProjectWithDetails,
} from '../InterviewPrepDetail.types'
import { Separator } from '@/components/ui/separator'

type ExperienceData = CareerWithDetails | ProjectWithDetails
type ExperienceType = 'CAREER' | 'PROJECT'

// Career-specific props
interface CareerCardProps {
  experience: CareerWithDetails
  experienceType: 'CAREER'
  onUpdate: (updated: CareerWithDetails) => void
  onDelete: (id: number) => void
  /** Href for key achievements page */
  href: string
}

// Project-specific props
interface ProjectCardProps {
  experience: ProjectWithDetails
  experienceType: 'PROJECT'
  onUpdate: (updated: ProjectWithDetails) => void
  onDelete: (id: number) => void
  /** Href for key achievements page */
  href: string
}

type ExperienceCardV2Props = CareerCardProps | ProjectCardProps

/**
 * Type guard to check if data is CareerWithDetails
 */
function isCareerData(data: ExperienceData): data is CareerWithDetails {
  return 'company' in data
}

/**
 * Experience card component for displaying and editing career/project experiences
 * Uses dialog-based editing pattern
 */
export function ExperienceCardV2(props: ExperienceCardV2Props) {
  const { experience, experienceType, onDelete, href } = props
  const t = useTranslations('interview-prep.detail.experienceCard')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [showAllTech, setShowAllTech] = useState(false)

  const isCareerType = experienceType === 'CAREER'

  const handleSubmit = (data: ExperienceData, type: ExperienceType) => {
    // Use submitted type (may have changed during editing)
    if (type === 'CAREER' && isCareerData(data)) {
      ;(props as CareerCardProps).onUpdate(data)
    } else if (type === 'PROJECT' && !isCareerData(data)) {
      ;(props as ProjectCardProps).onUpdate(data)
    }
    setDialogOpen(false)
  }

  // Type-safe property access
  const title = isCareerType
    ? (experience as CareerWithDetails).company
    : (experience as ProjectWithDetails).projectName
  const description = isCareerType
    ? (experience as CareerWithDetails).companyDescription
    : (experience as ProjectWithDetails).projectDescription

  const cardActions = createEditDeleteActions({
    onEdit: () => setDialogOpen(true),
    onDelete: () => onDelete(experience.id),
  })

  return (
    <>
      <ActionCard>
        <ActionCardHeader
          leadingIcon={
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  {isCareerType ? (
                    <Briefcase className='text-muted-foreground' size={35} />
                  ) : (
                    <FolderGit2 className='text-muted-foreground' size={35} />
                  )}
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isCareerType ? t('types.career') : t('types.project')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          }
          title={<span>{title}</span>}
          subtitle={
            <div className='flex flex-wrap items-center'>
              {experience.position.map((pos, idx) => (
                <span
                  key={idx}
                  className='flex items-center gap-2 font-medium text-primary'
                >
                  {idx > 0 && (
                    <div className='ml-2 flex h-4 items-center'>
                      <Separator orientation='vertical' />
                    </div>
                  )}
                  {pos}
                </span>
              ))}
            </div>
          }
          actions={cardActions}
        />

        <ActionCardContent>
          {/* Date & Type Badge */}
          <div className='mb-4 flex items-center gap-3 text-muted-foreground'>
            {experience.startDate && (
              <>
                <span>
                  {experience.startDate.replace('-', '.')} -{' '}
                  {experience.isCurrent
                    ? t('present')
                    : (experience.endDate?.replace('-', '.') ?? '')}
                </span>
                <span className='text-border'>|</span>
              </>
            )}
            <Badge variant='outline'>
              {isCareerType
                ? (experience as CareerWithDetails).employeeType
                : t('teamBadge')}
            </Badge>
          </div>

          {/* Team/Career Info */}
          <div className='mb-1'>
            {isCareerType
              ? (experience as CareerWithDetails).jobLevel && (
                  <p>
                    <span className='text-muted-foreground'>
                      {t('jobLevel')}
                    </span>{' '}
                    <span className='font-medium'>
                      {(experience as CareerWithDetails).jobLevel}
                    </span>
                  </p>
                )
              : (() => {
                  const projectExp = experience as ProjectWithDetails
                  const { teamSize, teamComposition } = projectExp
                  if (!teamSize && !teamComposition) return null
                  return (
                    <p>
                      <span>
                        {teamSize != null &&
                          t('teamProject', { count: teamSize })}
                        {teamComposition && ` ${teamComposition}`}
                      </span>
                    </p>
                  )
                })()}
          </div>

          {/* Description */}
          {description && <p className='mb-4 font-medium'>{description}</p>}

          {/* Tech Stack */}
          {experience.techStack && experience.techStack.length > 0 && (
            <div>
              <p className='mb-2 font-medium'>{t('techStack')}</p>
              <div className='flex flex-wrap gap-2'>
                {(showAllTech
                  ? experience.techStack
                  : experience.techStack.slice(0, 5)
                ).map(tech => (
                  <Badge key={tech} variant='outline'>
                    <Code size={10} /> {tech}
                  </Badge>
                ))}

                {experience.techStack.length > 5 && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setShowAllTech(!showAllTech)}
                    className='h-auto px-2 py-1 text-xs'
                  >
                    {showAllTech
                      ? t('showLess')
                      : `+${experience.techStack.length - 5}`}
                  </Button>
                )}
              </div>
            </div>
          )}
        </ActionCardContent>

        {/* Footer / Action Area */}
        <ActionCardFooter
          className='flex-row items-center justify-between'
          progress={
            experience.totalQuestions > 0
              ? {
                  label: t('questions'),
                  icon: <MessageSquare size={13} />,
                  completed: experience.completedQuestions,
                  total: experience.totalQuestions,
                }
              : undefined
          }
        >
          <div className='flex items-center gap-4 text-xs'>
            <span className='flex items-center gap-1'>
              <Layers size={12} /> {experience.keyAchievements.length}{' '}
              {t('achievements')}
            </span>
          </div>
          <LinkButton href={href} size='sm'>
            {t('checkKeyAchievements')}
            <ChevronRight size={12} />
          </LinkButton>
        </ActionCardFooter>
      </ActionCard>

      <ExperienceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={experience}
        initialType={experienceType}
        onSubmit={handleSubmit}
      />
    </>
  )
}
