-- AlterTable
ALTER TABLE "feedbacks" ADD COLUMN     "ratingRationale" TEXT[] DEFAULT ARRAY[]::TEXT[];
