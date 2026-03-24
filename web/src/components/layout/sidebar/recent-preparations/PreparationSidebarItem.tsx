'use client'

import { useState, useEffect } from 'react'
import { BookOpen, ChevronRight } from 'lucide-react'

import { Link, usePathname } from '@/i18n/navigation'
import { routes } from '@/lib/routes'

import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
} from '@/components/ui/sidebar'
import { SidebarPreparation } from './types'
import { ExperienceSidebarItem } from './ExperienceSidebarItem'

interface PreparationSidebarItemProps {
  preparation: SidebarPreparation
}

/**
 * Level 1 sidebar item - Interview Preparation
 * Collapsible item that shows Experiences when expanded
 */
export function PreparationSidebarItem({
  preparation,
}: PreparationSidebarItemProps) {
  const pathname = usePathname()

  const href = routes.interviewPrep.detail(preparation.id)

  // Check if current route is under this preparation
  const isActive = pathname.includes(`/interview-prep/${preparation.id}`)

  const [isOpen, setIsOpen] = useState(isActive)

  // Auto-expand when navigating to this preparation (without refresh)
  useEffect(() => {
    if (isActive) {
      setIsOpen(true)
    }
  }, [isActive])

  const hasExperiences = preparation.experiences.length > 0

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <SidebarMenuItem>
        <div className='flex w-full items-center'>
          {hasExperiences && (
            <CollapsibleTrigger asChild>
              <Button
                variant='ghost'
                className='h-8 w-6 shrink-0 p-0 group-data-[collapsible=icon]:hidden hover:bg-sidebar-accent'
                onClick={e => e.stopPropagation()}
              >
                <ChevronRight
                  className={`h-4 w-4 transition-transform duration-200 ${
                    isOpen ? 'rotate-90' : ''
                  }`}
                />
              </Button>
            </CollapsibleTrigger>
          )}
          {!hasExperiences && (
            <div className='w-6 shrink-0 group-data-[collapsible=icon]:hidden' />
          )}
          <SidebarMenuButton
            asChild
            isActive={isActive}
            tooltip={`${preparation.title} (${preparation.totalQuestions})`}
            className='flex-1'
          >
            <Link href={href}>
              <BookOpen className='h-4 w-4' />
              <span className='truncate'>{preparation.title}</span>
              <span className='ml-auto text-xs text-muted-foreground group-data-[collapsible=icon]:hidden'>
                ({preparation.totalQuestions})
              </span>
            </Link>
          </SidebarMenuButton>
        </div>
      </SidebarMenuItem>
      {hasExperiences && (
        <CollapsibleContent className='group-data-[collapsible=icon]:hidden'>
          <SidebarMenuSub>
            {preparation.experiences.map(experience => (
              <ExperienceSidebarItem
                key={`${experience.type}-${experience.id}`}
                experience={experience}
                preparationId={preparation.id}
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      )}
    </Collapsible>
  )
}
