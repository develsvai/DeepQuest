/**
 * File Upload Service
 *
 * Handles file upload record management operations.
 */

import { prisma } from '@/lib/db/prisma'
import type { CreateFileUploadInput, CreateFileUploadResult } from './types'

export const fileUploadService = {
  /**
   * Create a new file upload record
   *
   * @param input - File upload creation input
   * @returns Created file upload record
   */
  async create(input: CreateFileUploadInput): Promise<CreateFileUploadResult> {
    const fileUpload = await prisma.fileUpload.create({
      data: {
        userId: input.userId,
        fileName: input.fileName,
        fileType: input.fileType,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
        storageUrl: input.storageUrl,
        storagePath: input.storagePath,
        bucketName: input.bucketName ?? 'resumes',
        checksum: input.checksum,
        scanStatus: input.scanStatus ?? 'PENDING',
        scanMessage: input.scanMessage,
        interviewPreparationId: input.interviewPreparationId,
      },
    })

    return fileUpload
  },
}
