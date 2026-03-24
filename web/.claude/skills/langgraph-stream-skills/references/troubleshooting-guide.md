# LangGraph useStream() Troubleshooting Guide

Comprehensive troubleshooting guide for common issues when integrating LangGraph's `useStream()` hook into React applications.

---

## Messages Not Streaming

**Problem**: Messages appear all at once instead of streaming token by token.

**Root Cause**: The `useStream()` hook relies on `streamMode: "messages-tuple"` to receive individual LLM tokens from LangChain chat models. If streaming isn't working, the server-side configuration or model usage is likely incorrect.

**Solutions**:

1. **Verify messagesKey Configuration**
   - Check that `messagesKey` matches your state structure (default: `"messages"`)
   - Example: If your state uses `{ chat: Message[] }`, set `messagesKey: "chat"`

2. **Understand Internal Streaming Mode**
   - `useStream()` automatically enables `streamMode: "messages-tuple"`
   - This receives token-level streaming from LangChain chat models
   - No manual configuration needed on client side

3. **Server-Side Requirements**
   - Ensure LangChain chat models are used in graph nodes:
     - ✅ `ChatOpenAI`, `ChatAnthropic`, `ChatGoogleGenerativeAI`
     - ❌ Custom text generators without streaming support
   - Verify LangGraph server version supports message streaming (v0.1.0+)
   - Check server logs for streaming mode errors

4. **Test Streaming Directly**

   ```bash
   # Test server streaming capability
   curl -N ${API_URL}/threads/${THREAD_ID}/runs/stream \
     -H "Content-Type: application/json" \
     -d '{"assistant_id": "agent", "input": {"messages": [{"type": "human", "content": "hello"}]}}'
   ```

5. **Common Misconfigurations**
   - Using non-streaming models (e.g., completion APIs instead of chat APIs)
   - Server-side middleware blocking streaming responses
   - CORS configuration interfering with streaming

**Technical Detail**: The hook uses `streamMode: "messages-tuple"` to receive individual LLM tokens from any LangChain chat model invocations inside graph nodes. This happens transparently without manual configuration.

---

## Thread Not Persisting

**Problem**: Thread ID is lost after page refresh or navigation.

**Root Cause**: Thread state isn't properly synchronized between component state and persistent storage (URL, localStorage, etc.).

**Solutions**:

1. **Verify State Wiring**

   ```typescript
   const [threadId, setThreadId] = useState<string | null>(null)

   const thread = useStream({
     threadId, // Pass current state
     onThreadId: setThreadId, // Update state when thread created
   })
   ```

2. **Use URL Query Parameters (Recommended)**

   ```typescript
   import { useSearchParam } from '../assets/useSearchParam-utility'

   const [threadId, setThreadId] = useSearchParam('threadId')

   const thread = useStream({
     threadId,
     onThreadId: setThreadId, // Auto-updates URL
   })

   // URL: /chat?threadId=abc-123
   // Refreshing preserves threadId
   ```

3. **Next.js App Router Version**

   ```typescript
   import { useSearchParams, useRouter } from 'next/navigation'
   import { useSearchParamNextJS } from '../assets/useSearchParam-utility'

   const searchParams = useSearchParams()
   const router = useRouter()
   const [threadId, setThreadId] = useSearchParamNextJS(
     'threadId',
     searchParams,
     router
   )
   ```

4. **localStorage Alternative**

   ```typescript
   const [threadId, setThreadId] = useState<string | null>(() => {
     return localStorage.getItem('currentThreadId')
   })

   const thread = useStream({
     threadId,
     onThreadId: id => {
       setThreadId(id)
       if (id) localStorage.setItem('currentThreadId', id)
     },
   })
   ```

5. **Server-Side Verification**
   - Check server logs to confirm thread creation
   - Verify thread ID format matches server expectations
   - Test thread retrieval: `GET /threads/${threadId}`

**Best Practice**: Always use URL query parameters for thread IDs to enable:

- Shareable conversation links
- Browser back/forward navigation
- Bookmarkable chat sessions

---

## Branching Not Working

**Problem**: Edit/regenerate creates new messages instead of creating branches.

**Root Cause**: Checkpointing is disabled or not properly configured in the LangGraph server.

**Solutions**:

1. **Verify Checkpoints Are Enabled**

   ```python
   # Server-side LangGraph configuration
   from langgraph.checkpoint.memory import MemorySaver
   from langgraph.checkpoint.postgres import PostgresSaver

   # Use a checkpointer
   checkpointer = MemorySaver()  # or PostgresSaver(...)

   graph = StateGraph(...)
   graph.compile(checkpointer=checkpointer)  # Required for branching
   ```

2. **Test Checkpoint Creation**

   ```bash
   # List checkpoints for a thread
   curl ${API_URL}/threads/${THREAD_ID}/checkpoints

   # Should return array of checkpoints
   # If empty, checkpointing isn't working
   ```

3. **Verify Metadata Extraction**

   ```typescript
   const meta = thread.getMessagesMetadata(message)
   console.log('Metadata:', meta)
   console.log('Parent checkpoint:', meta?.firstSeenState?.parent_checkpoint)

   // Should log checkpoint ID
   // If undefined, checkpoints aren't available
   ```

4. **Check Checkpoint Usage**

   ```typescript
   const parentCheckpoint = meta?.firstSeenState?.parent_checkpoint

   if (!parentCheckpoint) {
     console.error('No parent checkpoint available for branching')
     return
   }

   // Edit message - creates new branch
   thread.submit(
     { messages: [editedMessage] },
     { checkpoint: parentCheckpoint }
   )
   ```

5. **Common Issues**
   - Graph compiled without checkpointer
   - Checkpointer storage full or inaccessible
   - Checkpoint cleanup policy too aggressive
   - State serialization errors preventing checkpoint creation

**Debug Checklist**:

- [ ] Checkpointer configured in graph compilation
- [ ] Checkpoints visible via API (`GET /threads/{id}/checkpoints`)
- [ ] `getMessagesMetadata()` returns checkpoint data
- [ ] `parentCheckpoint` is non-null before branching
- [ ] Server logs show checkpoint creation events

---

## Stream Not Resuming After Refresh

**Problem**: Ongoing streams stop and don't resume after page refresh.

**Root Cause**: Stream resumption requires persisting run metadata and explicitly rejoining the stream on mount.

**Solutions**:

1. **Enable Automatic Resumption (Simplest)**

   ```typescript
   const thread = useStream({
     apiUrl: 'http://localhost:2024',
     assistantId: 'agent',
     reconnectOnMount: true, // Automatic stream resumption
   })

   // Stores run ID in sessionStorage by default
   // Key: `lg:stream:${threadId}`
   ```

2. **Custom Storage Location**

   ```typescript
   const thread = useStream({
     apiUrl: 'http://localhost:2024',
     assistantId: 'agent',
     reconnectOnMount: () => window.localStorage, // Use localStorage instead
   })
   ```

3. **Manual Resumption Pattern**

   ```typescript
   import { useEffect, useRef } from 'react'

   const thread = useStream({
     apiUrl: 'http://localhost:2024',
     assistantId: 'agent',

     // Persist run ID when created
     onCreated: run => {
       sessionStorage.setItem(`resume:${run.thread_id}`, run.run_id)
     },

     // Clean up when finished
     onFinish: (_, run) => {
       sessionStorage.removeItem(`resume:${run?.thread_id}`)
     },
   })

   // Rejoin stream on mount
   const joinedThreadId = useRef<string | null>(null)
   useEffect(() => {
     if (!threadId) return

     const resumeId = sessionStorage.getItem(`resume:${threadId}`)
     if (resumeId && joinedThreadId.current !== threadId) {
       thread.joinStream(resumeId)
       joinedThreadId.current = threadId
     }
   }, [threadId])
   ```

4. **Enable Resumable Streams**

   ```typescript
   // When submitting, enable stream resumability
   thread.submit(
     { messages: [newMessage] },
     { streamResumable: true } // Required for resumption
   )
   ```

5. **Verify Storage Accessibility**

   ```typescript
   // Check if storage is available
   try {
     sessionStorage.setItem('test', 'test')
     sessionStorage.removeItem('test')
     console.log('Storage available')
   } catch (e) {
     console.error('Storage blocked:', e)
     // Fallback: use in-memory storage or disable resumption
   }
   ```

6. **Debug Storage Keys**
   ```typescript
   // Inspect stored run IDs
   console.log('Storage keys:', Object.keys(sessionStorage))
   console.log(
     'Thread run ID:',
     sessionStorage.getItem(`lg:stream:${threadId}`)
   )
   ```

**Common Issues**:

- Browser privacy settings blocking storage
- Incognito/private mode (sessionStorage clears on close)
- Storage quota exceeded
- Incorrect storage key format
- `streamResumable: true` not passed on submit
- Run ID expired or invalidated on server

**Storage Key Format**:

- Default: `lg:stream:${threadId}`
- Custom: Depends on `reconnectOnMount` implementation

---

## TypeScript Type Errors

**Problem**: Type errors when using `useStream` with custom state or type parameters.

**Solutions**:

1. **Define Explicit State Interface**

   ```typescript
   import type { Message } from '@langchain/langgraph-sdk'

   interface State {
     messages: Message[]
     context?: Record<string, unknown>
     metadata?: {
       sessionId: string
       userId: string
     }
   }

   const thread = useStream<State>({
     apiUrl: 'http://localhost:2024',
     assistantId: 'agent',
     messagesKey: 'messages',
   })

   // thread.messages is now properly typed
   ```

2. **Use Generic Type Parameters**

   ```typescript
   interface InterruptValue {
     type: 'confirmation' | 'input_required'
     message: string
   }

   const thread = useStream<State, { InterruptType: InterruptValue }>({
     apiUrl: 'http://localhost:2024',
     assistantId: 'agent',
   })

   // thread.interrupt.value is now typed as InterruptValue
   ```

3. **Import Types Only from LangGraph.js**

   ```typescript
   // ✅ Correct: Import types only
   import type { StateType, UpdateType } from '@langchain/langgraph/web'

   // ❌ Wrong: Imports entire runtime
   import { StateType, UpdateType } from '@langchain/langgraph/web'
   ```

4. **Use Type Reference File**

   ```typescript
   // Import from assets/typescript-types-reference.ts
   import type {
     StateWithContext,
     StructuredInterrupt,
     FullThreadConfig
   } from './assets/typescript-types-reference';

   const thread = useStream<
     StateWithContext,
     { InterruptType: StructuredInterrupt }
   >({ ... });
   ```

5. **LangGraph.js Annotation Integration**

   ```typescript
   // Only import types, not runtime
   import type { StateType, UpdateType } from "@langchain/langgraph/web";

   // Define annotation (this would be in your graph definition)
   // import { Annotation, MessagesAnnotation } from "@langchain/langgraph/web";
   // const AgentState = Annotation.Root({
   //   ...MessagesAnnotation.spec,
   //   context: Annotation<string>(),
   // });

   // Use annotation types in frontend
   type AgentStateType = StateType<typeof AgentState.spec>;
   type AgentUpdateType = UpdateType<typeof AgentState.spec>;

   const thread = useStream<
     AgentStateType,
     { UpdateType: AgentUpdateType }
   >({ ... });
   ```

**Common Type Issues**:

- Using `any` instead of explicit types
- Importing runtime code into frontend bundle
- Mismatched state interfaces between client and server
- Missing generic parameters for interrupts/events
- Incorrect `messagesKey` type (must match state structure)

**Best Practices**:

- Always define explicit state interfaces
- Use `assets/typescript-types-reference.ts` as a guide
- Import types only (not runtime) from LangGraph.js
- Enable `strict` mode in `tsconfig.json`

---

## Server Connection Issues

**Problem**: Cannot connect to LangGraph server or receive errors.

**Solutions**:

1. **Verify Server is Running**

   ```bash
   # Check if server is accessible
   curl ${API_URL}/ok

   # Should return: {"status": "ok"}
   ```

2. **Check API URL Configuration**

   ```typescript
   const thread = useStream({
     apiUrl: 'http://localhost:2024', // Verify port and protocol
     assistantId: 'agent',
   })

   // Common mistakes:
   // ❌ https://localhost:2024 (local dev uses http)
   // ❌ http://localhost:8000 (wrong port)
   // ✅ http://localhost:2024 (correct)
   ```

3. **Test Assistant/Agent Exists**

   ```bash
   # List available assistants
   curl ${API_URL}/assistants

   # Check specific assistant
   curl ${API_URL}/assistants/${ASSISTANT_ID}
   ```

4. **Fix CORS Issues**

   Server-side LangGraph configuration:

   ```python
   # Add CORS headers to LangGraph server
   from fastapi.middleware.cors import CORSMiddleware

   app.add_middleware(
     CORSMiddleware,
     allow_origins=["http://localhost:3000"],  # Your frontend URL
     allow_credentials=True,
     allow_methods=["*"],
     allow_headers=["*"],
   )
   ```

5. **Check Network Tab in DevTools**
   - Open browser DevTools → Network tab
   - Look for failed requests to LangGraph server
   - Inspect response status codes and error messages
   - Check request/response headers for CORS issues

6. **Authentication Issues**

   ```typescript
   // If server requires authentication
   const client = new Client({
     apiUrl: 'http://localhost:2024',
     defaultHeaders: {
       Authorization: `Bearer ${API_KEY}`,
       'X-API-Key': API_KEY,
     },
   })

   const thread = useStream({
     apiUrl: 'http://localhost:2024',
     assistantId: 'agent',
     // Pass authenticated client if needed
   })
   ```

**Common Connection Errors**:

- `ERR_CONNECTION_REFUSED`: Server not running
- `CORS error`: Missing CORS headers on server
- `404 Not Found`: Wrong API URL or assistant ID
- `401 Unauthorized`: Missing or invalid authentication
- `500 Internal Server Error`: Server-side error (check server logs)

**Debug Checklist**:

- [ ] Server is running and accessible
- [ ] API URL is correct (protocol, host, port)
- [ ] Assistant ID exists in server
- [ ] CORS headers configured on server
- [ ] Authentication credentials valid (if required)
- [ ] Network requests visible in DevTools

---

## Performance Issues

**Problem**: Chat interface feels slow, laggy, or unresponsive.

**Root Causes**:

- Unnecessary re-renders during streaming
- Missing optimistic updates
- Inefficient message list rendering
- Large message history without virtualization

**Solutions**:

1. **Enable Optimistic Updates**

   ```typescript
   const handleSubmit = (message: string) => {
     const newMessage = { type: 'human' as const, content: message }

     // Show message immediately before server response
     thread.submit(
       { messages: [newMessage] },
       {
         optimisticValues(prev) {
           return {
             ...prev,
             messages: [...(prev.messages ?? []), newMessage],
           }
         },
       }
     )
   }
   ```

2. **Use Cached Thread Display**

   ```typescript
   // Show cached data while loading
   const thread = useStream({
     apiUrl: 'http://localhost:2024',
     assistantId: 'agent',
     threadId,
     initialValues: cachedThreadData?.values, // Instant display
   })
   ```

3. **Implement Proper React Keys**

   ```typescript
   // ✅ Good: Stable message ID
   {thread.messages.map((message) => (
     <div key={message.id}>...</div>
   ))}

   // ❌ Bad: Array index (causes re-renders)
   {thread.messages.map((message, index) => (
     <div key={index}>...</div>
   ))}
   ```

4. **Avoid Expensive Renders During Streaming**

   ```typescript
   // Memoize components that don't need to re-render
   const MessageItem = React.memo(({ message }: { message: Message }) => (
     <div>{message.content as string}</div>
   ));

   // Use in message list
   {thread.messages.map((message) => (
     <MessageItem key={message.id} message={message} />
   ))}
   ```

5. **Virtualize Long Message Lists**

   ```typescript
   import { useVirtualizer } from '@tanstack/react-virtual';

   const parentRef = useRef<HTMLDivElement>(null);

   const virtualizer = useVirtualizer({
     count: thread.messages.length,
     getScrollElement: () => parentRef.current,
     estimateSize: () => 100, // Estimated message height
   });

   return (
     <div ref={parentRef} style={{ height: '500px', overflow: 'auto' }}>
       <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
         {virtualizer.getVirtualItems().map((virtualRow) => {
           const message = thread.messages[virtualRow.index];
           return (
             <div
               key={message.id}
               style={{
                 position: 'absolute',
                 top: 0,
                 left: 0,
                 width: '100%',
                 transform: `translateY(${virtualRow.start}px)`,
               }}
             >
               <MessageItem message={message} />
             </div>
           );
         })}
       </div>
     </div>
   );
   ```

6. **Profile with React DevTools**
   - Open React DevTools → Profiler
   - Record a streaming session
   - Identify components with excessive renders
   - Add `React.memo()` to expensive components

7. **Optimize State Updates**

   ```typescript
   // ❌ Bad: Multiple state updates per message chunk
   useEffect(() => {
     // Triggers re-render for every chunk
   }, [thread.messages])

   // ✅ Good: Debounce or batch updates
   const debouncedMessages = useDebouncedValue(thread.messages, 100)
   ```

**Performance Checklist**:

- [ ] Optimistic updates enabled
- [ ] `initialValues` used for cached threads
- [ ] Stable `key` props (use `message.id`)
- [ ] Expensive components memoized
- [ ] Long lists virtualized (>50 messages)
- [ ] React DevTools Profiler shows minimal re-renders

**Benchmarking**:

- Measure time to first message: <200ms (with optimistic updates)
- Streaming latency: <50ms per token
- Message list re-render: <16ms (60 FPS)
- Large thread load (100+ messages): <1s

---

## Additional Debugging Tips

### Enable Debug Logging

```typescript
const thread = useStream({
  apiUrl: 'http://localhost:2024',
  assistantId: 'agent',

  // Log all events
  onUpdateEvent: event => console.log('Update event:', event),
  onCustomEvent: event => console.log('Custom event:', event),
  onMetadataEvent: metadata => console.log('Metadata:', metadata),
  onError: error => console.error('Stream error:', error),
  onFinish: (values, run) => console.log('Stream finished:', values, run),
})
```

### Inspect Stream State

```typescript
// Check current stream state
console.log('Thread state:', {
  messages: thread.messages,
  isLoading: thread.isLoading,
  error: thread.error,
  interrupt: thread.interrupt,
  values: thread.values,
})
```

### Test Server-Side Directly

```bash
# Create a thread
curl -X POST ${API_URL}/threads \
  -H "Content-Type: application/json"

# Stream a message
curl -N -X POST ${API_URL}/threads/${THREAD_ID}/runs/stream \
  -H "Content-Type: application/json" \
  -d '{"assistant_id": "agent", "input": {"messages": [{"type": "human", "content": "test"}]}}'
```

### Browser Compatibility

Ensure browser supports:

- Server-Sent Events (SSE) for streaming
- `sessionStorage`/`localStorage`
- `window.history.pushState` for URL updates

**Tested Browsers**:

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+

---

## Getting Help

If issues persist after trying these solutions:

1. **Check LangGraph SDK Version**

   ```bash
   npm list @langchain/langgraph-sdk
   ```

   Ensure you're using a recent version (v0.1.0+)

2. **Review Server Logs**
   - Check LangGraph server console output
   - Look for errors during graph execution
   - Verify checkpoint creation logs

3. **Minimal Reproduction**
   - Create a minimal example reproducing the issue
   - Test with basic chat component from `assets/basic-chat-component.tsx`
   - Isolate the problematic feature

4. **Community Resources**
   - LangGraph SDK GitHub Issues: https://github.com/langchain-ai/langgraphjs/issues
   - LangChain Discord: https://discord.gg/langchain
   - Stack Overflow: Tag `langgraph` + `react`

5. **Reference Documentation**
   - Official docs: `references/usestream-integration-guide.md`
   - Code examples: `assets/` directory
   - Type reference: `assets/typescript-types-reference.ts`
