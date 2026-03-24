import { cn } from '@/lib/utils'
import { designTokens } from '@/components/design-system/core'

import { SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { DashboardLayoutClient } from './DashboardLayoutClient'

/**
 * Props for DashboardLayout component
 * @property children - Child components to render
 * @property className - Additional CSS classes
 */
interface DashboardLayoutProps {
  children: React.ReactNode
  className?: string
}

/**
 * Dashboard layout component (Server Component)
 * Main layout wrapper with sidebar and header
 *
 * Sidebar data fetching:
 * - Layout prefetches data via trpc.interviewPreparation.listForSidebar.prefetch()
 * - AppSidebar uses Suspense + useSuspenseQuery for hydration
 * - No props drilling - data flows through React Query cache
 */
export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  return (
    <DashboardLayoutClient>
      <AppSidebar />
      <SidebarInset>
        <main
          className={cn('flex-1 overflow-y-auto px-6', className)}
          style={{ backgroundColor: designTokens.colors.background }}
        >
          {children}
        </main>
      </SidebarInset>
    </DashboardLayoutClient>
  )
}
