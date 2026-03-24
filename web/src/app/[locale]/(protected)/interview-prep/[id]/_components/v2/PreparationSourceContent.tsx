'use client'

/**
 * PreparationSourceContent Component
 *
 * TabsContent for PreparationSourceSection.
 * Contains useSuspenseQuery for data fetching.
 * Renders Resume tab content and Job Posting tab content.
 */

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Briefcase } from 'lucide-react'
import { useTranslations } from 'next-intl'
import posthog from 'posthog-js'
import { POSTHOG_EVENTS } from '@/lib/posthog-events'
import { TabsContent } from '@/components/ui/tabs'
import { AddPlaceholderCard } from '@/components/ui/custom/add-placeholder-card'
import { api } from '@/trpc/react'
import { ExperienceCard } from './ExperienceCard'
import { ResumeOverviewHeader } from './ResumeOverviewHeader'
import {
  mapCareerToExperience,
  mapProjectToExperience,
  mapToProfileData,
} from './PreparationSourceSection.utils'
import { useInterviewPrepMutations } from '../InterviewPrepDetail.hooks'
import { HeaderEditDialog } from '../HeaderEditDialog'
import { ExperienceDialog } from '../ExperienceCard/ExperienceDialog'
import {
  createEmptyCareer,
  careerToInput,
  projectToInput,
} from '../InterviewPrepDetail.utils'
import type { HeaderData } from '../InterviewPrepDetail.types'
import type {
  CareerWithDetails,
  ProjectWithDetails,
} from '@/server/services/experience'

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

export function PreparationSourceContent() {
  const t = useTranslations('interview-prep.detail.v2.preparationSource')
  const tDate = useTranslations('interview-prep.detail.v2.dateFormat')
  const params = useParams<{ id: string }>()

  // Read from hydrated cache - no loading state needed (handled by Suspense)
  const [result] = api.interviewPreparation.getById.useSuspenseQuery({
    id: params.id,
  })

  // Mutations for header and experience CRUD
  const { header, career, project } = useInterviewPrepMutations({
    preparationId: params.id,
  })

  // Dialog states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isExperienceDialogOpen, setIsExperienceDialogOpen] = useState(false)

  // Translation labels for date formatting
  const currentLabel = tDate('current')
  const unspecifiedLabel = tDate('unspecified')

  // Transform server data to UI data
  const profileData = mapToProfileData(result, unspecifiedLabel)
  const experiences = [
    ...result.careers.map(c => mapCareerToExperience(c, currentLabel)),
    ...result.projects.map(p => mapProjectToExperience(p, currentLabel)),
  ]

  // HeaderEditDialog에서 사용할 전체 데이터 (title 포함)
  const headerData: HeaderData = {
    title: result.title,
    jobTitle: result.jobTitle,
    yearsOfExperience: result.yearsOfExperience,
    summary: result.summary,
  }

  // Header update handler
  const handleHeaderUpdate = async (updated: HeaderData) => {
    await header.update.mutateAsync({ id: params.id, data: updated })
  }

  // Add experience handler
  const handleAddExperience = async (
    newData: CareerWithDetails | ProjectWithDetails,
    type: 'CAREER' | 'PROJECT'
  ) => {
    if (type === 'CAREER') {
      await career.create.mutateAsync({
        interviewPreparationId: params.id,
        data: careerToInput(newData as CareerWithDetails),
      })
    } else {
      await project.create.mutateAsync({
        interviewPreparationId: params.id,
        data: projectToInput(newData as ProjectWithDetails),
      })
    }
    posthog.capture(POSTHOG_EVENTS.EXPERIENCE.ADDED, {
      experience_type: type.toLowerCase(),
      preparation_id: params.id,
    })
    setIsExperienceDialogOpen(false)
  }

  return (
    <>
      {/* Resume Analysis Tab */}
      <TabsContent value='resume' className='mt-0 space-y-6'>
        {/* Resume Overview Header */}
        <ResumeOverviewHeader
          targetPosition={profileData.targetPosition}
          yearsOfExperience={profileData.yearsOfExperience}
          summaryPoints={profileData.summaryPoints}
          onEdit={() => setIsEditDialogOpen(true)}
        />

        {/* Experience Cards Grid */}
        <section className='grid grid-cols-1 gap-5 sm:grid-cols-2'>
          {experiences.map(experience => (
            <ExperienceCard
              key={`${experience.type}-${experience.id}`}
              experience={experience}
            />
          ))}
          {/* Add New Experience Placeholder */}
          <AddPlaceholderCard
            onClick={() => setIsExperienceDialogOpen(true)}
            label={t('addExperience.label')}
            description={t('addExperience.description')}
          />
        </section>
      </TabsContent>

      {/* Job Posting Tab - Coming Soon */}
      <TabsContent value='job-posting' className='mt-0'>
        <section className='flex flex-col items-center justify-center py-20 text-center'>
          <div className='mb-5 flex size-20 items-center justify-center rounded-2xl bg-muted'>
            <Briefcase className='size-10 text-muted-foreground' />
          </div>
          <h3 className='text-xl font-bold -tracking-[0.02em] text-foreground'>
            {t('comingSoon.title')}
          </h3>
          <p className='mt-2 max-w-sm text-base text-muted-foreground'>
            {t('comingSoon.description')}
          </p>
        </section>
      </TabsContent>

      {/* Header Edit Dialog */}
      <HeaderEditDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        initialData={headerData}
        onSubmit={handleHeaderUpdate}
        isSubmitting={header.isPending}
      />

      {/* Add Experience Dialog */}
      <ExperienceDialog
        open={isExperienceDialogOpen}
        onOpenChange={setIsExperienceDialogOpen}
        initialData={createEmptyCareer()}
        initialType='CAREER'
        onSubmit={handleAddExperience}
      />
    </>
  )
}
