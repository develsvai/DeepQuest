import * as React from 'react'
import { Fragment } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Pencil } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Metadata item with icon + label pattern
 * Used for displaying structured information like position, date, team size
 */
export interface MetadataItem {
  /** Lucide icon component */
  icon: LucideIcon
  /** Display label/value */
  label: string
  /** Optional: hide this item conditionally */
  hidden?: boolean
}

/**
 * Badge configuration for type indicators
 */
export interface DetailBadge {
  /** Badge text content */
  label: string
  /** Badge variant from shadcn/ui Badge */
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
  /** Optional: hide this badge conditionally */
  hidden?: boolean
}

/**
 * Tag configuration for tech stack or similar lists
 */
export interface DetailTag {
  /** Unique key for React rendering */
  key: string
  /** Tag text content */
  label: string
}

/**
 * DetailHeader Props Interface
 */
export interface DetailHeaderProps {
  /** Main title text (required) - rendered as h1 with text-3xl */
  title: string

  /** Metadata items with icon + label, separated by pipes */
  metadata?: MetadataItem[]

  /** Badges for type indicators */
  badges?: DetailBadge[]

  /** Tags for tech stack or similar categorization */
  tags?: DetailTag[]

  /** Description text with prose styling */
  description?: string

  /** Action slot (button, dropdown) positioned top-right */
  action?: React.ReactNode

  /** Edit button click handler (hidden if not provided) */
  onEdit?: () => void

  /** Edit button label */
  editLabel?: string

  /** Custom className */
  className?: string
}

/**
 * DetailHeader Component
 *
 * Generalized header for detail pages with title, metadata, badges, tags, and description.
 * Server component by default - no client-side hooks.
 *
 * @example
 * ```tsx
 * <DetailHeader
 *   title="Google"
 *   metadata={[
 *     { icon: Building2, label: 'Senior Engineer' },
 *     { icon: Calendar, label: '2020 - 2024' },
 *   ]}
 *   badges={[{ label: 'Career', variant: 'default' }]}
 *   tags={[{ key: 'ts', label: 'TypeScript' }]}
 *   description="Led infrastructure team..."
 * />
 * ```
 */
export function DetailHeader({
  title,
  metadata,
  badges,
  tags,
  description,
  action,
  onEdit,
  editLabel = 'Edit',
  className,
}: DetailHeaderProps) {
  const visibleMetadata = metadata?.filter(item => !item.hidden) ?? []
  const visibleBadges =
    badges?.filter(badge => !badge.hidden && badge.label) ?? []

  return (
    <div className={cn('space-y-4', className)}>
      {/* Title Row with Optional Action */}
      <div className='flex items-start justify-between'>
        <div className='space-y-1'>
          <h1 className='text-3xl font-medium tracking-tight text-foreground'>
            {title}
          </h1>

          {/* Metadata Line with Pipe Separators */}
          {visibleMetadata.length > 0 && (
            <div className='flex items-center gap-2 text-muted-foreground'>
              {visibleMetadata.map((item, index) => (
                <Fragment key={index}>
                  {index > 0 && <span className='text-border'>|</span>}
                  <item.icon className='h-4 w-4' />
                  <span className='font-medium'>{item.label}</span>
                </Fragment>
              ))}
            </div>
          )}
        </div>

        {/* Edit Button & Action */}
        {(onEdit || action) && (
          <div className='flex shrink-0 items-center gap-2'>
            {onEdit && (
              <Button variant='outline' size='sm' onClick={onEdit}>
                <Pencil className='size-3.5' />
                {editLabel}
              </Button>
            )}
            {action}
          </div>
        )}
      </div>

      {/* Badges Row */}
      {visibleBadges.length > 0 && (
        <div className='flex items-center gap-2'>
          {visibleBadges.map((badge, index) => (
            <Badge key={index} variant={badge.variant ?? 'default'}>
              {badge.label}
            </Badge>
          ))}
        </div>
      )}

      {/* Tags Row */}
      {tags && tags.length > 0 && (
        <div className='flex flex-wrap gap-2'>
          {tags.map(tag => (
            <Badge
              key={tag.key}
              variant='secondary'
              className='border-0 bg-muted font-normal text-muted-foreground hover:bg-muted/80'
            >
              {tag.label}
            </Badge>
          ))}
        </div>
      )}

      {/* Description */}
      {description && (
        <div className='prose prose-stone max-w-none'>
          <p className='text-lg leading-relaxed text-muted-foreground'>
            {description}
          </p>
        </div>
      )}
    </div>
  )
}
