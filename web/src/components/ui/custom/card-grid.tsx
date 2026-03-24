import * as React from 'react'

import { cn } from '@/lib/utils'

// ==========================================
// Types
// ==========================================

interface CardGridProps {
  children: React.ReactNode
  /** Layout variant: grid (responsive columns) or stack (single column) */
  variant?: 'grid' | 'stack'
  /** Number of columns for grid variant at md breakpoint (default: 2) */
  columns?: 1 | 2 | 3
  /** Gap size (default: 6) */
  gap?: 4 | 6 | 8
  /** Additional className */
  className?: string
}

// ==========================================
// Constants
// ==========================================

const gapClasses: Record<4 | 6 | 8, string> = {
  4: 'gap-4',
  6: 'gap-6',
  8: 'gap-8',
}

const columnClasses: Record<1 | 2 | 3, string> = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
}

// ==========================================
// Component
// ==========================================

/**
 * CardGrid - Flexible layout container for ActionCards
 *
 * Supports two layout variants:
 * - `grid`: Responsive grid layout (1 column on mobile, configurable on md+)
 * - `stack`: Single column vertical stack
 *
 * @example
 * ```tsx
 * // 2-column grid (ExperienceDetail style)
 * <CardGrid variant="grid" columns={2} gap={6}>
 *   {achievements.map(a => <ActionCard key={a.id}>...</ActionCard>)}
 *   <AddPlaceholderCard />
 * </CardGrid>
 *
 * // Single column stack (InterviewPrepDetail style)
 * <CardGrid variant="stack" gap={8}>
 *   {experiences.map(e => <ExperienceCardV2 key={e.id} />)}
 * </CardGrid>
 * ```
 */
function CardGrid({
  children,
  variant = 'grid',
  columns = 2,
  gap = 6,
  className,
}: CardGridProps) {
  const gapClass = gapClasses[gap]

  if (variant === 'stack') {
    // Stack: flex column with gap (space-y equivalent but more flexible)
    return (
      <div
        data-slot='card-grid'
        data-variant='stack'
        className={cn('flex flex-col', gapClass, className)}
      >
        {children}
      </div>
    )
  }

  // Grid: responsive columns with equal row heights
  const columnClass = columnClasses[columns]

  return (
    <div
      data-slot='card-grid'
      data-variant='grid'
      className={cn(
        'grid auto-rows-fr grid-cols-1',
        columnClass,
        gapClass,
        className
      )}
    >
      {children}
    </div>
  )
}

// ==========================================
// Exports
// ==========================================

export { CardGrid }
export type { CardGridProps }
