-- 1. Add new array columns
ALTER TABLE "key_achievements" ADD COLUMN "problems" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "key_achievements" ADD COLUMN "actions" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "key_achievements" ADD COLUMN "results" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "key_achievements" ADD COLUMN "reflections" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- 2. Migrate existing data to arrays (convert single string to single-element array)
UPDATE "key_achievements" SET "problems" = ARRAY["problem"] WHERE "problem" IS NOT NULL;
UPDATE "key_achievements" SET "actions" = ARRAY["action"] WHERE "action" IS NOT NULL;
UPDATE "key_achievements" SET "results" = ARRAY["result"] WHERE "result" IS NOT NULL;
UPDATE "key_achievements" SET "reflections" = ARRAY["reflection"] WHERE "reflection" IS NOT NULL;

-- 3. Drop legacy columns
ALTER TABLE "key_achievements" DROP COLUMN "problem";
ALTER TABLE "key_achievements" DROP COLUMN "action";
ALTER TABLE "key_achievements" DROP COLUMN "result";
ALTER TABLE "key_achievements" DROP COLUMN "reflection";
