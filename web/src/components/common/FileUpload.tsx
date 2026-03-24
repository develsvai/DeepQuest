'use client'

import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react'
import { useState, useRef } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { RESUME_UPLOAD } from '@/lib/constants/file-upload'
import { cn } from '@/lib/utils'

/**
 * Props for FileUpload component
 * @property onFileSelect - Callback when file is selected (valid file)
 * @property onFileSizeExceeded - Callback when file size exceeds maxSize
 * @property acceptedFormats - Accepted file formats
 * @property maxSize - Maximum file size in MB
 * @property fileSizeErrorMessage - Custom error message for file size (supports i18n)
 * @property formatErrorMessage - Custom error message for format (supports i18n)
 * @property className - Additional CSS classes
 * @property disabled - Whether the file upload is disabled
 */
interface FileUploadProps {
  onFileSelect?: (file: File) => void
  onFileSizeExceeded?: (file: File, maxSize: number) => void
  acceptedFormats?: string[]
  maxSize?: number
  fileSizeErrorMessage?: string
  formatErrorMessage?: string
  className?: string
  disabled?: boolean
}

/**
 * File upload component with drag and drop
 * Supports drag & drop and click to upload
 */
export function FileUpload({
  onFileSelect,
  onFileSizeExceeded,
  acceptedFormats = ['.pdf', '.docx'],
  maxSize = RESUME_UPLOAD.MAX_SIZE_MB,
  fileSizeErrorMessage,
  formatErrorMessage,
  className,
  disabled = false,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const validateFile = (selectedFile: File): boolean => {
    // Check file size
    const sizeMB = selectedFile.size / (1024 * 1024)
    if (sizeMB > maxSize) {
      const errorMsg =
        fileSizeErrorMessage ?? `File size must be less than ${maxSize}MB`
      setError(errorMsg)
      // Call callback for additional handling (e.g., showing toast with link)
      onFileSizeExceeded?.(selectedFile, maxSize)
      return false
    }

    // Check file format
    const extension = '.' + selectedFile.name.split('.').pop()?.toLowerCase()
    if (!acceptedFormats.includes(extension)) {
      const errorMsg =
        formatErrorMessage ?? `Accepted formats: ${acceptedFormats.join(', ')}`
      setError(errorMsg)
      return false
    }

    setError(null)
    return true
  }

  const handleFileSelect = (selectedFile: File) => {
    if (validateFile(selectedFile)) {
      setFile(selectedFile)
      onFileSelect?.(selectedFile)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (disabled) return

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }

  const handleClick = () => {
    if (disabled) return
    inputRef.current?.click()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }

  const handleRemove = () => {
    setFile(null)
    setError(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024)
    return mb.toFixed(2) + ' MB'
  }

  return (
    <Card
      className={cn(
        'relative border-2 border-dashed bg-white transition-colors dark:bg-zinc-900',
        isDragging && 'border-primary bg-primary/5',
        error && 'border-destructive',
        file && !error && 'border-primary',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type='file'
        accept={acceptedFormats.join(',')}
        onChange={handleInputChange}
        className='hidden'
        disabled={disabled}
      />

      {!file ? (
        <div className='cursor-pointer p-8 text-center' onClick={handleClick}>
          <Upload className='mx-auto mb-4 h-12 w-12 text-muted-foreground' />
          <p className='mb-1 text-sm font-medium'>
            Drag & drop your file here, or click to browse
          </p>
          <p className='text-xs text-muted-foreground'>
            {acceptedFormats.join(', ')} (max {maxSize}MB)
          </p>
          {error && (
            <div className='flex items-center justify-center gap-2 text-destructive'>
              <AlertCircle className='h-4 w-4' />
              <span className='text-sm'>{error}</span>
            </div>
          )}
        </div>
      ) : (
        <div className='p-6'>
          <div className='flex items-start justify-between'>
            <div className='flex items-start gap-3'>
              <File className='mt-1 h-10 w-10 text-primary' />
              <div>
                <p className='text-sm font-medium'>{file.name}</p>
                <p className='mt-1 text-xs text-muted-foreground'>
                  {formatFileSize(file.size)}
                </p>
                <div className='mt-2 flex items-center gap-1 text-green-600 dark:text-green-400'>
                  <CheckCircle className='h-3 w-3' />
                  <span className='text-xs'>File uploaded successfully</span>
                </div>
              </div>
            </div>
            <Button
              size='sm'
              variant='ghost'
              onClick={handleRemove}
              className='h-8 w-8 p-0'
            >
              <X className='h-4 w-4' />
            </Button>
          </div>
          <Button
            className='mt-4 w-full'
            variant='outline'
            onClick={handleClick}
          >
            Replace File
          </Button>
        </div>
      )}
    </Card>
  )
}
