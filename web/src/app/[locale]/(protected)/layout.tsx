import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { InterviewPreparationProvider } from '@/components/providers/interview-preparation-provider'
import { QuestionGenerationProvider } from '@/components/providers/question-generation-provider'
import { trpc, HydrateClient } from '@/trpc/server'

/**
 * ProtectedLayout Props
 */
interface ProtectedLayoutProps {
  children: React.ReactNode
}

/**
 * Protected layout for authenticated routes
 *
 * Authentication is guaranteed by Clerk middleware in proxy.ts (Next.js 16).
 * Proxy runs BEFORE this layout, so auth() in tRPC context will always succeed.
 *
 * Data fetching pattern (prefetch & hydrate):
 * - Server: void prefetch (non-blocking) - pending 상태도 dehydrate됨
 * - Client: HydrateClient hydrates cache, 서버 스트리밍으로 데이터 완료
 * - Mutations: invalidateQueries triggers automatic refetch
 *
 * NOTE: query-client.ts의 shouldDehydrateQuery 설정으로
 * pending 쿼리도 직렬화되어 스트리밍 hydration 지원
 *
 * Sidebar data is prefetched here and consumed by RecentPreparationsSidebarGroup
 * via useSuspenseQuery inside AppSidebar's Suspense boundary.
 */
export default async function ProtectedLayout({
  children,
}: ProtectedLayoutProps) {
  // Prefetch sidebar data (non-blocking streaming)
  // NOTE: Must pass explicit { limit: 10 } to match client query key
  void trpc.interviewPreparation.listForSidebar.prefetch({ limit: 10 })

  return (
    <HydrateClient>
      <DashboardLayout>
        <InterviewPreparationProvider>
          <QuestionGenerationProvider>
            <div className='container mx-auto space-y-6'>{children}</div>
          </QuestionGenerationProvider>
        </InterviewPreparationProvider>
      </DashboardLayout>
    </HydrateClient>
  )
}
