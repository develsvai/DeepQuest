/**
 * Shared Prisma client instance for webhook handlers
 * Uses singleton pattern to prevent connection pool exhaustion
 */
export { prisma } from '@/lib/db/prisma'
