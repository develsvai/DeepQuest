/**
 * Highlighted Example Component
 *
 * Displays structured guide answer paragraphs with color-coded highlighting
 * Each paragraph shows a tooltip with its section name on hover
 * Supports progressive rendering with fade-in animation during streaming
 */

import { useState, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { designTokens } from '@/components/design-system/core'
import {
  getHighlightColor,
  getHoveredHighlightColor,
} from '@/lib/utils/feedback-highlight'
import type { Paragraph } from '@/server/services/ai/contracts/schemas/questionFeedbackGen'
import { MarkdownText } from '@/components/ui/markdown-text'

interface HighlightedExampleProps {
  paragraphs: Paragraph[]
}

const HighlightedExample = memo(function HighlightedExample({
  paragraphs,
}: HighlightedExampleProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <div
      className='rounded-lg p-4'
      style={{ backgroundColor: designTokens.colors.muted.DEFAULT }}
    >
      <TooltipProvider>
        <div className='space-y-2'>
          <AnimatePresence mode='popLayout'>
            {paragraphs.map((paragraph, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <Tooltip delayDuration={200}>
                  <TooltipTrigger asChild>
                    <span
                      className='block cursor-default rounded-sm text-sm leading-relaxed transition-all'
                      style={{
                        backgroundColor:
                          hoveredIndex === index
                            ? getHoveredHighlightColor(index)
                            : getHighlightColor(index),
                        padding: '8px 12px',
                      }}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      <MarkdownText>{paragraph.content}</MarkdownText>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className='text-sm font-medium'>
                      {paragraph.structureSectionName}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </TooltipProvider>
    </div>
  )
})

export default HighlightedExample
