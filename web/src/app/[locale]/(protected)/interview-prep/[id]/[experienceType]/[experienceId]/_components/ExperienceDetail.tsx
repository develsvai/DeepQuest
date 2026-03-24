'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { LinkButton } from '@/components/ui/custom/link-button'
import { routes } from '@/lib/routes'
import {
  Sparkles,
  MessageSquare,
  Target,
  Zap,
  Trophy,
  Lightbulb,
  Loader2,
} from 'lucide-react'
import { StarSection } from './StarSection'
import { StarMethodGuide } from './StarMethodGuide'
import { CompletenessWarningDialog } from './CompletenessWarningDialog'
import { CompletenessWarningIcon } from './CompletenessWarningIcon'
import { checkCompleteness, useCompletenessWarning } from '../_hooks'

import { api } from '@/trpc/react'
import {
  ActionCard,
  ActionCardHeader,
  ActionCardContent,
  ActionCardFooter,
  createEditDeleteActions,
} from '@/components/ui/custom/action-card'
import { AddPlaceholderCard } from '@/components/ui/custom/add-placeholder-card'
import { CardGrid } from '@/components/ui/custom/card-grid'
import { SectionHeader } from '@/components/ui/custom/section-header'
import { Button } from '@/components/ui/button'
import {
  KeyAchievementDialog,
  type KeyAchievementData,
} from './KeyAchievementDialog'
import { TopicSelectionDialog } from './TopicSelectionDialog'
import { QuestionCategory } from '@/generated/prisma/enums'
import {
  useKeyAchievementMutations,
  useQuestionGenerationMutation,
  useQuestionGenerationStatus,
} from './ExperienceDetail.hooks'
import type { KeyAchievementData as PrismaKeyAchievement } from '@/app/[locale]/(protected)/interview-prep/[id]/_components/InterviewPrepDetail.types.ts'

/**
 * Props for ExperienceDetail component
 * Uses discriminated union for type-safe experience handling
 */
type ExperienceDetailProps = {
  experienceType: 'career' | 'project'
  experienceId: number
  interviewPrepId: string
}

export default function ExperienceDetail(props: ExperienceDetailProps) {
  const { experienceType, experienceId, interviewPrepId } = props
  const t = useTranslations('experience-detail')

  // Read from hydrated cache - data is prefetched on server
  // useSuspenseQuery ensures data is always available (no loading state needed)
  // Component reacts to cache updates from mutations via invalidateQueries
  const [queryResult] =
    api.interviewPreparation.getExperienceById.useSuspenseQuery({
      interviewPreparationId: interviewPrepId,
      experienceType,
      experienceId,
    })

  const experience = queryResult.data

  // Completeness warning hook for STAR validation
  const { warningState, triggerWithCheck, handleProceed, closeDialog } =
    useCompletenessWarning()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAchievement, setEditingAchievement] =
    useState<PrismaKeyAchievement | null>(null)

  // Dialog state for topic selection (Generate)
  const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false)

  const [generatingAchievementId, setGeneratingAchievementId] = useState<
    number | null
  >(null)

  // Use mutations hook with optimistic updates
  const { handleCreate, handleUpdate, handleDelete, isLoading } =
    useKeyAchievementMutations({
      experienceId,
      experienceType,
      interviewPrepId,
    })

  // Question generation status tracking (uses global Zustand store)
  const { isGenerating: checkIsGenerating, trackGeneration } =
    useQuestionGenerationStatus()

  // Question generation mutation - pass trackGeneration callback
  const { startGeneration, isGenerating } = useQuestionGenerationMutation({
    interviewPrepId,
    onGenerationStarted: trackGeneration,
  })

  const handleAdd = () => {
    setEditingAchievement(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (achievement: PrismaKeyAchievement) => {
    setEditingAchievement(achievement)
    setIsDialogOpen(true)
  }

  const handleDeleteClick = async (id: number) => {
    await handleDelete(id)
  }

  const handleSave = async (data: KeyAchievementData) => {
    if (editingAchievement) {
      // Update existing
      await handleUpdate(editingAchievement.id, data)
    } else {
      // Create new
      await handleCreate(data)
    }
    setIsDialogOpen(false)
  }

  const handleGenerate = (achievementId: number) => {
    // Check completeness first using hook
    const achievement = experience.keyAchievements.find(
      ka => ka.id === achievementId
    )

    if (achievement && !triggerWithCheck(achievement)) {
      return // Warning dialog is shown by hook
    }

    setGeneratingAchievementId(achievementId)
    setIsTopicDialogOpen(true)
  }

  const handleWarningProceed = () => {
    const achievementId = handleProceed()
    if (achievementId) {
      setGeneratingAchievementId(achievementId)
      setIsTopicDialogOpen(true)
    }
  }

  const handleWarningEdit = () => {
    const achievementId = handleProceed()
    if (achievementId) {
      const achievement = experience.keyAchievements.find(
        ka => ka.id === achievementId
      )
      if (achievement) {
        handleEdit(achievement)
      }
    }
  }

  const handleTopicSubmit = async (categories: QuestionCategory[]) => {
    if (!generatingAchievementId) return

    try {
      await startGeneration({
        keyAchievementId: generatingAchievementId,
        questionCategories: categories,
      })
    } finally {
      setGeneratingAchievementId(null)
      setIsTopicDialogOpen(false)
    }
  }

  return (
    <div className='mx-auto flex h-full min-h-screen max-w-4xl flex-col space-y-8 bg-background'>
      {/* Loading overlay */}
      {/* isLoading은 keyAchievement 생성/수정/삭제 시 표시되는 로딩, 
      isGenerating 은 질문 생성 시 표시되는 로딩 */}
      {(isLoading || isGenerating) && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-background/50'>
          <div className='flex items-center gap-2 rounded-lg bg-card p-4 shadow-lg'>
            <Loader2 className='h-5 w-5 animate-spin text-primary' />
            <span className='text-sm text-muted-foreground'>
              {t('loading')}
            </span>
          </div>
        </div>
      )}

      {/* Key Achievements Section */}
      <div className='space-y-6'>
        <SectionHeader
          title={
            <span className='flex items-center gap-1'>
              {t('keyAchievements.title')}
              <StarMethodGuide />
            </span>
          }
          showDot
          variant='uppercase'
        />

        <CardGrid variant='grid' columns={2} gap={6}>
          {experience.keyAchievements.map(achievement => {
            const isThisGenerating = checkIsGenerating(achievement.id)
            const isComplete = checkCompleteness(achievement)

            const cardActions = createEditDeleteActions({
              onEdit: () => handleEdit(achievement),
              onDelete: () => handleDeleteClick(achievement.id),
            })

            return (
              <ActionCard key={achievement.id}>
                <ActionCardHeader
                  title={
                    <div className='flex items-center gap-2'>
                      <span>{achievement.title}</span>
                      <CompletenessWarningIcon isComplete={isComplete} />
                    </div>
                  }
                  actions={cardActions}
                  actionsDisabled={isLoading || isThisGenerating}
                />

                <ActionCardContent className='space-y-5'>
                  <StarSection
                    icon={Target}
                    label={t('star.situationTask')}
                    items={achievement.problems}
                  />
                  <StarSection
                    icon={Zap}
                    label={t('star.action')}
                    items={achievement.actions}
                  />
                  <StarSection
                    icon={Trophy}
                    label={t('star.result')}
                    items={achievement.results}
                    variant='highlight'
                  />
                  <StarSection
                    icon={Lightbulb}
                    label={t('star.lesson')}
                    items={achievement.reflections}
                    variant='italic'
                  />
                </ActionCardContent>

                <ActionCardFooter
                  progress={
                    achievement.totalQuestions > 0
                      ? {
                          label: t('keyAchievements.questions'),
                          icon: <MessageSquare size={13} />,
                          completed: achievement.completedQuestions,
                          total: achievement.totalQuestions,
                        }
                      : undefined
                  }
                  actions={
                    <>
                      <Button
                        variant={
                          achievement.totalQuestions === 0 ? 'default' : 'ghost'
                        }
                        size='sm'
                        className={
                          achievement.totalQuestions === 0
                            ? 'ml-auto h-8'
                            : 'h-8 text-primary transition-colors hover:bg-transparent hover:text-primary has-[>svg]:px-0'
                        }
                        onClick={() => handleGenerate(achievement.id)}
                        disabled={isThisGenerating}
                      >
                        {isThisGenerating ? (
                          <>
                            <Loader2 className='mr-1.5 h-3.5 w-3.5 animate-spin' />
                            {t('keyAchievements.generating')}
                          </>
                        ) : (
                          <>
                            <Sparkles className='mr-1.5 h-3.5 w-3.5' />
                            {t('keyAchievements.generate')}
                          </>
                        )}
                      </Button>
                      {achievement.totalQuestions > 0 && (
                        <LinkButton
                          size='sm'
                          href={{
                            pathname: routes.interviewPrep.questions(
                              interviewPrepId,
                              experienceType,
                              experienceId
                            ),
                            query: { keyAchievementId: achievement.id },
                          }}
                        >
                          <MessageSquare className='mr-2 h-4 w-4' />
                          {t('keyAchievements.viewQuestions')}
                        </LinkButton>
                      )}
                    </>
                  }
                />
              </ActionCard>
            )
          })}

          {/* Add New Achievement Placeholder */}
          <AddPlaceholderCard
            onClick={handleAdd}
            label={t('keyAchievements.addNew')}
            disabled={isLoading}
          />
        </CardGrid>

        <KeyAchievementDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          initialData={editingAchievement}
          onSubmit={handleSave}
        />

        <TopicSelectionDialog
          open={isTopicDialogOpen}
          onOpenChange={setIsTopicDialogOpen}
          onSubmit={handleTopicSubmit}
        />

        <CompletenessWarningDialog
          open={warningState.isOpen}
          onOpenChange={open => !open && closeDialog()}
          onProceed={handleWarningProceed}
          onEdit={handleWarningEdit}
        />
      </div>
    </div>
  )
}
