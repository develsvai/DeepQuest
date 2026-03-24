/**
 * ExperienceDetailContent Component
 *
 * Client component that fetches experience data using useSuspenseQuery.
 * Handles DetailHeader data derivation and renders the full page content.
 * Works with server-side prefetch + HydrateClient pattern for optimal SSR + client cache.
 */

'use client'

import { useState, useCallback, useMemo } from 'react'
import { Building2, Calendar, FolderGit2, Users } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { api } from '@/trpc/react'
import {
  DetailHeader,
  type MetadataItem,
  type DetailBadge,
  type DetailTag,
} from '@/components/ui/detail-header'
import { Separator } from '@/components/ui/separator'
import type {
  CareerDetailWithAchievements,
  ProjectDetailWithAchievements,
} from '@/server/services/experience'

import ExperienceDetail from './ExperienceDetail'
import { ExperienceDialog } from '../../../_components/ExperienceCard/ExperienceDialog'
import type {
  CareerWithDetails,
  ProjectWithDetails,
} from '../../../_components/InterviewPrepDetail.types'

interface ExperienceDetailContentProps {
  interviewPreparationId: string
  experienceType: 'career' | 'project'
  experienceId: number
}

/**
 * Helper to format date period from startDate/endDate
 */
function formatPeriod(
  startDate: string | null,
  endDate: string | null,
  isCurrent: boolean,
  presentLabel: string
): string {
  const start = startDate || 'N/A'
  const end = isCurrent ? presentLabel : endDate || 'N/A'
  return `${start} - ${end}`
}

/**
 * Content wrapper that fetches data using useSuspenseQuery
 *
 * Data is prefetched on the server and hydrated to the client cache,
 * so useSuspenseQuery reads from cache without additional network request.
 */
export function ExperienceDetailContent({
  interviewPreparationId,
  experienceType,
  experienceId,
}: ExperienceDetailContentProps) {
  const t = useTranslations('experience-detail')
  const utils = api.useUtils()

  // Dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Read from hydrated cache - no loading state needed
  const [result] = api.interviewPreparation.getExperienceById.useSuspenseQuery({
    interviewPreparationId,
    experienceType,
    experienceId,
  })

  const experience = result.data
  const isCareer = experienceType === 'career'

  // Mutations for Career and Project updates
  const updateCareerMutation =
    api.interviewPreparation.updateCareer.useMutation({
      onSuccess: () => {
        void utils.interviewPreparation.getExperienceById.invalidate({
          interviewPreparationId,
          experienceType,
          experienceId,
        })
        void utils.interviewPreparation.getById.invalidate({
          id: interviewPreparationId,
        })
      },
    })

  const updateProjectMutation =
    api.interviewPreparation.updateProject.useMutation({
      onSuccess: () => {
        void utils.interviewPreparation.getExperienceById.invalidate({
          interviewPreparationId,
          experienceType,
          experienceId,
        })
        void utils.interviewPreparation.getById.invalidate({
          id: interviewPreparationId,
        })
      },
    })

  // Convert CareerDetailWithAchievements to CareerWithDetails format for Dialog
  const dialogData = useMemo((): CareerWithDetails | ProjectWithDetails => {
    if (isCareer) {
      const careerData = experience as CareerDetailWithAchievements
      return {
        ...careerData,
        totalQuestions: 0,
        completedQuestions: 0,
      } as CareerWithDetails
    } else {
      const projectData = experience as ProjectDetailWithAchievements
      return {
        ...projectData,
        totalQuestions: 0,
        completedQuestions: 0,
      } as ProjectWithDetails
    }
  }, [experience, isCareer])

  // Handle dialog submit
  const handleDialogSubmit = useCallback(
    (
      data: CareerWithDetails | ProjectWithDetails,
      type: 'CAREER' | 'PROJECT'
    ) => {
      if (type === 'CAREER') {
        const careerData = data as CareerWithDetails
        updateCareerMutation.mutate({
          id: careerData.id,
          data: {
            company: careerData.company,
            companyDescription: careerData.companyDescription,
            position: careerData.position,
            techStack: careerData.techStack,
            startDate: careerData.startDate,
            endDate: careerData.endDate,
            isCurrent: careerData.isCurrent,
            employeeType: careerData.employeeType,
            jobLevel: careerData.jobLevel,
          },
        })
      } else {
        const projectData = data as ProjectWithDetails
        updateProjectMutation.mutate({
          id: projectData.id,
          data: {
            projectName: projectData.projectName,
            projectDescription: projectData.projectDescription,
            position: projectData.position,
            techStack: projectData.techStack,
            startDate: projectData.startDate,
            endDate: projectData.endDate,
            isCurrent: projectData.isCurrent,
            projectType: projectData.projectType,
            teamSize: projectData.teamSize,
            teamComposition: projectData.teamComposition,
          },
        })
      }
      setIsEditDialogOpen(false)
    },
    [updateCareerMutation, updateProjectMutation]
  )

  // Derive header data (moved from server to client)
  const title = isCareer
    ? (experience as CareerDetailWithAchievements).company
    : (experience as ProjectDetailWithAchievements).projectName

  const description = isCareer
    ? (experience as CareerDetailWithAchievements).companyDescription
    : (experience as ProjectDetailWithAchievements).projectDescription

  const period = formatPeriod(
    experience.startDate,
    experience.endDate,
    experience.isCurrent,
    t('header.present')
  )

  const metadata: MetadataItem[] = [
    {
      icon: isCareer ? Building2 : FolderGit2,
      label:
        experience.position.length > 0
          ? experience.position.join(' / ')
          : t('header.noPosition'),
    },
    { icon: Calendar, label: period },
    {
      icon: Users,
      label: t('header.teamOf', {
        size: (experience as ProjectDetailWithAchievements).teamSize ?? 0,
      }),
      hidden:
        isCareer || !(experience as ProjectDetailWithAchievements).teamSize,
    },
  ]

  const secondaryTypeLabel = isCareer
    ? (experience as CareerDetailWithAchievements).employeeType?.replace(
        '_',
        ' '
      )
    : (experience as ProjectDetailWithAchievements).projectType?.replace(
        '_',
        ' '
      )

  const badges: DetailBadge[] = [
    {
      label: isCareer ? t('header.career') : t('header.project'),
      variant: isCareer ? 'default' : 'secondary',
    },
    {
      label: secondaryTypeLabel ?? '',
      variant: 'outline',
      hidden: !secondaryTypeLabel,
    },
  ]

  const tags: DetailTag[] = experience.techStack.map(tech => ({
    key: tech,
    label: tech,
  }))

  return (
    <div className='space-y-8'>
      <DetailHeader
        title={title}
        metadata={metadata}
        badges={badges}
        tags={tags}
        description={description ?? undefined}
        onEdit={() => setIsEditDialogOpen(true)}
        editLabel={t('header.edit')}
      />
      <Separator className='bg-border' />
      <ExperienceDetail
        experienceType={experienceType}
        experienceId={experienceId}
        interviewPrepId={interviewPreparationId}
      />

      {/* Edit Dialog */}
      <ExperienceDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        initialData={dialogData}
        initialType={isCareer ? 'CAREER' : 'PROJECT'}
        onSubmit={handleDialogSubmit}
      />
    </div>
  )
}
