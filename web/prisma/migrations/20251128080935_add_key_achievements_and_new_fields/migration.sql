-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EmployeeType" ADD VALUE 'FULL_TIME';
ALTER TYPE "EmployeeType" ADD VALUE 'PART_TIME';

-- AlterTable
ALTER TABLE "career_experiences" ADD COLUMN     "architectureMermaid" TEXT,
ADD COLUMN     "isCurrent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "links" TEXT[];

-- AlterTable
ALTER TABLE "project_experiences" ADD COLUMN     "architectureMermaid" TEXT,
ADD COLUMN     "isCurrent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "links" TEXT[],
ADD COLUMN     "projectDescription" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "teamComposition" TEXT;

-- CreateTable
CREATE TABLE "key_achievements" (
    "id" SERIAL NOT NULL,
    "careerExperienceId" INTEGER,
    "projectExperienceId" INTEGER,
    "title" TEXT NOT NULL,
    "problem" TEXT,
    "action" TEXT,
    "result" TEXT,
    "reflection" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "key_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "key_achievements_careerExperienceId_idx" ON "key_achievements"("careerExperienceId");

-- CreateIndex
CREATE INDEX "key_achievements_projectExperienceId_idx" ON "key_achievements"("projectExperienceId");

-- AddForeignKey
ALTER TABLE "key_achievements" ADD CONSTRAINT "key_achievements_careerExperienceId_fkey" FOREIGN KEY ("careerExperienceId") REFERENCES "career_experiences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "key_achievements" ADD CONSTRAINT "key_achievements_projectExperienceId_fkey" FOREIGN KEY ("projectExperienceId") REFERENCES "project_experiences"("id") ON DELETE CASCADE ON UPDATE CASCADE;
