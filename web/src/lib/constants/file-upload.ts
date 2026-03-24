/**
 * File Upload Constants
 *
 * Single source of truth for all file upload configuration.
 * Use these constants across the application to ensure consistency.
 */

/**
 * Resume file upload configuration
 */
export const RESUME_UPLOAD = {
  /** Maximum file size in megabytes */
  MAX_SIZE_MB: 20,
  /** Maximum file size in bytes */
  MAX_SIZE_BYTES: 20 * 1024 * 1024,
  /** Allowed file extensions */
  ALLOWED_EXTENSIONS: ['.pdf', '.docx', '.doc'] as const,
  /** Supabase bucket name */
  BUCKET_NAME: 'resumes',
  /** Signed URL expiry time in seconds (1 hour) */
  SIGNED_URL_EXPIRY: 60 * 60,
} as const

/**
 * Image upload configuration (for temporary uploads)
 */
export const IMAGE_UPLOAD = {
  /** Maximum file size in megabytes */
  MAX_SIZE_MB: 10,
  /** Maximum file size in bytes */
  MAX_SIZE_BYTES: 10 * 1024 * 1024,
  /** Allowed file extensions */
  ALLOWED_EXTENSIONS: ['.png', '.jpg', '.jpeg'] as const,
  /** Supabase bucket name */
  BUCKET_NAME: 'temporary-uploads',
} as const

/**
 * Supported MIME types for resume uploads
 */
export const RESUME_MIME_TYPES = {
  PDF: 'application/pdf',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  DOC: 'application/msword',
} as const

/**
 * Supported MIME types for image uploads
 */
export const IMAGE_MIME_TYPES = {
  PNG: 'image/png',
  JPEG: 'image/jpeg',
  JPG: 'image/jpg',
} as const

/**
 * Maximum file name length
 */
export const MAX_FILE_NAME_LENGTH = 255
