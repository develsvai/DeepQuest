-- Custom migration: Convert summary from String? to String[]
-- This migration preserves existing data by converting:
-- - NULL values → empty array []
-- - String values → single-element array ["value"]

-- Step 1: Add temporary column with array type
ALTER TABLE "interview_preparations" ADD COLUMN "summary_new" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Step 2: Migrate existing data
UPDATE "interview_preparations"
SET "summary_new" = CASE
    WHEN "summary" IS NOT NULL AND "summary" != '' THEN ARRAY["summary"]
    ELSE ARRAY[]::TEXT[]
END;

-- Step 3: Drop old column
ALTER TABLE "interview_preparations" DROP COLUMN "summary";

-- Step 4: Rename new column to original name
ALTER TABLE "interview_preparations" RENAME COLUMN "summary_new" TO "summary";
