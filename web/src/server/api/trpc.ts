import { initTRPC, TRPCError } from '@trpc/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'
import { type NextRequest } from 'next/server'
import superjson from 'superjson'
import * as Sentry from '@sentry/nextjs'

/**
 * Context creation options
 * - req: Full NextRequest object (used by API route handler)
 * - headers: Headers object (used by RSC server-side calls)
 */
type CreateContextOptions = {
  req?: NextRequest
  headers?: Headers
}

/**
 * Create context for each request
 * This runs for every tRPC request and provides shared data
 */
export const createTRPCContext = async (opts: CreateContextOptions = {}) => {
  // Use headers from either NextRequest or direct Headers object
  const requestHeaders = opts.headers ?? opts.req?.headers ?? new Headers()

  // Get the session from Clerk
  const session = await auth()

  // Set Sentry user context for this request
  if (session.userId) {
    Sentry.setUser({ id: session.userId })
  } else {
    Sentry.setUser(null)
  }

  return {
    prisma,
    userId: session.userId ?? null,
    auth: session,
    headers: requestHeaders,
  }
}

/**
 * Initialize tRPC with our context type
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  jsonl: {
    pingMs: 100, // Keep-alive ping for long-lived streaming connections
  },
  errorFormatter({ shape, error }) {
    // Development: Log detailed error for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('[tRPC Error]', {
        code: error.code,
        message: error.message,
        cause: error.cause,
        stack: error.stack,
      })
    }

    // Production: Capture tRPC errors in Sentry
    // Skip UNAUTHORIZED errors as they're expected
    if (
      process.env.NODE_ENV !== 'development' &&
      error.code !== 'UNAUTHORIZED'
    ) {
      Sentry.captureException(error, {
        tags: {
          trpc_code: error.code,
        },
        extra: {
          shape,
          cause: error.cause,
        },
      })
    }

    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause?.name === 'ZodError' ? error.cause : null,
      },
    }
  },
})

/**
 * Export reusable router and procedure helpers
 */
export const createTRPCRouter = t.router

/**
 * Public (unauthenticated) procedure
 * Use this for procedures that don't require authentication
 */
export const publicProcedure = t.procedure

/**
 * Middleware for checking if user is authenticated
 * Throws UNAUTHORIZED error if not authenticated
 * Auto-creates user in DB if authenticated but not in database (fallback for webhook failures)
 */
const enforceUserIsAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  // Check if user exists in database
  let user = await ctx.prisma.user.findUnique({
    where: { id: ctx.userId },
  })

  // If user doesn't exist, create them from Clerk data
  // This is a fallback for cases where webhook failed or was delayed
  if (!user) {
    try {
      const client = await clerkClient()
      const clerkUser = await client.users.getUser(ctx.userId)

      const primaryEmail = clerkUser.emailAddresses.find(
        email => email.id === clerkUser.primaryEmailAddressId
      )

      if (!primaryEmail) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'User has no primary email',
        })
      }

      user = await ctx.prisma.user.create({
        data: {
          id: ctx.userId,
          email: primaryEmail.emailAddress,
          firstName: clerkUser.firstName || null,
          lastName: clerkUser.lastName || null,
          profileImageUrl: clerkUser.imageUrl || null,
        },
      })

      console.log('✅ Auto-created user in database:', user.email)
    } catch (error) {
      console.error('❌ Failed to auto-create user:', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create user in database',
        cause: error,
      })
    }
  }

  return next({
    ctx: {
      // Infers the `userId` as non-nullable
      prisma: ctx.prisma,
      auth: ctx.auth,
      userId: ctx.userId,
      headers: ctx.headers,
    },
  })
})

/**
 * Protected (authenticated) procedure
 * Use this for procedures that require authentication
 */
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed)

/**
 * Type definitions for testing
 */
export type Context = Awaited<ReturnType<typeof createTRPCContext>>

/**
 * Create a caller factory for testing
 */
export const createCallerFactory = t.createCallerFactory
