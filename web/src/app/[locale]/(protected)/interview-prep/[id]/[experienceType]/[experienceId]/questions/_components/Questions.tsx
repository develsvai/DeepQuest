'use client'

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Loader2, MessageSquare, Sparkles } from 'lucide-react'

import { useRouter } from '@/i18n/navigation'
import { routes } from '@/lib/routes'
import { QuestionCategory } from '@/generated/prisma/enums'
import type { QuestionListItem } from '@/server/services/question'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useIsKeyAchievementGenerating } from '@/lib/stores/question-generation-store'
import { QuestionCard } from './QuestionCard'
import { Separator } from '@/components/ui/separator'
import { TopicSelectionDialog } from '../../_components/TopicSelectionDialog'
import {
  useQuestionGenerationMutation,
  useQuestionGenerationStatus,
} from '../../_components/ExperienceDetail.hooks'
import { AddPlaceholderCard } from '@/components/ui/custom/add-placeholder-card'
import { QuestionDialog, type QuestionFormData } from './QuestionDialog'
import { api } from '@/trpc/react'
import {
  useCompletenessWarning,
  type CompletenessCheckable,
} from '../../_hooks'
import { CompletenessWarningDialog } from '../../_components/CompletenessWarningDialog'

/**
 * Props for Questions component
 */
interface QuestionsProps {
  /** Questions grouped by category */
  questionsByCategory: Partial<Record<QuestionCategory, QuestionListItem[]>>
  /** KeyAchievement ID for tracking generation status */
  keyAchievementId?: number
  /** KeyAchievement data for completeness check */
  keyAchievementData?: CompletenessCheckable | null
}

/**
 * Questions Component
 *
 * Client component that displays questions for a specific key achievement
 * or all questions for the experience.
 * Supports filtering by questionCategory (UI-only filtering).
 * Each question has a 'Solve' button and visual indicator for completion status.
 */
export default function Questions({
  questionsByCategory,
  keyAchievementId,
  keyAchievementData,
}: QuestionsProps) {
  const t = useTranslations('questions')
  const tCategory = useTranslations('common.questionCategory')
  const router = useRouter()
  const params = useParams<{
    id: string
    experienceType: string
    experienceId: string
  }>()

  // Check if questions are being generated for this key achievement
  const isGenerating = useIsKeyAchievementGenerating(keyAchievementId ?? 0)
  const showGeneratingAlert = keyAchievementId && isGenerating

  // Dialog state for topic selection
  const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false)

  // Dialog state for question CRUD
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] =
    useState<QuestionListItem | null>(null)

  // Generation hooks
  const { trackGeneration } = useQuestionGenerationStatus()
  const { startGeneration, isGenerating: isMutating } =
    useQuestionGenerationMutation({
      interviewPrepId: params.id,
      onGenerationStarted: trackGeneration,
    })

  // Completeness warning hook for STAR validation
  const { warningState, triggerWithCheck, handleProceed, closeDialog } =
    useCompletenessWarning()

  // Handle generate button click with completeness check
  const handleGenerateClick = () => {
    if (keyAchievementData && !triggerWithCheck(keyAchievementData)) {
      return // Warning dialog is shown by hook
    }
    setIsTopicDialogOpen(true)
  }

  // Handle warning dialog "Proceed Anyway" action
  const handleWarningProceed = () => {
    handleProceed()
    setIsTopicDialogOpen(true)
  }

  // Handle warning dialog "Edit" action - navigate to experience detail
  const handleWarningEdit = () => {
    handleProceed()
    router.push(
      routes.interviewPrep.experience(
        params.id,
        params.experienceType,
        params.experienceId
      )
    )
  }

  // Handle topic submit for question generation
  const handleTopicSubmit = async (categories: QuestionCategory[]) => {
    if (!keyAchievementId) return
    await startGeneration({
      keyAchievementId,
      questionCategories: categories,
    })
  }

  // tRPC utils for cache invalidation
  const utils = api.useUtils()

  // Question mutations
  const createMutation = api.question.create.useMutation({
    onSuccess: () => {
      utils.question.listByExperience.invalidate()
      utils.interviewPreparation.listForSidebar.invalidate()
    },
  })

  const updateMutation = api.question.update.useMutation({
    onSuccess: () => {
      utils.question.listByExperience.invalidate()
    },
  })

  const deleteMutation = api.question.delete.useMutation({
    onSuccess: () => {
      utils.question.listByExperience.invalidate()
      utils.interviewPreparation.listForSidebar.invalidate()
    },
  })

  // CRUD handlers
  const handleAddQuestion = () => {
    setEditingQuestion(null)
    setIsQuestionDialogOpen(true)
  }

  const handleEditQuestion = (question: QuestionListItem) => {
    setEditingQuestion(question)
    setIsQuestionDialogOpen(true)
  }

  const handleDeleteQuestion = async (questionId: string) => {
    await deleteMutation.mutateAsync({ id: questionId })
  }

  const handleSaveQuestion = async (data: QuestionFormData) => {
    if (editingQuestion) {
      // Update existing question
      await updateMutation.mutateAsync({
        id: editingQuestion.id,
        data: {
          text: data.text,
          category: data.category,
        },
      })
    } else if (keyAchievementId) {
      // Create new question
      await createMutation.mutateAsync({
        keyAchievementId,
        text: data.text,
        category: data.category,
      })
    }
    setIsQuestionDialogOpen(false)
  }

  // Check if any mutation is in progress
  const isMutatingQuestion =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending

  // Local state for category filtering
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  // Available categories from grouped data
  const availableCategories = useMemo(
    () => Object.keys(questionsByCategory) as QuestionCategory[],
    [questionsByCategory]
  )

  // All questions flattened
  const allQuestions = useMemo(
    () => Object.values(questionsByCategory).flat(),
    [questionsByCategory]
  )

  // Filter questions based on selected categories
  const filteredQuestions = useMemo(() => {
    if (selectedCategories.length === 0) {
      return allQuestions
    }
    return selectedCategories.flatMap(
      cat => questionsByCategory[cat as QuestionCategory] ?? []
    )
  }, [questionsByCategory, selectedCategories, allQuestions])

  // Handle category toggle
  const handleCategoryChange = (values: string[]) => {
    setSelectedCategories(values)
  }

  // Generate solve page href
  const getSolveHref = (questionId: string) =>
    `${routes.interviewPrep.questions(params.id, params.experienceType, params.experienceId)}/${questionId}`

  // Render empty state with optional Generate button
  if (allQuestions.length === 0) {
    return (
      <>
        <div className='space-y-4'>
          {/* Show only Generate button in empty state */}
          {keyAchievementId && (
            <div className='flex w-full justify-end pb-2'>
              <GenerateButton
                isGenerating={isGenerating || isMutating}
                onClick={handleGenerateClick}
              />
            </div>
          )}

          {/* Add Question Placeholder in empty state */}
          {keyAchievementId && (
            <AddPlaceholderCard
              onClick={handleAddQuestion}
              label={t('crud.addQuestion')}
              disabled={isMutatingQuestion}
              className='min-h-[100px]'
            />
          )}
        </div>

        {/* Topic Selection Dialog */}
        {keyAchievementId && (
          <TopicSelectionDialog
            open={isTopicDialogOpen}
            onOpenChange={setIsTopicDialogOpen}
            onSubmit={handleTopicSubmit}
          />
        )}

        {/* Question Dialog for Create/Edit */}
        {keyAchievementId && (
          <QuestionDialog
            open={isQuestionDialogOpen}
            onOpenChange={setIsQuestionDialogOpen}
            initialData={editingQuestion}
            onSubmit={handleSaveQuestion}
          />
        )}
      </>
    )
  }

  // Render no results after filtering
  if (filteredQuestions.length === 0 && selectedCategories.length > 0) {
    return (
      <div className='space-y-4'>
        <CategoryFilter
          availableCategories={availableCategories}
          selectedCategories={selectedCategories}
          onCategoryChange={handleCategoryChange}
          tCategory={tCategory}
          showGenerateButton={!!keyAchievementId}
          isGenerating={isGenerating || isMutating}
          onGenerateClick={handleGenerateClick}
        />
        <Empty className='border'>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <MessageSquare />
            </EmptyMedia>
            <EmptyTitle>{t('noResults.title')}</EmptyTitle>
            <EmptyDescription>{t('noResults.description')}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  return (
    <>
      <div className='space-y-6'>
        {/* Generation in progress alert */}
        {showGeneratingAlert && (
          <Alert>
            <Loader2 className='h-4 w-4 animate-spin' />
            <AlertDescription>
              {t('generation.inProgress', {
                defaultValue:
                  'Questions are being generated for this achievement...',
              })}
            </AlertDescription>
          </Alert>
        )}

        {/* Category Filter */}
        {availableCategories.length > 0 && (
          <CategoryFilter
            availableCategories={availableCategories}
            selectedCategories={selectedCategories}
            onCategoryChange={handleCategoryChange}
            tCategory={tCategory}
            showGenerateButton={!!keyAchievementId}
            isGenerating={isGenerating || isMutating}
            onGenerateClick={handleGenerateClick}
          />
        )}

        {/* Question List */}
        <div className='space-y-3'>
          {filteredQuestions.map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              questionIndex={index + 1}
              solveHref={getSolveHref(question.id)}
              onEdit={keyAchievementId ? handleEditQuestion : undefined}
              onDelete={keyAchievementId ? handleDeleteQuestion : undefined}
            />
          ))}

          {/* Add Question Placeholder - only shown when keyAchievementId is provided */}
          {keyAchievementId && (
            <AddPlaceholderCard
              onClick={handleAddQuestion}
              label={t('crud.addQuestion')}
              disabled={isMutatingQuestion}
              className='min-h-[100px]'
            />
          )}
        </div>
      </div>

      {/* Topic Selection Dialog for Question Generation */}
      {keyAchievementId && (
        <TopicSelectionDialog
          open={isTopicDialogOpen}
          onOpenChange={setIsTopicDialogOpen}
          onSubmit={handleTopicSubmit}
        />
      )}

      {/* Question Dialog for Create/Edit */}
      {keyAchievementId && (
        <QuestionDialog
          open={isQuestionDialogOpen}
          onOpenChange={setIsQuestionDialogOpen}
          initialData={editingQuestion}
          onSubmit={handleSaveQuestion}
        />
      )}

      {/* Completeness Warning Dialog */}
      <CompletenessWarningDialog
        open={warningState.isOpen}
        onOpenChange={open => !open && closeDialog()}
        onProceed={handleWarningProceed}
        onEdit={handleWarningEdit}
      />
    </>
  )
}

/**
 * Category Filter Component
 */
interface CategoryFilterProps {
  availableCategories: QuestionCategory[]
  selectedCategories: string[]
  onCategoryChange: (values: string[]) => void
  tCategory: ReturnType<typeof useTranslations>
  /** Whether to show the generate button */
  showGenerateButton?: boolean
  /** Whether generation is in progress */
  isGenerating?: boolean
  /** Callback when generate button is clicked */
  onGenerateClick?: () => void
}

function CategoryFilter({
  availableCategories,
  selectedCategories,
  onCategoryChange,
  tCategory,
  showGenerateButton,
  isGenerating,
  onGenerateClick,
}: CategoryFilterProps) {
  const isAllSelected = selectedCategories.length === 0

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      onCategoryChange(selectedCategories.filter(c => c !== category))
    } else {
      onCategoryChange([...selectedCategories, category])
    }
  }

  return (
    <div className='scrollbar-hide flex w-full items-center gap-2 overflow-x-auto pb-2'>
      <Button
        variant={isAllSelected ? 'default' : 'outline'}
        size='sm'
        className={cn(
          'h-8 rounded-full px-4 font-medium',
          isAllSelected
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'bg-background hover:bg-accent hover:text-accent-foreground'
        )}
        onClick={() => onCategoryChange([])}
      >
        {tCategory('all')}
      </Button>

      <div className='flex h-4 items-center'>
        <Separator orientation='vertical' />
      </div>

      {availableCategories.map(category => {
        const isSelected = selectedCategories.includes(category)
        return (
          <Button
            key={category}
            variant={isSelected ? 'default' : 'outline'}
            size='sm'
            className={cn(
              'h-8 rounded-full px-4 font-medium',
              isSelected
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-background hover:bg-accent hover:text-accent-foreground'
            )}
            onClick={() => toggleCategory(category)}
          >
            {tCategory(`${category}.name`)}
          </Button>
        )
      })}

      {/* Generate Button - positioned at flex-end */}
      {showGenerateButton && (
        <>
          <div className='flex-1' />
          <GenerateButton
            isGenerating={isGenerating}
            onClick={onGenerateClick}
          />
        </>
      )}
    </div>
  )
}

/**
 * Generate Button Component
 */
interface GenerateButtonProps {
  isGenerating?: boolean
  onClick?: () => void
}

function GenerateButton({ isGenerating, onClick }: GenerateButtonProps) {
  return (
    <Button
      variant='ghost'
      size='sm'
      className='h-8 shrink-0 text-primary hover:text-primary has-[>svg]:px-0'
      onClick={onClick}
      disabled={isGenerating}
    >
      {isGenerating ? (
        <>
          <Loader2 className='mr-1.5 h-3.5 w-3.5 animate-spin' />
          Generating...
        </>
      ) : (
        <>
          <Sparkles className='mr-1.5 h-3.5 w-3.5' />
          Generate
        </>
      )}
    </Button>
  )
}
