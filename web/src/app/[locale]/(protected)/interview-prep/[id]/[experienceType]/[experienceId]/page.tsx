/**
 * Experience Detail Page
 *
 * Displays career or project experience with key achievements.
 * Uses tRPC prefetch + HydrationBoundary pattern for optimal SSR + client cache.
 */

import { Suspense } from 'react'

import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { trpc, HydrateClient } from '@/trpc/server'
import { PageContainer } from '@/components/layout/PageContainer'

import { ExperienceDetailContent } from './_components/ExperienceDetailContent'
import { ExperienceDetailSkeleton } from './_components/ExperienceDetailSkeleton'

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
}

/**
 * Generate metadata for the page
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('common.pageHeaders')

  const title = t('practiceQuestionList.title')
  const description = t('practiceQuestionList.description')

  return {
    title,
    description,
  }
}

/**
 * Experience Detail Page Component
 *
 * Data fetching pattern:
 * - Server: prefetch data into QueryClient cache (non-blocking)
 * - Client: HydrateClient hydrates cache, useSuspenseQuery reads from cache
 * - Mutations: invalidateQueries triggers automatic refetch
 */
export default async function ExperienceDetailPage({ params }: PageProps) {
  const { id, experienceType, experienceId } = await params

  const experienceIdNum = parseInt(experienceId, 10)

  // Prefetch data into QueryClient cache (non-blocking)
  void trpc.interviewPreparation.getExperienceById.prefetch({
    interviewPreparationId: id,
    experienceType,
    experienceId: experienceIdNum,
  })

  return (
    <PageContainer width='narrow'>
      <Suspense fallback={<ExperienceDetailSkeleton />}>
        <HydrateClient>
          <ExperienceDetailContent
            interviewPreparationId={id}
            experienceType={experienceType}
            experienceId={experienceIdNum}
          />
        </HydrateClient>
      </Suspense>
    </PageContainer>
  )
}
