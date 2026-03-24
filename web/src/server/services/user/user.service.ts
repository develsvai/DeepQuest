/**
 * User 서비스
 * Clerk webhook 이벤트 처리를 위한 비즈니스 로직
 */

import { prisma } from '@/lib/db/prisma'
import { ValidationError } from '@/server/services/common/errors'
import type {
  UpsertUserFromClerkInput,
  DeleteUserInput,
  ClerkEmailAddress,
} from './types'

/**
 * Primary email 주소 추출
 * @param emailAddresses - Clerk에서 제공하는 이메일 주소 목록
 * @param primaryEmailAddressId - Primary email의 ID
 * @returns Primary email 주소
 * @throws ValidationError - primary email이 없는 경우
 */
function extractPrimaryEmail(
  emailAddresses: ClerkEmailAddress[],
  primaryEmailAddressId: string | null
): string {
  const primaryEmail = emailAddresses.find(
    email => email.id === primaryEmailAddressId
  )

  if (!primaryEmail) {
    throw new ValidationError('No primary email found for user')
  }

  return primaryEmail.email_address
}

/**
 * Clerk webhook에서 사용자 생성
 * @param input - Clerk user.created 이벤트 데이터
 * @throws ValidationError - primary email이 없는 경우
 */
async function createFromClerk(input: UpsertUserFromClerkInput): Promise<void> {
  const email = extractPrimaryEmail(
    input.emailAddresses,
    input.primaryEmailAddressId
  )

  await prisma.user.create({
    data: {
      id: input.id,
      email,
      firstName: input.firstName,
      lastName: input.lastName,
      profileImageUrl: input.imageUrl,
    },
  })
}

/**
 * Clerk webhook에서 사용자 업데이트
 * Primary email이 없으면 업데이트를 건너뜁니다 (silent skip)
 * @param input - Clerk user.updated 이벤트 데이터
 */
async function updateFromClerk(input: UpsertUserFromClerkInput): Promise<void> {
  const primaryEmail = input.emailAddresses.find(
    email => email.id === input.primaryEmailAddressId
  )

  // Primary email이 없으면 업데이트하지 않음 (기존 동작 유지)
  if (!primaryEmail) {
    return
  }

  await prisma.user.update({
    where: { id: input.id },
    data: {
      email: primaryEmail.email_address,
      firstName: input.firstName,
      lastName: input.lastName,
      profileImageUrl: input.imageUrl,
    },
  })
}

/**
 * Clerk webhook에서 사용자 삭제
 * @param input - Clerk user.deleted 이벤트 데이터
 */
async function deleteFromClerk(input: DeleteUserInput): Promise<void> {
  await prisma.user.delete({
    where: { id: input.id },
  })
}

export const userService = {
  createFromClerk,
  updateFromClerk,
  deleteFromClerk,
}
