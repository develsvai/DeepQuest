-- AlterTable
ALTER TABLE "interview_preparations" ADD COLUMN     "title" TEXT;

-- Populate title from jobTitle with fallback to date-based title
UPDATE "interview_preparations"
SET "title" = COALESCE(
  NULLIF(TRIM("jobTitle"), ''),
  'Interview Prep ' || TO_CHAR("created_at", 'YYYY-MM-DD')
);
