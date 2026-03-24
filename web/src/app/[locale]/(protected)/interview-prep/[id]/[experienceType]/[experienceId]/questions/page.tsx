/**
 * Questions Page
 *
 * Displays questions for a specific experience or key achievement.
 * Uses tRPC prefetch + HydrationBoundary pattern for optimal SSR + client cache.
 */

import { Suspense } from 'react'

import { PageContainer } from '@/components/layout/PageContainer'
import { trpc, HydrateClient } from '@/trpc/server'
import { ExperienceType } from '@/generated/prisma/enums'

import { QuestionsPageContent } from './_components/QuestionsPageContent'
import { QuestionsPageSkeleton } from './_components/QuestionsPageSkeleton'

/**
 * Page props interface
 */
interface PageProps {
  params: Promise<{
    locale: string
    id: string
    experienceType: 'career' | 'project'
    experienceId: string
  }>
  searchParams: Promise<{
    keyAchievementId?: string
  }>
}

/**
 * Questions Page Component
 *
 * Data fetching pattern:
 * - Server: prefetch data into QueryClient cache (non-blocking)
 * - Client: HydrateClient hydrates cache, useSuspenseQuery reads from cache
 * - Mutations: invalidateQueries triggers automatic refetch
 */
export default async function QuestionsPage({
  params,
  searchParams,
}: PageProps) {
  const { id, experienceType, experienceId } = await params
  const { keyAchievementId: keyAchievementIdParam } = await searchParams

  const experienceIdNum = parseInt(experienceId, 10)
  const keyAchievementId = keyAchievementIdParam
    ? parseInt(keyAchievementIdParam, 10)
    : undefined

  // Convert experienceType to ExperienceType enum
  const experienceTypeEnum =
    experienceType === 'career' ? ExperienceType.CAREER : ExperienceType.PROJECT

  // Prefetch all data into QueryClient cache (non-blocking)
  // All prefetches run concurrently - void makes them non-blocking
  void trpc.interviewPreparation.getExperienceById.prefetch({
    interviewPreparationId: id,
    experienceType,
    experienceId: experienceIdNum,
  })

  if (keyAchievementId && !isNaN(keyAchievementId)) {
    void trpc.keyAchievement.getById.prefetch({ id: keyAchievementId })
  }

  void trpc.question.listByExperience.prefetch({
    experienceType: experienceTypeEnum,
    experienceId: experienceIdNum,
    keyAchievementId:
      keyAchievementId && !isNaN(keyAchievementId)
        ? keyAchievementId
        : undefined,
  })

  return (
    <PageContainer width='narrow'>
      <Suspense fallback={<QuestionsPageSkeleton />}>
        <HydrateClient>
          <QuestionsPageContent
            interviewPreparationId={id}
            experienceType={experienceType}
            experienceId={experienceIdNum}
            keyAchievementId={keyAchievementId}
          />
        </HydrateClient>
      </Suspense>
    </PageContainer>
  )
}
