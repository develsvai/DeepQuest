/**
 * Question Solve Page
 *
 * Displays question with answer input and AI feedback.
 * Uses tRPC prefetch + HydrationBoundary pattern for optimal SSR + client cache.
 */

import { Suspense } from 'react'

import { PageContainer } from '@/components/layout/PageContainer'
import { trpc, HydrateClient } from '@/trpc/server'

import { QuestionSolveContent } from './_components/QuestionSolveContent'
import { QuestionSolveSkeleton } from './_components/QuestionSolveSkeleton'

interface QuestionPageProps {
  params: Promise<{
    locale: string
    id: string
    experienceType: 'career' | 'project'
    experienceId: string
    questionId: string
  }>
}

/**
 * Server Component for Question Solve Page
 *
 * Data fetching pattern:
 * - Server: prefetch data into QueryClient cache (non-blocking)
 * - Client: HydrateClient hydrates cache, useSuspenseQuery reads from cache
 * - Mutations: invalidateQueries triggers automatic refetch
 */
export default async function QuestionPage({ params }: QuestionPageProps) {
  const { questionId } = await params

  // Prefetch question and attempts data into QueryClient cache (non-blocking)
  void trpc.question.getById.prefetch({ questionId })
  void trpc.answer.listAttempts.prefetch({ questionId })

  return (
    <PageContainer width='full' className='h-[calc(100vh-4rem)] gap-0 py-0'>
      <Suspense fallback={<QuestionSolveSkeleton />}>
        <HydrateClient>
          <QuestionSolveContent questionId={questionId} />
        </HydrateClient>
      </Suspense>
    </PageContainer>
  )
}
