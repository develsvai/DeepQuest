-- AlterTable
ALTER TABLE "key_achievements" ADD COLUMN     "user_id" TEXT;

-- CreateIndex
CREATE INDEX "key_achievements_user_id_idx" ON "key_achievements"("user_id");

-- Data Migration: Populate user_id from existing relationships
-- Career path: KeyAchievement -> CareerExperience -> Resume -> InterviewPreparation -> User
UPDATE "key_achievements" ka
SET "user_id" = ip."userId"
FROM "career_experiences" ce
JOIN "resumes" r ON ce."resumeId" = r.id
JOIN "interview_preparations" ip ON r."interviewPreparationId" = ip.id
WHERE ka."careerExperienceId" = ce.id
  AND ka."user_id" IS NULL;

-- Project path: KeyAchievement -> ProjectExperience -> Resume -> InterviewPreparation -> User
UPDATE "key_achievements" ka
SET "user_id" = ip."userId"
FROM "project_experiences" pe
JOIN "resumes" r ON pe."resumeId" = r.id
JOIN "interview_preparations" ip ON r."interviewPreparationId" = ip.id
WHERE ka."projectExperienceId" = pe.id
  AND ka."user_id" IS NULL;
