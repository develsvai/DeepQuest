'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { httpBatchStreamLink, loggerLink } from '@trpc/client'
import { useState } from 'react'
import superjson from 'superjson'

import { api } from './react'
import { getQueryClientForProvider } from './query-client'

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // In browser, use absolute path to avoid locale prefix issues
    const origin = window.location.origin
    return origin
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}` // SSR should use vercel url
  return `http://localhost:${process.env.PORT ?? 3000}` // dev SSR should use localhost
}

/**
 * tRPC Provider with React Query integration
 *
 * This provider sets up the tRPC client for client-side components
 * with proper batching, transforms, and error handling.
 *
 * QueryClient 초기화: useState 대신 getQueryClientForProvider() 직접 호출
 * - TanStack Query 공식 권장 패턴
 * - React가 Suspense로 컴포넌트를 버려도 QueryClient가 유지됨
 * - Hydration이 제대로 작동하여 서버 prefetch 데이터가 클라이언트에 전달됨
 *
 * @see https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr
 */
export function TRPCProvider({ children }: { children: React.ReactNode }) {
  // NOTE: useState 대신 직접 호출 - Suspense에서 안전
  // "Avoid useState when initializing the query client if you don't have a
  // suspense boundary between this and the code that may suspend"
  const queryClient = getQueryClientForProvider()

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        // 🔍 DEBUG: tRPC 요청/응답 로깅
        loggerLink({
          enabled: () => process.env.NODE_ENV === 'development',
        }),
        httpBatchStreamLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
          async fetch(url, options) {
            const response = await fetch(url, {
              ...options,
              credentials: 'include',
            })
            return response
          },
          headers() {
            const headers = new Map<string, string>()
            headers.set('x-trpc-source', 'client')
            return Object.fromEntries(headers)
          },
        }),
      ],
    })
  )

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </api.Provider>
  )
}
