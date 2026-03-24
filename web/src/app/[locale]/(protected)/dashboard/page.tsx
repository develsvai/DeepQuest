import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { Suspense } from 'react'

import { trpc, HydrateClient } from '@/trpc/server'
import { PageContainer } from '@/components/layout/PageContainer'
import { NewPreparationButton } from './_components/NewPreparationButton'
import { DashboardContent } from './_components/DashboardContent'
import { DashboardListSkeleton } from './_components/DashboardListSkeleton'

const SITE_NAME = 'Deep Quest'

/**
 * Generate metadata for the dashboard page
 * Uses translations for SEO-friendly title and description
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('dashboard.pageHeaders')
  const title = `${SITE_NAME} - ${t('title')}`
  const description = t('description')

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
  }
}

/**
 * Dashboard page component
 *
 * Central hub for logged-in users to view all their interview preparations.
 * Uses tRPC prefetch + HydrationBoundary pattern for optimal SSR + client cache.
 *
 * Authentication is guaranteed by Clerk middleware in proxy.ts for (protected) routes.
 *
 * Data fetching pattern:
 * - Server: void prefetch (non-blocking) - pending 상태도 dehydrate됨
 * - Client: HydrateClient hydrates cache, 서버 스트리밍으로 데이터 완료
 * - Mutations: invalidateQueries triggers automatic refetch
 *
 * NOTE: query-client.ts의 shouldDehydrateQuery 설정으로 스트리밍 hydration 지원
 */
export default async function DashboardPage() {
  // Prefetch data (non-blocking streaming)
  void trpc.interviewPreparation.list.prefetch()

  const t = await getTranslations('dashboard')

  return (
    <PageContainer>
      <PageContainer.Header
        title={t('pageHeaders.title')}
        description={t('pageHeaders.description')}
        action={<NewPreparationButton />}
      />
      <PageContainer.Content>
        <Suspense fallback={<DashboardListSkeleton />}>
          <HydrateClient>
            <DashboardContent />
          </HydrateClient>
        </Suspense>
      </PageContainer.Content>
    </PageContainer>
  )
}
