import { createTRPCRouter } from '@/server/api/trpc'
import { interviewPreparationRouter } from '@/server/api/routers/interview-preparation'
import { fileUploadRouter } from '@/server/api/routers/file-upload'
import { keyAchievementRouter } from '@/server/api/routers/key-achievement'
import { questionRouter } from '@/server/api/routers/question'
import { answerRouter } from '@/server/api/routers/answer'

/**
 * This is the primary router for your server.
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  interviewPreparation: interviewPreparationRouter,
  fileUpload: fileUploadRouter,
  keyAchievement: keyAchievementRouter,
  question: questionRouter,
  answer: answerRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
