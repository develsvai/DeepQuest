/**
 * Markdown Text Component
 *
 * Renders markdown content with consistent styling using design tokens.
 * Supports basic markdown (bold, italic) and GitHub Flavored Markdown extensions.
 *
 * @example
 * ```tsx
 * <MarkdownText>This is **bold** and *italic* text</MarkdownText>
 * ```
 */

import React from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { designTokens } from '@/components/design-system/core'
import type { Components } from 'react-markdown'

interface MarkdownTextProps {
  /**
   * Markdown content to render
   */
  children: string
  /**
   * Additional CSS classes to apply to the wrapper
   */
  className?: string
}

/**
 * Custom component overrides for markdown elements
 * Applies design token colors consistently
 */
const markdownComponents: Components = {
  // Bold text - emphasize with primary color
  strong: ({ children }) => (
    <strong
      style={{
        fontWeight: 600,
      }}
    >
      {children}
    </strong>
  ),
  // Italic text - subtle emphasis with muted foreground
  em: ({ children }) => (
    <em
      style={{
        fontStyle: 'italic',
        color: designTokens.colors.muted.foreground,
      }}
    >
      {children}
    </em>
  ),
  // Paragraphs - render as span for inline usage
  p: ({ children }) => <span>{children}</span>,
}

/**
 * MarkdownText component for rendering simple markdown in inline contexts
 *
 * Uses react-markdown with remark-gfm for GitHub Flavored Markdown support.
 * Automatically applies design tokens for consistent styling.
 */
export const MarkdownText = React.memo(function MarkdownText({
  children,
  className,
}: MarkdownTextProps) {
  return (
    <span className={className}>
      <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {children}
      </Markdown>
    </span>
  )
})
