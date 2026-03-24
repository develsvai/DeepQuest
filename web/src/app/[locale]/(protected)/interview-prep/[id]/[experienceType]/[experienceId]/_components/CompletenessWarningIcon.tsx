'use client'

import { useTranslations } from 'next-intl'
import { AlertTriangle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface CompletenessWarningIconProps {
  /** Whether the achievement is complete (has all STAR fields) */
  isComplete: boolean
}

/**
 * Warning icon with tooltip for incomplete achievements
 * Only renders when isComplete is false
 *
 * Shows an amber AlertTriangle icon with a tooltip explaining
 * that some required STAR fields are missing
 */
export function CompletenessWarningIcon({
  isComplete,
}: CompletenessWarningIconProps) {
  const t = useTranslations('experience-detail')

  if (isComplete) return null

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className='flex items-center justify-center rounded-full bg-amber-500/10 p-1 text-amber-500'>
            <AlertTriangle size={14} />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t('completeness.tooltip')}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
