/*
  Warnings:

  - Made the column `title` on table `interview_preparations` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "interview_preparations" ALTER COLUMN "title" SET NOT NULL;
