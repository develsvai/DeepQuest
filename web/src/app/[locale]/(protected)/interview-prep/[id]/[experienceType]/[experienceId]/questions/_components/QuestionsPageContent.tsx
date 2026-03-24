/**
 * QuestionsPageContent Component
 *
 * Client component that fetches questions data using useSuspenseQuery.
 * Handles DetailHeader data derivation and renders the full page content.
 * Works with server-side prefetch + HydrateClient pattern for optimal SSR + client cache.
 */

'use client'

import { useMemo } from 'react'
import { Building2, Calendar, FolderGit2, Users } from 'lucide-react'

import { api } from '@/trpc/react'
import {
  DetailHeader,
  type MetadataItem,
  type DetailBadge,
  type DetailTag,
} from '@/components/ui/detail-header'
import { Separator } from '@/components/ui/separator'
import { ExperienceType } from '@/generated/prisma/browser'
import type {
  CareerDetailWithAchievements,
  ProjectDetailWithAchievements,
} from '@/server/services/experience'

import KeyAchievement from './KeyAchievement'
import Questions from './Questions'

interface QuestionsPageContentProps {
  interviewPreparationId: string
  experienceType: 'career' | 'project'
  experienceId: number
  keyAchievementId?: number
}

/**
 * Helper to format date period from startDate/endDate
 */
function formatPeriod(
  startDate: string | null,
  endDate: string | null,
  isCurrent: boolean
): string {
  const start = startDate || 'N/A'
  const end = isCurrent ? 'Present' : endDate || 'N/A'
  return `${start} - ${end}`
}

/**
 * Content wrapper that fetches data using useSuspenseQuery
 *
 * Data is prefetched on the server and hydrated to the client cache,
 * so useSuspenseQuery reads from cache without additional network request.
 */
export function QuestionsPageContent({
  interviewPreparationId,
  experienceType,
  experienceId,
  keyAchievementId,
}: QuestionsPageContentProps) {
  // Read from hydrated cache - no loading state needed
  const [experienceResult] =
    api.interviewPreparation.getExperienceById.useSuspenseQuery({
      interviewPreparationId,
      experienceType,
      experienceId,
    })

  // Conditional suspense query for key achievement
  // Only fetch if keyAchievementId is provided
  const keyAchievementData =
    keyAchievementId && !isNaN(keyAchievementId)
      ? api.keyAchievement.getById.useSuspenseQuery({ id: keyAchievementId })[0]
      : null

  // Convert experienceType to ExperienceType enum
  const experienceTypeEnum =
    experienceType === 'career' ? ExperienceType.CAREER : ExperienceType.PROJECT

  // Fetch questions data
  const [questionsResult] = api.question.listByExperience.useSuspenseQuery({
    experienceType: experienceTypeEnum,
    experienceId,
    keyAchievementId:
      keyAchievementId && !isNaN(keyAchievementId)
        ? keyAchievementId
        : undefined,
  })

  // Compute progress from questions data (SSoT pattern)
  // This ensures progress is always in sync with the actual questions list
  const computedProgress = useMemo(() => {
    const allQuestions = Object.values(
      questionsResult.questionsByCategory
    ).flat()
    return {
      totalQuestions: allQuestions.length,
      completedQuestions: allQuestions.filter(q => q.isCompleted).length,
    }
  }, [questionsResult.questionsByCategory])

  // Merge achievement data with computed progress (SSoT)
  const achievementWithProgress = keyAchievementData
    ? {
        ...keyAchievementData,
        totalQuestions: computedProgress.totalQuestions,
        completedQuestions: computedProgress.completedQuestions,
      }
    : null

  const experience = experienceResult.data
  const isCareer = experienceType === 'career'

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
    experience.isCurrent
  )

  const metadata: MetadataItem[] = [
    {
      icon: isCareer ? Building2 : FolderGit2,
      label:
        experience.position.length > 0
          ? experience.position.join(' / ')
          : 'No position specified',
    },
    { icon: Calendar, label: period },
    {
      icon: Users,
      label: `Team of ${(experience as ProjectDetailWithAchievements).teamSize}`,
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
      label: isCareer ? 'Career' : 'Project',
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
      />
      {achievementWithProgress && (
        <KeyAchievement achievement={achievementWithProgress} />
      )}
      <Separator className='bg-border' />
      <Questions
        questionsByCategory={questionsResult.questionsByCategory}
        keyAchievementId={keyAchievementId}
        keyAchievementData={keyAchievementData}
      />
    </div>
  )
}
