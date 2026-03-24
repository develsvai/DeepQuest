'use client'

import { useEffect } from 'react'
import { useForm, useFieldArray, type Control } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Pencil, Plus, Trash, FileText } from 'lucide-react'
import { useTranslations } from 'next-intl'

import {
  SectionedDialog,
  SectionedDialogBody,
  SectionedDialogFooter,
  SectionedDialogHeader,
  useSectionedDialog,
} from '@/components/ui/custom/sectioned-dialog'
import { JobTitleCombobox } from '@/components/ui/custom/job-title-combobox'
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

import type { HeaderData } from './InterviewPrepDetail.types'

// ============================================================================
// Form Schema & Types
// ============================================================================

/**
 * Zod schema for form validation
 * summary uses object array for useFieldArray compatibility
 */
const headerEditFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(50, 'Title is too long'),
  jobTitle: z.string().max(50, 'Job title is too long'),
  yearsOfExperience: z.string(),
  summary: z.array(z.object({ value: z.string() })),
})

/**
 * Form values type inferred from Zod schema
 */
type FormValues = z.infer<typeof headerEditFormSchema>

// ============================================================================
// Component Props
// ============================================================================

interface HeaderEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData: HeaderData
  onSubmit: (data: HeaderData) => Promise<void>
  isSubmitting?: boolean
}

// ============================================================================
// Default Values
// ============================================================================

function getDefaultValues(data: HeaderData): FormValues {
  return {
    title: data.title,
    jobTitle: data.jobTitle ?? '',
    yearsOfExperience: data.yearsOfExperience?.toString() ?? '',
    summary:
      data.summary.length > 0
        ? data.summary.map(v => ({ value: v }))
        : [{ value: '' }],
  }
}

// ============================================================================
// Summary Point List Component
// ============================================================================

interface SummaryPointListProps {
  control: Control<FormValues>
  addPointLabel: string
  placeholder: string
}

function SummaryPointList({
  control,
  addPointLabel,
  placeholder,
}: SummaryPointListProps) {
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'summary',
  })

  /**
   * Handle remove: if only one field remains, reset it to empty
   */
  const handleRemove = (index: number) => {
    if (fields.length === 1) {
      update(index, { value: '' })
    } else {
      remove(index)
    }
  }

  return (
    <div className='space-y-3'>
      <div className='space-y-2'>
        {fields.map((field, index) => (
          <div key={field.id} className='flex items-start gap-2'>
            <span className='mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60' />
            <FormField
              control={control}
              name={`summary.${index}.value`}
              render={({ field: inputField }) => (
                <FormItem className='flex-1'>
                  <FormControl>
                    <Textarea
                      placeholder={placeholder}
                      className='max-h-[100px] min-h-[60px] resize-none overflow-y-auto'
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

// ============================================================================
// Main Dialog Component
// ============================================================================

/**
 * Dialog for editing interview preparation header data
 * (title, jobTitle, yearsOfExperience, summary)
 *
 * Follows KeyAchievementDialog pattern:
 * - React Hook Form with Zod validation
 * - useFieldArray for summary field
 * - formState.isDirty for unsaved changes detection
 */
export function HeaderEditDialog({
  open,
  onOpenChange,
  initialData,
  onSubmit,
  isSubmitting,
}: HeaderEditDialogProps) {
  const t = useTranslations('interview-prep.detail.editProfileDialog')

  const form = useForm<FormValues>({
    resolver: zodResolver(headerEditFormSchema),
    defaultValues: getDefaultValues(initialData),
  })

  const {
    formState: { isDirty },
  } = form

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues(initialData))
    }
  }, [open, initialData, form])

  const handleFormSubmit = async (data: FormValues) => {
    // Transform summary: object array → string array, filter empty
    const summaryArray = data.summary
      .map(s => s.value)
      .filter(v => v.trim() !== '')

    // Parse yearsOfExperience
    const yearsNum =
      data.yearsOfExperience === ''
        ? null
        : parseInt(data.yearsOfExperience, 10)

    try {
      await onSubmit({
        title: data.title,
        jobTitle: data.jobTitle || null,
        yearsOfExperience: isNaN(yearsNum ?? NaN) ? null : yearsNum,
        summary: summaryArray,
      })
      onOpenChange(false)
    } catch (error) {
      // Error handling is done by parent's mutation
      console.error(error)
    }
  }

  return (
    <SectionedDialog
      open={open}
      onOpenChange={onOpenChange}
      maxWidth='md'
      isDirty={isDirty}
    >
      <SectionedDialogHeader
        icon={<Pencil className='h-5 w-5' />}
        title={t('title')}
        description={t('description')}
      />

      <SectionedDialogBody className='space-y-6'>
        <Form {...form}>
          <form
            id='header-edit-form'
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
                    {t('fields.title')}{' '}
                    <span className='text-destructive'>*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('fields.titlePlaceholder')}
                      maxLength={50}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Job Title */}
            <FormField
              control={form.control}
              name='jobTitle'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.jobTitle')}</FormLabel>
                  <FormControl>
                    <JobTitleCombobox
                      value={field.value || ''}
                      onChange={field.onChange}
                      disabled={isSubmitting}
                      hasError={!!form.formState.errors.jobTitle}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Years of Experience */}
            <FormField
              control={form.control}
              name='yearsOfExperience'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.yearsOfExperience')}</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      min={0}
                      max={50}
                      placeholder={t('fields.yearsOfExperiencePlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Summary */}
            <div className='space-y-2'>
              <div className='flex items-center gap-2 text-primary'>
                <FileText className='h-4 w-4' />
                <span className='text-xs font-bold tracking-wider uppercase'>
                  {t('fields.summary')}
                </span>
              </div>
              <SummaryPointList
                control={form.control}
                addPointLabel={t('addPoint')}
                placeholder={t('fields.summaryPlaceholder')}
              />
            </div>
          </form>
        </Form>
      </SectionedDialogBody>

      <DialogFooter isLoading={isSubmitting ?? false} />
    </SectionedDialog>
  )
}

// ============================================================================
// Footer Component
// ============================================================================

/**
 * Footer component using useSectionedDialog hook for proper close handling
 */
function DialogFooter({ isLoading }: { isLoading: boolean }) {
  const { requestClose } = useSectionedDialog()
  const tCommon = useTranslations('common.common')

  return (
    <SectionedDialogFooter>
      <Button
        type='button'
        variant='ghost'
        onClick={requestClose}
        disabled={isLoading}
      >
        {tCommon('cancel')}
      </Button>
      <Button type='submit' form='header-edit-form' disabled={isLoading}>
        {isLoading ? tCommon('loading') : tCommon('save')}
      </Button>
    </SectionedDialogFooter>
  )
}
