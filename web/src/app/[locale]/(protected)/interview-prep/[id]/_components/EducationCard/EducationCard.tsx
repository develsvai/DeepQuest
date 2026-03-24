'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { GraduationCap } from 'lucide-react'

import {
  ActionCard,
  ActionCardHeader,
  ActionCardContent,
  createEditDeleteActions,
} from '@/components/ui/custom/action-card'
import { Badge } from '@/components/ui/badge'

import { EducationDialog } from './EducationDialog'
import type { EducationData, DegreeType } from '../InterviewPrepDetail.types'

interface EducationCardProps {
  education: EducationData
  onUpdate: (updated: EducationData) => void
  onDelete: (id: number) => void
}

/**
 * Degree type to translation key mapping
 */
const DEGREE_KEY_MAP: Record<DegreeType, string> = {
  BACHELOR: 'bachelor',
  MASTER: 'master',
  DOCTOR: 'doctor',
  HIGH_SCHOOL: 'highSchool',
  ASSOCIATE: 'associate',
  OTHER: 'other',
}

/**
 * Education card component for displaying and editing education entries
 * Uses dialog-based editing pattern
 */
export function EducationCard({
  education,
  onUpdate,
  onDelete,
}: EducationCardProps) {
  const t = useTranslations('interview-prep.detail.educationCard')
  const [dialogOpen, setDialogOpen] = useState(false)

  const formatDegreeType = (degree: DegreeType): string => {
    const key = DEGREE_KEY_MAP[degree] as
      | 'bachelor'
      | 'master'
      | 'doctor'
      | 'highSchool'
      | 'associate'
      | 'other'
      | undefined
    if (!key) return degree
    return t(`degree.${key}`)
  }

  const handleSubmit = (data: EducationData) => {
    onUpdate(data)
    setDialogOpen(false)
  }

  const cardActions = createEditDeleteActions({
    onEdit: () => setDialogOpen(true),
    onDelete: () => onDelete(education.id),
  })

  return (
    <>
      <ActionCard className='transition-all hover:border-primary'>
        <ActionCardHeader
          title={
            <div className='flex items-center gap-2'>
              <Badge variant='secondary'>{t('badge')}</Badge>
              <span>{education.institution}</span>
            </div>
          }
          subtitle={
            <span className='font-medium text-primary'>
              {education.degree && `${formatDegreeType(education.degree)} in `}
              {education.major && education.major}
            </span>
          }
          actions={cardActions}
        />

        <ActionCardContent className='pb-6'>
          {/* Date & Major Badges */}
          <div className='text-xm mb-4 flex flex-wrap items-center gap-3 text-muted-foreground'>
            <span>
              {education.startDate ?? ''} - {education.endDate ?? ''}
            </span>
            {education.major && (
              <Badge variant='secondary'>
                <GraduationCap size={12} />
                {education.major}
              </Badge>
            )}
          </div>

          <p className='text-sm text-muted-foreground'>
            {education.description}
          </p>
        </ActionCardContent>
      </ActionCard>

      <EducationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={education}
        onSubmit={handleSubmit}
      />
    </>
  )
}
