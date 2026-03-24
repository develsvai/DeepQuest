/**
 * Resume Parsing V2 Contract
 *
 * 새로운 InterviewPrep 생성 플로우용 (JD Structuring 스킵)
 * AI Server: ai/src/graphs/resume_parser/state.py, schema.py와 정확히 일치
 *
 * AI Server 스키마 구조:
 * - summary: 핵심 문장 배열 (List[str], 전문성/기술 강점 요약)
 * - work_experiences: 경력 경험 리스트 (snake_case → workExperiences)
 * - project_experiences: 프로젝트 경험 리스트
 * - educations: 학력 정보 리스트 (top-level)
 *
 * V2 변경사항:
 * - Duration 객체 (startDate/endDate → duration.startDate/endDate/isCurrent)
 * - Architecture 객체 (string → { description, mermaid })
 * - KeyAchievement 배열 (STAR 배열 → STAR-L 방법론 기반 객체 배열)
 * - 새 필드: links, teamComposition, projectDescription
 * - EmployeeType: FULL_TIME, PART_TIME 추가
 *
 * @see docs/refactoring/resume-parse-result-schema-refactoring.md
 */

import { z } from 'zod'
import {
  DurationSchema,
  CareerExperienceV2Schema,
  ProjectExperienceV2Schema,
} from './common'

// ============= V2 Input Schema =============
// AI Server InputState와 1:1 매핑
// - resume_file_path → resumeFilePath
// - applied_position → appliedPosition
// - experience_names_to_analyze → experienceNamesToAnalyze
export const ResumeParsingV2InputSchema = z.object({
  resumeFilePath: z.string(), // 이력서 파일 경로 또는 Supabase Storage URL
  appliedPosition: z.string(), // 지원 직무
  experienceNamesToAnalyze: z.array(z.string()).default([]), // 분석할 경험 이름 목록
})

export type ResumeParsingV2Input = z.infer<typeof ResumeParsingV2InputSchema>

// ============= V2 Education Schema =============

/**
 * Education 스키마 V2
 *
 * AI Server: ai/src/graphs/resume_parser/schema.py - Education
 * 학력 정보 (top-level, candidateProfile 외부)
 */
export const EducationV2Schema = z.object({
  institution: z.string(), // 교육 기관명
  major: z.string(), // 전공
  degree: z.string().nullable(), // 학위 (Bachelor, Master 등)
  duration: DurationSchema.nullable(), // 기간 (Duration 객체)
  description: z.string().nullable(), // 추가 정보 (GPA, 논문 등)
})

export type EducationV2 = z.infer<typeof EducationV2Schema>

// ============= V2 Output Schema =============

/**
 * Resume Parse Result V2
 *
 * AI Server 응답 전체 구조 (ai/src/graphs/resume_parser/schema.py와 1:1 매핑)
 * - summary: 핵심 문장 배열 (전문성, 기술 강점 요약)
 * - workExperiences: 경력 경험 리스트 (AI: work_experiences)
 * - projectExperiences: 프로젝트 경험 리스트 (AI: project_experiences)
 * - educations: 학력 정보 리스트 (top-level)
 *
 * Note: candidateProfile은 AI 서버에서 제공하지 않음
 * - name, desiredPosition은 InterviewPreparation/User에서 가져옴
 */
export const ResumeParseResultV2Schema = z.object({
  summary: z.array(z.string()).default([]), // 핵심 문장 배열 (전문성, 기술 강점)
  workExperiences: z.array(CareerExperienceV2Schema).default([]), // 경력 경험 리스트
  projectExperiences: z.array(ProjectExperienceV2Schema).default([]), // 프로젝트 경험 리스트
  educations: z.array(EducationV2Schema).default([]), // 학력 정보 리스트
})

export type ResumeParseResultV2 = z.infer<typeof ResumeParseResultV2Schema>

// ============= V2 Complete State Schema =============

/**
 * Resume Parsing V2 State Schema
 *
 * Input + Output 전체 상태
 */
export const ResumeParsingV2StateSchema = ResumeParsingV2InputSchema.extend({
  resumeParseResult: ResumeParseResultV2Schema.nullable(), // 파싱 결과 (성공시)
})

export type ResumeParsingV2State = z.infer<typeof ResumeParsingV2StateSchema>
