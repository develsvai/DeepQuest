---
name: sentry
description: Implement Sentry error tracking, performance monitoring, and logging in Next.js applications. Use this skill when adding Sentry instrumentation for exception catching, custom spans for performance tracing, or structured logging integration.
---

# Sentry

## Overview

Integrate Sentry's error tracking, performance monitoring, and logging capabilities into Next.js applications. This skill provides guidance on implementing exception catching, custom span instrumentation for performance tracing, and structured logging using Sentry's SDK.

## Core Capabilities

### 1. Exception Catching

Capture and report exceptions to Sentry using `Sentry.captureException(error)`.

**When to use:**

- In try-catch blocks for error handling
- When wrapping risky operations
- For logging unhandled errors with context

**Example:**

```typescript
try {
  await riskyOperation()
} catch (error) {
  Sentry.captureException(error)
  throw error
}
```

### 2. Performance Monitoring with Custom Spans

Create spans to track performance of meaningful user interactions and operations.

**When to use:**

- Button clicks and user interactions (`op: "ui.click"`)
- API calls and HTTP requests (`op: "http.client"`)
- Database queries (`op: "db.query"`)
- Function calls and business logic

**Key principles:**

- Use meaningful `name` and `op` properties that describe the activity
- Attach relevant attributes (metrics, config values, IDs)
- Nest child spans within parent spans for detailed tracing
- Focus on critical user paths and performance-sensitive operations

**Example - UI interaction:**

```typescript
Sentry.startSpan(
  {
    op: 'ui.click',
    name: 'Submit Form Button',
  },
  span => {
    span.setAttribute('formId', formId)
    span.setAttribute('userId', userId)
    handleSubmit()
  }
)
```

**Example - API call:**

```typescript
async function fetchUserData(userId: string) {
  return Sentry.startSpan(
    {
      op: 'http.client',
      name: `GET /api/users/${userId}`,
    },
    async () => {
      const response = await fetch(`/api/users/${userId}`)
      return response.json()
    }
  )
}
```

### 3. Structured Logging

Enable and use Sentry's logging integration for structured logs.

**When to use:**

- Application-level logging with context
- Debug information with variable interpolation
- Error logging with structured data
- Performance and operational monitoring

**Key principles:**

- Import Sentry as `import * as Sentry from "@sentry/nextjs"`
- Use `logger.fmt` template literals for variable interpolation
- Include contextual objects with relevant metadata
- Choose appropriate log levels (trace, debug, info, warn, error, fatal)

**Example:**

```typescript
import * as Sentry from '@sentry/nextjs'
const { logger } = Sentry

logger.info('Updated profile', { profileId: 345, userId: userId })
logger.error('Failed to process payment', { orderId, amount })
logger.debug(logger.fmt`Cache miss for user: ${userId}`)
```

## Next.js Configuration

**Initialization locations:**

- **Client-side**: `instrumentation-client.ts` or `src/instrumentation-client.ts`
- **Server-side**: `sentry.server.config.ts`
- **Edge runtime**: `sentry.edge.config.ts`

**Important:** Sentry initialization happens ONLY in the files above. Do not re-initialize in other files. Simply import and use: `import * as Sentry from "@sentry/nextjs"`

**Baseline configuration:**

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  _experiments: {
    enableLogs: true, // Enable logging capability
  },
})
```

**With console integration:**

```typescript
Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  integrations: [
    // Automatically capture console.log, console.warn, console.error
    Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] }),
  ],
})
```

## Implementation Workflow

When adding Sentry instrumentation:

1. **Identify the use case**: Exception catching, performance tracing, or logging
2. **Import Sentry**: `import * as Sentry from "@sentry/nextjs"` (do not re-initialize)
3. **Implement instrumentation**:
   - Exceptions: Wrap in try-catch with `Sentry.captureException(error)`
   - Performance: Use `Sentry.startSpan()` with meaningful `op` and `name`
   - Logging: Use `const { logger } = Sentry` and appropriate log level
4. **Add context**: Attach relevant attributes, metadata, or structured data
5. **Test**: Verify events appear in Sentry dashboard

## References

For detailed code examples and complete implementation patterns, see:

- `references/sentry-examples.md` - Comprehensive examples for all capabilities

## Resources

This skill includes:

### references/

- `sentry-examples.md` - Detailed code examples for exception catching, tracing, and logging
