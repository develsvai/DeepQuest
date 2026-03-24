-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "keyAchievementId" INTEGER;

-- CreateIndex
CREATE INDEX "questions_keyAchievementId_idx" ON "questions"("keyAchievementId");

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_keyAchievementId_fkey" FOREIGN KEY ("keyAchievementId") REFERENCES "key_achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
