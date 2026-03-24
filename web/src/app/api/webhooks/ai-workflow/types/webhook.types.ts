/**
 * Webhook related types for AI workflow processing
 */

/**
 * Webhook payload type for AI workflow results
 */
export interface WebhookPayload<T = unknown> {
  run_id: string
  thread_id: string
  status: 'success' | 'error'
  workflow_type: string
  result?: T
  metadata?: Record<string, unknown>
  error?: {
    message: string
    code?: string
  }
  timestamp: string
}

/**
 * Workflow handler function type
 */
export type WorkflowHandler<T = unknown> = (
  runId: string,
  payload: WebhookPayload<T>
) => Promise<void>

/**
 * Webhook validation result
 */
export interface ValidationResult {
  isValid: boolean
  error?: string
}

/**
 * Webhook context with extracted request data
 */
export interface ExtractedWebhookContext<T = unknown> {
  runId: string
  threadId: string
  workflowType: string
  status: 'success' | 'error'
  metadata?: Record<string, unknown>
  result?: T
  error?: {
    message: string
    code?: string
  }
}
