/**
 * File Upload Domain Service Types
 *
 * TypeScript types for file upload operations.
 */

import type { FileUpload } from '@/generated/prisma/client'
import type { FileType, FileScanStatus } from '@/generated/prisma/enums'

/**
 * Input for creating a file upload record
 */
export interface CreateFileUploadInput {
  userId: string
  fileName: string
  fileType: FileType
  fileSize: number
  mimeType: string
  storageUrl: string
  storagePath: string
  bucketName?: string
  checksum?: string
  scanStatus?: FileScanStatus
  scanMessage?: string
  interviewPreparationId?: string
}

/**
 * Result of file upload creation - uses Prisma model directly
 */
export type CreateFileUploadResult = FileUpload
