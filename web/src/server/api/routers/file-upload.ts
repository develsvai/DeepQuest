import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { fileUploadService } from '@/server/services/file-upload'
import { handleServiceError } from '@/server/services/common/trpc-error-handler'
import {
  RESUME_UPLOAD,
  MAX_FILE_NAME_LENGTH,
} from '@/lib/constants/file-upload'

/**
 * Zod schema for creating file upload
 */
const createFileUploadSchema = z.object({
  fileName: z
    .string()
    .min(1, 'File name is required')
    .max(MAX_FILE_NAME_LENGTH, 'File name too long'),
  fileType: z.enum(['PDF', 'DOCX', 'DOC'], {
    message: 'File type must be PDF, DOCX, or DOC',
  }),
  fileSize: z
    .number()
    .int()
    .min(1, 'File size must be greater than 0')
    .max(
      RESUME_UPLOAD.MAX_SIZE_BYTES,
      `File size cannot exceed ${RESUME_UPLOAD.MAX_SIZE_MB}MB`
    ),
  mimeType: z.string().min(1, 'MIME type is required'),
  storageUrl: z.url('Invalid storage URL'),
  storagePath: z.string().min(1, 'Storage path is required'),
  bucketName: z.string().default('resumes'),
  checksum: z.string().optional(),
  scanStatus: z
    .enum(['PENDING', 'SCANNING', 'CLEAN', 'SUSPICIOUS', 'FAILED'])
    .default('PENDING'),
  scanMessage: z.string().optional(),
  interviewPreparationId: z.cuid().optional(),
})

/**
 * File upload router providing file record creation
 *
 * Features:
 * - Authentication required for all operations
 * - Input validation with Zod schemas
 * - File size limits (20MB) and supported formats (PDF, DOCX, DOC)
 * - Scan status tracking for security
 * - Integration with Supabase storage
 */
export const fileUploadRouter = createTRPCRouter({
  /**
   * Create a new file upload record
   *
   * @param fileName - Name of the uploaded file
   * @param fileType - File format (PDF, DOCX, DOC)
   * @param fileSize - Size in bytes (max 20MB)
   * @param mimeType - MIME type of the file
   * @param storageUrl - Supabase storage URL
   * @param storagePath - Storage path in bucket
   * @param bucketName - Storage bucket (defaults to 'resumes')
   * @param checksum - Optional file integrity checksum
   * @param scanStatus - Security scan status (defaults to 'PENDING')
   * @param scanMessage - Optional scan result message
   * @param interviewPreparationId - Optional link to interview preparation
   *
   * @returns Created file upload record
   */
  create: protectedProcedure
    .input(createFileUploadSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await fileUploadService.create({
          userId: ctx.userId,
          fileName: input.fileName,
          fileType: input.fileType,
          fileSize: input.fileSize,
          mimeType: input.mimeType,
          storageUrl: input.storageUrl,
          storagePath: input.storagePath,
          bucketName: input.bucketName,
          checksum: input.checksum,
          scanStatus: input.scanStatus,
          scanMessage: input.scanMessage,
          interviewPreparationId: input.interviewPreparationId,
        })
      } catch (error) {
        handleServiceError(error)
      }
    }),
})
