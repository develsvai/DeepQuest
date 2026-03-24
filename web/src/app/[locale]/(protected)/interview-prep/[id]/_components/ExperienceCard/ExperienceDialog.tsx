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
import { Checkbox } from '@/components/ui/checkbox'
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
import { cn } from '@/lib/utils'
import { EmployeeType, ProjectType } from '@/generated/prisma/enums'

import type {
  CareerWithDetails,
  ProjectWithDetails,
} from '../InterviewPrepDetail.types'

// ============================================================================
// Types
// ============================================================================

type ExperienceData = CareerWithDetails | ProjectWithDetails
type ExperienceType = 'CAREER' | 'PROJECT'

// ============================================================================
// Form Schema & Types
// ============================================================================

/**
 * Flat schema for experience form
 * Uses nullable for type-specific fields to handle Career/Project switching
 */
const experienceFormSchema = z.object({
  experienceType: z.enum(['CAREER', 'PROJECT']),
  name: z.string().min(1),
  position: z.string(), // Comma-separated, parsed on submit
  techStack: z.string(), // Comma-separated, parsed on submit
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  isCurrent: z.boolean(),
  description: z.string(),
  // Career-specific (nullable when type is PROJECT)
  employeeType: z
    .enum([
      EmployeeType.FULL_TIME,
      EmployeeType.PART_TIME,
      EmployeeType.CONTRACT,
      EmployeeType.FREELANCE,
      EmployeeType.INTERN,
    ])
    .nullable(),
  jobLevel: z.string().nullable(),
  // Project-specific (nullable when type is CAREER)
  projectType: z
    .enum([
      ProjectType.PERSONAL,
      ProjectType.TEAM,
      ProjectType.FREELANCE,
      ProjectType.OPEN_SOURCE,
      ProjectType.ACADEMIC,
      ProjectType.HACKATHON,
    ])
    .nullable(),
  teamSize: z.number().nullable(),
  teamComposition: z.string().nullable(),
})

type FormValues = z.infer<typeof experienceFormSchema>

// ============================================================================
// Component Props
// ============================================================================

interface ExperienceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData: ExperienceData
  initialType: ExperienceType
  onSubmit: (data: ExperienceData, type: ExperienceType) => void
}

// ============================================================================
// Type Guards & Helpers
// ============================================================================

/**
 * Type guard to check if data is CareerWithDetails
 */
function isCareerData(data: ExperienceData): data is CareerWithDetails {
  return 'company' in data
}

/**
 * Convert ExperienceData to form values
 */
function getDefaultValues(
  data: ExperienceData,
  type: ExperienceType
): FormValues {
  const isCareer = type === 'CAREER'
  const careerData = data as CareerWithDetails
  const projectData = data as ProjectWithDetails

  return {
    experienceType: type,
    name: isCareer ? careerData.company : projectData.projectName,
    position: data.position.join(', '),
    techStack: data.techStack?.join(', ') ?? '',
    startDate: data.startDate,
    endDate: data.endDate,
    isCurrent: data.isCurrent ?? false,
    description: isCareer
      ? careerData.companyDescription
      : (projectData.projectDescription ?? ''),
    // Career-specific
    employeeType: isCareer ? careerData.employeeType : null,
    jobLevel: isCareer ? careerData.jobLevel : null,
    // Project-specific
    projectType: isCareer ? null : projectData.projectType,
    teamSize: isCareer ? null : projectData.teamSize,
    teamComposition: isCareer ? null : projectData.teamComposition,
  }
}

/**
 * Convert form values to CareerWithDetails
 */
function formToCareerData(
  values: FormValues,
  original: ExperienceData
): CareerWithDetails {
  // Preserve non-form fields from original
  const base = isCareerData(original)
    ? original
    : {
        id: original.id,
        totalQuestions: original.totalQuestions,
        completedQuestions: original.completedQuestions,
      }

  return {
    ...base,
    company: values.name,
    companyDescription: values.description,
    position: parseCommaSeparated(values.position),
    techStack: parseCommaSeparated(values.techStack),
    startDate: values.startDate,
    endDate: values.endDate,
    isCurrent: values.isCurrent,
    employeeType: values.employeeType,
    jobLevel: values.jobLevel,
    // Ensure these exist for type compatibility
    totalQuestions: base.totalQuestions ?? 0,
    completedQuestions: base.completedQuestions ?? 0,
  } as CareerWithDetails
}

/**
 * Convert form values to ProjectWithDetails
 */
function formToProjectData(
  values: FormValues,
  original: ExperienceData
): ProjectWithDetails {
  // Preserve non-form fields from original
  const base = !isCareerData(original)
    ? original
    : {
        id: original.id,
        totalQuestions: original.totalQuestions,
        completedQuestions: original.completedQuestions,
      }

  return {
    ...base,
    projectName: values.name,
    projectDescription: values.description,
    position: parseCommaSeparated(values.position),
    techStack: parseCommaSeparated(values.techStack),
    startDate: values.startDate,
    endDate: values.endDate,
    isCurrent: values.isCurrent,
    projectType: values.projectType,
    teamSize: values.teamSize,
    teamComposition: values.teamComposition,
    // Ensure these exist for type compatibility
    totalQuestions: base.totalQuestions ?? 0,
    completedQuestions: base.completedQuestions ?? 0,
  } as ProjectWithDetails
}

/**
 * Parse comma-separated string to array
 */
function parseCommaSeparated(value: string): string[] {
  return value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}

// ============================================================================
// Main Dialog Component
// ============================================================================

/**
 * Dialog for editing Experience (Career/Project) entries
 * Uses react-hook-form with Zod validation
 * Supports type switching between Career and Project
 */
export function ExperienceDialog({
  open,
  onOpenChange,
  initialData,
  initialType,
  onSubmit,
}: ExperienceDialogProps) {
  const t = useTranslations('common.toast')

  const form = useForm<FormValues>({
    resolver: zodResolver(experienceFormSchema),
    defaultValues: getDefaultValues(initialData, initialType),
  })

  const {
    formState: { isDirty },
    watch,
    setValue,
  } = form

  const experienceType = watch('experienceType')
  const isCareer = experienceType === 'CAREER'
  const isCurrent = watch('isCurrent')

  // Reset form when dialog opens with new initialData
  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues(initialData, initialType))
    }
  }, [open, initialData, initialType, form])

  /**
   * Handle type switching between Career and Project
   * Resets type-specific fields to appropriate defaults
   */
  const handleTypeChange = (newType: ExperienceType) => {
    if (newType === experienceType) return

    setValue('experienceType', newType, { shouldDirty: true })

    if (newType === 'PROJECT') {
      // Reset career-specific, set project defaults
      setValue('employeeType', null)
      setValue('jobLevel', null)
      setValue('projectType', ProjectType.TEAM)
      setValue('teamSize', null)
      setValue('teamComposition', null)
    } else {
      // Reset project-specific, set career defaults
      setValue('projectType', null)
      setValue('teamSize', null)
      setValue('teamComposition', null)
      setValue('employeeType', EmployeeType.FULL_TIME)
      setValue('jobLevel', null)
    }
  }

  const handleFormSubmit = (values: FormValues) => {
    const isCareerType = values.experienceType === 'CAREER'
    const result = isCareerType
      ? formToCareerData(values, initialData)
      : formToProjectData(values, initialData)

    onSubmit(result, values.experienceType)
    toast.success(t('experienceSaved'))
  }

  return (
    <SectionedDialog
      open={open}
      onOpenChange={onOpenChange}
      maxWidth='lg'
      isDirty={isDirty}
    >
      <SectionedDialogHeader
        title='Edit Experience'
        description='Update your career or project experience.'
      />

      <SectionedDialogBody className='space-y-6'>
        <Form {...form}>
          <form
            id='experience-edit-form'
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className='space-y-6'
          >
            {/* Type Switcher */}
            <div className='flex justify-center'>
              <div className='flex items-center rounded-lg bg-muted p-1'>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={() => handleTypeChange('CAREER')}
                  className={cn(
                    'rounded-md px-6 py-1.5 text-sm font-medium transition-all duration-200',
                    isCareer
                      ? 'cursor-default bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-transparent hover:text-foreground/80'
                  )}
                >
                  Career
                </Button>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={() => handleTypeChange('PROJECT')}
                  className={cn(
                    'rounded-md px-6 py-1.5 text-sm font-medium transition-all duration-200',
                    !isCareer
                      ? 'cursor-default bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-transparent hover:text-foreground/80'
                  )}
                >
                  Project
                </Button>
              </div>
            </div>

            {/* Name & Position */}
            <div className='grid grid-cols-2 gap-6'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-xs font-bold tracking-wider text-muted-foreground uppercase'>
                      {isCareer ? 'Company Name' : 'Project Name'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={
                          isCareer ? 'Ex. Google' : 'Ex. Portfolio Website'
                        }
                        className='text-lg font-bold'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='position'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-xs font-bold tracking-wider text-muted-foreground uppercase'>
                      Position / Role
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Ex. Backend Engineer, Team Lead'
                        className='text-lg font-bold'
                        {...field}
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
              <div className='flex gap-4'>
                <FormField
                  control={form.control}
                  name='endDate'
                  render={({ field }) => {
                    const startDate = watch('startDate')
                    return (
                      <FormItem className='flex-1'>
                        <FormLabel className='text-xs font-bold tracking-wider text-muted-foreground uppercase'>
                          End Date
                        </FormLabel>
                        <FormControl>
                          <MonthPicker
                            value={
                              isCurrent ? undefined : (field.value ?? undefined)
                            }
                            onChange={field.onChange}
                            placeholder={isCurrent ? 'Present' : 'YYYY-MM'}
                            disabled={isCurrent}
                            minDate={startDate ?? undefined}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )
                  }}
                />
                <FormField
                  control={form.control}
                  name='isCurrent'
                  render={({ field }) => (
                    <FormItem className='flex items-center gap-2 pt-6'>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={checked => {
                            field.onChange(checked === true)
                            if (checked) {
                              setValue('endDate', null)
                            }
                          }}
                        />
                      </FormControl>
                      <FormLabel className='text-xs font-medium'>
                        Current
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-xs font-bold tracking-wider text-muted-foreground uppercase'>
                    {isCareer ? 'Company Description' : 'Project Description'}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Briefly describe the company or project...'
                      className='min-h-[80px] resize-none'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tech Stack */}
            <FormField
              control={form.control}
              name='techStack'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-xs font-bold tracking-wider text-muted-foreground uppercase'>
                    Tech Stack
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Ex. React, Node.js, AWS (Comma separated)'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Type Specific Fields */}
            <div className='space-y-4 rounded-lg'>
              {isCareer ? (
                <div className='grid grid-cols-2 gap-6'>
                  <FormField
                    control={form.control}
                    name='employeeType'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-xs font-bold tracking-wider text-muted-foreground uppercase'>
                          Employee Type
                        </FormLabel>
                        <Select
                          value={field.value ?? undefined}
                          onValueChange={value =>
                            field.onChange(value as EmployeeType)
                          }
                        >
                          <FormControl>
                            <SelectTrigger className='w-full'>
                              <SelectValue placeholder='Select type' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={EmployeeType.FULL_TIME}>
                              Full-time
                            </SelectItem>
                            <SelectItem value={EmployeeType.PART_TIME}>
                              Part-time
                            </SelectItem>
                            <SelectItem value={EmployeeType.CONTRACT}>
                              Contract
                            </SelectItem>
                            <SelectItem value={EmployeeType.FREELANCE}>
                              Freelance
                            </SelectItem>
                            <SelectItem value={EmployeeType.INTERN}>
                              Intern
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='jobLevel'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-xs font-bold tracking-wider text-muted-foreground uppercase'>
                          Job Level
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder='Ex. Senior, Junior, Lead'
                            value={field.value ?? ''}
                            onChange={e =>
                              field.onChange(e.target.value || null)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ) : (
                <div className='space-y-4'>
                  <div className='grid grid-cols-2 gap-6'>
                    <FormField
                      control={form.control}
                      name='projectType'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-xs font-bold tracking-wider text-muted-foreground uppercase'>
                            Project Type
                          </FormLabel>
                          <Select
                            value={field.value ?? undefined}
                            onValueChange={value =>
                              field.onChange(value as ProjectType)
                            }
                          >
                            <FormControl>
                              <SelectTrigger className='w-full'>
                                <SelectValue placeholder='Select type' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={ProjectType.PERSONAL}>
                                Personal
                              </SelectItem>
                              <SelectItem value={ProjectType.TEAM}>
                                Team
                              </SelectItem>
                              <SelectItem value={ProjectType.FREELANCE}>
                                Freelance
                              </SelectItem>
                              <SelectItem value={ProjectType.OPEN_SOURCE}>
                                Open Source
                              </SelectItem>
                              <SelectItem value={ProjectType.ACADEMIC}>
                                Academic
                              </SelectItem>
                              <SelectItem value={ProjectType.HACKATHON}>
                                Hackathon
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='teamSize'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-xs font-bold tracking-wider text-muted-foreground uppercase'>
                            Team Size
                          </FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              value={field.value ?? ''}
                              onChange={e =>
                                field.onChange(
                                  e.target.value
                                    ? parseInt(e.target.value, 10)
                                    : null
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name='teamComposition'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-xs font-bold tracking-wider text-muted-foreground uppercase'>
                          Team Composition
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder='Ex. 1 PM, 2 Backend, 1 Frontend'
                            value={field.value ?? ''}
                            onChange={e =>
                              field.onChange(e.target.value || null)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>
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
      <Button type='submit' form='experience-edit-form'>
        Save
      </Button>
    </SectionedDialogFooter>
  )
}
