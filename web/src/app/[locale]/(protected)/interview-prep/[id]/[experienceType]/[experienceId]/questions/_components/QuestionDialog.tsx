'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'

import {
  SectionedDialog,
  SectionedDialogBody,
  SectionedDialogFooter,
  SectionedDialogHeader,
  useSectionedDialog,
} from '@/components/ui/custom/sectioned-dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { QuestionCategory } from '@/generated/prisma/enums'
import type { QuestionListItem } from '@/server/services/question'

// ============================================================================
// Constants
// ============================================================================

/**
 * Category options for the select dropdown
 */
const CATEGORY_OPTIONS = Object.values(QuestionCategory)

// ============================================================================
// Form Schema & Types
// ============================================================================

/**
 * Zod schema for question form validation
 */
const questionFormSchema = z.object({
  text: z
    .string()
    .min(1, 'Question text is required')
    .max(2000, 'Question text is too long'),
  category: z
    .enum(CATEGORY_OPTIONS as [QuestionCategory, ...QuestionCategory[]])
    .nullable(),
})

type FormValues = z.infer<typeof questionFormSchema>

/**
 * Data submitted from the form
 */
export interface QuestionFormData {
  text: string
  category: QuestionCategory | null
}

// ============================================================================
// Component Props
// ============================================================================

interface QuestionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Pass null for create mode, existing question for edit mode */
  initialData?: QuestionListItem | null
  onSubmit: (data: QuestionFormData) => void
}

// ============================================================================
// Default Values
// ============================================================================

const defaultValues: FormValues = {
  text: '',
  category: null,
}

function getDefaultValues(
  data: QuestionListItem | null | undefined
): FormValues {
  if (!data) {
    return defaultValues
  }
  return {
    text: data.text,
    category: data.category,
  }
}

// ============================================================================
// Main Dialog Component
// ============================================================================

/**
 * Dialog for creating/editing Questions
 * Uses react-hook-form with Zod validation
 * Uses SectionedDialog for consistent header/body/footer layout
 */
export function QuestionDialog({
  open,
  onOpenChange,
  initialData,
  onSubmit,
}: QuestionDialogProps) {
  const t = useTranslations('questions.dialog')
  const tCategory = useTranslations('common.questionCategory')

  const isEditMode = !!initialData

  const form = useForm<FormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: getDefaultValues(initialData),
  })

  const {
    formState: { isDirty },
  } = form

  // Reset form when dialog opens with new initialData
  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues(initialData))
    }
  }, [open, initialData, form])

  const handleFormSubmit = (data: FormValues) => {
    const result: QuestionFormData = {
      text: data.text,
      category: data.category,
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
        title={isEditMode ? t('title.edit') : t('title.create')}
        description={
          isEditMode ? t('description.edit') : t('description.create')
        }
      />

      <SectionedDialogBody className='space-y-6'>
        <Form {...form}>
          <form
            id='question-form'
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className='space-y-6'
          >
            {/* Question Text */}
            <FormField
              control={form.control}
              name='text'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-xs font-bold tracking-wider text-muted-foreground uppercase'>
                    {t('field.text.label')}
                    <span className='ml-1 text-destructive'>*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('field.text.placeholder')}
                      className='min-h-[120px] resize-none'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name='category'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-xs font-bold tracking-wider text-muted-foreground uppercase'>
                    {t('field.category.label')}
                  </FormLabel>
                  <Select
                    value={field.value ?? undefined}
                    onValueChange={value =>
                      field.onChange(value as QuestionCategory)
                    }
                  >
                    <FormControl>
                      <SelectTrigger className='w-full'>
                        <SelectValue
                          placeholder={t('field.category.placeholder')}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map(category => (
                        <SelectItem key={category} value={category}>
                          {tCategory(`${category}.name`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </SectionedDialogBody>

      <DialogFooter />
    </SectionedDialog>
  )
}

// ============================================================================
// Footer Component
// ============================================================================

/**
 * Footer component using useSectionedDialog hook for proper close handling
 */
function DialogFooter() {
  const t = useTranslations('questions.dialog')
  const { requestClose } = useSectionedDialog()

  return (
    <SectionedDialogFooter>
      <Button type='button' variant='ghost' onClick={requestClose}>
        {t('action.cancel')}
      </Button>
      <Button type='submit' form='question-form'>
        {t('action.save')}
      </Button>
    </SectionedDialogFooter>
  )
}
