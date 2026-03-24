'use client'

import { QuestionCategory } from '@/generated/prisma/enums'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'
import QuestionDetail from './QuestionDetail'
import QuestionFeedback from './QuestionFeedback'
import { useState, useCallback, useMemo, useRef } from 'react'
import { useStream } from '@langchain/langgraph-sdk/react'
import {
  QuestionFeedbackGenGraphInputV2,
  QuestionFeedbackGenStateV2,
  StructuredGuideAnswerSchema,
} from '@/server/services/ai/contracts/schemas/questionFeedbackGen'
import { GraphName } from '@/server/services/ai/langgraph/types/graphs'
import { getLangGraphProxyUrl } from '@/lib/utils/url'
import { snakeToCamelCase, camelToSnakeCase } from '@/lib/utils/case-transform'
import { api } from '@/trpc/react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import posthog from 'posthog-js'
import { POSTHOG_EVENTS } from '@/lib/posthog-events'
import type {
  FeedbackV2,
  StructuredGuideAnswer,
} from '@/server/services/ai/contracts/schemas/questionFeedbackGen'
import { parsePartialJson } from '@/lib/utils/parse-partial-json'
import { FeedbackSchemaV2 } from '@/server/services/ai/contracts/schemas/questionFeedbackGen'
import { useEffect } from 'react'
import { useNavigationGuard } from '@/hooks/use-navigation-guard'

interface QuestionSolveBodyProps {
  question: {
    id: string
    text: string
    category: QuestionCategory | null
  }
}

/** View mode type */
type ViewMode = 'new' | 'viewing'

export default function QuestionSolveBody({
  question,
}: QuestionSolveBodyProps) {
  const t = useTranslations('question-solve')

  // ========== View Mode State ==========
  const [viewMode, setViewMode] = useState<ViewMode>('new')
  const [viewingAttemptId, setViewingAttemptId] = useState<string | null>(null)
  const [draftAnswer, setDraftAnswer] = useState('')

  // ========== Streaming State ==========
  const [streamingStatus, setStreamingStatus] = useState({
    feedback: false,
    guideAnswer: false,
  })

  const answerIdRef = useRef<string | null>(null)

  // Streaming result state for display (new attempt mode)
  const [feedback, setFeedback] = useState<Partial<FeedbackV2> | null>(null)
  const [guideAnswer, setGuideAnswer] =
    useState<Partial<StructuredGuideAnswer> | null>(null)

  // tRPC utils for imperative data fetching
  const utils = api.useUtils()

  // ========== tRPC Queries ==========
  // Fetch attempts list for this question
  // Data is prefetched on server and hydrated to client cache
  const [attemptsData] = api.answer.listAttempts.useSuspenseQuery(
    { questionId: question.id },
    { staleTime: 0 } // Always refetch after mutation
  )

  // Fetch specific attempt when viewing past attempt
  const { data: viewedAttemptData } = api.answer.getAttemptById.useQuery(
    { answerId: viewingAttemptId! },
    { enabled: !!viewingAttemptId && viewMode === 'viewing' }
  )

  // tRPC mutations
  const submitAnswerMutation = api.answer.submitAnswer.useMutation({
    onError: (error: { message: string }) => {
      toast.error(t('submitError'), {
        description: error.message,
      })
    },
  })

  const saveFeedbackMutation = api.answer.saveFeedbackResult.useMutation({
    onSuccess: () => {
      toast.success(t('feedbackSaved'))
      // Invalidate attempts list to show the new attempt
      utils.answer.listAttempts.invalidate({ questionId: question.id })

      // Switch to viewing mode with the newly created attempt
      if (answerIdRef.current) {
        setViewMode('viewing')
        setViewingAttemptId(answerIdRef.current)
        // Clear the draft since it's now saved
        setDraftAnswer('')
      }
    },
    onError: (error: { message: string }) => {
      toast.error(t('saveFeedbackError'), {
        description: error.message,
      })
    },
  })

  const thread = useStream<QuestionFeedbackGenGraphInputV2>({
    apiUrl: getLangGraphProxyUrl(),
    assistantId: GraphName.QUESTION_FEEDBACK_GEN,
    reconnectOnMount: true,
    onUpdateEvent(data) {
      if (data?.question_feedback_gen) {
        setStreamingStatus({
          feedback: false,
          guideAnswer: true,
        })
      }
      if (data?.structured_guide_answer_gen) {
        setStreamingStatus({
          feedback: false,
          guideAnswer: false,
        })
      }
    },
    onFinish: async (state, run) => {
      const resultState = snakeToCamelCase(
        state.values
      ) as QuestionFeedbackGenStateV2
      const resultFeedback = resultState.feedback
      const resultGuideAnswer = resultState.structuredGuideAnswer

      // Update display state
      setFeedback(resultFeedback)
      setGuideAnswer(resultGuideAnswer)

      // PostHog: Track feedback received (key conversion moment)
      if (resultFeedback) {
        posthog.capture(POSTHOG_EVENTS.QUESTION.FEEDBACK_RECEIVED, {
          question_id: question.id,
          question_category: question.category,
          rating_level: resultFeedback.rating?.level,
          strengths_count: resultFeedback.strengths?.length ?? 0,
          weaknesses_count: resultFeedback.weaknesses?.length ?? 0,
          suggestions_count: resultFeedback.suggestions?.length ?? 0,
          has_guide_answer: !!resultGuideAnswer,
        })
      }

      // Save feedback to database (feedback is required, guideAnswer is optional)
      if (answerIdRef.current && resultFeedback) {
        await saveFeedbackMutation.mutateAsync({
          answerId: answerIdRef.current,
          feedback: resultFeedback,
          guideAnswer: resultGuideAnswer,
        })
      }

      // Clean up the thread
      if (run?.thread_id) {
        await thread.client.threads.delete(run.thread_id)
      }
    },
    onError: async (error, run) => {
      console.error('[QuestionFeedbackGen] Error:', error)
      toast.error(t('streamingError'))
      setStreamingStatus({ feedback: false, guideAnswer: false })
      if (run?.thread_id) {
        await thread.client.threads.delete(run.thread_id)
      }
    },
  })

  useEffect(() => {
    if (thread.messages[0]) {
      const content = thread.messages[0].content
      // Extract text from message block array: [{ type: 'text', text: '...' }]
      const partialJsonString =
        Array.isArray(content) && content[0]?.type === 'text'
          ? content[0].text
          : (content as string)

      if (partialJsonString) {
        const parsedFeedback = parsePartialJson<Partial<FeedbackV2>>(
          partialJsonString,
          {
            schema: FeedbackSchemaV2.partial(),
          }
        )
        const parsedGuideAnswer = parsePartialJson<
          Partial<StructuredGuideAnswer>
        >(partialJsonString, {
          schema: StructuredGuideAnswerSchema.partial(), // Allow partial guide answer during streaming
        })

        if (parsedGuideAnswer && Object.keys(parsedGuideAnswer).length > 0) {
          setGuideAnswer(parsedGuideAnswer)
        }
        if (parsedFeedback && Object.keys(parsedFeedback).length > 0) {
          setFeedback(parsedFeedback)
        }
      }
    }
  }, [thread.messages])

  /**
   * Handle answer submission
   *
   * 1. Submit answer via tRPC
   * 2. Get feedback generation input (with experience data)
   * 3. Start LangGraph streaming
   */
  const handleSubmitAnswer = useCallback(
    async (answerText: string) => {
      try {
        // Reset state
        setFeedback(null)
        setGuideAnswer(null)

        // 1. Submit answer
        const result = await submitAnswerMutation.mutateAsync({
          questionId: question.id,
          answerText,
        })
        answerIdRef.current = result.id

        // PostHog: Track answer submission
        posthog.capture(POSTHOG_EVENTS.QUESTION.ANSWER_SUBMITTED, {
          question_id: question.id,
          question_category: question.category,
          answer_length: answerText.length,
          attempt_number: (attemptsData?.attempts?.length ?? 0) + 1,
        })

        // 2. Get feedback generation input (experience 데이터 포함)
        const input = await utils.answer.getFeedbackGenInput.fetch({
          answerId: result.id,
        })

        // 3. Start streaming with feedback status
        setStreamingStatus({ feedback: true, guideAnswer: true })

        // 4. Stream feedback generation with proper input
        thread.submit(camelToSnakeCase(input))
      } catch {
        // Error handled by mutation onError
        setStreamingStatus({ feedback: false, guideAnswer: false })
      }
    },
    [
      question,
      submitAnswerMutation,
      utils,
      thread,
      attemptsData?.attempts?.length,
    ]
  )

  // ========== Attempt Selection Handlers ==========
  const handleAttemptSelect = useCallback((attemptId: string) => {
    setViewMode('viewing')
    setViewingAttemptId(attemptId)
  }, [])

  const handleNewAttempt = useCallback(() => {
    setViewMode('new')
    setViewingAttemptId(null)
  }, [])

  const handleDraftChange = useCallback((text: string) => {
    setDraftAnswer(text)
    setFeedback(null)
    setGuideAnswer(null)
  }, [])

  // ========== Computed Values ==========
  const isStreaming = streamingStatus.feedback || streamingStatus.guideAnswer
  const isSubmitting = submitAnswerMutation.isPending

  // ========== Prevent Navigation During Streaming ==========
  useNavigationGuard({
    enabled: isStreaming,
    message: t('navigationWarning'),
  })

  // Transform viewed feedback to FeedbackV2 format for display
  const viewedFeedback: FeedbackV2 | null = useMemo(() => {
    if (!viewedAttemptData?.feedback) return null
    return {
      strengths: viewedAttemptData.feedback.strengths,
      weaknesses: viewedAttemptData.feedback.weaknesses,
      suggestions: viewedAttemptData.feedback.suggestions,
      rating: {
        level: viewedAttemptData.feedback.rating,
        rationale: viewedAttemptData.feedback.ratingRationale,
      },
    }
  }, [viewedAttemptData?.feedback])

  // Determine which feedback/guideAnswer to display based on view mode
  const displayFeedback = viewMode === 'viewing' ? viewedFeedback : feedback
  const displayGuideAnswer =
    viewMode === 'viewing'
      ? (viewedAttemptData?.feedback?.guideAnswer ?? null)
      : guideAnswer

  return (
    <ResizablePanelGroup direction='horizontal' className='min-h-0 flex-1'>
      <ResizablePanel defaultSize={50} minSize={30}>
        <QuestionDetail
          question={question}
          isStreaming={isStreaming}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmitAnswer}
          viewMode={viewMode}
          draftAnswer={draftAnswer}
          viewedAnswer={viewedAttemptData?.answer ?? null}
          attempts={attemptsData?.attempts ?? []}
          viewingAttemptId={viewingAttemptId}
          onAttemptSelect={handleAttemptSelect}
          onNewAttempt={handleNewAttempt}
          onDraftChange={handleDraftChange}
        />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={50} minSize={30}>
        <QuestionFeedback
          feedback={displayFeedback}
          guideAnswer={displayGuideAnswer}
          isStreamingFeedback={viewMode === 'new' && streamingStatus.feedback}
          isStreamingGuideAnswer={
            viewMode === 'new' && streamingStatus.guideAnswer
          }
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
