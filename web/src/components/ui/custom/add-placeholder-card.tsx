import * as React from 'react'
import { Plus } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * Props for AddPlaceholderCard component
 * A clickable placeholder card for adding new items
 */
interface AddPlaceholderCardProps {
  /** Click handler when card is clicked */
  onClick: () => void
  /** Label text displayed below the icon */
  label: string
  /** Disables the card interaction */
  disabled?: boolean
  /** Optional description text below the label */
  description?: string
  /** Custom icon to display instead of default plus */
  icon?: React.ReactNode
  /** Additional CSS classes */
  className?: string
}

/**
 * A reusable placeholder card component for "Add New" actions.
 * Features a dashed border, centered icon, and hover effects.
 *
 * @example
 * ```tsx
 * <AddPlaceholderCard
 *   onClick={handleAdd}
 *   label="Add New Achievement"
 *   disabled={isLoading}
 * />
 * ```
 */
function AddPlaceholderCard({
  onClick,
  label,
  disabled = false,
  description,
  icon,
  className,
}: AddPlaceholderCardProps) {
  const handleClick = () => {
    if (!disabled) {
      onClick()
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!disabled && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      onClick()
    }
  }

  return (
    <div
      role='button'
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-disabled={disabled}
      aria-label={label}
      className={cn(
        // h-full stretches to match sibling cards in CSS Grid (requires auto-rows-fr on parent)
        // min-h-[200px] provides fallback height when no siblings exist
        'group flex h-full min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-background p-8 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-card shadow-sm transition-transform duration-200 group-hover:scale-110'>
        {icon ?? <Plus className='h-6 w-6 text-muted-foreground' />}
      </div>
      <span className='text-lg font-medium text-muted-foreground'>{label}</span>
      {description && (
        <span className='mt-1 text-sm text-muted-foreground/70'>
          {description}
        </span>
      )}
    </div>
  )
}

export { AddPlaceholderCard }
export type { AddPlaceholderCardProps }
