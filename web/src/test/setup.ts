import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Polyfill for Node.js environment - Using Node's built-in globals
if (typeof global.TextEncoder === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { TextEncoder, TextDecoder } = require('util')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  global.TextEncoder = TextEncoder as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  global.TextDecoder = TextDecoder as any
}

// Mock environment variables for testing
process.env.DATABASE_URL =
  'postgresql://postgres:postgres@127.0.0.1:54322/postgres?schema=public'
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'test-clerk-key'
process.env.CLERK_SECRET_KEY = 'test-clerk-secret'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

// LangGraph integration test environment variables
process.env.LANGGRAPH_API_URL = 'http://localhost:8123'
process.env.LANGSMITH_API_KEY = 'test-langsmith-api-key'
process.env.AI_WEBHOOK_SECRET = 'test-webhook-secret'
process.env.APP_URL = 'http://localhost:3000'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/test',
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}))

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  auth: () => ({ userId: 'test-user-id' }),
  currentUser: () =>
    Promise.resolve({
      id: 'test-user-id',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
      firstName: 'Test',
      lastName: 'User',
    }),
  useAuth: () => ({
    userId: 'test-user-id',
    isLoaded: true,
    isSignedIn: true,
  }),
  useUser: () => ({
    user: {
      id: 'test-user-id',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
      firstName: 'Test',
      lastName: 'User',
    },
    isLoaded: true,
    isSignedIn: true,
  }),

  SignedIn: ({ children }: { children: React.ReactNode }) => children,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  SignedOut: ({ children }: { children: React.ReactNode }) => null,
  UserButton: () => null,
}))

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'ko',
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}))

// Suppress console errors during tests unless DEBUG is set
if (!process.env.DEBUG) {
  const originalError = console.error
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  console.error = (...args: any[]) => {
    if (
      args[0]?.includes?.('Warning: ReactDOM.render') ||
      args[0]?.includes?.('Warning: useLayoutEffect')
    ) {
      return
    }

    originalError.call(console, ...args)
  }
}
