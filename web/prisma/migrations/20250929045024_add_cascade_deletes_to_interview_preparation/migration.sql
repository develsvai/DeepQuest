-- DropForeignKey
ALTER TABLE "public"."file_uploads" DROP CONSTRAINT "file_uploads_interviewPreparationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."structured_jds" DROP CONSTRAINT "structured_jds_interviewPreparationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."webhook_events" DROP CONSTRAINT "webhook_events_preparationId_fkey";

-- AddForeignKey
ALTER TABLE "public"."file_uploads" ADD CONSTRAINT "file_uploads_interviewPreparationId_fkey" FOREIGN KEY ("interviewPreparationId") REFERENCES "public"."interview_preparations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."structured_jds" ADD CONSTRAINT "structured_jds_interviewPreparationId_fkey" FOREIGN KEY ("interviewPreparationId") REFERENCES "public"."interview_preparations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."webhook_events" ADD CONSTRAINT "webhook_events_preparationId_fkey" FOREIGN KEY ("preparationId") REFERENCES "public"."interview_preparations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
