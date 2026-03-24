/**
 * TypeScript Types Reference for LangGraph useStream Hook
 *
 * This file contains common type definitions and patterns for using
 * the useStream hook with full type safety.
 */

import type { Message } from '@langchain/langgraph-sdk'

// ============================================================================
// Basic State Types
// ============================================================================

/**
 * Basic state with messages only
 */
export interface BasicState {
  messages: Message[]
}

/**
 * State with additional context
 */
export interface StateWithContext {
  messages: Message[]
  context?: Record<string, unknown>
}

/**
 * State with custom fields
 */
export interface CustomState {
  messages: Message[]
  userPreferences?: {
    language: string
    theme: string
  }
  metadata?: {
    sessionId: string
    createdAt: string
  }
}

// ============================================================================
// Interrupt Types
// ============================================================================

/**
 * Simple string interrupt
 */
export type StringInterrupt = string

/**
 * Structured interrupt with type and data
 */
export interface StructuredInterrupt {
  type: 'confirmation' | 'input_required' | 'error'
  message: string
  data?: unknown
}

/**
 * Confirmation interrupt
 */
export interface ConfirmationInterrupt {
  type: 'confirmation'
  action: string
  description: string
  confirmText?: string
  cancelText?: string
}

// ============================================================================
// Custom Event Types
// ============================================================================

/**
 * Progress event
 */
export interface ProgressEvent {
  type: 'progress'
  step: string
  current: number
  total: number
}

/**
 * Debug event
 */
export interface DebugEvent {
  type: 'debug'
  message: string
  data?: unknown
}

/**
 * Custom event union
 */
export type CustomEvent = ProgressEvent | DebugEvent

// ============================================================================
// Configurable Types
// ============================================================================

/**
 * Basic configurable options
 */
export interface BasicConfigurable {
  model?: string
  temperature?: number
}

/**
 * Advanced configurable options
 */
export interface AdvancedConfigurable {
  model: 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3'
  temperature: number
  maxTokens?: number
  systemPrompt?: string
  tools?: string[]
}

// ============================================================================
// Update Types
// ============================================================================

/**
 * Update type that accepts both single message and array
 */
export interface FlexibleUpdate {
  messages: Message[] | Message
  context?: Record<string, unknown>
}

/**
 * Strict update type
 */
export interface StrictUpdate {
  messages: Message[]
  metadata?: {
    source: string
    timestamp: string
  }
}

// ============================================================================
// Complete Type Examples
// ============================================================================

/**
 * Example 1: Basic usage with minimal types
 */
export type BasicThreadConfig = {
  State: BasicState
}

/**
 * Example 2: Full configuration with all type parameters
 */
export type FullThreadConfig = {
  State: StateWithContext
  ConfigurableType: AdvancedConfigurable
  InterruptType: StructuredInterrupt
  CustomEventType: CustomEvent
  UpdateType: FlexibleUpdate
}

/**
 * Example 3: Confirmation-focused configuration
 */
export type ConfirmationThreadConfig = {
  State: BasicState
  InterruptType: ConfirmationInterrupt
  ConfigurableType: BasicConfigurable
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Extract message content type
 */
export type MessageContent<T extends Message = Message> = T['content']

/**
 * Message with required content type
 */
export interface TypedMessage<T = string> extends Omit<Message, 'content'> {
  content: T
}

/**
 * State with typed messages
 */
export interface TypedState<TContent = string> {
  messages: TypedMessage<TContent>[]
}

// ============================================================================
// Helper Types for LangGraph.js Integration
// ============================================================================

/**
 * When using LangGraph.js annotations, you can reuse your graph's annotation
 * types in the frontend for perfect type alignment between client and server.
 *
 * IMPORTANT: Only import TYPES, not the runtime code!
 * Use `import type { ... }` to avoid bundling LangGraph.js runtime in frontend.
 */

/**
 * Example 1: Basic LangGraph.js Annotation Integration
 *
 * Server-side (LangGraph.js graph definition):
 * ```typescript
 * import { Annotation, MessagesAnnotation } from "@langchain/langgraph/web";
 *
 * const AgentState = Annotation.Root({
 *   ...MessagesAnnotation.spec,
 *   context: Annotation<string>(),
 * });
 *
 * const graph = new StateGraph(AgentState)...
 * ```
 *
 * Client-side (React frontend):
 * ```typescript
 * import type { StateType, UpdateType } from "@langchain/langgraph/web";
 * import { useStream } from "@langchain/langgraph-sdk/react";
 *
 * // Import the AgentState definition (type only!)
 * import type { AgentState } from './server/graph';
 *
 * type AgentStateType = StateType<typeof AgentState.spec>;
 * type AgentUpdateType = UpdateType<typeof AgentState.spec>;
 *
 * const thread = useStream<
 *   AgentStateType,
 *   { UpdateType: AgentUpdateType }
 * >({
 *   apiUrl: "http://localhost:2024",
 *   assistantId: "agent",
 *   messagesKey: "messages",
 * });
 * ```
 */

/**
 * Example 2: Full Annotation Pattern with Custom Fields
 *
 * Server-side:
 * ```typescript
 * import { Annotation, MessagesAnnotation } from "@langchain/langgraph/web";
 *
 * const ComplexAgentState = Annotation.Root({
 *   ...MessagesAnnotation.spec,
 *   context: Annotation<Record<string, unknown>>(),
 *   userPreferences: Annotation<{ language: string; theme: string }>(),
 *   sessionMetadata: Annotation<{ sessionId: string; startTime: string }>(),
 * });
 *
 * export type { ComplexAgentState };
 * ```
 *
 * Client-side:
 * ```typescript
 * import type { StateType, UpdateType } from "@langchain/langgraph/web";
 * import type { ComplexAgentState } from './server/graph';
 *
 * type ComplexStateType = StateType<typeof ComplexAgentState.spec>;
 * type ComplexUpdateType = UpdateType<typeof ComplexAgentState.spec>;
 *
 * const thread = useStream<
 *   ComplexStateType,
 *   { UpdateType: ComplexUpdateType }
 * >({
 *   apiUrl: "http://localhost:2024",
 *   assistantId: "agent",
 *   messagesKey: "messages",
 * });
 *
 * // Now thread.values is properly typed with all custom fields
 * const context = thread.values?.context; // Type: Record<string, unknown> | undefined
 * const prefs = thread.values?.userPreferences; // Type: { language: string; theme: string } | undefined
 * ```
 */

/**
 * Example 3: Without LangGraph.js Runtime (Manual Types)
 *
 * If you can't import from LangGraph.js, manually define matching types:
 * ```typescript
 * import type { Message } from "@langchain/langgraph-sdk";
 *
 * // Manually match your server-side state structure
 * interface ManualAgentState {
 *   messages: Message[];
 *   context: Record<string, unknown>;
 *   userPreferences: { language: string; theme: string };
 * }
 *
 * // Manually define update type (partial state)
 * interface ManualAgentUpdate {
 *   messages?: Message[] | Message;
 *   context?: Record<string, unknown>;
 *   userPreferences?: { language: string; theme: string };
 * }
 *
 * const thread = useStream<
 *   ManualAgentState,
 *   { UpdateType: ManualAgentUpdate }
 * >({
 *   apiUrl: "http://localhost:2024",
 *   assistantId: "agent",
 *   messagesKey: "messages",
 * });
 * ```
 */

// ============================================================================
// Annotation Type Utilities
// ============================================================================

/**
 * Helper type to extract state type from annotation
 * (Use when you have the annotation but not StateType utility)
 */
export type ExtractStateType<T> = T extends { spec: infer S } ? S : never

/**
 * Helper type to make annotation state partial for updates
 * (Use when you have the annotation but not UpdateType utility)
 */
export type ExtractUpdateType<T> = Partial<ExtractStateType<T>>
