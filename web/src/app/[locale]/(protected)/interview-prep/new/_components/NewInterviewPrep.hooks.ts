'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'

import { useRouter } from '@/i18n/navigation'
import { routes } from '@/lib/routes'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations, useLocale } from 'next-intl'
import { toast } from 'sonner'
import posthog from 'posthog-js'
import { POSTHOG_EVENTS } from '@/lib/posthog-events'

import { useFileUpload } from '@/hooks/useFileUpload'
import { api } from '@/trpc/react'
import { useInterviewPreparationStore } from '@/lib/stores/interview-preparation-store'
import { isDevelopment } from '@/lib/dev'
import { SAMPLE_RESUME_URL } from '@/lib/dev/sample-data'
import {
  interviewPrepNewFormSchema,
  type InterviewPrepNewFormData,
} from '@/lib/schemas/interview-prep-new.schema'
import { createZodErrorMap } from '@/lib/utils/zod/zod-error-map'
import type { CreateInput } from '@/server/api/routers/interview-preparation/schema'

export function useNewInterviewPrepForm() {
  const t = useTranslations('interview-prep.new.form')
  const tValidation = useTranslations('interview-prep.new')
  const tErrors = useTranslations('interview-prep.new.errors')
  const router = useRouter()
  const locale = useLocale()

  // React Hook Form setup
  const form = useForm<InterviewPrepNewFormData>({
    resolver: zodResolver(interviewPrepNewFormSchema, {
      error: createZodErrorMap(tValidation),
    }),
    defaultValues: {
      title: '',
      jobTitle: '',
      experiences: [{ id: crypto.randomUUID(), name: '' }],
    },
    mode: 'onChange',
  })

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false)

  // File state (not in form schema - handled separately)
  const [fileError, setFileError] = useState<string | null>(null)

  // File upload (useFileUpload hook)
  const {
    selectedFile,
    uploadError,
    isUploading,
    handleFileSelect: onFileSelect,
    handleSubmit: handleFileUpload,
    handleRemoveSelectedFile,
  } = useFileUpload()

  // PDF preview URL (create from selectedFile)
  const [fileUrl, setFileUrl] = useState<string | null>(null)

  // Get store action via getState() for stable reference
  const { addPending } = useInterviewPreparationStore.getState()

  // tRPC utils for cache invalidation
  const utils = api.useUtils()

  // Ref to store last mutation input for retry on error
  const lastMutationInputRef = useRef<CreateInput | null>(null)

  // tRPC mutation for creating interview preparation
  const createPrepMutation = api.interviewPreparation.create.useMutation({
    onSuccess: async data => {
      // Add to pending store for Realtime subscription tracking
      addPending(data.preparationId)
      // Invalidate dashboard list cache
      void (await utils.interviewPreparation.list.invalidate())
      // Show success toast
      toast.success(t('createSuccess'))
    },
    onError: error => {
      // Show error toast with retry action
      const savedInput = lastMutationInputRef.current
      toast.error(error.message || tErrors('createFailed'), {
        action: savedInput
          ? {
              label: t('retryButton'),
              onClick: () => createPrepMutation.mutate(savedInput),
            }
          : undefined,
        duration: 15000,
      })
    },
  })

  // Create/cleanup Object URL when selectedFile changes
  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile)
      setFileUrl(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setFileUrl(null)
    }
  }, [selectedFile])

  // Handle file selection (PDF validation only - size is handled by FileUpload)
  const handleFileSelect = useCallback(
    (file: File) => {
      // Validate PDF only (additional check since FileUpload accepts .pdf)
      if (file.type !== 'application/pdf') {
        setFileError(tErrors('pdfOnly'))
        return
      }
      setFileError(null)
      onFileSelect(file)
    },
    [onFileSelect, tErrors]
  )

  // Handle file size exceeded - show toast with compression link
  const handleFileSizeExceeded = useCallback(() => {
    toast.error(t('fileTooLargeTitle'), {
      description: t('fileTooLargeDescription'),
      action: {
        label: t('compressWithILovePDF'),
        onClick: () =>
          window.open('https://www.ilovepdf.com/compress_pdf', '_blank'),
      },
      duration: 15000,
    })
  }, [t])

  // Handle file removal
  const handleRemoveFile = useCallback(() => {
    handleRemoveSelectedFile()
    setFileError(null)
  }, [handleRemoveSelectedFile])

  // Handle form submission
  // Flow: File upload → Create prep → Navigate to detail page
  const onSubmit = useCallback(
    async (data: InterviewPrepNewFormData) => {
      // File validation (not in Zod schema)
      if (!selectedFile) {
        setFileError(tErrors('resumeRequired'))
        return
      }
      setFileError(null)

      setIsSubmitting(true)

      try {
        // 1. Upload file (blocking - high failure risk, user should know immediately)
        const uploadResult = await handleFileUpload()
        if (!uploadResult) {
          // Error is handled by useFileUpload hook (uploadError state)
          setIsSubmitting(false)
          return
        }

        // PostHog: Track resume upload success
        posthog.capture(POSTHOG_EVENTS.RESUME.UPLOADED, {
          file_size_bytes: selectedFile.size,
          file_name: selectedFile.name,
        })

        // 2. Prepare mutation input
        const experienceNames = data.experiences
          .map(e => e.name.trim())
          .filter(name => name.length > 0)

        let storageUrl = uploadResult.storageUrl

        if (isDevelopment()) storageUrl = SAMPLE_RESUME_URL

        // 3. Save input to ref for retry on error, then start mutation
        const mutationInput: CreateInput = {
          title: data.title.trim(),
          jobTitle: data.jobTitle.trim(),
          experienceNames,
          resumeFileId: uploadResult.id,
          resumeFileUrl: storageUrl,
          locale,
        }
        lastMutationInputRef.current = mutationInput

        // 3. Execute mutation and wait for result to get preparationId
        const result = await createPrepMutation.mutateAsync(mutationInput)

        // PostHog: Track interview preparation creation
        posthog.capture(POSTHOG_EVENTS.PREPARATION.CREATED, {
          job_title: data.jobTitle.trim(),
          experience_count: experienceNames.length,
          locale,
        })

        // 4. Reset form and file state before navigation
        form.reset()
        handleRemoveSelectedFile()

        // 5. Navigate to the newly created interview prep detail page
        router.push(routes.interviewPrep.detail(result.preparationId))
      } catch {
        // File upload error
        setIsSubmitting(false)
      }
    },
    [
      selectedFile,
      locale,
      tErrors,
      handleFileUpload,
      createPrepMutation,
      router,
      form,
      handleRemoveSelectedFile,
    ]
  )

  // Computed states
  const experiences = form.watch('experiences')
  const isLoading = isSubmitting || isUploading
  const hasValidExperience = experiences.some(e => e.name.trim().length > 0)
  const canSubmit =
    form.formState.isValid && selectedFile && hasValidExperience && !isLoading

  return {
    // Form
    form,
    onSubmit,

    // File handling
    selectedFile,
    fileUrl,
    fileError,
    uploadError,
    handleFileSelect,
    handleFileSizeExceeded,
    handleRemoveFile,

    // Loading states
    isSubmitting,
    isUploading,
    isLoading,
    canSubmit,
  }
}
