/**
 * Clerk Webhook Route Handler
 * 사용자 생성/수정/삭제 이벤트를 처리합니다.
 *
 * @see https://clerk.com/docs/webhooks
 */

import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { NextRequest } from 'next/server'
import { userService } from '@/server/services/user'
import { ValidationError } from '@/server/services/common/errors'
import { captureError, ErrorHandler } from '@/lib/error-tracking'

export async function POST(req: NextRequest) {
  const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET

  if (!secret) {
    captureError(new Error('CLERK_WEBHOOK_SIGNING_SECRET not set'), {
      handler: ErrorHandler.CLERK_WEBHOOK,
      extra: { reason: 'environment-variable-missing' },
    })
    return new Response('Webhook secret not configured', { status: 500 })
  }

  const evt = await verifyWebhook(req, { signingSecret: secret })
  const eventType = evt.type

  try {
    if (eventType === 'user.created') {
      await userService.createFromClerk({
        id: evt.data.id,
        emailAddresses: evt.data.email_addresses,
        primaryEmailAddressId: evt.data.primary_email_address_id,
        firstName: evt.data.first_name,
        lastName: evt.data.last_name,
        imageUrl: evt.data.image_url,
      })
    }

    if (eventType === 'user.updated') {
      await userService.updateFromClerk({
        id: evt.data.id,
        emailAddresses: evt.data.email_addresses,
        primaryEmailAddressId: evt.data.primary_email_address_id,
        firstName: evt.data.first_name,
        lastName: evt.data.last_name,
        imageUrl: evt.data.image_url,
      })
    }

    if (eventType === 'user.deleted' && evt.data.id) {
      await userService.deleteFromClerk({ id: evt.data.id })
    }
  } catch (error) {
    // ValidationError는 클라이언트 오류 (4xx) - Sentry 캡처 불필요
    if (error instanceof ValidationError) {
      console.error(`Clerk webhook validation error: ${error.message}`)
      return new Response(error.message, { status: 400 })
    }

    // 기타 에러는 Sentry/PostHog에 캡처하고 200 반환 (Clerk retry 방지)
    captureError(error, {
      handler: ErrorHandler.CLERK_WEBHOOK,
      userId: evt.data.id,
      extra: {
        eventType,
        clerkUserId: evt.data.id,
      },
    })
    return new Response('Internal server error', { status: 500 })
  }

  return new Response('', { status: 200 })
}
