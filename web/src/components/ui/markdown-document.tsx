/**
 * Markdown Document Component
 *
 * Renders full markdown documents with comprehensive styling using design tokens.
 * Supports headings, tables, lists, links, blockquotes, horizontal rules, and more.
 * Designed for legal documents, terms of service, and privacy policies.
 *
 * @example
 * ```tsx
 * <MarkdownDocument>{markdownContent}</MarkdownDocument>
 * ```
 */

import React from 'react'
import Markdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import { designTokens } from '@/components/design-system/core'
import type { Components } from 'react-markdown'
import { cn } from '@/lib/utils'

interface MarkdownDocumentProps {
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
  // Headings
  h1: ({ children }) => (
    <h1
      className='mt-8 mb-6 scroll-m-20 text-3xl font-bold tracking-tight first:mt-0'
      style={{ color: designTokens.colors.foreground }}
    >
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2
      className='mt-8 mb-4 scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight first:mt-0'
      style={{
        color: designTokens.colors.foreground,
        borderColor: designTokens.colors.border,
      }}
    >
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3
      className='mt-6 mb-3 scroll-m-20 text-xl font-semibold tracking-tight'
      style={{ color: designTokens.colors.foreground }}
    >
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4
      className='mt-4 mb-2 scroll-m-20 text-lg font-semibold tracking-tight'
      style={{ color: designTokens.colors.foreground }}
    >
      {children}
    </h4>
  ),
  h5: ({ children }) => (
    <h5
      className='mt-4 mb-2 scroll-m-20 text-base font-semibold tracking-tight'
      style={{ color: designTokens.colors.foreground }}
    >
      {children}
    </h5>
  ),
  h6: ({ children }) => (
    <h6
      className='mt-4 mb-2 scroll-m-20 text-sm font-semibold tracking-tight'
      style={{ color: designTokens.colors.muted.foreground }}
    >
      {children}
    </h6>
  ),

  // Paragraphs
  p: ({ children }) => (
    <p
      className='mb-4 leading-7 last:mb-0'
      style={{ color: designTokens.colors.foreground }}
    >
      {children}
    </p>
  ),

  // Bold text
  strong: ({ children }) => (
    <strong
      className='font-semibold'
      style={{ color: designTokens.colors.foreground }}
    >
      {children}
    </strong>
  ),

  // Italic text
  em: ({ children }) => (
    <em
      className='italic'
      style={{ color: designTokens.colors.muted.foreground }}
    >
      {children}
    </em>
  ),

  // Links
  a: ({ href, children }) => (
    <a
      href={href}
      className='font-medium underline underline-offset-4 transition-colors hover:opacity-80'
      style={{ color: designTokens.colors.primary.DEFAULT }}
      target='_blank'
      rel='noopener noreferrer'
    >
      {children}
    </a>
  ),

  // Blockquotes
  blockquote: ({ children }) => (
    <blockquote
      className='my-4 border-l-4 py-2 pl-4'
      style={{
        borderColor: designTokens.colors.primary.DEFAULT,
        backgroundColor: designTokens.colors.muted.DEFAULT,
      }}
    >
      {children}
    </blockquote>
  ),

  // Horizontal rule
  hr: () => (
    <hr className='my-8' style={{ borderColor: designTokens.colors.border }} />
  ),

  // Unordered lists
  ul: ({ children }) => (
    <ul className='my-4 ml-6 list-disc space-y-2'>{children}</ul>
  ),

  // Ordered lists
  ol: ({ children }) => (
    <ol className='my-4 ml-6 list-decimal space-y-2'>{children}</ol>
  ),

  // List items
  li: ({ children }) => (
    <li className='leading-7' style={{ color: designTokens.colors.foreground }}>
      {children}
    </li>
  ),

  // Code inline
  code: ({ children }) => (
    <code
      className='relative rounded px-1.5 py-0.5 font-mono text-sm'
      style={{
        backgroundColor: designTokens.colors.muted.DEFAULT,
        color: designTokens.colors.foreground,
      }}
    >
      {children}
    </code>
  ),

  // Code block
  pre: ({ children }) => (
    <pre
      className='my-4 overflow-x-auto rounded-lg p-4'
      style={{
        backgroundColor: designTokens.colors.muted.DEFAULT,
      }}
    >
      {children}
    </pre>
  ),

  // Tables
  table: ({ children }) => (
    <div className='my-6 w-full overflow-auto'>
      <table
        className='w-full border-collapse text-sm'
        style={{ borderColor: designTokens.colors.border }}
      >
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead style={{ backgroundColor: designTokens.colors.muted.DEFAULT }}>
      {children}
    </thead>
  ),
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => (
    <tr
      className='border-b transition-colors hover:bg-muted/50'
      style={{ borderColor: designTokens.colors.border }}
    >
      {children}
    </tr>
  ),
  th: ({ children }) => (
    <th
      className='border px-4 py-2 text-left font-semibold'
      style={{
        borderColor: designTokens.colors.border,
        color: designTokens.colors.foreground,
      }}
    >
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td
      className='border px-4 py-2'
      style={{
        borderColor: designTokens.colors.border,
        color: designTokens.colors.foreground,
      }}
    >
      {children}
    </td>
  ),
}

/**
 * MarkdownDocument component for rendering full markdown documents
 *
 * Uses react-markdown with remark-gfm for GitHub Flavored Markdown support.
 * Automatically applies design tokens for consistent styling.
 */
export const MarkdownDocument = React.memo(function MarkdownDocument({
  children,
  className,
}: MarkdownDocumentProps) {
  return (
    <article className={cn('prose prose-stone max-w-none', className)}>
      <Markdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={markdownComponents}
      >
        {children}
      </Markdown>
    </article>
  )
})
