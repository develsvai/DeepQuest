-- Phase 2: Remove Deprecated Fields Migration
-- Reference: docs/refactoring/deprecated-fields-removal-refactoring.md

-- ============================================================
-- Step 1: Data Migration - EmployeeType EMPLOYEE → FULL_TIME
-- ============================================================
UPDATE "career_experiences"
SET "employeeType" = 'FULL_TIME'
WHERE "employeeType" = 'EMPLOYEE';

-- ============================================================
-- Step 2: Drop Indexes (before dropping columns they reference)
-- ============================================================
-- Question indexes that reference deprecated columns
DROP INDEX IF EXISTS "questions_interviewPreparationId_idx";
DROP INDEX IF EXISTS "questions_experienceType_experienceId_idx";
DROP INDEX IF EXISTS "questions_interviewPreparationId_experienceType_experienceI_idx";

-- Experience importance indexes (added in 20251013082042_add_experience_importance)
DROP INDEX IF EXISTS "career_experiences_resumeId_importance_endDate_idx";
DROP INDEX IF EXISTS "project_experiences_resumeId_importance_endDate_idx";

-- ============================================================
-- Step 3: Drop Foreign Key Constraints
-- ============================================================
-- Question → InterviewPreparation FK
ALTER TABLE "questions" DROP CONSTRAINT IF EXISTS "questions_interviewPreparationId_fkey";

-- ============================================================
-- Step 4: Drop Deprecated Columns from InterviewPreparation
-- ============================================================
ALTER TABLE "interview_preparations" DROP COLUMN IF EXISTS "companyName";
ALTER TABLE "interview_preparations" DROP COLUMN IF EXISTS "jobDescription";
ALTER TABLE "interview_preparations" DROP COLUMN IF EXISTS "threadId";
ALTER TABLE "interview_preparations" DROP COLUMN IF EXISTS "totalQuestions";
ALTER TABLE "interview_preparations" DROP COLUMN IF EXISTS "completedQuestions";

-- ============================================================
-- Step 5: Drop STAR & Importance Columns from CareerExperience
-- ============================================================
ALTER TABLE "career_experiences" DROP COLUMN IF EXISTS "situation";
ALTER TABLE "career_experiences" DROP COLUMN IF EXISTS "task";
ALTER TABLE "career_experiences" DROP COLUMN IF EXISTS "action";
ALTER TABLE "career_experiences" DROP COLUMN IF EXISTS "result";
ALTER TABLE "career_experiences" DROP COLUMN IF EXISTS "importance";

-- ============================================================
-- Step 6: Drop STAR & Importance Columns from ProjectExperience
-- ============================================================
ALTER TABLE "project_experiences" DROP COLUMN IF EXISTS "situation";
ALTER TABLE "project_experiences" DROP COLUMN IF EXISTS "task";
ALTER TABLE "project_experiences" DROP COLUMN IF EXISTS "action";
ALTER TABLE "project_experiences" DROP COLUMN IF EXISTS "result";
ALTER TABLE "project_experiences" DROP COLUMN IF EXISTS "importance";

-- ============================================================
-- Step 7: Drop Deprecated Columns from Question
-- ============================================================
ALTER TABLE "questions" DROP COLUMN IF EXISTS "interviewPreparationId";
ALTER TABLE "questions" DROP COLUMN IF EXISTS "experienceType";
ALTER TABLE "questions" DROP COLUMN IF EXISTS "experienceId";
ALTER TABLE "questions" DROP COLUMN IF EXISTS "guideAnswer";

-- ============================================================
-- Step 8: Remove EMPLOYEE from EmployeeType enum
-- ============================================================
-- PostgreSQL requires recreating enum to remove values
-- Since we already migrated data above, we can safely alter

-- Create new enum without EMPLOYEE
CREATE TYPE "EmployeeType_new" AS ENUM ('FULL_TIME', 'PART_TIME', 'INTERN', 'CONTRACT', 'FREELANCE');

-- Alter column to use new enum
ALTER TABLE "career_experiences"
  ALTER COLUMN "employeeType" TYPE "EmployeeType_new"
  USING ("employeeType"::text::"EmployeeType_new");

-- Drop old enum and rename new one
DROP TYPE "EmployeeType";
ALTER TYPE "EmployeeType_new" RENAME TO "EmployeeType";

-- ============================================================
-- Step 9: Drop ImportanceLevel enum (no longer referenced)
-- ============================================================
DROP TYPE IF EXISTS "ImportanceLevel";
