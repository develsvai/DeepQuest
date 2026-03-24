/**
 * Interview Workflow Types
 *
 * Type definitions for interview preparation workflow states and progress tracking
 */

/**
 * Status of individual workflow steps
 */
export type WorkflowStepStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'

/**
 * Overall workflow status
 */
export type WorkflowStatus = 'pending' | 'processing' | 'completed' | 'failed'

/**
 * Individual workflow step progress data
 */
export interface WorkflowStepProgress {
  status: WorkflowStepStatus
  progress: number // 0-100
  startedAt?: Date
  completedAt?: Date
  error?: string
}

/**
 * Progress data for a complete interview preparation workflow
 */
export interface WorkflowProgress {
  /** Unique identifier for the preparation */
  preparationId: string
  /** Overall workflow status */
  status: WorkflowStatus
  /** Overall progress percentage (0-100) */
  overallProgress: number
  /** Estimated remaining time in milliseconds */
  estimatedRemainingTime: number | null
  /** When the workflow was started */
  startedAt: Date
  /** When the workflow was completed (if status is completed) */
  completedAt?: Date
  /** Individual workflow steps */
  // NOTE: v2.0.0 이후 resumeParsing만 사용. jdStructuring, questionGeneration은 deprecated.
  workflows: {
    /**
     * @deprecated v2.0.0 이후 사용되지 않음. resumeParsing만 사용.
     * 향후 버전에서 제거 예정.
     */
    jdStructuring?: WorkflowStepProgress
    /** Resume parsing workflow - 현재 유일하게 사용되는 워크플로우 */
    resumeParsing: WorkflowStepProgress
    /**
     * @deprecated v2.0.0 이후 사용되지 않음. resumeParsing만 사용.
     * 향후 버전에서 제거 예정.
     */
    questionGeneration?: WorkflowStepProgress
  }
}

/**
 * Storage structure for localStorage persistence
 */
export interface WorkflowStorageData {
  activeWorkflows: Record<string, WorkflowProgress>
  isPolling: boolean
  lastUpdated: string
}
