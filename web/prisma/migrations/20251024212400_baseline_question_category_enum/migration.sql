-- Baseline migration: QuestionCategory enum update
--
-- This migration updates QuestionCategory enum from old values to new values.
-- In development, this was already applied via `prisma db push`.
-- This migration makes it idempotent so it can be safely applied in all environments.
--
-- Previous values: TECHNICAL_CONCEPT, IMPLEMENTATION, ARCHITECTURE, EXPERIENCE, BEHAVIORAL, PROBLEM_SOLVING
-- New values: TECHNICAL_DECISION, IMPLEMENTATION, PERFORMANCE, JD_BRIDGE, TECH_COMPARISON

DO $$
BEGIN
  -- Check if the old enum values still exist
  IF EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'QuestionCategory')
    AND enumlabel IN ('TECHNICAL_CONCEPT', 'ARCHITECTURE', 'EXPERIENCE', 'BEHAVIORAL', 'PROBLEM_SOLVING')
  ) THEN
    -- Old enum exists, need to update

    -- Create new enum type
    CREATE TYPE "QuestionCategory_new" AS ENUM ('TECHNICAL_DECISION', 'IMPLEMENTATION', 'PERFORMANCE', 'JD_BRIDGE', 'TECH_COMPARISON');

    -- Update questions table to use new enum
    -- This will fail if there are values that don't exist in the new enum
    ALTER TABLE "questions"
      ALTER COLUMN "category" DROP DEFAULT;

    ALTER TABLE "questions"
      ALTER COLUMN "category" TYPE "QuestionCategory_new"
      USING ("category"::text::"QuestionCategory_new");

    -- Drop old enum
    DROP TYPE "QuestionCategory";

    -- Rename new enum to original name
    ALTER TYPE "QuestionCategory_new" RENAME TO "QuestionCategory";

    RAISE NOTICE 'QuestionCategory enum updated successfully';
  ELSE
    -- New enum already exists, skip
    RAISE NOTICE 'QuestionCategory enum already up to date, skipping migration';
  END IF;
END $$;
