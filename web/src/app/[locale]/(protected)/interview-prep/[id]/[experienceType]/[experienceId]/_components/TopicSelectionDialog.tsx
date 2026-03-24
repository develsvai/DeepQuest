'use client'

import { useState, useCallback, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Sparkles, Check, Lightbulb } from 'lucide-react'
import {
  SectionedDialog,
  SectionedDialogBody,
  SectionedDialogFooter,
  SectionedDialogHeader,
  useSectionedDialog,
} from '@/components/ui/custom/sectioned-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { QuestionCategory } from '@/generated/prisma/enums'
import { CATEGORY_ICONS } from '@/lib/constants/question-category'

/**
 * All available categories in display order
 */
const CATEGORIES = Object.values(QuestionCategory)

interface TopicSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (categories: QuestionCategory[]) => void
}

/**
 * Category card component for selection grid
 */
interface CategoryCardProps {
  category: QuestionCategory
  isSelected: boolean
  onToggle: () => void
}

function CategoryCard({ category, isSelected, onToggle }: CategoryCardProps) {
  const t = useTranslations('common')
  const Icon = CATEGORY_ICONS[category]
  const name = t(`questionCategory.${category}.name`)
  const tags = t.raw(`questionCategory.${category}.tags`) as string[]
  const questionHook = t(`questionCategory.${category}.questionHook`)
  const description = t(`questionCategory.${category}.description`)
  const starRelevance = t(`questionCategory.${category}.starRelevance`)

  return (
    <button
      type='button'
      onClick={onToggle}
      className={`relative flex w-full flex-col rounded-xl border-2 p-5 text-left transition-all ${
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border bg-background hover:border-muted-foreground/30 hover:bg-muted/30'
      }`}
    >
      {/* Header: Icon + Name + Tags + Check */}
      <div className='flex w-full items-stretch gap-3'>
        {/* Icon - stretches to match name + tags height */}
        <div
          className={`flex w-10 shrink-0 items-center justify-center rounded-lg ${
            isSelected
              ? 'bg-primary/10 text-primary'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          <Icon className='h-5 w-5' />
        </div>

        {/* Name and Tags */}
        <div className='min-w-0 flex-1 pr-8'>
          <h3 className='text-base font-semibold text-foreground'>{name}</h3>
          <div className='mt-1.5 flex flex-wrap gap-1.5'>
            {tags.map(tag => (
              <Badge
                key={tag}
                variant='secondary'
                className='px-2 py-0.5 text-xs font-normal'
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Selection indicator */}
        <div
          className={`absolute top-5 right-5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
            isSelected
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-muted-foreground/30'
          }`}
        >
          {isSelected && <Check className='h-3 w-3' />}
        </div>
      </div>

      {/* Question Hook (Quote style) */}
      <p className='mt-4 text-base font-medium text-foreground'>
        &ldquo;{questionHook}&rdquo;
      </p>

      {/* Description */}
      <p className='mt-1.5 text-sm leading-relaxed text-muted-foreground'>
        {description}
      </p>

      {/* Divider */}
      <div className='my-4 border-t border-border' />

      {/* STAR Relevance */}
      <div className='flex items-start gap-2'>
        <Lightbulb className='mt-0.5 h-4 w-4 shrink-0 text-amber-500' />
        <p className='text-sm leading-relaxed text-muted-foreground'>
          {starRelevance}
        </p>
      </div>
    </button>
  )
}

export function TopicSelectionDialog({
  open,
  onOpenChange,
  onSubmit,
}: TopicSelectionDialogProps) {
  const t = useTranslations('common')
  const [selectedCategories, setSelectedCategories] = useState<
    Set<QuestionCategory>
  >(new Set())

  // Reset selection when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedCategories(new Set())
    }
  }, [open])

  const handleToggle = useCallback((category: QuestionCategory) => {
    setSelectedCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }, [])

  const handleSubmit = () => {
    onSubmit(Array.from(selectedCategories))
    setSelectedCategories(new Set())
    onOpenChange(false)
  }

  const selectedCount = selectedCategories.size

  // Consider dirty if any categories are selected
  const isDirty = selectedCount > 0

  return (
    <SectionedDialog
      open={open}
      onOpenChange={onOpenChange}
      maxWidth='xl'
      isDirty={isDirty}
    >
      <SectionedDialogHeader
        icon={<Sparkles className='h-5 w-5 text-primary' />}
        title={t('questionGeneration.dialog.title')}
        description={t('questionGeneration.dialog.description')}
      />

      <SectionedDialogBody>
        <div className='grid gap-4 sm:grid-cols-2'>
          {CATEGORIES.map(category => (
            <CategoryCard
              key={category}
              category={category}
              isSelected={selectedCategories.has(category)}
              onToggle={() => handleToggle(category)}
            />
          ))}
        </div>
      </SectionedDialogBody>

      <DialogFooter
        selectedCount={selectedCount}
        onSubmit={handleSubmit}
        isSubmitDisabled={selectedCount === 0}
      />
    </SectionedDialog>
  )
}

/**
 * Footer component that uses useSectionedDialog hook for proper close handling
 */
interface DialogFooterProps {
  selectedCount: number
  onSubmit: () => void
  isSubmitDisabled: boolean
}

function DialogFooter({
  selectedCount,
  onSubmit,
  isSubmitDisabled,
}: DialogFooterProps) {
  const t = useTranslations('common')
  const { requestClose } = useSectionedDialog()

  return (
    <SectionedDialogFooter
      leftContent={
        <span className='text-sm text-muted-foreground'>
          {selectedCount === 0
            ? t('questionGeneration.dialog.noSelection')
            : t('questionGeneration.dialog.selectedCount', {
                count: selectedCount,
              })}
        </span>
      }
    >
      <Button type='button' variant='ghost' onClick={requestClose}>
        {t('common.cancel')}
      </Button>
      <Button type='button' onClick={onSubmit} disabled={isSubmitDisabled}>
        <Sparkles className='mr-2 h-4 w-4' />
        {t('questionGeneration.dialog.submit')}
      </Button>
    </SectionedDialogFooter>
  )
}
