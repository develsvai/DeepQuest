import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Variant determines the text styling for the section
 * - default: standard muted text
 * - highlight: bolder foreground text (for results)
 * - italic: italic muted text (for reflections)
 */
type StarSectionVariant = 'default' | 'highlight' | 'italic'

interface StarSectionProps {
  icon: LucideIcon
  label: string
  items: string[]
  variant?: StarSectionVariant
}

const variantStyles: Record<StarSectionVariant, string> = {
  default: 'text-muted-foreground',
  highlight: 'font-semibold text-foreground',
  italic: 'text-muted-foreground italic',
}

/**
 * Reusable STAR section component for displaying achievement details
 * Each section has an icon, label, and bulleted list of items
 */
export function StarSection({
  icon: Icon,
  label,
  items,
  variant = 'default',
}: StarSectionProps) {
  if (items.length === 0) return null

  return (
    <div className='space-y-1.5'>
      <div className='flex items-center gap-2 text-primary'>
        <Icon className='h-4 w-4' />
        <span className='text-sm font-bold tracking-wider uppercase'>
          {label}
        </span>
      </div>
      <ul
        className={cn(
          'space-y-1 text-sm leading-relaxed',
          variantStyles[variant]
        )}
      >
        {items.map((item, idx) => (
          <li key={idx} className='flex items-start gap-2'>
            <span className='mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60' />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
