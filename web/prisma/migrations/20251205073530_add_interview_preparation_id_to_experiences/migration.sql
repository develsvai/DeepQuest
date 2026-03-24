-- DropForeignKey
ALTER TABLE "candidate_educations" DROP CONSTRAINT "candidate_educations_resumeId_fkey";

-- DropForeignKey
ALTER TABLE "career_experiences" DROP CONSTRAINT "career_experiences_resumeId_fkey";

-- DropForeignKey
ALTER TABLE "project_experiences" DROP CONSTRAINT "project_experiences_resumeId_fkey";

-- AlterTable: Add new columns (nullable initially for data migration)
ALTER TABLE "candidate_educations" ADD COLUMN     "interviewPreparationId" TEXT,
ALTER COLUMN "resumeId" DROP NOT NULL;

ALTER TABLE "career_experiences" ADD COLUMN     "interviewPreparationId" TEXT,
ALTER COLUMN "resumeId" DROP NOT NULL;

ALTER TABLE "project_experiences" ADD COLUMN     "interviewPreparationId" TEXT,
ALTER COLUMN "resumeId" DROP NOT NULL;

-- Data Migration: Copy interviewPreparationId from Resume to Experience tables
UPDATE "career_experiences" ce
SET "interviewPreparationId" = r."interviewPreparationId"
FROM "resumes" r
WHERE ce."resumeId" = r."id";

UPDATE "project_experiences" pe
SET "interviewPreparationId" = r."interviewPreparationId"
FROM "resumes" r
WHERE pe."resumeId" = r."id";

UPDATE "candidate_educations" edu
SET "interviewPreparationId" = r."interviewPreparationId"
FROM "resumes" r
WHERE edu."resumeId" = r."id";

-- Set NOT NULL constraint after data migration
ALTER TABLE "candidate_educations" ALTER COLUMN "interviewPreparationId" SET NOT NULL;
ALTER TABLE "career_experiences" ALTER COLUMN "interviewPreparationId" SET NOT NULL;
ALTER TABLE "project_experiences" ALTER COLUMN "interviewPreparationId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "candidate_educations_interviewPreparationId_idx" ON "candidate_educations"("interviewPreparationId");

CREATE INDEX "career_experiences_interviewPreparationId_idx" ON "career_experiences"("interviewPreparationId");

CREATE INDEX "project_experiences_interviewPreparationId_idx" ON "project_experiences"("interviewPreparationId");

-- AddForeignKey (resumeId with SET NULL)
ALTER TABLE "candidate_educations" ADD CONSTRAINT "candidate_educations_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "resumes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "career_experiences" ADD CONSTRAINT "career_experiences_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "resumes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "project_experiences" ADD CONSTRAINT "project_experiences_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "resumes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey (interviewPreparationId with CASCADE)
ALTER TABLE "candidate_educations" ADD CONSTRAINT "candidate_educations_interviewPreparationId_fkey" FOREIGN KEY ("interviewPreparationId") REFERENCES "interview_preparations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "career_experiences" ADD CONSTRAINT "career_experiences_interviewPreparationId_fkey" FOREIGN KEY ("interviewPreparationId") REFERENCES "interview_preparations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "project_experiences" ADD CONSTRAINT "project_experiences_interviewPreparationId_fkey" FOREIGN KEY ("interviewPreparationId") REFERENCES "interview_preparations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
