/**
 * Interview Preparation Detail Page
 *
 * Displays detailed information about a specific interview preparation including:
 * - Company information summary
 * - Candidate profile from resume
 * - Experience timeline with progress tracking
 * - Practice selection and navigation
 *
 * Uses tRPC prefetch + HydrationBoundary pattern for optimal SSR + client cache.
 */

import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'

import { trpc, HydrateClient } from '@/trpc/server'
import { PageContainer } from '@/components/layout/PageContainer'

// import { InterviewPrepDetail } from './_components/InterviewPrepDetail'
import { InterviewPrepDetailV2 } from './_components/InterviewPrepDetailV2'
import { InterviewPrepDetailSkeleton } from './_components/InterviewPrepDetailSkeleton'

interface PageProps {
  params: Promise<{
    locale: string
    id: string
  }>
}

/**
 * Server Component for Interview Preparation Detail Page
 *
 * Data fetching pattern:
 * - Server: prefetch data into QueryClient cache (non-blocking)
 * - Client: HydrateClient hydrates cache, useSuspenseQuery reads from cache
 * - Mutations: invalidateQueries triggers automatic refetch
 */
export default async function InterviewPrepDetailPage({ params }: PageProps) {
  const { id } = await params

  // Server date for prefetch (YYYY-MM-DD format)
  const serverDate = new Date().toISOString().split('T')[0]

  // Prefetch data into QueryClient cache (non-blocking)
  void trpc.interviewPreparation.getById.prefetch({ id })

  // Prefetch Today's Quest data (client will use local date, auto-refetch if different)
  void trpc.question.getTodaysQuest.prefetch({
    interviewPreparationId: id,
    date: serverDate,
  })

  return (
    <PageContainer width='default'>
      <Suspense fallback={<InterviewPrepDetailSkeleton />}>
        <HydrateClient>
          {/* <InterviewPrepDetail id={id} /> */}
          <InterviewPrepDetailV2 id={id} />
        </HydrateClient>
      </Suspense>
    </PageContainer>
  )
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const t = await getTranslations('interview-prep.metadata')

  try {
    // Fetch preparation data for metadata
    const result = await trpc.interviewPreparation.getById({ id })

    return {
      title: t('title', { title: result.title }),
      description: result.jobTitle
        ? t('description', { jobTitle: result.jobTitle })
        : t('descriptionDefault'),
    }
  } catch {
    // Fallback metadata if fetch fails
    return {
      title: t('notFound'),
    }
  }
}
