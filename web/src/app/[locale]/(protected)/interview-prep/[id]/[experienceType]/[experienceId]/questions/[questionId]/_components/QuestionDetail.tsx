'use client'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  TooltipContent,
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useSpeechToText } from '@/hooks/useSpeechToText'
import { AnswerStatus, QuestionCategory } from '@/generated/prisma/enums'
import { Mic, Send, Square, Loader2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useCallback, useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Separator } from '@/components/ui/separator'
import { CATEGORY_ICONS } from '@/lib/constants/question-category'

/** Attempt summary for displaying in button list */
interface AttemptSummary {
  id: string
  attemptNumber: number
  submittedAt: Date | null
  status: AnswerStatus
  hasEvaluated: boolean
}

/** Answer data for viewing past attempts */
interface AnswerData {
  id: string
  questionId: string
  text: string
  status: AnswerStatus
  version: number
  startedAt: Date
  submittedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

interface QuestionDetailProps {
  question: {
    id: string
    text: string
    category: QuestionCategory | null
  }
  isStreaming: boolean
  isSubmitting: boolean
  onSubmit: (answerText: string) => Promise<void>
  // Attempt management props
  viewMode: 'new' | 'viewing'
  draftAnswer: string
  viewedAnswer: AnswerData | null
  attempts: AttemptSummary[]
  viewingAttemptId: string | null
  onAttemptSelect: (attemptId: string) => void
  onNewAttempt: () => void
  onDraftChange: (text: string) => void
}

const MIN_ANSWER_LENGTH = 10
const MAX_ANSWER_LENGTH = 5000

export default function QuestionDetail({
  question,
  isStreaming,
  isSubmitting,
  onSubmit,
  viewMode,
  draftAnswer,
  viewedAnswer,
  attempts,
  viewingAttemptId,
  onAttemptSelect,
  onNewAttempt,
  onDraftChange,
}: QuestionDetailProps) {
  const tQuestionSolve = useTranslations('question-solve')
  const tCommon = useTranslations('common')
  const locale = useLocale()

  const categoryName = question.category
    ? tCommon(`questionCategory.${question.category}.name`)
    : null
  const [interimText, setInterimText] = useState('')
  const [answerText, setAnswerText] = useState('')

  // Refs to hold latest values for stable callbacks (prevent SpeechRecognition re-creation)
  const answerTextRef = useRef(answerText)
  const onDraftChangeRef = useRef(onDraftChange)

  // Keep refs in sync with latest values
  useEffect(() => {
    answerTextRef.current = answerText
  }, [answerText])

  useEffect(() => {
    onDraftChangeRef.current = onDraftChange
  }, [onDraftChange])

  // Sync draft answer from parent when in 'new' mode
  useEffect(() => {
    if (viewMode === 'new') {
      setAnswerText(draftAnswer)
    }
  }, [viewMode, draftAnswer])

  // Voice input callbacks
  const handleVoiceInterimResult = useCallback((transcript: string) => {
    // Real-time preview (not yet confirmed)
    setInterimText(transcript)
  }, [])

  const handleVoiceFinalResult = useCallback((transcript: string) => {
    // Confirmed segment - append to answer text
    // Use refs to access latest values without adding dependencies
    // This prevents SpeechRecognition re-creation on every render
    const currentText = answerTextRef.current
    const newText = currentText ? `${currentText} ${transcript}` : transcript
    setAnswerText(newText)
    onDraftChangeRef.current(newText) // Sync to parent for draft preservation
    setInterimText('') // Clear interim text
  }, [])

  const handleVoiceError = useCallback(
    (error: Error) => {
      if (error.message.includes('not-allowed')) {
        toast.error(tQuestionSolve('microphonePermissionDenied'))
      } else if (error.message.includes('no-speech')) {
        toast.warning(tQuestionSolve('noSpeechDetected'))
      } else {
        toast.error(tQuestionSolve('voiceInputError'))
      }
    },
    [tQuestionSolve]
  )

  const { isRecording, isSupported, startRecording, stopRecording } =
    useSpeechToText({
      lang: locale === 'ko' ? 'ko-KR' : 'en-US',
      onInterimResult: handleVoiceInterimResult,
      onFinalResult: handleVoiceFinalResult,
      onError: handleVoiceError,
      continuous: true,
    })

  // Cleanup interim text when recording stops
  useEffect(() => {
    if (!isRecording) {
      setInterimText('')
    }
  }, [isRecording])

  const handleVoiceInputClick = useCallback(() => {
    if (!isSupported) {
      toast.error(tQuestionSolve('voiceInputNotSupported'))
      return
    }
    if (isRecording) {
      stopRecording()
      toast.success(tQuestionSolve('voiceInputComplete'))
    } else {
      startRecording()
    }
  }, [isSupported, isRecording, startRecording, stopRecording, tQuestionSolve])

  const handleSubmitClick = useCallback(async () => {
    await onSubmit(answerText)
  }, [answerText, onSubmit])

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newText = e.target.value
      setAnswerText(newText)
      onDraftChange(newText) // Sync to parent for draft preservation
    },
    [onDraftChange]
  )

  // Display text includes interim voice input (only in new mode)
  const displayText =
    viewMode === 'viewing'
      ? (viewedAnswer?.text ?? '')
      : interimText
        ? `${answerText} ${interimText}`
        : answerText

  const currentLength = answerText.length
  const isValidLength =
    currentLength >= MIN_ANSWER_LENGTH && currentLength <= MAX_ANSWER_LENGTH
  const canSubmit =
    viewMode === 'new' && isValidLength && !isStreaming && !isSubmitting
  const isViewingMode = viewMode === 'viewing'

  // Footer height calculation: p-6 (24px) + pt-10 (40px) + button h-9 (36px) ≈ 100px
  const footerHeight = isViewingMode ? 0 : 100

  return (
    <div className='relative flex h-full flex-col'>
      {/* Question Section - shrink-0 to maintain its size */}
      <div className='shrink-0 space-y-4 p-6 pb-4'>
        {question.category && categoryName && (
          <div className='flex items-center gap-2 text-sm font-medium text-primary'>
            {(() => {
              const Icon = CATEGORY_ICONS[question.category]
              return <Icon className='h-4 w-4' />
            })()}
            <span>{categoryName}</span>
          </div>
        )}
        <h2 className='text-xl leading-relaxed font-semibold tracking-tight text-foreground'>
          {question.text}
        </h2>
      </div>

      {/* Input Section - flex-1 to fill remaining space */}
      <div
        className='flex min-h-0 flex-1 flex-col gap-4 px-6'
        style={{ paddingBottom: footerHeight }}
      >
        {/* Attempt Selector */}
        <div className='flex shrink-0 flex-wrap items-center gap-2'>
          {/* New Attempt Button */}
          <Button
            variant={viewMode === 'new' ? 'default' : 'secondary'}
            size='sm'
            className='h-7 rounded-full px-3 font-medium'
            onClick={onNewAttempt}
          >
            <span className='mr-1'>+</span> {tQuestionSolve('newAttempt')}
          </Button>

          <div className='h-4'>
            <Separator orientation='vertical' />
          </div>

          {/* Past Attempt Buttons */}
          {attempts.map(attempt => (
            <Button
              key={attempt.id}
              variant={viewingAttemptId === attempt.id ? 'default' : 'outline'}
              size='sm'
              className='h-7 rounded-full px-3 font-medium'
              onClick={() => onAttemptSelect(attempt.id)}
            >
              {tQuestionSolve('attemptNumber', {
                number: attempt.attemptNumber,
              })}
            </Button>
          ))}
        </div>

        {/* Textarea container - flex-1 to fill remaining space */}
        <div className='relative min-h-0 flex-1'>
          <Textarea
            placeholder={
              isViewingMode ? '' : tQuestionSolve('answerPlaceholder')
            }
            className='h-full w-full resize-none border-0 bg-transparent p-0 text-lg placeholder:text-muted-foreground/40 focus-visible:ring-0'
            value={displayText}
            onChange={isViewingMode ? undefined : handleTextChange}
            disabled={
              isStreaming || isSubmitting || isViewingMode || isRecording
            }
            readOnly={isViewingMode}
          />
          {/* Recording indicator */}
          {isRecording && interimText && (
            <span className='absolute right-3 bottom-3 text-xs text-muted-foreground italic'>
              {tQuestionSolve('speaking')}
            </span>
          )}
        </div>

        {/* Character count (only in new mode) */}
        {!isViewingMode && (
          <div className='flex shrink-0 justify-end'>
            <span
              className={`text-xs ${
                currentLength < MIN_ANSWER_LENGTH
                  ? 'text-muted-foreground'
                  : currentLength > MAX_ANSWER_LENGTH
                    ? 'text-destructive'
                    : 'text-muted-foreground'
              }`}
            >
              {currentLength} / {MAX_ANSWER_LENGTH}
            </span>
          </div>
        )}
      </div>

      {/* Footer Actions - only show in new mode */}
      {!isViewingMode && (
        <div className='absolute right-0 bottom-0 left-0 bg-linear-to-t from-background via-background to-transparent p-6 pt-10'>
          <div className='flex items-center justify-between'>
            <div className='flex gap-2'>
              {/* Voice Input Button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isRecording ? 'destructive' : 'outline'}
                      size='sm'
                      disabled={isStreaming || isSubmitting}
                      onClick={handleVoiceInputClick}
                    >
                      {isRecording ? (
                        <>
                          <Square className='mr-2 h-4 w-4' />
                          {tQuestionSolve('stopRecording')}
                        </>
                      ) : (
                        <>
                          <Mic className='mr-2 h-4 w-4' />
                          {tQuestionSolve('voiceInput')}
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  {!isSupported && (
                    <TooltipContent>
                      <p>{tQuestionSolve('voiceInputNotSupported')}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>

            <Button
              className='h-9 px-4 text-sm font-medium shadow-sm'
              disabled={!canSubmit}
              onClick={handleSubmitClick}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className='mr-2 h-3 w-3 animate-spin' />
                  {tQuestionSolve('submitting')}
                </>
              ) : (
                <>
                  <Send className='mr-2 h-3 w-3' />
                  {tQuestionSolve('submitAnswer')}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
