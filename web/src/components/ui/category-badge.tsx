/**
 * CategoryBadge Component
 *
 * Displays question category with responsive tooltip/popover for description.
 * Desktop: Tooltip on hover
 * Mobile: Popover on tap
 *
 * Category names and descriptions are internationalized via next-intl.
 */

'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { Tag } from 'lucide-react'
import { QuestionCategory } from '@/generated/prisma/enums'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { designTokens } from '@/components/design-system/core'
import { useMediaQuery, mediaQueries } from '@/hooks/use-media-query'
import { getCategoryColorKey } from '@/lib/constants/question-category'

export interface CategoryBadgeProps {
  /** Question category enum value */
  category: QuestionCategory
  /** Badge size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Optional className for additional styling */
  className?: string
}

/**
 * Get color CSS variable for category
 */
function getCategoryColor(category: QuestionCategory): string {
  const colorKey = getCategoryColorKey(category)

  // Map colorKey to designTokens
  const colorMap: Record<string, string> = {
    'chart.1': designTokens.colors.chart[1],
    'chart.2': designTokens.colors.chart[2],
    'chart.3': designTokens.colors.chart[3],
    'chart.4': designTokens.colors.chart[4],
    'chart.5': designTokens.colors.chart[5],
  }

  return colorMap[colorKey] || designTokens.colors.chart[1]
}

/**
 * Get background color with opacity for category
 */
function getCategoryBgColor(category: QuestionCategory): string {
  const color = getCategoryColor(category)
  // Use CSS color-mix for opacity (modern browsers)
  return `color-mix(in srgb, ${color} 10%, transparent)`
}

/**
 * CategoryBadge content component
 */
function CategoryBadgeContent({
  category,
  size = 'md',
  className,
}: CategoryBadgeProps) {
  const t = useTranslations('common.questionCategory')
  const name = t(`${category}.name`)

  const sizeClasses = {
    sm: 'text-xs gap-1 px-2 py-0.5',
    md: 'text-sm gap-1.5 px-2.5 py-1',
    lg: 'text-base gap-2 px-3 py-1.5',
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  }

  return (
    <Badge
      variant='outline'
      className={`cursor-help font-medium ${sizeClasses[size]} ${className || ''}`}
      style={{
        borderColor: getCategoryColor(category),
        backgroundColor: getCategoryBgColor(category),
        color: designTokens.colors.foreground,
      }}
    >
      <Tag
        className={iconSizes[size]}
        style={{ color: getCategoryColor(category) }}
      />
      <span>{name}</span>
    </Badge>
  )
}

/**
 * CategoryBadge with responsive Tooltip/Popover
 */
export function CategoryBadge(props: CategoryBadgeProps) {
  const { category } = props
  const t = useTranslations('common.questionCategory')
  const name = t(`${category}.name`)
  const description = t(`${category}.description`)
  const isDesktop = useMediaQuery(mediaQueries.md)

  // Desktop: Tooltip
  if (isDesktop) {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <CategoryBadgeContent {...props} />
            </div>
          </TooltipTrigger>
          <TooltipContent
            side='bottom'
            align='start'
            className='max-w-xs border bg-popover text-popover-foreground shadow-md'
          >
            <div className='space-y-1'>
              <p className='text-sm font-medium'>{name}</p>
              <p
                className='text-xs'
                style={{ color: designTokens.colors.muted.foreground }}
              >
                {description}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Mobile: Popover
  return (
    <Popover>
      <PopoverTrigger asChild>
        <div>
          <CategoryBadgeContent {...props} />
        </div>
      </PopoverTrigger>
      <PopoverContent side='bottom' align='start' className='w-80'>
        <div className='space-y-2'>
          <h4 className='text-sm font-semibold'>{name}</h4>
          <p
            className='text-sm'
            style={{ color: designTokens.colors.muted.foreground }}
          >
            {description}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}
