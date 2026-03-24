'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { designTokens } from '@/components/design-system/core'
import { FileText, File, X, ExternalLink } from 'lucide-react'

/**
 * Uploaded file data interface
 */
interface UploadedFileData {
  id?: string
  fileName: string
  fileType: 'PDF' | 'DOCX' | 'DOC'
  fileSize: number
  storageUrl?: string
  uploadedAt?: Date
}

/**
 * Props for UploadedFile component
 */
interface UploadedFileProps {
  file: UploadedFileData
  onRemove?: () => void
  onView?: () => void
  showActions?: boolean
  disabled?: boolean
}

/**
 * Formats file size in a human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * Gets the appropriate icon for a file type
 * @param fileType - The file type (PDF, DOCX, DOC)
 * @returns React icon component
 */
function getFileIcon(fileType: string) {
  switch (fileType.toUpperCase()) {
    case 'PDF':
      return (
        <FileText
          className='h-5 w-5'
          style={{ color: designTokens.colors.destructive.DEFAULT }}
        />
      )
    case 'DOCX':
    case 'DOC':
      return (
        <FileText
          className='h-5 w-5'
          style={{ color: designTokens.colors.primary.DEFAULT }}
        />
      )
    default:
      return (
        <File
          className='h-5 w-5'
          style={{ color: designTokens.colors.muted.foreground }}
        />
      )
  }
}

/**
 * Gets the appropriate badge color for a file type
 * @param fileType - The file type (PDF, DOCX, DOC)
 * @returns Badge variant
 */
function getFileBadgeVariant(
  fileType: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (fileType.toUpperCase()) {
    case 'PDF':
      return 'destructive'
    case 'DOCX':
    case 'DOC':
      return 'default'
    default:
      return 'secondary'
  }
}

/**
 * UploadedFile Component
 *
 * Displays uploaded file information in a clean, user-friendly card format.
 * Shows file icon, name, size, upload time, and optional action buttons.
 * Uses shadcn/ui components and design system tokens for consistency.
 *
 * @param file - File data to display
 * @param onRemove - Optional callback when remove button is clicked
 * @param onView - Optional callback when view button is clicked
 * @param showActions - Whether to show action buttons (default: true)
 */
export function UploadedFile({
  file,
  onRemove,
  onView,
  showActions = true,
  disabled = false,
}: UploadedFileProps) {
  const handleView = () => {
    if (onView) {
      onView()
    } else if (file.storageUrl) {
      window.open(file.storageUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const formatUploadTime = (uploadedAt?: Date) => {
    if (!uploadedAt) return 'Just now'

    const now = new Date()
    const diff = now.getTime() - uploadedAt.getTime()
    const minutes = Math.floor(diff / (1000 * 60))

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`

    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`

    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <Card className='w-full bg-white dark:bg-zinc-900'>
      <CardContent className='p-4'>
        <div className='flex items-center gap-3'>
          {/* File Icon */}
          <div className='shrink-0'>{getFileIcon(file.fileType)}</div>

          {/* File Information */}
          <div className='min-w-0 flex-1'>
            <div className='mb-1 flex items-center gap-2'>
              <h3
                className='truncate text-sm font-medium'
                style={{ color: designTokens.colors.foreground }}
                title={file.fileName}
              >
                {file.fileName}
              </h3>
              <Badge variant={getFileBadgeVariant(file.fileType)}>
                {file.fileType}
              </Badge>
            </div>

            <div className='flex items-center gap-3 text-xs'>
              <span style={{ color: designTokens.colors.muted.foreground }}>
                {formatFileSize(file.fileSize)}
              </span>
              <span
                className='text-xs'
                style={{ color: designTokens.colors.muted.foreground }}
              >
                {formatUploadTime(file.uploadedAt)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          {showActions && (
            <div className='flex items-center gap-1'>
              {(onView || file.storageUrl) && (
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={handleView}
                  className='h-8 w-8 p-0'
                  title='View file'
                >
                  <ExternalLink className='h-4 w-4' />
                  <span className='sr-only'>View file</span>
                </Button>
              )}

              {onRemove && (
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={onRemove}
                  className='h-8 w-8 p-0 text-muted-foreground hover:text-destructive'
                  title='Remove file'
                  disabled={disabled}
                >
                  <X className='h-4 w-4' />
                  <span className='sr-only'>Remove file</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
