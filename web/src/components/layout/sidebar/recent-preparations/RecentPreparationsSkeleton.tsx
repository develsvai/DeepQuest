'use client'

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Skeleton component for Recent Preparations sidebar group
 *
 * Displays loading placeholders that match the structure of RecentPreparationsSidebarGroup:
 * - Level 1: Preparations (title + total question count)
 * - Level 2: Experiences - Career/Project (name + question count)
 *
 * Used as Suspense fallback in AppSidebar while data is being fetched.
 */
export function RecentPreparationsSkeleton() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className='text-xs font-bold tracking-wider text-muted-foreground/70 uppercase'>
        <Skeleton className='h-3 w-24' />
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {/* Skeleton for 3 preparation items */}
          {[1, 2, 3].map(i => (
            <SidebarMenuItem key={i}>
              <SidebarMenuButton className='cursor-default'>
                <Skeleton className='h-4 w-4 rounded' />
                <Skeleton className='h-4 flex-1' />
                <Skeleton className='h-3 w-6' />
              </SidebarMenuButton>
              <SidebarMenuSub>
                {/* Skeleton for 2 experience items per preparation */}
                {[1, 2].map(j => (
                  <SidebarMenuSubItem key={j}>
                    <SidebarMenuSubButton className='cursor-default'>
                      <Skeleton className='h-3 w-3 rounded' />
                      <Skeleton className='h-3 flex-1' />
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
