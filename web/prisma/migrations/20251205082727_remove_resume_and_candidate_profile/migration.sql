/*
  Warnings:

  - You are about to drop the column `resumeId` on the `candidate_educations` table. All the data in the column will be lost.
  - You are about to drop the column `resumeId` on the `career_experiences` table. All the data in the column will be lost.
  - You are about to drop the column `resumeId` on the `project_experiences` table. All the data in the column will be lost.
  - You are about to drop the `candidate_profiles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `resumes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "candidate_educations" DROP CONSTRAINT "candidate_educations_resumeId_fkey";

-- DropForeignKey
ALTER TABLE "candidate_profiles" DROP CONSTRAINT "candidate_profiles_resumeId_fkey";

-- DropForeignKey
ALTER TABLE "career_experiences" DROP CONSTRAINT "career_experiences_resumeId_fkey";

-- DropForeignKey
ALTER TABLE "project_experiences" DROP CONSTRAINT "project_experiences_resumeId_fkey";

-- DropForeignKey
ALTER TABLE "resumes" DROP CONSTRAINT "resumes_interviewPreparationId_fkey";

-- DropIndex
DROP INDEX "candidate_educations_resumeId_idx";

-- DropIndex
DROP INDEX "career_experiences_resumeId_idx";

-- DropIndex
DROP INDEX "career_experiences_resumeId_importance_endDate_idx";

-- DropIndex
DROP INDEX "project_experiences_resumeId_idx";

-- DropIndex
DROP INDEX "project_experiences_resumeId_importance_endDate_idx";

-- AlterTable
ALTER TABLE "candidate_educations" DROP COLUMN "resumeId";

-- AlterTable
ALTER TABLE "career_experiences" DROP COLUMN "resumeId";

-- AlterTable
ALTER TABLE "project_experiences" DROP COLUMN "resumeId";

-- DropTable
DROP TABLE "candidate_profiles";

-- DropTable
DROP TABLE "resumes";
