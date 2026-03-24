import type { NextRequest, NextResponse } from 'next/server'
import { NextResponse as Response } from 'next/server'
import { GraphName } from '@/server/services/ai/langgraph/types/graphs'
import { WebhookValidator } from './webhook-validator'
import type {
  WorkflowHandler,
  WebhookPayload,
  ExtractedWebhookContext,
} from '../types/webhook.types'
import {
  handleResumeParsingV2Result,
  handleQuestionGenerationV2Result,
} from '../handlers'
import { langGraphService } from '@/server/services/ai/langgraph/service'
import { captureError, ErrorHandler } from '@/lib/error-tracking'

/**
 * Main webhook processor that handles routing and processing of AI workflow results
 * Strategy Pattern is used
 */
export class WebhookProcessor {
  private handlers: Map<string, WorkflowHandler>

  constructor() {
    this.handlers = new Map()
    this.registerHandlers()
  }

  /**
   * Register all workflow handlers
   */
  private registerHandlers(): void {
    // V2 핸들러 사용 (V1 대체)
    this.handlers.set(
      GraphName.RESUME_PARSER,
      handleResumeParsingV2Result as WorkflowHandler
    )
    // V2 핸들러 사용 (V1 대체)
    this.handlers.set(
      GraphName.QUESTION_GEN,
      handleQuestionGenerationV2Result as WorkflowHandler
    )
  }

  /**
   * Main entry point for processing webhook requests
   */
  async handle(request: NextRequest): Promise<NextResponse> {
    try {
      // Validate request signature
      const validationResult = WebhookValidator.validateRequest(request)
      if (!validationResult.isValid) {
        captureError(new Error('Webhook signature validation failed'), {
          handler: ErrorHandler.WEBHOOK_PROCESSOR,
          extra: {
            error: validationResult.error,
            reason: 'signature-validation-failed',
          },
        })
        return Response.json(
          { error: validationResult.error || 'Invalid signature' },
          { status: 401 }
        )
      }

      // Extract webhook context
      const context = await WebhookValidator.extractContext(request)

      // 디버깅: Docker/배포 환경에서 웹훅 수신 여부 확인용 (run_id, type만 로그)
      if (process.env.NODE_ENV === 'production') {
        // eslint-disable-next-line no-console -- Docker 로그에서 웹훅 수신 확인용
        console.info('[webhook] Received', {
          type: context.workflowType,
          runId: context.runId?.slice(0, 8),
          status: context.status,
        })
      }

      // Route to appropriate handler
      await this.routeToHandler(context)

      await langGraphService.cleanUpThread(context.threadId)

      return Response.json({ success: true })
    } catch (error) {
      // Handle specific error types (4xx - no Sentry capture needed)
      if (error instanceof SyntaxError) {
        return Response.json({ error: 'Invalid JSON payload' }, { status: 400 })
      }

      if (
        error instanceof Error &&
        error.message.includes('Missing workflow type')
      ) {
        return Response.json(
          { error: 'Missing or invalid workflow type' },
          { status: 400 }
        )
      }

      // Unexpected errors (5xx) - capture to Sentry + PostHog
      captureError(error, {
        handler: ErrorHandler.WEBHOOK_PROCESSOR,
        extra: {
          endpoint: '/api/webhooks/ai-workflow',
        },
      })

      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }

  /**
   * Route webhook context to appropriate handler
   */
  private async routeToHandler(
    context: ExtractedWebhookContext
  ): Promise<void> {
    const handler = this.handlers.get(context.workflowType)

    if (!handler) {
      const error = new Error(`Unknown workflow type: ${context.workflowType}`)
      captureError(error, {
        handler: ErrorHandler.WEBHOOK_PROCESSOR,
        extra: { workflowType: context.workflowType },
      })
      throw error
    }

    // Convert context to WebhookPayload format for handler
    const payload: WebhookPayload = {
      run_id: context.runId,
      thread_id: context.threadId,
      status: context.status,
      workflow_type: context.workflowType,
      result: context.result,
      metadata: context.metadata,
      error: context.error,
      timestamp: new Date().toISOString(),
    }

    // Call the appropriate handler
    await handler(context.runId, payload)
  }

  /**
   * Get health status
   */
  static getHealthStatus() {
    return {
      status: 'healthy',
      endpoint: '/api/webhooks/ai-workflow',
      timestamp: new Date().toISOString(),
      supportedWorkflows: [
        GraphName.JD_STRUCTURING,
        GraphName.RESUME_PARSER,
        GraphName.QUESTION_GEN,
      ],
    }
  }
}
