'use client'

/**
 * Interview Prep Detail V2 Component
 *
 * Dashboard-style Interview Prep page with:
 * - Header with date and motivational title
 * - Stats widgets (Weekly Streak, Today Goal)
 * - Today's Quest (featured question) - connected to API
 * - Recommended Questions - connected to API
 * - Experience Progress cards
 *
 * PENDING 상태일 때는 진행 상태 UI를 표시합니다.
 *
 * Realtime 상태는 InterviewPreparationProvider에서 전역 관리하며,
 * 이 컴포넌트는 Zustand store를 구독하여 상태를 표시합니다.
 */

import { useEffect } from 'react'
import {
  HeaderSection,
  WeeklyGoalWidget,
  TodaysQuestSection,
  PreparationSourceSection,
} from './v2'
import { Separator } from '@/components/ui/separator'
import { PreparationProgressSteps } from './PreparationProgressSteps'
import { api } from '@/trpc/react'
import { PreparationStatus } from '@/generated/prisma/enums'
import {
  useInterviewPreparationStore,
  usePreparationProgress,
} from '@/lib/stores/interview-preparation-store'

// ═══════════════════════════════════════════════════════════════════════════
// Props
// ═══════════════════════════════════════════════════════════════════════════

interface InterviewPrepDetailV2Props {
  id: string
}

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

export function InterviewPrepDetailV2({ id }: InterviewPrepDetailV2Props) {
  // Fetch preparation data
  const [preparation] = api.interviewPreparation.getById.useSuspenseQuery({
    id,
  })

  // Get store action via getState() for stable reference
  const { updateProgress } = useInterviewPreparationStore.getState()

  // Subscribe to realtime progress from global store (managed by Provider)
  const storeProgress = usePreparationProgress(id)

  // Sync server data to store on initial load or when server data changes
  // This ensures store has data even if page is visited before realtime event
  useEffect(() => {
    if (preparation.status === PreparationStatus.PENDING && !storeProgress) {
      updateProgress(id, {
        status: preparation.status as PreparationStatus,
        totalQuestionGenTasks: preparation.totalQuestionGenTasks,
        completedQuestionGenTasks: preparation.completedQuestionGenTasks,
      })
    }
  }, [
    id,
    preparation.status,
    preparation.totalQuestionGenTasks,
    preparation.completedQuestionGenTasks,
    storeProgress,
    updateProgress,
  ])

  // Derive display state: prefer store data (realtime), fallback to server data
  const displayStatus =
    storeProgress?.status ?? (preparation.status as PreparationStatus)
  const displayTotalTasks =
    storeProgress?.totalQuestionGenTasks ?? preparation.totalQuestionGenTasks
  const displayCompletedTasks =
    storeProgress?.completedQuestionGenTasks ??
    preparation.completedQuestionGenTasks

  // 기본 상태
  const isProcessing = displayStatus === PreparationStatus.PENDING
  const isReady = displayStatus === PreparationStatus.READY
  const hasError = displayStatus === PreparationStatus.FAILED

  // 단계별 상태
  const isParsingComplete = displayTotalTasks !== null
  const isParsingPending = isProcessing && !isParsingComplete
  // 문제 생성 진행 중 상태 (향후 UI 확장 시 사용)
  const _isQuestionGenPending = isProcessing && isParsingComplete

  return (
    <div className='mx-auto max-w-6xl space-y-8 p-6'>
      {/* Top Section: Header + Stats - 4열 그리드 */}
      <div className='grid grid-cols-1 items-start gap-6 lg:grid-cols-4'>
        {/* Header: 2칸 */}
        <div className='lg:col-span-2'>
          <HeaderSection />
        </div>

        {/* Weekly Goal: 2칸 (동심원 + 주차 네비게이션 통합) */}
        <WeeklyGoalWidget
          interviewPreparationId={id}
          className='lg:col-span-2'
        />
      </div>

      {/* Main Content: PENDING 상태에 따라 조건부 렌더링 */}
      <main>
        {isProcessing ? (
          <PreparationProgressSteps
            totalTasks={displayTotalTasks}
            completedTasks={displayCompletedTasks}
            isReady={isReady}
            hasError={hasError}
          />
        ) : (
          <TodaysQuestSection interviewPreparationId={id} />
        )}
      </main>

      <Separator />

      {/* Preparation Source Section: 이력서 분석 / 채용공고 */}
      <PreparationSourceSection isLoading={isParsingPending} />
    </div>
  )
}
