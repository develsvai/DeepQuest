/*
  Warnings:

  - Made the column `user_id` on table `webhook_events` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "webhook_events" ALTER COLUMN "user_id" SET NOT NULL;
