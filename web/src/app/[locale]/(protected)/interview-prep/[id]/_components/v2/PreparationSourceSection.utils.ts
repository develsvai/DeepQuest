/**
 * PreparationSourceSection 데이터 변환 유틸리티
 *
 * 서버 응답 타입 (CareerWithDetails, ProjectWithDetails) →
 * UI 타입 (ExperienceData, ProfileData) 변환
 */

import type {
  CareerWithDetails,
  ProjectWithDetails,
} from '@/server/services/experience'
import type { ExperienceData } from './ExperienceCard'

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ResumeOverviewHeader에서 사용하는 프로필 데이터
 */
export interface ProfileData {
  targetPosition: string
  yearsOfExperience: number
  summaryPoints: string[]
}

// ═══════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 날짜를 YYYY.MM 형식으로 포맷팅
 * tRPC/JSON 역직렬화 시 Date가 string으로 올 수 있어 둘 다 처리
 */
function formatDate(date: Date | string | null): string {
  if (!date) return ''

  const dateObj = typeof date === 'string' ? new Date(date) : date
  return `${dateObj.getFullYear()}.${String(dateObj.getMonth() + 1).padStart(2, '0')}`
}

/**
 * 기간 문자열 생성 (예: "2023.01 - 2023.06" 또는 "2024.01 - Present")
 * @param currentLabel - 현재 진행 중일 때 표시할 텍스트 (기본값: '현재')
 */
function formatDuration(
  startDate: Date | string | null,
  endDate: Date | string | null,
  isCurrent: boolean,
  currentLabel: string = '현재'
): string {
  const start = formatDate(startDate)
  const end = isCurrent ? currentLabel : formatDate(endDate)

  if (!start && !end) return ''
  if (!start) return end
  if (!end) return start

  return `${start} - ${end}`
}

// ═══════════════════════════════════════════════════════════════════════════
// Data Mappers
// ═══════════════════════════════════════════════════════════════════════════

/**
 * CareerWithDetails → ExperienceData 변환
 * @param currentLabel - 현재 진행 중일 때 표시할 텍스트 (기본값: '현재')
 */
export function mapCareerToExperience(
  career: CareerWithDetails,
  currentLabel: string = '현재'
): ExperienceData {
  return {
    id: career.id,
    name: career.company,
    position: career.position.join(' · '),
    duration: formatDuration(
      career.startDate,
      career.endDate,
      career.isCurrent,
      currentLabel
    ),
    type: 'career',
    keyAchievements: career.keyAchievements.map(ka => ka.title),
    totalQuestions: career.totalQuestions,
    answeredQuestions: career.completedQuestions,
  }
}

/**
 * ProjectWithDetails → ExperienceData 변환
 * @param currentLabel - 현재 진행 중일 때 표시할 텍스트 (기본값: '현재')
 */
export function mapProjectToExperience(
  project: ProjectWithDetails,
  currentLabel: string = '현재'
): ExperienceData {
  return {
    id: project.id,
    name: project.projectName,
    position: project.position.join(' · '),
    duration: formatDuration(
      project.startDate,
      project.endDate,
      project.isCurrent,
      currentLabel
    ),
    type: 'project',
    keyAchievements: project.keyAchievements.map(ka => ka.title),
    totalQuestions: project.totalQuestions,
    answeredQuestions: project.completedQuestions,
  }
}

/**
 * InterviewPrepDetailResult → ProfileData 변환
 * @param unspecifiedLabel - 미지정 시 표시할 텍스트 (기본값: '미지정')
 */
export function mapToProfileData(
  result: {
    jobTitle: string | null
    yearsOfExperience: number | null
    summary: string[]
  },
  unspecifiedLabel: string = '미지정'
): ProfileData {
  return {
    targetPosition: result.jobTitle ?? unspecifiedLabel,
    yearsOfExperience: result.yearsOfExperience ?? 0,
    summaryPoints: result.summary,
  }
}
