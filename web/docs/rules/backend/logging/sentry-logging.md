# Sentry Structured Logging Guide

## Overview

Sentry provides structured logging capabilities that allow you to capture application logs with rich context and metadata. This guide covers how to use Sentry's logger effectively in the Deep Quest application.

## Configuration

Logging is already enabled in the Sentry configuration:

```typescript
// src/instrumentation-client.ts (client-side)
// sentry.server.config.ts (server-side)
// sentry.edge.config.ts (edge runtime)

Sentry.init({
  // ...other config
  enableLogs: true, // ✅ Already configured
})
```

## Basic Usage

### Importing the Logger

```typescript
import * as Sentry from '@sentry/nextjs'
const { logger } = Sentry
```

### Log Levels

Use appropriate log levels based on the severity and purpose of your log:

| Level            | When to Use                             | Example Use Case                         |
| ---------------- | --------------------------------------- | ---------------------------------------- |
| `logger.trace()` | Very detailed debugging information     | Function entry/exit, loop iterations     |
| `logger.debug()` | Debugging information                   | Cache hits/misses, configuration details |
| `logger.info()`  | General informational messages          | User actions, workflow progress          |
| `logger.warn()`  | Warning messages that require attention | Deprecated API usage, recoverable errors |
| `logger.error()` | Error conditions                        | Failed operations, exceptions            |
| `logger.fatal()` | Critical system failures                | Database connection loss, system crashes |

## Common Patterns

### 1. Basic Logging with Context

```typescript
import * as Sentry from '@sentry/nextjs'
const { logger } = Sentry

// Simple info log
logger.info('User logged in', {
  userId: user.id,
  timestamp: new Date().toISOString(),
})

// Error log with details
logger.error('Failed to process payment', {
  orderId: 'order_123',
  amount: 99.99,
  errorCode: 'PAYMENT_DECLINED',
})
```

### 2. Variable Interpolation with `logger.fmt`

Use `logger.fmt` template literals for dynamic string formatting:

```typescript
const { logger } = Sentry

// ✅ Correct: Use logger.fmt for variable interpolation
logger.debug(logger.fmt`Processing preparation ${preparationId}`)
logger.info(logger.fmt`User ${userId} created ${itemCount} items`)

// ❌ Incorrect: Don't use string concatenation
logger.debug(`Processing preparation ${preparationId}`) // Missing logger.fmt
```

### 3. Logging with Structured Data

Include relevant context as an object for better filtering and analysis:

```typescript
const { logger } = Sentry

logger.info('Interview preparation created', {
  preparationId: preparation.id,
  userId: user.id,
  hasJobPosting: true,
  hasResume: true,
  locale: 'ko',
  createdAt: new Date().toISOString(),
})
```

### 4. Error Logging with Stack Traces

For errors, include the error object for automatic stack trace capture:

```typescript
const { logger } = Sentry

try {
  await riskyOperation()
} catch (error) {
  logger.error('Operation failed', {
    operation: 'riskyOperation',
    userId: user.id,
    error: error instanceof Error ? error.message : String(error),
  })

  // For capturing full exception details, use Sentry.captureException
  Sentry.captureException(error)
}
```

## Deep Quest-Specific Examples

### 1. Interview Workflow Logging

```typescript
// server/api/routers/interview-workflow/router.ts
import * as Sentry from '@sentry/nextjs'
const { logger } = Sentry

export const interviewWorkflowRouter = createTRPCRouter({
  startAnalysis: protectedProcedure
    .input(CreatePreparationInput)
    .mutation(async ({ ctx, input }) => {
      // Log workflow start
      logger.info('Starting interview preparation workflow', {
        userId: ctx.userId,
        hasJobPosting: hasCompleteJobPosting(input),
        hasResume: !!input.resumeFileUrl,
        locale: input.locale,
      })

      // ... workflow logic

      // Log workflow completion
      logger.info('Interview preparation workflow completed', {
        preparationId: preparation.id,
        duration: totalDuration,
        threadId: threadId,
      })
    }),
})
```

### 2. AI Service Logging

```typescript
// server/services/ai/langgraph/service.ts
import * as Sentry from '@sentry/nextjs'
const { logger } = Sentry

class LangGraphService {
  async invokeGraph(assistantId: string, input: unknown) {
    logger.debug(logger.fmt`Invoking LangGraph assistant ${assistantId}`)

    try {
      const result = await this.client.runs.stream(...)

      logger.info('LangGraph invocation successful', {
        assistantId,
        duration: Date.now() - startTime
      })

      return result
    } catch (error) {
      logger.error('LangGraph invocation failed', {
        assistantId,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }
}
```

### 3. File Upload Logging

```typescript
// server/api/routers/file-upload.ts
import * as Sentry from '@sentry/nextjs'
const { logger } = Sentry

export const fileUploadRouter = createTRPCRouter({
  uploadResume: protectedProcedure
    .input(
      z.object({
        /* ... */
      })
    )
    .mutation(async ({ ctx, input }) => {
      logger.info('Resume upload started', {
        userId: ctx.userId,
        fileSize: input.file.size,
        mimeType: input.file.type,
      })

      // ... upload logic

      logger.info('Resume upload completed', {
        userId: ctx.userId,
        fileKey: uploadedFile.key,
        uploadDuration: Date.now() - startTime,
      })
    }),
})
```

### 4. Webhook Event Logging

```typescript
// app/api/webhooks/ai-workflow/route.ts
import * as Sentry from '@sentry/nextjs'
const { logger } = Sentry

export async function POST(request: Request) {
  const payload = await request.json()

  logger.info('Webhook received', {
    graphName: payload.graph_name,
    eventType: payload.event_type,
    threadId: payload.thread_id,
  })

  // ... webhook processing

  if (success) {
    logger.info('Webhook processed successfully', {
      graphName: payload.graph_name,
      processingDuration: Date.now() - startTime,
    })
  } else {
    logger.error('Webhook processing failed', {
      graphName: payload.graph_name,
      error: error.message,
    })
  }
}
```

## Best Practices

### ✅ DO

1. **Use structured data**: Always pass context as an object

   ```typescript
   logger.info('Action completed', { userId, action, duration })
   ```

2. **Use `logger.fmt` for interpolation**: For dynamic strings

   ```typescript
   logger.debug(logger.fmt`Processing item ${itemId}`)
   ```

3. **Include timestamps for critical events**: Helps with time-based analysis

   ```typescript
   logger.info('Job started', { jobId, startedAt: new Date().toISOString() })
   ```

4. **Log at appropriate levels**: Match log level to severity

   ```typescript
   logger.debug('Cache hit') // Non-critical info
   logger.error('Database query failed') // Critical issue
   ```

5. **Include correlation IDs**: For tracing across services
   ```typescript
   logger.info('API call', { requestId, userId, endpoint })
   ```

### ❌ DON'T

1. **Don't log sensitive information**: Never log passwords, tokens, or PII

   ```typescript
   // ❌ Bad
   logger.info('User login', { email, password })

   // ✅ Good
   logger.info('User login', { userId })
   ```

2. **Don't use string concatenation**: Use `logger.fmt` instead

   ```typescript
   // ❌ Bad
   logger.info('User ' + userId + ' logged in')

   // ✅ Good
   logger.info(logger.fmt`User ${userId} logged in`)
   ```

3. **Don't log in tight loops**: Can cause performance issues

   ```typescript
   // ❌ Bad
   items.forEach(item => {
     logger.debug('Processing item', { item }) // Too many logs
   })

   // ✅ Good
   logger.debug('Processing items', { count: items.length })
   ```

4. **Don't log without context**: Always include relevant metadata

   ```typescript
   // ❌ Bad
   logger.info('Operation completed')

   // ✅ Good
   logger.info('Operation completed', { operationId, userId, duration })
   ```

## Viewing Logs in Sentry

1. **Navigate to Sentry Dashboard** → `Issues` → Select your project
2. **Filter by Log Level**: Use the severity filter (Debug, Info, Warning, Error, Fatal)
3. **Search by Context**: Search for specific user IDs, operation types, etc.
4. **Correlate with Errors**: Logs appear alongside errors for the same transaction

## Integration with Other Monitoring

Sentry logs automatically correlate with:

- **Errors**: Via `Sentry.captureException()`
- **Performance Traces**: Via `Sentry.startSpan()`
- **User Context**: Via `Sentry.setUser()`

This provides a complete picture of application behavior when debugging issues.

## Resources

- [Sentry Logging Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/usage/logs/)
- [Sentry SDK API Reference](https://docs.sentry.io/platforms/javascript/configuration/options/)
