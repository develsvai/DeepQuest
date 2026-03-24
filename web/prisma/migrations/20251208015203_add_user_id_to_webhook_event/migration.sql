-- AlterTable
ALTER TABLE "key_achievements" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "webhook_events" ADD COLUMN     "user_id" TEXT;

-- CreateIndex
CREATE INDEX "webhook_events_user_id_graphName_idx" ON "webhook_events"("user_id", "graphName");
