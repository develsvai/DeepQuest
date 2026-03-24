'use client'

import { useState, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import {
  uploadImageToStorage,
  deleteImageFromStorage,
  type ImageUploadResult,
} from '@/lib/db/supabase/storage'

interface UploadedImageData {
  storagePath: string
  storageUrl: string
  fileName: string
  fileSize: number
  mimeType: string
}

interface UseImageUploadReturn {
  /** Currently selected image file (not yet uploaded) */
  selectedFile: File | null
  /** Data from successfully uploaded image */
  uploadedImage: UploadedImageData | null
  /** Whether upload is in progress */
  isUploading: boolean
  /** Upload error message if any */
  uploadError: string | null

  /** Upload image to Supabase Storage and return uploaded image data */
  uploadImage: (file: File) => Promise<UploadedImageData | null>
  /** Delete uploaded image from storage */
  deleteImage: () => Promise<boolean>
  /** Reset all state */
  reset: () => void
}

/**
 * Hook for managing temporary image uploads to Supabase Storage
 *
 * Features:
 * - Upload images to 'temporary-uploads' bucket
 * - Track upload state and progress
 * - Delete uploaded images from storage
 * - No database records (storage only)
 *
 * @example
 * ```tsx
 * const { uploadImage, uploadedImage, deleteImage, isUploading } = useImageUpload()
 *
 * const handleUpload = async (file: File) => {
 *   const url = await uploadImage(file)
 *   if (url) {
 *     // Use the URL for further processing
 *   }
 * }
 *
 * // Cleanup on unmount
 * useEffect(() => {
 *   return () => {
 *     if (uploadedImage) {
 *       deleteImage()
 *     }
 *   }
 * }, [])
 * ```
 */
export function useImageUpload(): UseImageUploadReturn {
  const { user } = useUser()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadedImage, setUploadedImage] = useState<UploadedImageData | null>(
    null
  )
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  /**
   * Upload image to Supabase Storage
   * @returns Uploaded image data on success, null on failure
   */
  const uploadImage = useCallback(
    async (file: File): Promise<UploadedImageData | null> => {
      // Validate user is authenticated
      if (!user?.id) {
        setUploadError('User not authenticated')
        return null
      }

      try {
        setIsUploading(true)
        setUploadError(null)
        setSelectedFile(file)

        // Upload to Supabase Storage
        const result: ImageUploadResult = await uploadImageToStorage(
          file,
          user.id
        )

        if (!result.success || !result.data) {
          const errorMessage = result.error?.message ?? 'Failed to upload image'
          setUploadError(errorMessage)
          return null
        }

        // Store uploaded image data
        setUploadedImage(result.data)
        return result.data
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred'
        setUploadError(errorMessage)
        return null
      } finally {
        setIsUploading(false)
      }
    },
    [user?.id]
  )

  /**
   * Delete uploaded image from storage
   * @returns True if successful, false otherwise
   */
  const deleteImage = useCallback(async (): Promise<boolean> => {
    if (!uploadedImage?.storagePath) {
      return false
    }

    try {
      const success = await deleteImageFromStorage(uploadedImage.storagePath)

      if (success) {
        setUploadedImage(null)
        setSelectedFile(null)
      }

      return success
    } catch (error) {
      console.error('Failed to delete image:', error)
      return false
    }
  }, [uploadedImage?.storagePath])

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    setSelectedFile(null)
    setUploadedImage(null)
    setIsUploading(false)
    setUploadError(null)
  }, [])

  return {
    selectedFile,
    uploadedImage,
    isUploading,
    uploadError,
    uploadImage,
    deleteImage,
    reset,
  }
}
