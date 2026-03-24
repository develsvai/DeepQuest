import {
  QueryClient,
  defaultShouldDehydrateQuery,
  isServer,
} from '@tanstack/react-query'
import { cache } from 'react'

/**
 * Create a new QueryClient instance with default options
 *
 * ============================================================================
 * 🔑 핵심 설정: shouldDehydrateQuery with pending status
 * ============================================================================
 *
 * 기본 dehydrate 동작:
 * - TanStack Query의 dehydrate()는 기본적으로 'success' 상태 쿼리만 직렬화
 * - 'pending' 상태 쿼리는 무시됨
 *
 * 문제 상황 (void prefetch 사용 시):
 * 1. Server: void prefetch() 호출 → 쿼리 'pending' 상태로 시작
 * 2. Server: dehydrate() 호출 → pending 쿼리 무시 (기본 동작)
 * 3. Server: HTML 스트리밍 시작
 * 4. Client: hydration → QueryClient에 데이터 없음
 * 5. Client: API 재호출 → 인증 세션 타이밍 이슈 발생 가능
 *
 * 해결책:
 * - shouldDehydrateQuery에서 'pending' 상태도 직렬화하도록 설정
 * - 클라이언트는 pending 상태로 hydration 시작
 * - 서버에서 prefetch 완료 시 스트리밍으로 데이터 전달
 * - 클라이언트에서 자동 업데이트 → API 재호출 없음!
 *
 * 이점:
 * - void prefetch() 사용 가능 (non-blocking)
 * - 스트리밍 SSR의 이점 유지 (빠른 TTFB)
 * - 클라이언트 API 재호출 방지 (인증 이슈 해결)
 *
 * @see https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr
 * ============================================================================
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // SSR에서는 0보다 큰 staleTime 권장 - 클라이언트에서 즉시 refetch 방지
        staleTime: 30 * 1000,
      },
      dehydrate: {
        // pending 상태도 dehydrate - 스트리밍 hydration의 핵심!
        shouldDehydrateQuery: query =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === 'pending',
      },
    },
  })
}

/**
 * Server-side QueryClient getter using React cache
 * Ensures request-scoped singleton for SSR hydration
 *
 * 서버: React cache로 요청 스코프 싱글톤 - 같은 요청 내에서 동일한 인스턴스 반환
 */
export const getQueryClient = cache(makeQueryClient)

/**
 * Browser-side QueryClient singleton
 *
 * 브라우저에서 모듈 레벨 싱글톤으로 관리
 * React가 Suspense로 컴포넌트를 버려도 QueryClient는 유지됨
 */
let browserQueryClient: QueryClient | undefined = undefined

/**
 * Get QueryClient for TRPCProvider (client component)
 *
 * TanStack Query 공식 문서 권장 패턴:
 * - 서버: 매 요청마다 새 QueryClient 생성
 * - 브라우저: 모듈 레벨 싱글톤 재사용
 *
 * 주의: useState 대신 이 함수를 직접 호출해야 함
 * "Avoid useState when initializing the query client if you don't have a
 * suspense boundary between this and the code that may suspend because
 * React will throw away the client on the initial render if it suspends"
 *
 * @see https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr
 */
export function getQueryClientForProvider() {
  if (isServer) {
    // 서버: 매번 새로 생성 (요청 간 격리)
    return makeQueryClient()
  } else {
    // 브라우저: 싱글톤 패턴 - Suspense에서 안전
    if (!browserQueryClient) {
      browserQueryClient = makeQueryClient()
    }
    return browserQueryClient
  }
}
