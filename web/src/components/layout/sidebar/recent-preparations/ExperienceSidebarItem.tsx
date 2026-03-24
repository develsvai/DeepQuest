'use client'

import { useState, useEffect } from 'react'
import { Briefcase, FolderGit2, ChevronRight } from 'lucide-react'

import { Link, usePathname } from '@/i18n/navigation'
import { routes } from '@/lib/routes'

import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarMenuSub,
} from '@/components/ui/sidebar'
import { SidebarExperience } from './types'
import { KeyAchievementSidebarItem } from './KeyAchievementSidebarItem'

interface ExperienceSidebarItemProps {
  experience: SidebarExperience
  preparationId: string
}

/**
 * Level 2 sidebar item - Experience (Career/Project)
 * Collapsible item that shows Key Achievements when expanded
 */
export function ExperienceSidebarItem({
  experience,
  preparationId,
}: ExperienceSidebarItemProps) {
  const pathname = usePathname()

  const experienceType = experience.type.toLowerCase()
  const href = routes.interviewPrep.experience(
    preparationId,
    experienceType,
    experience.id
  )

  // Check if current route is under this experience
  const isActive = pathname.includes(
    `/interview-prep/${preparationId}/${experienceType}/${experience.id}`
  )

  const [isOpen, setIsOpen] = useState(isActive)

  // Auto-expand when navigating to this experience (without refresh)
  useEffect(() => {
    if (isActive) {
      setIsOpen(true)
    }
  }, [isActive])

  // Icon based on experience type
  const Icon = experience.type === 'CAREER' ? Briefcase : FolderGit2

  const hasKeyAchievements = experience.keyAchievements.length > 0

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <SidebarMenuSubItem>
        <div className='flex w-full items-center'>
          {hasKeyAchievements && (
            <CollapsibleTrigger asChild>
              <Button
                variant='ghost'
                className='h-7 w-5 shrink-0 p-0 hover:bg-sidebar-accent'
                onClick={e => e.stopPropagation()}
              >
                <ChevronRight
                  className={`h-3 w-3 transition-transform duration-200 ${
                    isOpen ? 'rotate-90' : ''
                  }`}
                />
              </Button>
            </CollapsibleTrigger>
          )}
          {!hasKeyAchievements && <div className='w-5 shrink-0' />}
          <SidebarMenuSubButton
            asChild
            size='sm'
            isActive={isActive}
            className='flex-1'
          >
            <Link href={href}>
              <Icon className='h-3.5 w-3.5' />
              <span className='truncate'>{experience.name}</span>
              <span className='ml-auto text-xs text-muted-foreground'>
                ({experience.questionCount})
              </span>
            </Link>
          </SidebarMenuSubButton>
        </div>
      </SidebarMenuSubItem>
      {hasKeyAchievements && (
        <CollapsibleContent>
          <SidebarMenuSub className='ml-5 border-l-0'>
            {experience.keyAchievements.map(achievement => (
              <KeyAchievementSidebarItem
                key={achievement.id}
                achievement={achievement}
                preparationId={preparationId}
                experienceId={experience.id}
                experienceType={experience.type}
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      )}
    </Collapsible>
  )
}
