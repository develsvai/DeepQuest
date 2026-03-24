/**
 * Reusable Collapsible Feedback Section Component
 *
 * A generic collapsible section for displaying feedback items like
 * strengths, weaknesses, and suggestions with consistent styling
 * Supports progressive rendering with fade-in animation during streaming
 */

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { designTokens } from '@/components/design-system/core'
import { MarkdownText } from '@/components/ui/markdown-text'

interface CollapsibleFeedbackSectionProps {
  title: string
  items: string[] | undefined
  icon: LucideIcon
  iconColor: string
  textColor: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export default function CollapsibleFeedbackSection({
  title,
  items,
  icon: Icon,
  iconColor,
  textColor,
  isOpen,
  onOpenChange,
}: CollapsibleFeedbackSectionProps) {
  if (!items || items.length === 0) return null

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <Button
          variant='ghost'
          className='h-auto w-full justify-between p-3'
          style={{
            backgroundColor: designTokens.colors.background,
            borderColor: designTokens.colors.border,
          }}
        >
          <div className='flex items-center gap-2'>
            <Icon className='h-4 w-4' style={{ color: iconColor }} />
            <span className='font-medium' style={{ color: textColor }}>
              {title} ({items.length})
            </span>
          </div>
          {isOpen ? (
            <ChevronUp className='h-4 w-4' />
          ) : (
            <ChevronDown className='h-4 w-4' />
          )}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className='mt-2'>
        <div
          className='space-y-2 rounded-lg p-4'
          style={{
            backgroundColor: designTokens.colors.muted.DEFAULT + '50',
          }}
        >
          <AnimatePresence mode='popLayout'>
            {items.map((item, index) => (
              <motion.div
                key={`${title.toLowerCase()}-item-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className='flex items-start gap-2'
              >
                <Icon
                  className='mt-0.5 h-4 w-4 shrink-0'
                  style={{ color: iconColor }}
                />
                <MarkdownText className='text-sm leading-relaxed'>
                  {item}
                </MarkdownText>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
