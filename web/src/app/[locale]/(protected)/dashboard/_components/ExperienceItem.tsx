'use client'

import { Briefcase, FolderGit2, Trophy } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { CircularProgress } from '@/components/ui/circular-progress'
import { cn } from '@/lib/utils'

/**
 * Props for ExperienceItem component
 */
interface ExperienceItemProps {
  /** Experience type - determines icon and styling */
  type: 'career' | 'project'
  /** Company name or Project name */
  name: string
  /** Positions/roles array - displayed with vertical separator */
  role: string[] | null
  /** Technology stack array */
  techStack: string[]
  /** Number of key achievements for this experience */
  keyAchievementsCount: number
  /** Total questions for this experience */
  totalQuestions: number
  /** Completed questions count */
  completedQuestions: number
  /** Maximum tech badges to display before +N (default: 3) */
  maxTechDisplay?: number
  /** Additional className */
  className?: string
}

/**
 * Displays a single experience (Career or Project) with progress indicator
 *
 * Layout:
 * - Left: Icon + Name + Role + TechStack + KeyAchievements
 * - Right: CircularProgress showing question completion rate
 */
function ExperienceItem({
  type,
  name,
  role,
  techStack,
  keyAchievementsCount,
  totalQuestions,
  completedQuestions,
  maxTechDisplay = 3,
  className,
}: ExperienceItemProps) {
  const t = useTranslations('dashboard.preparationItem')

  // Calculate progress percentage
  const progressValue =
    totalQuestions > 0
      ? Math.round((completedQuestions / totalQuestions) * 100)
      : 0

  // Split tech stack for display
  const displayedTech = techStack.slice(0, maxTechDisplay)
  const remainingTechCount = techStack.length - maxTechDisplay

  // Icon based on experience type
  const ExperienceIcon = type === 'career' ? Briefcase : FolderGit2

  return (
    <Card className={cn('py-4', className)}>
      <CardContent className='flex items-center gap-4 py-0'>
        {/* Left Section - Experience Info */}
        <div className='min-w-0 flex-1 space-y-2'>
          {/* Name with Icon */}
          <div className='flex items-center gap-2'>
            <ExperienceIcon className='h-4 w-4 shrink-0 text-muted-foreground' />
            <span className='truncate font-semibold text-foreground'>
              {name}
            </span>
          </div>

          {/* Role/Position - separated by vertical bar */}
          {role && role.length > 0 && (
            <p className='truncate pl-6 text-sm text-muted-foreground'>
              {role.join(' | ')}
            </p>
          )}

          {/* Tech Stack Badges */}
          {techStack.length > 0 && (
            <div className='flex flex-wrap gap-1.5 pl-6'>
              {displayedTech.map(tech => (
                <Badge key={tech} variant='outline' className='text-xs'>
                  {tech}
                </Badge>
              ))}
              {remainingTechCount > 0 && (
                <Badge variant='secondary' className='text-xs'>
                  +{remainingTechCount}
                </Badge>
              )}
            </div>
          )}

          {/* Key Achievements Count */}
          <div className='flex items-center gap-1.5 pl-6 text-sm text-muted-foreground'>
            <Trophy className='h-4 w-4 text-amber-500' />
            <span>{t('keyAchievements', { count: keyAchievementsCount })}</span>
          </div>
        </div>

        {/* Right Section - Circular Progress */}
        <div className='flex shrink-0 flex-col items-center gap-1'>
          <CircularProgress
            value={progressValue}
            size='md'
            showLabel
            className='text-primary'
          />
          <span className='text-xs text-muted-foreground'>
            {completedQuestions}/{totalQuestions}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

export { ExperienceItem }
export type { ExperienceItemProps }
