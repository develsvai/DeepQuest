import { z } from 'zod'
import { jobPostingSchema } from '@/lib/schemas/job-posting.schema'

export const JdUrlToTextGraphInputSchema = z.object({
  jobTitle: z.string(),
  companyName: z.string(),
  url: z.string().optional(),
})

export const JdUrlToTextGraphOutputSchema = jobPostingSchema.pick({
  companyName: true,
  jobTitle: true,
  jobDescription: true,
})

export type JdUrlToTextGraphInput = z.infer<typeof JdUrlToTextGraphInputSchema>

export type JdUrlToTextGraphOutput = z.infer<
  typeof JdUrlToTextGraphOutputSchema
>
