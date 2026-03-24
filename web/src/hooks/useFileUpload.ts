import { useState } from 'react'
import { api } from '@/trpc/react'
import { createBrowserSupabaseClient } from '@/lib/db/supabase/hooks/clientSupabase'

// 파일 검증 설정
const FILE_VERIFY_MAX_RETRIES = 3
const FILE_VERIFY_BASE_DELAY_MS = 500

/**
 * 업로드된 파일이 실제로 접근 가능한지 HEAD 요청으로 확인합니다.
 * 타이밍 이슈로 인해 업로드 직후에는 파일이 아직 사용 가능하지 않을 수 있습니다.
 *
 * @param url - 확인할 파일의 URL
 * @returns 파일이 존재하면 true
 * @throws 모든 재시도 실패 시 에러
 */
async function verifyFileAvailability(url: string): Promise<boolean> {
  for (let attempt = 0; attempt < FILE_VERIFY_MAX_RETRIES; attempt++) {
    // 지수 백오프 (첫 시도 제외)
    if (attempt > 0) {
      const delay = FILE_VERIFY_BASE_DELAY_MS * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))
    }

    try {
      const response = await fetch(url, { method: 'HEAD' })

      if (response.ok) {
        return true
      }

      console.warn(
        `파일 확인 실패 (attempt ${attempt + 1}/${FILE_VERIFY_MAX_RETRIES}): status=${response.status}`
      )
    } catch (error) {
      console.warn(
        `파일 확인 네트워크 에러 (attempt ${attempt + 1}/${FILE_VERIFY_MAX_RETRIES}):`,
        error
      )
    }
  }

  throw new Error('파일 업로드 확인 실패: 잠시 후 다시 시도해 주세요.')
}

/**
 * File upload state interface
 */
interface FileUploadState {
  selectedFile: File | null
  uploadProgress: number
  uploadError: string | null
  uploadSuccess: {
    id: string
    fileName: string
    storageUrl: string
    fileType: 'PDF' | 'DOCX' | 'DOC'
    fileSize: number
  } | null
  isUploading: boolean
}

/**
 * Upload result type
 */
type UploadResult = {
  id: string
  fileName: string
  storageUrl: string
  fileType: 'PDF' | 'DOCX' | 'DOC'
  fileSize: number
}

/**
 * File upload hook return interface
 */
interface UseFileUploadReturn extends FileUploadState {
  handleFileSelect: (file: File) => void
  handleSubmit: () => Promise<UploadResult | null>
  handleRemoveSelectedFile: () => void
  handleRemoveUploadedFile: () => void
  reset: () => void
  getFileTypeFromName: (fileName: string) => 'PDF' | 'DOCX' | 'DOC'
}

/**
 * Custom hook for file upload functionality
 *
 * Handles file selection, upload via tRPC, progress tracking, and error handling.
 * Provides a clean interface for components to use file upload functionality.
 *
 * @param interviewPreparationId - Optional ID to link uploaded file to interview preparation
 * @returns File upload state and handlers
 */
export function useFileUpload(
  interviewPreparationId?: string
): UseFileUploadReturn {
  const supabase = createBrowserSupabaseClient()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<{
    id: string
    fileName: string
    storageUrl: string
    fileType: 'PDF' | 'DOCX' | 'DOC'
    fileSize: number
  } | null>(null)
  const [isUploading, setIsUploading] = useState<boolean>(false)

  // tRPC mutation for creating DB record after successful storage upload
  const createFileRecordMutation = api.fileUpload.create.useMutation()

  /**
   * Handles file selection
   */
  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setUploadProgress(0)
    setUploadError(null)
    // Clear previous upload success when selecting new file
    setUploadSuccess(null)
  }

  /**
   * Handles file upload submission
   * @returns Upload result on success, null on failure
   */
  const handleSubmit = async (): Promise<UploadResult | null> => {
    if (!selectedFile) {
      setUploadError('Please select a file first')
      return null
    }

    try {
      setIsUploading(true)
      setUploadError(null)
      setUploadProgress(10)

      // Prepare storage path and metadata
      const originalFileName = selectedFile.name
      const sanitizedFileName = originalFileName.replace(
        /[^a-zA-Z0-9._-]/g,
        '_'
      )
      const storagePath = `${Date.now()}_${sanitizedFileName}`

      // Determine file type from extension
      const ext = originalFileName.split('.').pop()?.toUpperCase()
      let fileType: 'PDF' | 'DOCX' | 'DOC' = 'PDF'
      if (ext === 'DOCX') fileType = 'DOCX'
      else if (ext === 'DOC') fileType = 'DOC'

      // 1) Upload file directly from client to Supabase Storage
      setUploadProgress(40)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(storagePath, selectedFile, {
          contentType: selectedFile.type,
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError || !uploadData?.path) {
        setIsUploading(false)
        setUploadProgress(0)
        setUploadError(
          uploadError?.message || 'Failed to upload file to storage.'
        )
        return null
      }

      // 2) Get public URL
      setUploadProgress(60)
      const { data: urlData } = supabase.storage
        .from('resumes')
        .getPublicUrl(uploadData.path)

      if (!urlData?.publicUrl) {
        setIsUploading(false)
        setUploadProgress(0)
        setUploadError('Failed to generate public URL.')
        return null
      }

      // 3) 파일 가용성 확인 (타이밍 이슈 방지)
      setUploadProgress(75)
      await verifyFileAvailability(urlData.publicUrl)

      // 4) Create DB record via tRPC
      setUploadProgress(85)
      const created = await createFileRecordMutation.mutateAsync({
        fileName: originalFileName,
        fileType,
        fileSize: selectedFile.size,
        mimeType: selectedFile.type,
        storageUrl: urlData.publicUrl,
        storagePath: uploadData.path,
        bucketName: 'resumes',
        scanStatus: 'PENDING',
        interviewPreparationId,
      })

      setUploadProgress(100)
      setUploadError(null)
      const result: UploadResult = {
        id: created.id,
        fileName: created.fileName,
        storageUrl: created.storageUrl,
        fileType,
        fileSize: selectedFile.size,
      }
      setUploadSuccess(result)
      setSelectedFile(null)
      setIsUploading(false)
      // Reset progress for next upload
      setUploadProgress(0)
      return result
    } catch (err) {
      setIsUploading(false)
      setUploadProgress(0)
      setUploadError(
        err instanceof Error ? err.message : 'Failed to process file.'
      )
      return null
    }
  }

  /**
   * Handles removing selected file (before upload)
   */
  const handleRemoveSelectedFile = () => {
    setSelectedFile(null)
    setUploadError(null)
    setUploadProgress(0)
  }

  /**
   * Handles removing uploaded file (after successful upload)
   */
  const handleRemoveUploadedFile = () => {
    setUploadSuccess(null)
    setUploadError(null)
    setUploadProgress(0)
  }

  /**
   * Resets all state to initial values
   */
  const reset = () => {
    setSelectedFile(null)
    setUploadProgress(0)
    setUploadError(null)
    setUploadSuccess(null)
  }

  /**
   * Helper function to get file type from file name
   */
  const getFileTypeFromName = (fileName: string): 'PDF' | 'DOCX' | 'DOC' => {
    const extension = fileName.split('.').pop()?.toUpperCase()
    if (extension === 'DOCX') return 'DOCX'
    if (extension === 'DOC') return 'DOC'
    return 'PDF'
  }

  return {
    selectedFile,
    uploadProgress,
    uploadError,
    uploadSuccess,
    isUploading,
    handleFileSelect,
    handleSubmit,
    handleRemoveSelectedFile,
    handleRemoveUploadedFile,
    reset,
    getFileTypeFromName,
  }
}
