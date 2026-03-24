'use client'

import { useTranslations } from 'next-intl'

import { api } from '@/trpc/react'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
} from '@/components/ui/sidebar'
import { PreparationSidebarItem } from './PreparationSidebarItem'

/**
 * Recent Preparations sidebar group
 * Displays a collapsible nested list of interview preparations
 *
 * Uses tRPC + React Query Suspense pattern:
 * - Server prefetches data into QueryClient cache (in layout.tsx)
 * - HydrateClient hydrates client-side cache
 * - useSuspenseQuery suspends until data is available
 * - Suspense boundary in AppSidebar shows skeleton while loading
 *
 * Structure:
 * - Level 1: Preparations (title + total question count)
 * - Level 2: Experiences - Career/Project (name + question count)
 * - Level 3: Key Achievements (title)
 */
export function RecentPreparationsSidebarGroup() {
  const t = useTranslations('common.sidebar')

  // useSuspenseQuery suspends until data is available
  // Suspense boundary in AppSidebar shows RecentPreparationsSkeleton during loading
  // NOTE: Must pass explicit { limit: 10 } to match server prefetch query key
  const [preparations] =
    api.interviewPreparation.listForSidebar.useSuspenseQuery({ limit: 10 })

  if (preparations.length === 0) {
    return null
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel className='text-xs font-bold tracking-wider text-muted-foreground/70 uppercase'>
        {t('recentPreparations')}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {preparations.map(preparation => (
            <PreparationSidebarItem
              key={preparation.id}
              preparation={preparation}
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
