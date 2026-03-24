-- AlterTable
ALTER TABLE "career_experiences" ALTER COLUMN "employeeType" DROP NOT NULL;

-- AlterTable
ALTER TABLE "project_experiences" ALTER COLUMN "projectType" DROP NOT NULL,
ALTER COLUMN "projectDescription" DROP NOT NULL,
ALTER COLUMN "projectDescription" DROP DEFAULT;
