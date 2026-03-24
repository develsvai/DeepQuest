'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import {
  SectionedDialog,
  SectionedDialogBody,
  SectionedDialogFooter,
  SectionedDialogHeader,
  useSectionedDialog,
} from '@/components/ui/custom/sectioned-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MonthPicker } from '@/components/ui/month-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { DegreeType } from '@/generated/prisma/enums'

import type { EducationData } from '../InterviewPrepDetail.types'

// ============================================================================
// Form Schema & Types
// ============================================================================

/**
 * Zod schema for education form validation
 * Note: Date fields are stored as string | null (ISO format from Prisma)
 */
const educationFormSchema = z.object({
  institution: z.string().min(1),
  degree: z
    .enum([
      DegreeType.BACHELOR,
      DegreeType.MASTER,
      DegreeType.DOCTOR,
      DegreeType.HIGH_SCHOOL,
      DegreeType.ASSOCIATE,
      DegreeType.OTHER,
    ])
    .nullable(),
  major: z.string().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  description: z.string(),
})

type FormValues = z.infer<typeof educationFormSchema>

// ============================================================================
// Component Props
// ============================================================================

interface EducationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData: EducationData
  onSubmit: (data: EducationData) => void
}

// ============================================================================
// Default Values
// ============================================================================

function getDefaultValues(data: EducationData): FormValues {
  return {
    institution: data.institution,
    degree: data.degree,
    major: data.major,
    startDate: data.startDate,
    endDate: data.endDate,
    description: data.description,
  }
}

// ============================================================================
// Main Dialog Component
// ============================================================================

/**
 * Dialog for editing Education entries
 * Uses react-hook-form with Zod validation
 * Uses SectionedDialog for consistent header/body/footer layout
 */
export function EducationDialog({
  open,
  onOpenChange,
  initialData,
  onSubmit,
}: EducationDialogProps) {
  const t = useTranslations('common.toast')

  const form = useForm<FormValues>({
    resolver: zodResolver(educationFormSchema),
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
    // Reconstruct EducationData preserving non-form fields (id, interviewPreparationId)
    const result: EducationData = {
      ...initialData,
      institution: data.institution,
      degree: data.degree,
      major: data.major,
      startDate: data.startDate,
      endDate: data.endDate,
      description: data.description,
    }
    onSubmit(result)
    toast.success(t('educationSaved'))
  }

  return (
    <SectionedDialog
      open={open}
      onOpenChange={onOpenChange}
      maxWidth='md'
      isDirty={isDirty}
    >
      <SectionedDialogHeader
        title='Edit Education'
        description='Update your education details.'
      />

      <SectionedDialogBody className='space-y-6'>
        <Form {...form}>
          <form
            id='education-edit-form'
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className='space-y-6'
          >
            {/* Institution */}
            <FormField
              control={form.control}
              name='institution'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-xs font-bold tracking-wider text-muted-foreground uppercase'>
                    Institution
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Ex. Stanford University'
                      className='text-lg font-bold'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Degree & Major */}
            <div className='grid grid-cols-2 gap-6'>
              <FormField
                control={form.control}
                name='degree'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-xs font-bold tracking-wider text-muted-foreground uppercase'>
                      Degree
                    </FormLabel>
                    <Select
                      value={field.value ?? undefined}
                      onValueChange={value =>
                        field.onChange(value as DegreeType)
                      }
                    >
                      <FormControl>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Select degree' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={DegreeType.BACHELOR}>
                          Bachelor&apos;s
                        </SelectItem>
                        <SelectItem value={DegreeType.MASTER}>
                          Master&apos;s
                        </SelectItem>
                        <SelectItem value={DegreeType.DOCTOR}>
                          Doctorate
                        </SelectItem>
                        <SelectItem value={DegreeType.HIGH_SCHOOL}>
                          High School
                        </SelectItem>
                        <SelectItem value={DegreeType.ASSOCIATE}>
                          Associate
                        </SelectItem>
                        <SelectItem value={DegreeType.OTHER}>Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='major'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-xs font-bold tracking-wider text-muted-foreground uppercase'>
                      Major
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Ex. Computer Science'
                        value={field.value ?? ''}
                        onChange={e => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Start Date & End Date */}
            <div className='grid grid-cols-2 gap-6'>
              <FormField
                control={form.control}
                name='startDate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-xs font-bold tracking-wider text-muted-foreground uppercase'>
                      Start Date
                    </FormLabel>
                    <FormControl>
                      <MonthPicker
                        value={field.value ?? undefined}
                        onChange={field.onChange}
                        placeholder='YYYY-MM'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='endDate'
                render={({ field }) => {
                  const startDate = form.watch('startDate')
                  return (
                    <FormItem>
                      <FormLabel className='text-xs font-bold tracking-wider text-muted-foreground uppercase'>
                        End Date
                      </FormLabel>
                      <FormControl>
                        <MonthPicker
                          value={field.value ?? undefined}
                          onChange={field.onChange}
                          placeholder='YYYY-MM'
                          minDate={startDate ?? undefined}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-xs font-bold tracking-wider text-muted-foreground uppercase'>
                    Description
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Briefly describe your study...'
                      className='min-h-[80px] resize-none'
                      {...field}
                    />
                  </FormControl>
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
  const { requestClose } = useSectionedDialog()

  return (
    <SectionedDialogFooter>
      <Button type='button' variant='ghost' onClick={requestClose}>
        Cancel
      </Button>
      <Button type='submit' form='education-edit-form'>
        Save
      </Button>
    </SectionedDialogFooter>
  )
}
