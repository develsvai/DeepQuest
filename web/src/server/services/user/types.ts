/**
 * User 서비스 타입 정의
 * Clerk webhook 연동을 위한 타입들
 */

/** Clerk webhook에서 받는 이메일 주소 형식 */
export interface ClerkEmailAddress {
  id: string
  email_address: string
}

/** User 생성/업데이트 입력 (Clerk webhook 데이터 기반) */
export interface UpsertUserFromClerkInput {
  id: string
  emailAddresses: ClerkEmailAddress[]
  primaryEmailAddressId: string | null
  firstName: string | null
  lastName: string | null
  imageUrl: string | null
}

/** User 삭제 입력 */
export interface DeleteUserInput {
  id: string
}
