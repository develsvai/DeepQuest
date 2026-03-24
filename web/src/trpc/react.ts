'use client'

import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '@/server/api/root'

/**
 * React tRPC client for client-side components
 *
 * This provides the `api` object used in client components for:
 * - useQuery hooks for data fetching
 * - useMutation hooks for data modifications
 * - useSubscription hooks for real-time updates
 *
 * Usage:
 * ```tsx
 * import { api } from '@/trpc/react'
 *
 * function MyComponent() {
 *   const { data } = api.interviewPreparation.getById.useQuery({ id: 'xxx' })
 *   const { mutate } = api.fileUpload.create.useMutation()
 *   return <div>...</div>
 * }
 * ```
 */
export const api = createTRPCReact<AppRouter>()
