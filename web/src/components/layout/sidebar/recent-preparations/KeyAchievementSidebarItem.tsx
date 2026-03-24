'use client'

import { useSearchParams } from 'next/navigation'

import { Link, usePathname } from '@/i18n/navigation'
import { routes } from '@/lib/routes'

import {
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar'
import { SidebarKeyAchievement } from './types'

interface KeyAchievementSidebarItemProps {
  achievement: SidebarKeyAchievement
  preparationId: string
  experienceId: number
  experienceType: 'CAREER' | 'PROJECT'
}

/**
 * Level 3 sidebar item - Key Achievement
 * Navigates to questions page filtered by keyAchievementId
 */
export function KeyAchievementSidebarItem({
  achievement,
  preparationId,
  experienceId,
  experienceType,
}: KeyAchievementSidebarItemProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Use object syntax for query parameters
  const href = {
    pathname: routes.interviewPrep.questions(
      preparationId,
      experienceType,
      experienceId
    ),
    query: { keyAchievementId: achievement.id },
  }

  // Check if current route matches this achievement
  const isActive =
    pathname.includes(
      `/interview-prep/${preparationId}/${experienceType.toLowerCase()}/${experienceId}/questions`
    ) && searchParams.get('keyAchievementId') === achievement.id.toString()

  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton asChild size='sm' isActive={isActive}>
        <Link href={href}>
          <span className='mr-1 text-muted-foreground'>•</span>
          <span className='truncate'>{achievement.title}</span>
        </Link>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  )
}
