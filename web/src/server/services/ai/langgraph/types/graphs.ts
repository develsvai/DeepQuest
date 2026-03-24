// 그래프 이름 enum
export const GraphName = {
  JD_URL_TO_TEXT: 'jd_to_text',
  JD_STRUCTURING: 'jd_structuring',
  RESUME_PARSER: 'resume_parser',
  QUESTION_GEN: 'question_gen',
  FOLLOW_UP_QUESTION_GEN: 'follow_up_question_gen',
  QUESTION_FEEDBACK_GEN: 'question_feedback_gen',
} as const

export type GraphNameType = (typeof GraphName)[keyof typeof GraphName]

// 유효성 검증 함수
export function isValidGraphName(name: string): name is GraphNameType {
  return Object.values(GraphName).includes(name as GraphNameType)
}
