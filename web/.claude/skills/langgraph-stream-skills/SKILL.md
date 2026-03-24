---
name: langgraph-stream-skills
description: Integrate LangGraph's useStream() hook into React applications with streaming chat interfaces, message handling, thread management, branching, and TypeScript support. Use this skill when implementing LangGraph SDK streaming features in Next.js or React applications.
---

# LangGraph Stream Integration Skill

Integrate LangGraph's `useStream()` React hook into React/Next.js applications to build production-ready AI chat interfaces with streaming, state management, and advanced features.

## When to Use This Skill

Use this skill when:

- Implementing LangGraph SDK streaming in a React or Next.js application
- Building AI chat interfaces that require message streaming
- Setting up thread management for conversational AI applications
- Adding features like message branching, editing, or regeneration
- Implementing interrupt handling for agent confirmations
- Integrating with LangGraph Cloud or self-hosted LangGraph servers

## Prerequisites

Before starting integration:

1. **Install Dependencies**: `@langchain/langgraph-sdk` and `@langchain/core` installed
2. **LangGraph Server**: A running LangGraph server (local or cloud)
3. **Assistant ID**: The assistant/agent ID to connect to
4. **API URL**: The API endpoint URL for the LangGraph server

## Alternative Solutions

For pre-built chat components instead of custom interfaces:

- **CopilotKit** (https://docs.copilotkit.ai/coagents/quickstart/langgraph) - Production-ready chat UI
- **assistant-ui** (https://www.assistant-ui.com/docs/runtimes/langgraph) - Flexible chat components

Use this skill when building fully custom, bespoke chat experiences with complete control over UI and behavior.

## Integration Workflow

### Choose Integration Level

Determine the required feature set:

**Basic Integration** (Simple chat):

- Message streaming
- Thread management (create/resume)
- Loading states with stop button
- Error handling

**Advanced Integration** (Full features):

- All basic features
- Message branching (edit/regenerate)
- Interrupt handling
- Optimistic updates
- Cached thread display
- Stream resumption after page refresh
- Custom event handling

### Component Templates

Start with ready-to-use templates from `assets/`:

#### Basic Chat Component

**File**: `assets/basic-chat-component.tsx`

Copy this template for simple chat interfaces. Includes message streaming, thread management, loading states, and error handling.

Usage: Customize props (`apiUrl`, `assistantId`, `initialThreadId`) and styling to match your design system.

#### Advanced Chat Component

**File**: `assets/advanced-chat-component.tsx`

Copy this template for full-featured chat interfaces. Includes all basic features plus:

- `BranchSwitcher` component for branch navigation
- `EditMessage` component for inline editing
- Interrupt handling with resume UI
- Optimistic updates
- Event handlers (onError, onFinish)

Usage: Customize props and integrate with your caching layer (`cachedThreadData`).

### TypeScript Type Safety

**File**: `assets/typescript-types-reference.ts`

Import type definitions for type-safe development:

- **State Types**: `BasicState`, `StateWithContext`, `CustomState`
- **Interrupt Types**: `StringInterrupt`, `StructuredInterrupt`, `ConfirmationInterrupt`
- **Custom Event Types**: `ProgressEvent`, `DebugEvent`
- **Configurable Types**: `BasicConfigurable`, `AdvancedConfigurable`
- **LangGraph.js Integration**: Annotation type patterns (reuse server-side types)

Example:

```typescript
import type { StateWithContext, StructuredInterrupt } from './assets/typescript-types-reference';

const thread = useStream<StateWithContext, { InterruptType: StructuredInterrupt }>({...});
```

### Thread Persistence

**File**: `assets/useSearchParam-utility.ts`

Use the `useSearchParam` hook to persist thread IDs in URL query parameters:

```typescript
import { useSearchParam } from './assets/useSearchParam-utility'

const [threadId, setThreadId] = useSearchParam('threadId')
const thread = useStream({ threadId, onThreadId: setThreadId })
```

Result: Shareable URLs, bookmarkable conversations, browser navigation support.

For Next.js App Router, use `useSearchParamNextJS` variant (see file for usage).

## Implementation Steps

### 1. Install Dependencies

```bash
npm install @langchain/langgraph-sdk @langchain/core
```

### 2. Define State Types

Create an interface matching your LangGraph server state structure (see `assets/typescript-types-reference.ts` for examples).

### 3. Copy Component Template

Start with `assets/basic-chat-component.tsx` or `assets/advanced-chat-component.tsx`.

### 4. Configure useStream Hook

Set `apiUrl`, `assistantId`, `threadId`, `onThreadId`, and `messagesKey` (default: `"messages"`).

### 5. Customize UI

Replace Tailwind CSS classes with your design system components.

### 6. Add Thread Persistence

Integrate `assets/useSearchParam-utility.ts` to store thread IDs in URL.

### 7. (Advanced) Enable Additional Features

- **Branching**: Use `getMessagesMetadata()` and `checkpoint` parameter (see `assets/advanced-chat-component.tsx`)
- **Interrupts**: Check `thread.interrupt` and render confirmation UI
- **Optimistic Updates**: Pass `optimisticValues` function to `thread.submit()`
- **Stream Resumption**: Set `reconnectOnMount: true` or implement manual resumption
- **Cached Display**: Pass `initialValues` to show cached data while loading

### 8. Handle Events

Implement callbacks: `onError`, `onFinish`, `onCustomEvent`, `onUpdateEvent`, `onMetadataEvent`.

## Key Configuration Options

Essential `useStream()` parameters:

- `apiUrl` - LangGraph server endpoint
- `assistantId` - Agent/assistant identifier
- `threadId` - Current thread ID (null for new threads)
- `onThreadId` - Callback when thread is created
- `messagesKey` - State key for messages (default: `"messages"`)
- `reconnectOnMount` - Auto-resume streams after refresh (default: false)
- `initialValues` - Cached state to display while loading

Advanced branching:

- `experimental_branchTree` - Tree representation for non-message based graphs

## Best Practices

**Type Safety**:

- Always define explicit state interfaces
- Use generic parameters for interrupts and events
- Import types only (not runtime) from LangGraph.js: `import type { ... }`

**Performance**:

- Enable optimistic updates for instant user feedback
- Use `initialValues` for cached thread display
- Implement proper React `key` props (use `message.id`)

**User Experience**:

- Show loading states with stop/cancel buttons
- Display errors with actionable messages
- Store thread IDs in URL for shareable conversations
- Implement message branching for exploratory chats

**Thread Management**:

- Persist thread IDs in URL query parameters (use `assets/useSearchParam-utility.ts`)
- Clean up session storage for old threads
- Implement thread list/history for multi-conversation UIs

## Troubleshooting

For common issues, consult `references/troubleshooting-guide.md`:

**Quick Fixes**:

- **Messages not streaming**: Verify `messagesKey` matches state structure; ensure LangChain chat models used server-side
- **Thread not persisting**: Use `useSearchParam` utility for URL persistence
- **Branching not working**: Enable checkpoints in LangGraph server configuration
- **Stream not resuming**: Set `reconnectOnMount: true` or implement manual resumption
- **Type errors**: Define explicit state interface; see `assets/typescript-types-reference.ts`
- **Server connection issues**: Verify `apiUrl`, check CORS configuration, ensure assistant exists
- **Performance issues**: Enable optimistic updates, use `initialValues`, implement proper React keys

See `references/troubleshooting-guide.md` for detailed solutions, debug techniques, and server-side configuration.

## Additional Resources

**Detailed Documentation**:

- `references/usestream-integration-guide.md` - Complete API documentation, feature examples, advanced use cases
- `references/troubleshooting-guide.md` - Comprehensive troubleshooting guide

**Code Templates**:

- `assets/basic-chat-component.tsx` - Simple chat interface template
- `assets/advanced-chat-component.tsx` - Full-featured chat with branching, interrupts, optimistic updates
- `assets/typescript-types-reference.ts` - Complete type definitions and patterns
- `assets/useSearchParam-utility.ts` - URL persistence utility hook

## Summary

To integrate LangGraph streaming:

1. Install `@langchain/langgraph-sdk` and `@langchain/core`
2. Copy component template from `assets/` (basic or advanced)
3. Define state types (see `assets/typescript-types-reference.ts`)
4. Configure `useStream()` with `apiUrl`, `assistantId`, `threadId`, `onThreadId`
5. Add thread persistence with `assets/useSearchParam-utility.ts`
6. (Optional) Enable advanced features: branching, interrupts, optimistic updates
7. Consult `references/troubleshooting-guide.md` for issues

The templates provide production-ready starting points. Customize styling, add features incrementally, and reference documentation as needed.
