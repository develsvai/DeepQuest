/**
 * InterviewPrepDetailV2 Constants
 *
 * Shared constants for V2 dashboard-style Interview Prep Detail page.
 */

/**
 * Category labels for question categories (Korean)
 *
 * Note: This includes both actual QuestionCategory enum values and
 * mock-only categories for UI prototyping.
 *
 * Actual enum values: TECHNICAL_DECISION, TECHNICAL_DEPTH, PROBLEM_SOLVING, SCALABILITY
 * Mock-only values: LEADERSHIP, COMMUNICATION, CONFLICT_RESOLUTION
 */
export const CATEGORY_LABELS: Record<string, string> = {
  // Actual QuestionCategory enum values
  TECHNICAL_DECISION: '기술적 의사결정',
  TECHNICAL_DEPTH: '기술 깊이 및 원리',
  PROBLEM_SOLVING: '문제 해결 및 검증',
  SCALABILITY: '확장 가능성',
  // Mock-only categories (for UI prototyping)
  LEADERSHIP: '리더십',
  COMMUNICATION: '커뮤니케이션',
  CONFLICT_RESOLUTION: '갈등 해결',
}
