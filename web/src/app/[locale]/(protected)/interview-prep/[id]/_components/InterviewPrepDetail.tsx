'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import posthog from 'posthog-js'
import { POSTHOG_EVENTS } from '@/lib/posthog-events'

import { Layout } from 'lucide-react'
import { useParams } from 'next/navigation'

import { routes } from '@/lib/routes'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CardGrid } from '@/components/ui/custom/card-grid'
import { SectionHeader } from '@/components/ui/custom/section-header'
import { AddPlaceholderCard } from '@/components/ui/custom/add-placeholder-card'
import { api } from '@/trpc/react'

import { EducationCard } from './EducationCard/EducationCard'
import { EducationDialog } from './EducationCard/EducationDialog'
import { ExperienceCardV2 } from './ExperienceCard/ExperienceCardV2'
import { ExperienceDialog } from './ExperienceCard/ExperienceDialog'
import { HeaderSection } from './HeaderSection'
import { useInterviewPrepMutations } from './InterviewPrepDetail.hooks'
import {
  careerToInput,
  projectToInput,
  educationToInput,
  createEmptyCareer,
  createEmptyEducation,
} from './InterviewPrepDetail.utils'
import type {
  CareerWithDetails,
  ProjectWithDetails,
  EducationData,
  HeaderData,
} from './InterviewPrepDetail.types'

type ExperienceData = CareerWithDetails | ProjectWithDetails
type ExperienceType = 'CAREER' | 'PROJECT'

interface InterviewPrepDetailProps {
  id: string
}

/**
 * Interview Prep Detail Component
 *
 * Displays the full interview preparation detail page with:
 * - Header with title, position, and summary
 * - Tabs for Resume Analysis and Job Descriptions
 * - Experience cards (Career/Project) with inline editing
 * - Education cards with inline editing
 *
 * Uses useSuspenseQuery to read from hydrated cache (prefetched on server).
 * Uses optimistic updates via useInterviewPrepMutations hook.
 */
export function InterviewPrepDetail({ id }: InterviewPrepDetailProps) {
  const t = useTranslations('interview-prep.detail')
  const params = useParams<{ locale: string; id: string }>()
  const hasTrackedViewRef = useRef(false)

  // Read from hydrated cache - no loading state needed (handled by Suspense)
  const [result] = api.interviewPreparation.getById.useSuspenseQuery({ id })

  // PostHog: Track interview preparation detail view (only once per component mount)
  if (!hasTrackedViewRef.current) {
    posthog.capture(POSTHOG_EVENTS.PREPARATION.DETAIL_VIEWED, {
      preparation_id: id,
      job_title: result.jobTitle,
      career_count: result.careers.length,
      project_count: result.projects.length,
      education_count: result.educations.length,
    })
    hasTrackedViewRef.current = true
  }

  // Get grouped mutation functions with optimistic updates
  const { header, career, project, education } = useInterviewPrepMutations({
    preparationId: id,
  })

  // Create headerData object on the fly (not state)
  const headerData: HeaderData = {
    title: result.title,
    jobTitle: result.jobTitle,
    yearsOfExperience: result.yearsOfExperience,
    summary: result.summary,
  }

  // Header handler
  const handleHeaderUpdate = async (updated: HeaderData) => {
    await header.update.mutateAsync({ id, data: updated })
  }

  // Career handlers - using mapper utilities for clean code
  const handleUpdateCareer = async (updated: CareerWithDetails) => {
    await career.update.mutateAsync({
      id: updated.id,
      data: careerToInput(updated),
    })
  }

  const handleDeleteCareer = async (careerId: number) => {
    // PostHog: Track experience deletion
    posthog.capture(POSTHOG_EVENTS.EXPERIENCE.DELETED, {
      experience_id: careerId,
      experience_type: 'career',
      preparation_id: id,
    })
    await career.delete.mutateAsync({ id: careerId })
  }

  // Project handlers - using mapper utilities for clean code
  const handleUpdateProject = async (updated: ProjectWithDetails) => {
    await project.update.mutateAsync({
      id: updated.id,
      data: projectToInput(updated),
    })
  }

  const handleDeleteProject = async (projectId: number) => {
    // PostHog: Track experience deletion
    posthog.capture(POSTHOG_EVENTS.EXPERIENCE.DELETED, {
      experience_id: projectId,
      experience_type: 'project',
      preparation_id: id,
    })
    await project.delete.mutateAsync({ id: projectId })
  }

  // Education handlers - using mapper utilities for clean code
  const handleUpdateEducation = async (updated: EducationData) => {
    await education.update.mutateAsync({
      id: updated.id,
      data: educationToInput(updated),
    })
  }

  const handleDeleteEducation = async (educationId: number) => {
    await education.delete.mutateAsync({ id: educationId })
  }

  // Dialog states for adding new items (local UI state - not data state)
  const [isExperienceDialogOpen, setIsExperienceDialogOpen] = useState(false)
  const [isEducationDialogOpen, setIsEducationDialogOpen] = useState(false)

  const handleAddExperience = async (
    newData: ExperienceData,
    type: ExperienceType
  ) => {
    if (type === 'CAREER') {
      await career.create.mutateAsync({
        interviewPreparationId: id,
        data: careerToInput(newData as CareerWithDetails),
      })
    } else {
      await project.create.mutateAsync({
        interviewPreparationId: id,
        data: projectToInput(newData as ProjectWithDetails),
      })
    }
    // PostHog: Track experience added
    posthog.capture(POSTHOG_EVENTS.EXPERIENCE.ADDED, {
      experience_type: type.toLowerCase(),
      preparation_id: id,
    })
    setIsExperienceDialogOpen(false)
  }

  const handleAddEducation = async (newData: EducationData) => {
    await education.create.mutateAsync({
      interviewPreparationId: id,
      data: educationToInput(newData),
    })
    // PostHog: Track education added
    posthog.capture(POSTHOG_EVENTS.EDUCATION.ADDED, {
      preparation_id: id,
      institution: newData.institution,
      degree: newData.degree,
    })
    setIsEducationDialogOpen(false)
  }

  return (
    <div className='-m-6 min-h-screen p-8'>
      {/* Header Section */}
      <HeaderSection
        data={headerData}
        onSubmit={handleHeaderUpdate}
        isSubmitting={header.isPending}
      />

      {/* Main Content with Tabs */}
      <main className='mx-auto max-w-7xl'>
        <Tabs defaultValue='resume' className='w-full'>
          <TabsList className='mb-4 h-auto w-full justify-start gap-0 rounded-none border-b border-border bg-transparent p-0'>
            <div className='flex'>
              <TabsTrigger
                value='resume'
                className='rounded-none border-transparent bg-transparent px-4 py-2 text-muted-foreground shadow-none data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none'
              >
                {t('tabs.resumeAnalysis')}
              </TabsTrigger>
              <TabsTrigger
                value='jd'
                className='rounded-none border-transparent bg-transparent px-4 py-2 text-muted-foreground shadow-none data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none'
              >
                {t('tabs.jobDescriptions')}
              </TabsTrigger>
            </div>
          </TabsList>

          <TabsContent value='resume'>
            {/* Experiences Section */}
            <SectionHeader title={t('sections.experiences')} className='mb-4' />

            <CardGrid variant='grid' gap={8}>
              {/* Career Experiences */}
              {result.careers.map(career => (
                <ExperienceCardV2
                  key={`career-${career.id}`}
                  experience={career}
                  experienceType='CAREER'
                  onUpdate={handleUpdateCareer}
                  onDelete={handleDeleteCareer}
                  href={routes.interviewPrep.experience(
                    params.id,
                    'career',
                    career.id
                  )}
                />
              ))}

              {/* Project Experiences */}
              {result.projects.map(project => (
                <ExperienceCardV2
                  key={`project-${project.id}`}
                  experience={project}
                  experienceType='PROJECT'
                  onUpdate={handleUpdateProject}
                  onDelete={handleDeleteProject}
                  href={routes.interviewPrep.experience(
                    params.id,
                    'project',
                    project.id
                  )}
                />
              ))}

              {/* Add New Experience Placeholder - h-full in component matches sibling card heights */}
              <AddPlaceholderCard
                onClick={() => setIsExperienceDialogOpen(true)}
                label={t('addExperience.label')}
                description={t('addExperience.description')}
              />
            </CardGrid>

            {/* Education Section */}
            <SectionHeader
              title={t('sections.education')}
              className='mt-12 mb-4'
            />

            <CardGrid variant='grid' gap={8}>
              {result.educations.map(edu => (
                <EducationCard
                  key={edu.id}
                  education={edu}
                  onUpdate={handleUpdateEducation}
                  onDelete={handleDeleteEducation}
                />
              ))}

              {/* Add New Education Placeholder - h-full in component matches sibling card heights */}
              <AddPlaceholderCard
                onClick={() => setIsEducationDialogOpen(true)}
                label={t('addEducation.label')}
                description={t('addEducation.description')}
              />
            </CardGrid>
          </TabsContent>

          <TabsContent value='jd'>
            <div className='py-20 text-center'>
              <div className='mb-4 inline-block rounded-full bg-muted p-4 text-muted-foreground'>
                <Layout size={32} />
              </div>
              <h3 className='mb-2 text-xl font-bold text-foreground'>
                {t('jdPlaceholder.title')}
              </h3>
              <p className='text-muted-foreground'>
                {t('jdPlaceholder.description')}
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Add Experience Dialog */}
      <ExperienceDialog
        open={isExperienceDialogOpen}
        onOpenChange={setIsExperienceDialogOpen}
        initialData={createEmptyCareer()}
        initialType='CAREER'
        onSubmit={handleAddExperience}
      />

      {/* Add Education Dialog */}
      <EducationDialog
        open={isEducationDialogOpen}
        onOpenChange={setIsEducationDialogOpen}
        initialData={createEmptyEducation(params.id)}
        onSubmit={handleAddEducation}
      />
    </div>
  )
}
