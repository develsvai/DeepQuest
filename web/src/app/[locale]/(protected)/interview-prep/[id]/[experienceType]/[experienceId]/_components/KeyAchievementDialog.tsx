'use client'

import { useEffect } from 'react'
import { useForm, useFieldArray, type Control } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Target, Zap, Trophy, Lightbulb, Trash } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  SectionedDialog,
  SectionedDialogBody,
  SectionedDialogFooter,
  SectionedDialogHeader,
  useSectionedDialog,
} from '@/components/ui/custom/sectioned-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

// Zod schema for form validation - 배열 타입
const keyAchievementFormSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요'),
  problems: z
    .array(z.object({ value: z.string().min(1, '내용을 입력해주세요') }))
    .min(1, '최소 1개 항목이 필요합니다'),
  actions: z
    .array(z.object({ value: z.string().min(1, '내용을 입력해주세요') }))
    .min(1, '최소 1개 항목이 필요합니다'),
  results: z
    .array(z.object({ value: z.string().min(1, '내용을 입력해주세요') }))
    .min(1, '최소 1개 항목이 필요합니다'),
  reflections: z.array(z.object({ value: z.string() })),
})

// Explicit type definition for FormValues to ensure type safety
interface FormValues {
  title: string
  problems: { value: string }[]
  actions: { value: string }[]
  results: { value: string }[]
  reflections: { value: string }[]
}

// Form submission data type - 실제 제출 시 배열로 변환
export interface KeyAchievementData {
  title: string
  problems: string[]
  actions: string[]
  results: string[]
  reflections: string[]
}

// Initial data type - Prisma KeyAchievement와 호환
export interface KeyAchievementInitialData {
  id?: number
  title: string
  problems: string[]
  actions: string[]
  results: string[]
  reflections: string[]
}

interface KeyAchievementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: KeyAchievementInitialData | null
  onSubmit: (data: KeyAchievementData) => void
}

const defaultValues: FormValues = {
  title: '',
  problems: [{ value: '' }],
  actions: [{ value: '' }],
  results: [{ value: '' }],
  reflections: [],
}

/**
 * Reusable point list component for STAR-L fields
 */
interface PointListProps {
  name: 'problems' | 'actions' | 'results' | 'reflections'
  control: Control<FormValues>
  label: string
  icon: LucideIcon
  required?: boolean
  placeholder: string
  addPointLabel: string
}

function PointList({
  name,
  control,
  label,
  icon: Icon,
  required = false,
  placeholder,
  addPointLabel,
}: PointListProps) {
  const { fields, append, remove, update } = useFieldArray({
    control,
    name,
  })

  /**
   * Handle remove with minimum field constraint for required fields.
   * If required and only one field remains, reset it to empty instead of removing.
   */
  const handleRemove = (index: number) => {
    if (required && fields.length === 1) {
      // Reset to empty value instead of removing the last required field
      update(index, { value: '' })
    } else {
      remove(index)
    }
  }

  return (
    <div className='space-y-3'>
      <div className='flex items-center gap-2 text-primary'>
        <Icon className='h-4 w-4' />
        <span className='text-xs font-bold tracking-wider uppercase'>
          {label}
          {required && <span className='ml-1 text-destructive'>*</span>}
        </span>
      </div>

      <div className='space-y-2'>
        {fields.map((field, index) => (
          <div key={field.id} className='flex items-start gap-2'>
            <span className='mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60' />
            <FormField
              control={control}
              name={`${name}.${index}.value`}
              render={({ field: inputField }) => (
                <FormItem className='flex-1'>
                  <FormControl>
                    <Textarea
                      placeholder={placeholder}
                      className='max-h-[120px] min-h-[60px] resize-none overflow-y-auto'
                      {...inputField}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='mt-1 h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive'
              onClick={() => handleRemove(index)}
            >
              <Trash className='h-4 w-4' />
            </Button>
          </div>
        ))}
      </div>

      <Button
        type='button'
        variant='ghost'
        size='sm'
        className='h-8 text-muted-foreground hover:text-primary'
        onClick={() => append({ value: '' })}
      >
        <Plus className='mr-1.5 h-4 w-4' />
        {addPointLabel}
      </Button>
    </div>
  )
}

export function KeyAchievementDialog({
  open,
  onOpenChange,
  initialData,
  onSubmit,
}: KeyAchievementDialogProps) {
  const t = useTranslations('experience-detail')
  const form = useForm<FormValues>({
    resolver: zodResolver(keyAchievementFormSchema),
    defaultValues,
  })

  // Extract isDirty from form state for unsaved changes detection
  const {
    formState: { isDirty },
  } = form

  useEffect(() => {
    if (open) {
      if (initialData) {
        // Convert string arrays to object arrays for useFieldArray
        form.reset({
          title: initialData.title,
          problems:
            initialData.problems.length > 0
              ? initialData.problems.map(v => ({ value: v }))
              : [{ value: '' }],
          actions:
            initialData.actions.length > 0
              ? initialData.actions.map(v => ({ value: v }))
              : [{ value: '' }],
          results:
            initialData.results.length > 0
              ? initialData.results.map(v => ({ value: v }))
              : [{ value: '' }],
          reflections:
            initialData.reflections.length > 0
              ? initialData.reflections.map(v => ({ value: v }))
              : [],
        })
      } else {
        form.reset(defaultValues)
      }
    }
  }, [open, initialData, form])

  const handleFormSubmit = (data: FormValues) => {
    // Convert object arrays back to string arrays, filter empty strings
    const result: KeyAchievementData = {
      title: data.title,
      problems: data.problems.map(p => p.value).filter(v => v.trim() !== ''),
      actions: data.actions.map(a => a.value).filter(v => v.trim() !== ''),
      results: data.results.map(r => r.value).filter(v => v.trim() !== ''),
      reflections: data.reflections
        .map(r => r.value)
        .filter(v => v.trim() !== ''),
    }
    onSubmit(result)
    onOpenChange(false)
  }

  return (
    <SectionedDialog
      open={open}
      onOpenChange={onOpenChange}
      maxWidth='md'
      isDirty={isDirty}
    >
      <SectionedDialogHeader
        title={initialData ? t('dialog.editTitle') : t('dialog.addTitle')}
        description={t('dialog.description')}
      />

      <SectionedDialogBody className='space-y-6'>
        <Form {...form}>
          <form
            id='key-achievement-form'
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className='space-y-6'
          >
            {/* Title */}
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('dialog.titleLabel')}{' '}
                    <span className='text-destructive'>*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('dialog.titlePlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* SITUATION & TASK */}
            <PointList
              name='problems'
              control={form.control}
              label={t('star.situationTask')}
              icon={Target}
              required
              placeholder={t('dialog.placeholders.situationTask')}
              addPointLabel={t('dialog.addPoint')}
            />

            {/* ACTION */}
            <PointList
              name='actions'
              control={form.control}
              label={t('star.action')}
              icon={Zap}
              required
              placeholder={t('dialog.placeholders.action')}
              addPointLabel={t('dialog.addPoint')}
            />

            {/* RESULT */}
            <PointList
              name='results'
              control={form.control}
              label={t('star.result')}
              icon={Trophy}
              required
              placeholder={t('dialog.placeholders.result')}
              addPointLabel={t('dialog.addPoint')}
            />

            {/* LESSON */}
            <PointList
              name='reflections'
              control={form.control}
              label={t('star.lesson')}
              icon={Lightbulb}
              required={false}
              placeholder={t('dialog.placeholders.lesson')}
              addPointLabel={t('dialog.addPoint')}
            />
          </form>
        </Form>
      </SectionedDialogBody>

      <DialogFooter />
    </SectionedDialog>
  )
}

/**
 * Footer component that uses useSectionedDialog hook for proper close handling
 */
function DialogFooter() {
  const { requestClose } = useSectionedDialog()
  const t = useTranslations('experience-detail')

  return (
    <SectionedDialogFooter>
      <Button type='button' variant='ghost' onClick={requestClose}>
        {t('dialog.cancel')}
      </Button>
      <Button type='submit' form='key-achievement-form'>
        {t('dialog.save')}
      </Button>
    </SectionedDialogFooter>
  )
}
