import * as React from 'react'

import { cn } from '@/lib/utils'

// ==========================================
// Types
// ==========================================

interface SectionHeaderProps {
  /** Section title text */
  title: React.ReactNode
  /** Show dot indicator before title */
  showDot?: boolean
  /** Title style variant */
  variant?: 'default' | 'uppercase'
  /** Right side content (e.g., action buttons) */
  headerRight?: React.ReactNode
  /** Additional className */
  className?: string
}

// ==========================================
// Component
// ==========================================

/**
 * SectionHeader - Reusable section header with optional dot indicator
 *
 * @example
 * ```tsx
 * // With dot indicator and uppercase (ExperienceDetail style)
 * <SectionHeader
 *   title="Key Achievements (STAR)"
 *   showDot
 *   variant="uppercase"
 * />
 *
 * // Simple header (InterviewPrepDetail style)
 * <SectionHeader title="Experiences" />
 *
 * // With right content
 * <SectionHeader
 *   title="My Section"
 *   headerRight={<Button>Add</Button>}
 * />
 * ```
 */
function SectionHeader({
  title,
  showDot = false,
  variant = 'default',
  headerRight,
  className,
}: SectionHeaderProps) {
  return (
    <div
      data-slot='section-header'
      className={cn('flex items-center justify-between', className)}
    >
      <div className='flex items-center gap-2'>
        {showDot && (
          <div className='h-1.5 w-1.5 rounded-full bg-primary' aria-hidden />
        )}
        <h2
          className={cn(
            'font-bold text-foreground',
            variant === 'uppercase'
              ? 'text-m tracking-wider uppercase'
              : 'text-xl'
          )}
        >
          {title}
        </h2>
      </div>
      {headerRight && <div>{headerRight}</div>}
    </div>
  )
}

// ==========================================
// Exports
// ==========================================

export { SectionHeader }
export type { SectionHeaderProps }
