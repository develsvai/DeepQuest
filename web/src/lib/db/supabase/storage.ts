import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

import { IMAGE_UPLOAD, IMAGE_MIME_TYPES } from '@/lib/constants/file-upload'

/**
 * Image upload configuration - uses shared constants
 */
const IMAGE_UPLOAD_CONFIG = {
  MAX_FILE_SIZE: IMAGE_UPLOAD.MAX_SIZE_BYTES,
  BUCKET_NAME: IMAGE_UPLOAD.BUCKET_NAME,
  ALLOWED_EXTENSIONS: IMAGE_UPLOAD.ALLOWED_EXTENSIONS,
} as const

/**
 * Image upload result interface
 */
export interface ImageUploadResult {
  success: boolean
  data?: {
    storagePath: string
    storageUrl: string
    fileName: string
    fileSize: number
    mimeType: string
  }
  error?: {
    code: string
    message: string
  }
}

/**
 * Generates a unique storage path for the file
 * Format: userId/timestamp_originalFileName
 */
function generateStoragePath(userId: string, fileName: string): string {
  const timestamp = Date.now()
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${userId}/${timestamp}_${sanitizedFileName}`
}

/**
 * Creates a client-side Supabase client for browser uploads
 * Uses anon key for client-side operations
 */
function createClientStorageClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase configuration for client storage operations'
    )
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

/**
 * Uploads an image file to Supabase storage (client-side compatible)
 *
 * @param imageFile - Image File object from browser
 * @param userId - ID of the user uploading the file
 * @returns Promise<ImageUploadResult> - Upload result with storage URL or error
 *
 * @throws Never throws - all errors are captured and returned in the result
 */
export async function uploadImageToStorage(
  imageFile: File,
  userId: string
): Promise<ImageUploadResult> {
  try {
    // Validate input parameters
    if (!imageFile || !userId) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required parameters',
        },
      }
    }

    // Validate file size
    if (imageFile.size > IMAGE_UPLOAD_CONFIG.MAX_FILE_SIZE) {
      return {
        success: false,
        error: {
          code: 'FILE_VALIDATION_ERROR',
          message: `File size must be less than ${IMAGE_UPLOAD_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`,
        },
      }
    }

    if (imageFile.size === 0) {
      return {
        success: false,
        error: {
          code: 'FILE_VALIDATION_ERROR',
          message: 'File cannot be empty',
        },
      }
    }

    // Get file extension
    const extension = '.' + imageFile.name.split('.').pop()?.toLowerCase()

    // Check if extension is allowed
    if (
      !IMAGE_UPLOAD_CONFIG.ALLOWED_EXTENSIONS.includes(
        extension as '.png' | '.jpg' | '.jpeg'
      )
    ) {
      return {
        success: false,
        error: {
          code: 'FILE_VALIDATION_ERROR',
          message: `File type not supported. Allowed formats: ${IMAGE_UPLOAD_CONFIG.ALLOWED_EXTENSIONS.join(', ')}`,
        },
      }
    }

    // Validate MIME type
    const validMimeTypes: string[] = Object.values(IMAGE_MIME_TYPES)
    if (!validMimeTypes.includes(imageFile.type)) {
      return {
        success: false,
        error: {
          code: 'FILE_VALIDATION_ERROR',
          message: `Invalid MIME type. Allowed types: ${validMimeTypes.join(', ')}`,
        },
      }
    }

    // Create client storage client
    const supabase = createClientStorageClient()

    // Generate unique storage path
    const storagePath = generateStoragePath(userId, imageFile.name)

    // Upload file to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(IMAGE_UPLOAD_CONFIG.BUCKET_NAME)
      .upload(storagePath, imageFile, {
        contentType: imageFile.type,
        cacheControl: '3600', // Cache for 1 hour
        upsert: false, // Don't overwrite existing files
      })

    if (uploadError) {
      return {
        success: false,
        error: {
          code: 'STORAGE_UPLOAD_ERROR',
          message: `Failed to upload file: ${uploadError.message}`,
        },
      }
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from(IMAGE_UPLOAD_CONFIG.BUCKET_NAME)
      .getPublicUrl(storagePath)

    if (!urlData.publicUrl) {
      return {
        success: false,
        error: {
          code: 'URL_GENERATION_ERROR',
          message: 'Failed to generate public URL for uploaded file',
        },
      }
    }

    return {
      success: true,
      data: {
        storagePath: uploadData.path,
        storageUrl: urlData.publicUrl,
        fileName: imageFile.name,
        fileSize: imageFile.size,
        mimeType: imageFile.type,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
      },
    }
  }
}

/**
 * Deletes an image file from temporary uploads bucket
 *
 * @param storagePath - Path to the image in storage
 * @returns Promise<boolean> - True if successful, false otherwise
 */
export async function deleteImageFromStorage(
  storagePath: string
): Promise<boolean> {
  try {
    const supabase = createClientStorageClient()

    const { error } = await supabase.storage
      .from(IMAGE_UPLOAD_CONFIG.BUCKET_NAME)
      .remove([storagePath])

    return !error
  } catch {
    return false
  }
}
