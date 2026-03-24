/*
  Warnings:

  - You are about to drop the column `completedAt` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `isCompleted` on the `questions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "questions" DROP COLUMN "completedAt",
DROP COLUMN "isCompleted";
