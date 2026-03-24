import * as React from 'react'

import { designTokens } from '@/components/design-system/core'
import { cn } from '@/lib/utils'

/**
 * Standard page container widths
 * - narrow: Focused content (forms, articles) - max-w-4xl (896px)
 * - default: Standard dashboard pages - max-w-6xl (1152px)
 * - wide: Data-heavy pages (tables, analytics, multi-column) - max-w-7xl (1280px)
 * - full: No width restriction - use full available space
 */
export type ContainerWidth = 'narrow' | 'default' | 'wide' | 'full'

/**
 * Standard gap sizes between header and content
 * - none: No gap (for special layouts like full-screen pages)
 * - sm: 16px (space-y-4) - compact layouts
 * - md: 24px (space-y-6) - default
 * - lg: 32px (space-y-8) - spacious layouts
 */
export type ContainerGap = 'none' | 'sm' | 'md' | 'lg'

const WIDTH_CLASSES: Record<ContainerWidth, string> = {
  narrow: 'max-w-4xl',
  default: 'max-w-6xl',
  wide: 'max-w-9xl',
  full: 'max-w-none',
}

const GAP_CLASSES: Record<ContainerGap, string> = {
  none: 'gap-0',
  sm: 'gap-4',
  md: 'gap-6',
  lg: 'gap-8',
}

// ============================================================================
// PageContainer.Header
// ============================================================================

interface PageHeaderProps {
  /**
   * Main page title (required)
   */
  title: string

  /**
   * Optional subtitle or description text
   */
  description?: string

  /**
   * Optional action button slot
   * Accepts any React node (Button, Link, custom component)
   */
  action?: React.ReactNode

  /**
   * Optional className for custom styling
   */
  className?: string
}

/**
 * Page header sub-component for PageContainer
 *
 * @example
 * ```tsx
 * <PageContainer.Header
 *   title="Dashboard"
 *   description="Manage your interview preparations"
 *   action={<Button>New</Button>}
 * />
 * ```
 */
function PageHeader({
  title,
  description,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex-1 space-y-1'>
          <h1
            className='text-2xl font-bold tracking-tight'
            style={{ color: designTokens.colors.foreground }}
          >
            {title}
          </h1>
          {description && (
            <p
              className='text-sm'
              style={{ color: designTokens.colors.muted.foreground }}
            >
              {description}
            </p>
          )}
        </div>
        {action && <div className='shrink-0'>{action}</div>}
      </div>
    </div>
  )
}

PageHeader.displayName = 'PageContainer.Header'

// ============================================================================
// PageContainer.Content
// ============================================================================

interface PageContentProps {
  children: React.ReactNode
  /**
   * Optional className for custom styling
   */
  className?: string
}

/**
 * Page content sub-component for PageContainer
 *
 * @example
 * ```tsx
 * <PageContainer.Content>
 *   <YourContent />
 * </PageContainer.Content>
 * ```
 */
function PageContent({ children, className }: PageContentProps) {
  return <div className={cn('flex-1', className)}>{children}</div>
}

PageContent.displayName = 'PageContainer.Content'

// ============================================================================
// PageContainer (Main Component)
// ============================================================================

interface PageContainerProps {
  children: React.ReactNode
  width?: ContainerWidth
  /**
   * Gap between header and content sections
   * @default 'lg' (32px)
   */
  gap?: ContainerGap
  className?: string
}

/**
 * Page container component with compound sub-components
 *
 * Provides consistent layout structure with:
 * - Configurable max-width (narrow, default, wide, full)
 * - Automatic gap between Header and Content (configurable)
 * - Flex column layout for proper spacing
 *
 * @example
 * ```tsx
 * // Standard usage with header and content
 * <PageContainer>
 *   <PageContainer.Header
 *     title="Dashboard"
 *     description="Manage your preparations"
 *     action={<Button>New</Button>}
 *   />
 *   <PageContainer.Content>
 *     <YourContent />
 *   </PageContainer.Content>
 * </PageContainer>
 * ```
 *
 * @example
 * ```tsx
 * // Full-width with no gap (special layouts)
 * <PageContainer width="full" gap="none" className="py-0">
 *   <FullScreenContent />
 * </PageContainer>
 * ```
 *
 * @example
 * ```tsx
 * // Narrow width for forms
 * <PageContainer width="narrow">
 *   <PageContainer.Header title="Settings" />
 *   <PageContainer.Content>
 *     <SettingsForm />
 *   </PageContainer.Content>
 * </PageContainer>
 * ```
 */
function PageContainerRoot({
  children,
  width = 'default',
  gap = 'lg',
  className,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto flex flex-col py-6',
        WIDTH_CLASSES[width],
        GAP_CLASSES[gap],
        className
      )}
    >
      {children}
    </div>
  )
}

PageContainerRoot.displayName = 'PageContainer'

// ============================================================================
// Compound Component Export
// ============================================================================

/**
 * PageContainer compound component
 *
 * Usage:
 * - PageContainer: Main container with width and gap management
 * - PageContainer.Header: Page header with title, description, and action
 * - PageContainer.Content: Main content wrapper
 */
export const PageContainer = Object.assign(PageContainerRoot, {
  Header: PageHeader,
  Content: PageContent,
})

// Export types for external use
export type { PageContainerProps, PageHeaderProps, PageContentProps }
