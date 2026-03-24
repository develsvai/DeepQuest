import 'server-only'

import { createHydrationHelpers } from '@trpc/react-query/rsc'

import { appRouter, type AppRouter } from '@/server/api/root'
import { createTRPCContext, createCallerFactory } from '@/server/api/trpc'
import { getQueryClient } from './query-client'
import { headers } from 'next/headers'
import { cache } from 'react'

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a server-side request (RSC).
 */
const createContext = cache(async () => {
  const heads = new Headers(await headers())
  heads.set('x-trpc-source', 'rsc')

  return createTRPCContext({ headers: heads })
})

/**
 * ============================================================================
 * Server-side tRPC Caller - 사용 시나리오 가이드
 * ============================================================================
 *
 * `trpc`는 두 가지 용도로 사용할 수 있습니다:
 *
 * ## 1. 직접 호출 (await trpc.xxx()) - 서버에서 값을 직접 사용해야 할 때
 *
 * ### 사용 케이스:
 * - generateMetadata (SEO)
 * - Redirect 로직
 * - 순수 서버 렌더링 (클라이언트 상호작용 없음)
 *
 * ```tsx
 * // generateMetadata
 * export async function generateMetadata({ params }) {
 *   const post = await trpc.post.getById({ id: params.id })
 *   return { title: post.title }
 * }
 *
 * // Redirect 로직
 * export default async function Page({ params }) {
 *   const item = await trpc.item.getById({ id: params.id })
 *   if (!item) redirect('/not-found')
 *   return <ItemView item={item} />
 * }
 * ```
 *
 * ## 2. Prefetch (void trpc.xxx.prefetch()) - 클라이언트와 연동해야 할 때
 *
 * 서버에서 데이터를 미리 가져오고(prefetch), 클라이언트 컴포넌트에서
 * useQuery로 이어받아 상호작용해야 할 때 사용합니다.
 *
 * ### 사용 케이스:
 * - refetch, invalidation이 필요한 데이터
 * - 무한 스크롤, 페이지네이션
 * - 실시간 업데이트가 필요한 UI
 *
 * ```tsx
 * // Server Component
 * export default async function Page() {
 *   void trpc.post.list.prefetch({ limit: 10 })
 *   return (
 *     <HydrateClient>
 *       <PostList />
 *     </HydrateClient>
 *   )
 * }
 *
 * // Client Component ("use client")
 * function PostList() {
 *   const { data, refetch } = api.post.list.useQuery({ limit: 10 })
 *   // 상호작용 로직...
 * }
 * ```
 * ============================================================================
 */

/**
 * Caller factory for hydration helpers
 * Uses createCallerFactory pattern for proper typing with createHydrationHelpers
 */
const caller = createCallerFactory(appRouter)(createContext)

/**
 * Server-side tRPC caller with hydration support
 *
 * @description 서버 컴포넌트에서 tRPC를 사용하기 위한 통합 인터페이스입니다.
 *
 * ### 직접 호출 (값 반환)
 * ```tsx
 * const data = await trpc.myRouter.myProcedure({ input })
 * ```
 *
 * ### Prefetch (클라이언트 hydration용)
 * ```tsx
 * void trpc.myRouter.myProcedure.prefetch({ input })
 * ```
 */
export const { trpc, HydrateClient } = createHydrationHelpers<AppRouter>(
  caller,
  getQueryClient
)
