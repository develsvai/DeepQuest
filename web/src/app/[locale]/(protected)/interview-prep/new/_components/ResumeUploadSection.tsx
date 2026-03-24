'use client'

import { Lightbulb } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { FileUpload } from '@/components/common/FileUpload'
import { UploadedFile } from '@/components/common/UploadedFile'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { designTokens } from '@/components/design-system/core'
import { RESUME_UPLOAD } from '@/lib/constants/file-upload'

interface ResumeUploadSectionProps {
  selectedFile: File | null
  fileUrl: string | null
  fileError: string | null
  onFileSelect: (file: File) => void
  onFileSizeExceeded: () => void
  onRemoveFile: () => void
  disabled?: boolean
}

export function ResumeUploadSection({
  selectedFile,
  fileUrl,
  fileError,
  onFileSelect,
  onFileSizeExceeded,
  onRemoveFile,
  disabled,
}: ResumeUploadSectionProps) {
  const t = useTranslations('interview-prep.new.form')
  const tErrors = useTranslations('interview-prep.new.errors')

  const MAX_FILE_SIZE_MB = RESUME_UPLOAD.MAX_SIZE_MB

  return (
    <div className='space-y-3'>
      <div
        className='text-base font-medium'
        style={{ color: designTokens.colors.foreground }}
      >
        {t('resumeLabel')}
        <span className='ml-0.5 text-primary'>*</span>
      </div>

      {!selectedFile ? (
        <FileUpload
          onFileSelect={onFileSelect}
          onFileSizeExceeded={onFileSizeExceeded}
          acceptedFormats={['.pdf']}
          maxSize={MAX_FILE_SIZE_MB}
          fileSizeErrorMessage={tErrors('fileTooLarge', {
            maxSize: MAX_FILE_SIZE_MB,
          })}
          className='h-48'
          disabled={disabled}
        />
      ) : (
        <UploadedFile
          file={{
            fileName: selectedFile.name,
            fileType: 'PDF',
            fileSize: selectedFile.size,
            uploadedAt: new Date(),
          }}
          onRemove={onRemoveFile}
          onView={() => fileUrl && window.open(fileUrl)}
          disabled={disabled}
        />
      )}

      {fileError && <p className='text-sm text-destructive'>{fileError}</p>}

      <Alert
        className='border p-3'
        style={{
          backgroundColor: `${designTokens.colors.secondary.DEFAULT}30`,
          borderColor: designTokens.colors.secondary.DEFAULT,
        }}
      >
        <AlertDescription
          className='flex items-start gap-2 text-sm'
          style={{ color: designTokens.colors.muted.foreground }}
        >
          <Lightbulb
            className='mt-0.5 h-4 w-4 shrink-0'
            style={{ color: designTokens.colors.primary.DEFAULT }}
          />
          <span>
            {t.rich('resumeHint', {
              bold: chunks => (
                <span className='font-semibold underline underline-offset-2'>
                  {chunks}
                </span>
              ),
            })}
          </span>
        </AlertDescription>
      </Alert>
    </div>
  )
}
