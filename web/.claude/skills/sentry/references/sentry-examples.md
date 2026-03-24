# Sentry Implementation Examples

This file contains detailed code examples for implementing Sentry in a Next.js application.

## Exception Catching

Use `Sentry.captureException(error)` to capture an exception and log the error in Sentry.
Use this in try-catch blocks or areas where exceptions are expected.

```typescript
try {
  await riskyOperation()
} catch (error) {
  Sentry.captureException(error)
  throw error
}
```

## Tracing & Performance Monitoring

Spans should be created for meaningful actions within an application like button clicks, API calls, and function calls.
Use the `Sentry.startSpan` function to create a span.
Child spans can exist within a parent span.

### Custom Span Instrumentation in Component Actions

The `name` and `op` properties should be meaningful for the activities in the call.
Attach attributes based on relevant information and metrics from the request.

```typescript
function TestComponent() {
  const handleTestButtonClick = () => {
    // Create a transaction/span to measure performance
    Sentry.startSpan(
      {
        op: "ui.click",
        name: "Test Button Click",
      },
      (span) => {
        const value = "some config";
        const metric = "some metric";

        // Metrics can be added to the span
        span.setAttribute("config", value);
        span.setAttribute("metric", metric);

        doSomething();
      },
    );
  };

  return (
    <button type="button" onClick={handleTestButtonClick}>
      Test Sentry
    </button>
  );
}
```

### Custom Span Instrumentation in API Calls

The `name` and `op` properties should be meaningful for the activities in the call.
Attach attributes based on relevant information and metrics from the request.

```typescript
async function fetchUserData(userId: string) {
  return Sentry.startSpan(
    {
      op: 'http.client',
      name: `GET /api/users/${userId}`,
    },
    async () => {
      const response = await fetch(`/api/users/${userId}`)
      const data = await response.json()
      return data
    }
  )
}
```

## Logging Configuration & Examples

Where logs are used, ensure Sentry is imported using `import * as Sentry from "@sentry/nextjs"`.
Enable logging in Sentry using `Sentry.init({ _experiments: { enableLogs: true } })`.
Reference the logger using `const { logger } = Sentry`.

Sentry offers a `consoleLoggingIntegration` that can be used to log specific console error types automatically without instrumenting the individual logger calls.

### Configuration in Next.js

In Next.js:

- **Client-side initialization**: `instrumentation-client.ts`
- **Server-side initialization**: `sentry.server.config.ts`
- **Edge runtime initialization**: `sentry.edge.config.ts`

Initialization does not need to be repeated in other files, it only needs to happen in the files mentioned above. Use `import * as Sentry from "@sentry/nextjs"` to reference Sentry functionality.

#### Baseline Configuration

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: 'https://4676189ddcda6841cb3f1718fcbcaec2@o4510226039046144.ingest.us.sentry.io/4510226040553472',

  _experiments: {
    enableLogs: true,
  },
})
```

#### Logger Integration

```typescript
Sentry.init({
  dsn: 'https://4676189ddcda6841cb3f1718fcbcaec2@o4510226039046144.ingest.us.sentry.io/4510226040553472',
  integrations: [
    // send console.log, console.warn, and console.error calls as logs to Sentry
    Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] }),
  ],
})
```

### Logger Usage Examples

`logger.fmt` is a template literal function that should be used to bring variables into the structured logs.

```typescript
import * as Sentry from '@sentry/nextjs'
const { logger } = Sentry

// Different log levels
logger.trace('Starting database connection', { database: 'users' })
logger.debug(logger.fmt`Cache miss for user: ${userId}`)
logger.info('Updated profile', { profileId: 345 })
logger.warn('Rate limit reached for endpoint', {
  endpoint: '/api/results/',
  isEnterprise: false,
})
logger.error('Failed to process payment', {
  orderId: 'order_123',
  amount: 99.99,
})
logger.fatal('Database connection pool exhausted', {
  database: 'users',
  activeConnections: 100,
})
```
