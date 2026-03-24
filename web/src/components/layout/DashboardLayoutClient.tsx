'use client'

import { SidebarProvider } from '@/components/ui/sidebar'

/**
 * Props for DashboardLayoutClient component
 * @property children - Child components to render
 */
interface DashboardLayoutClientProps {
  children: React.ReactNode
}

/**
 * Client wrapper for sidebar provider functionality
 * Minimal client component that only handles sidebar state
 */
export function DashboardLayoutClient({
  children,
}: DashboardLayoutClientProps) {
  return <SidebarProvider defaultOpen={true}>{children}</SidebarProvider>
}
