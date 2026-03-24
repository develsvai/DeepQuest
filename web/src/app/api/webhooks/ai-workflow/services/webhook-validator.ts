import type { NextRequest } from 'next/server'
import { WebhookGraphReturn } from '@/server/services/ai/langgraph/types/runs'
import type {
  ValidationResult,
  ExtractedWebhookContext,
} from '../types/webhook.types'

/**
 * Webhook validation and parsing service
 */
export class WebhookValidator {
  private static readonly WEBHOOK_SECRET =
    process.env.AI_WEBHOOK_SECRET || 'dev-secret-key'

  /**
   * Verify webhook signature using query parameter
   */
  static verifySignature(webhookSecret: string | null): ValidationResult {
    if (!this.WEBHOOK_SECRET) {
      console.warn(
        '[WebhookValidator] WEBHOOK_SECRET not configured, skipping validation'
      )
      return { isValid: true }
    }

    // Check queryString secret value
    if (webhookSecret && webhookSecret === this.WEBHOOK_SECRET) {
      return { isValid: true }
    }

    return {
      isValid: false,
      error: 'Invalid webhook signature',
    }
  }

  /**
   * Extract webhook context from request
   */
  static async extractContext(
    request: NextRequest
  ): Promise<ExtractedWebhookContext> {
    // Parse WebhookGraphReturn body
    const requestJson = await request.json()
    const body = requestJson as WebhookGraphReturn<unknown, unknown>

    // Extract data from WebhookGraphReturn structure
    const runId = body.run_id
    const threadId = body.thread_id
    const status =
      body.status === 'success' ? ('success' as const) : ('error' as const)
    const result = body.values // Final Graph State
    const metadata = body.metadata

    // Get workflow type from query string
    const workflowType = request.nextUrl.searchParams.get('type')

    if (!workflowType) {
      throw new Error('Missing workflow type in query parameters')
    }

    return {
      runId,
      threadId,
      workflowType,
      status,
      result,
      // For error status, we'll get error details from metadata or create a generic error
      ...(status === 'error' && {
        error: {
          message: 'AI workflow execution failed',
          code: 'WORKFLOW_EXECUTION_ERROR',
        },
      }),
      ...(metadata && {
        metadata,
      }),
    }
  }

  /**
   * Validate request in production environment
   */
  static validateRequest(request: NextRequest): ValidationResult {
    if (process.env.NODE_ENV !== 'production') {
      return { isValid: true }
    }

    const webhookSecret = request.nextUrl.searchParams.get('signature')
    const result = this.verifySignature(webhookSecret)
    if (!result.isValid) {
      // Docker/배포 환경에서 웹훅 401 원인 확인용 (시크릿 값은 로그하지 않음)
      // eslint-disable-next-line no-console -- 웹훅 검증 실패 원인 파악용
      console.warn('[webhook] Signature validation failed', {
        hasQuerySignature: Boolean(webhookSecret),
        path: request.nextUrl.pathname,
      })
    }
    return result
  }
}
