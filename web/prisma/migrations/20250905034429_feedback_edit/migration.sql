/*
  Warnings:

  - You are about to drop the column `aiModel` on the `feedbacks` table. All the data in the column will be lost.
  - The `technicalAccuracy` column on the `feedbacks` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `communicationClarity` column on the `feedbacks` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `depthOfKnowledge` column on the `feedbacks` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."feedbacks" DROP COLUMN "aiModel",
DROP COLUMN "technicalAccuracy",
ADD COLUMN     "technicalAccuracy" "public"."Rating",
DROP COLUMN "communicationClarity",
ADD COLUMN     "communicationClarity" "public"."Rating",
DROP COLUMN "depthOfKnowledge",
ADD COLUMN     "depthOfKnowledge" "public"."Rating";
