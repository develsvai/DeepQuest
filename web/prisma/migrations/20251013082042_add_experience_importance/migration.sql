-- CreateEnum
CREATE TYPE "public"."ImportanceLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- AlterTable
ALTER TABLE "public"."career_experiences" ADD COLUMN     "importance" "public"."ImportanceLevel" NOT NULL DEFAULT 'MEDIUM';

-- AlterTable
ALTER TABLE "public"."project_experiences" ADD COLUMN     "importance" "public"."ImportanceLevel" NOT NULL DEFAULT 'MEDIUM';

-- CreateIndex
CREATE INDEX "career_experiences_resumeId_importance_endDate_idx" ON "public"."career_experiences"("resumeId", "importance", "endDate");

-- CreateIndex
CREATE INDEX "project_experiences_resumeId_importance_endDate_idx" ON "public"."project_experiences"("resumeId", "importance", "endDate");
