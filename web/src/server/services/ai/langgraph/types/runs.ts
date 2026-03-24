import { GraphNameType } from './graphs'
import { RunsInvokePayload } from '@langchain/langgraph-sdk'

/* LangGraph Run Payload */
export type GraphRunPayload<T> = Omit<RunsInvokePayload, 'input'> & {
  input: T | Record<string, unknown> | null | undefined
}

export type RunStatus =
  | 'pending'
  | 'running'
  | 'error'
  | 'success'
  | 'timeout'
  | 'interrupted'

// TODO: Open Source 기여해보기. 현재 타입 정의가 완벽하지 않음.
export interface RunMetadata extends Record<string, unknown> {
  created_by: 'system' | 'user'
  graph_id: GraphNameType
  assistant_id: string
}

export interface RunBase<M> {
  run_id: string
  thread_id: string
  assistant_id: string
  metadata: RunMetadata & M
  status: RunStatus
  created_at: string
  updated_at: string
  run_started_at: string
  run_ended_at: string
  webhook_sent_at?: string
  multitask_strategy?: string
}

export interface RunInput<T> {
  input: Partial<T> // langgraph api call에 사용된 state input
  command?: unknown
  config?: Record<string, unknown>
  stream_mode?: string[]
  interrupt_before?: unknown
  interrupt_after?: unknown
  webhook?: string
  feedback_keys?: unknown
  temporary?: boolean
  subgraphs?: boolean
  resumable?: boolean
  checkpoint_during?: boolean
}

export interface RunOutput<T> {
  values: T // Final Graph State
}

export type WebhookGraphReturn<T, M> = RunBase<M> & {
  kwargs: RunInput<T>
} & RunOutput<T>
