/**
 * JD Structuring Workflow Contract Types
 * Source: docs/epics/workflows/2-workflow-jd-structuring.md
 * Python Source: ai/src/graphs/jd_structuring/state.py
 */

import { z } from 'zod'
import { jobPostingSchema } from '@/lib/schemas/job-posting.schema'

// ============= Input Schema =============
export const JDStructuringInputSchema = jobPostingSchema
  .pick({
    companyName: true,
    jobTitle: true,
    jobDescription: true,
  })
  .extend({
    preparationId: z.string(), // 인터뷰 준비 ID
  })

export type JdStructuringGraphInput = z.infer<typeof JDStructuringInputSchema>

// ============= Output Schema Components =============
export const QualificationsSchema = z.object({
  required: z.array(z.string()), // 필수 자격요건
  preferred: z.array(z.string()).nullable(), // 우대사항
})

export type Qualifications = z.infer<typeof QualificationsSchema>

export const CompanyInfoSchema = z.object({
  cultureAndValues: z.array(z.string()).nullable(), // 회사 문화와 가치관
  teamIntroduction: z.array(z.string()).nullable(), // 팀 소개
  coreServiceProduct: z.array(z.string()).nullable(), // 핵심 서비스/제품
})

export type CompanyInfo = z.infer<typeof CompanyInfoSchema>

export const StructuredJDSchema = z.object({
  techStack: z.array(z.string()).nullable(), // 기술스택 리스트 (키워드만)
  responsibilities: z.array(z.string()), // 주요 업무/책임
  qualifications: QualificationsSchema, // 자격요건
  companyInfo: CompanyInfoSchema.nullable(), // 회사 정보
})

export type StructuredJD = z.infer<typeof StructuredJDSchema>

// ============= Complete State Schema =============
export const JDStructuringStateSchema = JDStructuringInputSchema.extend({
  structuredJD: StructuredJDSchema.nullable(), // 성공시 데이터 (구조화된 JD)
})

export type JdStructuringGraphOutput = z.infer<typeof JDStructuringStateSchema>
