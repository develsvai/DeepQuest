'use client'

/**
 * Preparation Progress Steps Component
 *
 * 이력서 분석 및 문제 생성 진행 상태를 단계별로 표시하는 컴포넌트
 * status === 'PENDING'일 때 main content로 표시
 *
 * 단계 (2단계):
 * 1. 이력서 분석 (totalQuestionGenTasks가 설정되면 완료)
 * 2. 면접 문제 생성 (completedQuestionGenTasks/totalQuestionGenTasks 진행)
 *
 * 레이아웃: 좌측 스텝 + 우측 Ember 타이핑 동영상
 */

import { useTranslations } from 'next-intl'
import { CheckCircle2, Circle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type StepStatus = 'pending' | 'in-progress' | 'completed'

interface PreparationProgressStepsProps {
  /** 전체 문제 생성 작업 수 (파싱 완료 후 설정) */
  totalTasks: number | null
  /** 완료된 문제 생성 작업 수 */
  completedTasks: number | null
  /** 현재 preparation 상태가 READY인지 */
  isReady: boolean
  /** 에러 발생 여부 */
  hasError?: boolean
}

/**
 * 단계별 진행 상태를 표시하는 컴포넌트
 */
export function PreparationProgressSteps({
  totalTasks,
  completedTasks,
  isReady,
  hasError = false,
}: PreparationProgressStepsProps) {
  const t = useTranslations('interview-prep.detail.progressSteps')

  // 단계 판단 로직
  const isParsingComplete = totalTasks !== null // 문제 생성 작업이 초기화됨 = 파싱 완료
  const isQuestionGenInProgress =
    isParsingComplete && completedTasks !== null && completedTasks < totalTasks
  const isQuestionGenComplete =
    isParsingComplete && completedTasks !== null && completedTasks >= totalTasks

  // 단계별 상태 계산
  const getParsingStatus = (): StepStatus => {
    if (hasError) return 'pending'
    if (isParsingComplete) return 'completed'
    return 'in-progress'
  }

  const getQuestionGenStatus = (): StepStatus => {
    if (hasError) return 'pending'
    if (isQuestionGenComplete || isReady) return 'completed'
    if (isQuestionGenInProgress) return 'in-progress'
    if (isParsingComplete) return 'in-progress'
    return 'pending'
  }

  // 문제 생성 진행 레이블
  const questionGenLabel =
    totalTasks !== null
      ? `${t('questionGeneration')} (${completedTasks ?? 0}/${totalTasks})`
      : t('questionGeneration')

  const parsingStatus = getParsingStatus()
  const questionGenStatus = getQuestionGenStatus()

  return (
    <section>
      {/* 건조한 타이틀 */}
      <h2 className='mb-6 text-2xl font-bold text-stone'>{t('mainTitle')}</h2>

      {/* 하나의 카드 안에서 split 레이아웃 */}
      <div className='flex flex-col overflow-hidden rounded-2xl border border-border bg-card lg:flex-row'>
        {/* 좌측: Progress Steps (1/3) */}
        <div className='flex flex-col justify-center p-8 lg:w-1/3 lg:p-10'>
          <h3 className='mb-8 text-lg font-semibold text-foreground'>
            {t('title')}
          </h3>

          {/* 타임라인 스텝 */}
          <div className='flex flex-col'>
            <TimelineStep
              label={t('resumeAnalysis')}
              status={parsingStatus}
              isLast={false}
            />
            <TimelineStep
              label={questionGenLabel}
              status={questionGenStatus}
              isLast={true}
            />
          </div>
        </div>

        {/* 구분선 */}
        <div className='border-t border-border lg:border-t-0 lg:border-l' />

        {/* 우측: Ember 타이핑 동영상 (2/3) */}
        <div className='flex min-h-[280px] items-center justify-center bg-muted/30 lg:w-2/3'>
          <video
            src='/videos/typing-ember.mp4'
            autoPlay
            loop
            muted
            playsInline
            preload='auto'
            aria-label={t('emberTypingVideo')}
            className='h-full w-full object-cover'
          >
            {/* 비디오 미지원 브라우저용 폴백 */}
            {t('videoNotSupported')}
          </video>
        </div>
      </div>
    </section>
  )
}

/**
 * 타임라인 스텝 컴포넌트 (세로선으로 연결)
 */
function TimelineStep({
  label,
  status,
  isLast,
}: {
  label: string
  status: StepStatus
  isLast: boolean
}) {
  // 연결선 색상: 현재 스텝이 완료되면 primary, 아니면 muted
  const lineColor =
    status === 'completed' ? 'bg-primary' : 'bg-muted-foreground/20'

  return (
    <div className='flex'>
      {/* 아이콘 + 연결선 */}
      <div className='flex flex-col items-center'>
        <StepIcon status={status} />
        {!isLast && <div className={cn('my-1 h-8 w-0.5', lineColor)} />}
      </div>

      {/* 텍스트 */}
      <div className='ml-4 pb-6'>
        <span
          className={cn(
            'text-base font-medium transition-colors lg:text-lg',
            status === 'completed' && 'text-foreground',
            status === 'in-progress' && 'text-primary',
            status === 'pending' && 'text-muted-foreground'
          )}
        >
          {label}
        </span>
      </div>
    </div>
  )
}

/**
 * 단계 아이콘 컴포넌트
 */
function StepIcon({ status }: { status: StepStatus }) {
  switch (status) {
    case 'completed':
      return (
        <CheckCircle2
          className='size-7 shrink-0 text-primary'
          aria-label='completed'
        />
      )
    case 'in-progress':
      return (
        <Loader2
          className='size-7 shrink-0 animate-spin text-primary'
          aria-label='in progress'
        />
      )
    case 'pending':
    default:
      return (
        <Circle
          className='size-7 shrink-0 text-muted-foreground/50'
          aria-label='pending'
        />
      )
  }
}
