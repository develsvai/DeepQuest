/**
 * Common Schemas for AI Contract Types
 *
 * 여러 AI 워크플로우에서 공유하는 공통 스키마 정의
 * Source: ai/src/common/schemas/project.py
 *
 * Used by:
 * - resumeParsingV2.ts: extends these for full experience schemas
 * - questionFeedbackGen.ts: extends these for simplified experience schemas
 */

import { z } from 'zod'
import {
  EmployeeTypeZod,
  ProjectTypeZod,
  QuestionCategoryZod,
} from '@/lib/db/utils/prisma-to-zod'

// ============= Duration Schema =============

/**
 * Duration 스키마
 *
 * AI Server: ai/src/common/schemas/project.py - Duration
 */
export const DurationSchema = z.object({
  startDate: z.string().nullable(), // YYYY-MM 형식
  endDate: z.string().nullable(), // YYYY-MM 형식, 현재 진행중이면 null
  isCurrent: z.boolean().default(false), // 현재 재직/진행 중 여부
})

export type Duration = z.infer<typeof DurationSchema>

// ============= Architecture Schema =============

/**
 * Architecture 스키마
 *
 * AI Server: ai/src/common/schemas/project.py - Architecture
 */
export const ArchitectureSchema = z.object({
  description: z.string(), // 시스템 아키텍처, 데이터 흐름, 주요 컴포넌트 설명
  mermaid: z.string().nullable(), // Mermaid.js 다이어그램 코드
})

export type Architecture = z.infer<typeof ArchitectureSchema>

// ============= KeyAchievement Schema =============

/**
 * KeyAchievement 스키마 (STAR-L 방법론)
 *
 * AI Server: ai/src/common/schemas/project.py - KeyAchievement
 */
export const KeyAchievementSchema = z.object({
  title: z.string().default(''), // 성과 요약 제목
  problems: z
    .array(z.string())
    .nullable()
    .transform(v => v ?? []), // Situation/Task
  actions: z
    .array(z.string())
    .nullable()
    .transform(v => v ?? []), // Action
  results: z
    .array(z.string())
    .nullable()
    .transform(v => v ?? []), // Result
  reflections: z
    .array(z.string())
    .nullable()
    .transform(v => v ?? []), // Learning
})

export type KeyAchievement = z.infer<typeof KeyAchievementSchema>

// ============= Simplified Experience Schemas for question_feedback_gen =============
// Source: ai/src/graphs/question_feedback_gen/state.py

/**
 * Base Experience Base 스키마 (Simplified)
 *
 * AI Server: ai/src/graphs/question_feedback_gen/state.py - BaseExperience
 * V2와 차이점: duration, links 없음, keyAchievement (단수)
 */
export const BaseExperienceBaseSchema = z.object({
  position: z.array(z.string()).default([]),
  techStack: z.array(z.string()).default([]),
  architecture: ArchitectureSchema.nullable().default(null),
  keyAchievement: KeyAchievementSchema, // 단수
})

export type BaseExperienceBase = z.infer<typeof BaseExperienceBaseSchema>

/**
 * Career Experience Base 스키마 (Simplified)
 *
 * AI Server: ai/src/graphs/question_feedback_gen/state.py - CareerExperienceBase
 * V2와 차이점: employeeType 없음
 */
export const CareerExperienceBaseSchema = BaseExperienceBaseSchema.extend({
  company: z.string(),
  companyDescription: z.string().nullable().default(null),
  jobLevel: z.string().nullable().default(null),
})

export type CareerExperienceBase = z.infer<typeof CareerExperienceBaseSchema>

/**
 * Project Experience Base 스키마 (Simplified)
 *
 * AI Server: ai/src/graphs/question_feedback_gen/state.py - ProjectExperienceBase
 * V2와 차이점: projectType required
 */
export const ProjectExperienceBaseSchema = BaseExperienceBaseSchema.extend({
  projectName: z.string(),
  projectDescription: z.string().nullable().default(null),
  projectType: ProjectTypeZod, // required (V2는 nullable)
  teamComposition: z.string().nullable().default(null),
})

export type ProjectExperienceBase = z.infer<typeof ProjectExperienceBaseSchema>

// ============= V2 Experience Schemas (Full Version) =============
// Source: ai/src/common/schemas/project.py

/**
 * Base Experience 스키마 V2 (Full Version)
 *
 * AI Server: ai/src/common/schemas/project.py - BaseExperience
 * Career/Project Experience의 공통 필드
 */
export const BaseExperienceV2Schema = z.object({
  duration: DurationSchema.nullable(), // 기간 (Duration 객체)
  position: z.array(z.string()).default([]), // 역할/직무 목록
  techStack: z.array(z.string()).default([]), // 사용 기술 스택
  links: z.array(z.string()).default([]), // 관련 URL (GitHub, 포트폴리오 등)
  architecture: ArchitectureSchema.nullable(), // 아키텍처 정보
  keyAchievements: z.array(KeyAchievementSchema).default([]), // 핵심 성과 (STAR-L)
})

export type BaseExperienceV2 = z.infer<typeof BaseExperienceV2Schema>

/**
 * Career Experience 스키마 V2 (Full Version)
 *
 * AI Server: ai/src/common/schemas/project.py - CareerExperience
 * 회사 경력 정보
 */
export const CareerExperienceV2Schema = BaseExperienceV2Schema.extend({
  company: z.string(), // 회사명
  companyDescription: z.string().nullable(), // 회사 설명 (도메인, 산업, 주요 제품)
  employeeType: EmployeeTypeZod.nullable(), // 고용 형태 (AI: nullable)
  jobLevel: z.string().nullable(), // 직급 (Senior, Junior, Staff 등)
})

export type CareerExperienceV2 = z.infer<typeof CareerExperienceV2Schema>

/**
 * Project Experience 스키마 V2 (Full Version)
 *
 * AI Server: ai/src/common/schemas/project.py - ProjectExperience
 * 개인/팀/학술 프로젝트 정보
 */
export const ProjectExperienceV2Schema = BaseExperienceV2Schema.extend({
  projectName: z.string(), // 프로젝트명
  projectDescription: z.string().nullable(), // 프로젝트 목적/범위 설명 (AI: nullable)
  projectType: ProjectTypeZod.nullable(), // 프로젝트 유형 (AI: nullable)
  teamComposition: z.string().nullable(), // 팀 구성 설명 (예: "BE 2명, FE 2명")
})

export type ProjectExperienceV2 = z.infer<typeof ProjectExperienceV2Schema>

// ============= Question Schema =============
export const QuestionSchema = z.object({
  content: z.string(), // 질문 내용
  category: QuestionCategoryZod.nullish(), // 질문 카테고리 (null, undefined 모두 허용)
})
