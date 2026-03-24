'use client'

import { useRouter } from '@/i18n/navigation'
import { Sparkles, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { designTokens } from '@/components/design-system/core'

import { useNewInterviewPrepForm } from './NewInterviewPrep.hooks'
import { JobTitleCombobox } from '@/components/ui/custom/job-title-combobox'
import { ResumeUploadSection } from './ResumeUploadSection'
import { ExperienceList } from './ExperienceList'
import { PdfViewer } from './PdfViewer'

export function NewInterviewPrep() {
  const t = useTranslations('interview-prep.new.form')
  const router = useRouter()

  const {
    form,
    onSubmit,
    selectedFile,
    fileUrl,
    fileError,
    uploadError,
    handleFileSelect,
    handleFileSizeExceeded,
    handleRemoveFile,
    isSubmitting,
    isUploading,
    isLoading,
    canSubmit,
  } = useNewInterviewPrepForm()

  const jobTitleValue = form.watch('jobTitle')

  return (
    <div className='grid grid-cols-1 items-stretch gap-6 p-6 lg:grid-cols-2'>
      {/* Left Column - Form */}
      <div className='flex min-w-0 flex-col'>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex-1 space-y-8'
            noValidate
          >
            <div className='space-y-6'>
              {/* Workspace Title */}
              <FormField
                control={form.control}
                name='title'
                render={({ field }) => (
                  <FormItem className='space-y-3'>
                    <FormLabel
                      className='text-base font-medium'
                      style={{ color: designTokens.colors.foreground }}
                    >
                      {t('nameLabel')}
                      <span className='ml-0.5 text-primary'>*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('namePlaceholder')}
                        maxLength={50}
                        className='h-12 bg-white text-lg dark:bg-zinc-900'
                        aria-describedby='title-hint'
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <Alert
                      id='title-hint'
                      className='border-0 bg-transparent p-0'
                    >
                      <AlertDescription
                        className='flex items-center gap-2 text-sm'
                        style={{ color: designTokens.colors.muted.foreground }}
                      >
                        <Sparkles
                          className='h-4 w-4'
                          style={{ color: designTokens.colors.primary.DEFAULT }}
                        />
                        {t('nameHint')}
                      </AlertDescription>
                    </Alert>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Job Title - Combobox */}
              <FormField
                control={form.control}
                name='jobTitle'
                render={({ field }) => (
                  <FormItem className='space-y-3'>
                    <FormLabel
                      className='text-base font-medium'
                      style={{ color: designTokens.colors.foreground }}
                    >
                      {t('roleLabel')}
                      <span className='ml-0.5 text-primary'>*</span>
                    </FormLabel>
                    <FormControl>
                      <JobTitleCombobox
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isSubmitting}
                        hasError={!!form.formState.errors.jobTitle}
                      />
                    </FormControl>
                    <p
                      className='text-right text-sm'
                      style={{ color: designTokens.colors.muted.foreground }}
                    >
                      {jobTitleValue.length}/50
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Resume Upload */}
              <ResumeUploadSection
                selectedFile={selectedFile}
                fileUrl={fileUrl}
                fileError={fileError}
                onFileSelect={handleFileSelect}
                onFileSizeExceeded={handleFileSizeExceeded}
                onRemoveFile={handleRemoveFile}
                disabled={isSubmitting}
              />

              {/* Mobile PDF Viewer */}
              <div className='block space-y-3 lg:hidden'>
                <div
                  className='text-base font-medium'
                  style={{ color: designTokens.colors.foreground }}
                >
                  {t('previewLabel')}
                </div>
                <PdfViewer file={selectedFile} fileUrl={fileUrl} />
              </div>

              {/* Experience List */}
              <FormField
                control={form.control}
                name='experiences'
                render={({ field }) => (
                  <FormItem className='space-y-3'>
                    <FormLabel
                      className='text-base font-medium'
                      style={{ color: designTokens.colors.foreground }}
                    >
                      {t('experienceLabel')}
                      <span className='ml-0.5 text-primary'>*</span>
                    </FormLabel>
                    <FormControl>
                      <ExperienceList
                        experiences={field.value}
                        onChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* General Errors (upload errors) */}
              {uploadError && (
                <Alert
                  variant='destructive'
                  className='border p-3'
                  style={{
                    backgroundColor: `${designTokens.colors.destructive.DEFAULT}10`,
                    borderColor: designTokens.colors.destructive.DEFAULT,
                  }}
                >
                  <AlertDescription className='text-sm'>
                    {uploadError}
                  </AlertDescription>
                </Alert>
              )}

              {/* Actions */}
              <div className='flex justify-end gap-3 pt-6'>
                <Button
                  type='button'
                  variant='ghost'
                  size='lg'
                  disabled={isLoading}
                  onClick={() => router.back()}
                >
                  {t('cancelButton')}
                </Button>
                <Button
                  type='submit'
                  size='lg'
                  className='px-8'
                  disabled={!canSubmit}
                  aria-busy={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      {isUploading ? t('uploadingButton') : t('creatingButton')}
                    </>
                  ) : (
                    t('createButton')
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>

      {/* Right Column - PDF Viewer */}
      <PdfViewer
        file={selectedFile}
        fileUrl={fileUrl}
        className='hidden min-w-0 self-stretch lg:flex'
      />
    </div>
  )
}
