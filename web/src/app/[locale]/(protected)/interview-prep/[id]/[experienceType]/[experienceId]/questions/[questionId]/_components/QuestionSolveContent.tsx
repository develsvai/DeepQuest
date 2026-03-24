/**
 * QuestionSolveContent Component
 *
 * Client component that fetches question data using useSuspenseQuery.
 * Works with server-side prefetch + HydrateClient pattern for optimal SSR + client cache.
 */

'use client'

import { notFound } from 'next/navigation'

import { api } from '@/trpc/react'

import QuestionSolveHeader from './QuestionSolveHeader'
import QuestionSolveBody from './QuestionSolveBody'

interface QuestionSolveContentProps {
  questionId: string
}

/**
 * Content wrapper that fetches data using useSuspenseQuery
 *
 * Data is prefetched on the server and hydrated to the client cache,
 * so useSuspenseQuery reads from cache without additional network request.
 */
export function QuestionSolveContent({
  questionId,
}: QuestionSolveContentProps) {
  // Read from hydrated cache - no loading state needed
  const [question] = api.question.getById.useSuspenseQuery({ questionId })

  if (!question) {
    notFound()
  }

  return (
    <>
      <QuestionSolveHeader />
      <QuestionSolveBody question={question} />
    </>
  )
}
