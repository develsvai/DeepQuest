'use client'

import { Edit, MoreHorizontal, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import * as React from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

// ==========================================
// Types
// ==========================================

/**
 * Action item for dropdown menu
 */
interface ActionCardAction {
  /** Label displayed in dropdown */
  label: string
  /** Icon component (e.g., <Pencil className='mr-2 h-4 w-4' />) */
  icon?: React.ReactNode
  /** Click handler */
  onClick: () => void
  /** Visual variant - destructive shows red text */
  variant?: 'default' | 'destructive'
  /** Disable this action */
  disabled?: boolean
}

/**
 * Progress section configuration
 */
interface ActionCardProgress {
  /** Label text (e.g., "Questions") */
  label: string
  /** Icon component for label */
  icon?: React.ReactNode
  /** Current completed count */
  completed: number
  /** Total count */
  total: number
  /** Custom progress bar className */
  progressClassName?: string
}

// ==========================================
// Component Props
// ==========================================

interface ActionCardProps extends React.ComponentProps<'div'> {
  children: React.ReactNode
}

interface ActionCardHeaderProps {
  /** Leading icon displayed to the left of title/subtitle, vertically centered */
  leadingIcon?: React.ReactNode
  /** Title content (string or ReactNode) */
  title: React.ReactNode
  /** Optional subtitle/description below title */
  subtitle?: React.ReactNode
  /** Dropdown actions (Edit, Delete, etc.) - renders MoreHorizontal trigger */
  actions?: ActionCardAction[]
  /** Disable all actions */
  actionsDisabled?: boolean
  /** Content rendered on the right side, adjacent to actions dropdown (e.g., date) */
  headerRight?: React.ReactNode
  /** Additional content in the middle area */
  children?: React.ReactNode
  /** Additional className for the header */
  className?: string
}

interface ActionCardContentProps extends React.ComponentProps<'div'> {
  children: React.ReactNode
}

interface ActionCardFooterProps extends React.ComponentProps<'div'> {
  /** Progress section configuration (optional) */
  progress?: ActionCardProgress
  /** Action buttons slot (optional) */
  actions?: React.ReactNode
  /** Additional footer content (optional) */
  children?: React.ReactNode
}

interface ActionCardActionsProps {
  /** Action items for dropdown */
  actions: ActionCardAction[]
  /** Disable all actions */
  disabled?: boolean
  /** Additional className for trigger button */
  className?: string
}

// ==========================================
// Components
// ==========================================

/**
 * Root ActionCard container
 * Provides group class for hover state management
 * Uses h-full to stretch and fill parent grid cell (requires auto-rows-fr on parent grid)
 */
function ActionCard({ className, children, ...props }: ActionCardProps) {
  return (
    <Card
      data-slot='action-card'
      className={cn(
        'group flex h-full flex-col overflow-hidden pb-0',
        className
      )}
      {...props}
    >
      {children}
    </Card>
  )
}

/**
 * ActionCard header with title and optional dropdown actions
 */
function ActionCardHeader({
  leadingIcon,
  title,
  subtitle,
  actions,
  actionsDisabled = false,
  headerRight,
  className,
  children,
}: ActionCardHeaderProps) {
  return (
    <CardHeader
      data-slot='action-card-header'
      className={cn('gap-0 space-y-0', className)}
    >
      <div className='flex items-start justify-between'>
        <div className='flex items-center gap-3'>
          {leadingIcon && (
            <div className='flex shrink-0 items-center'>{leadingIcon}</div>
          )}
          <div className='space-y-1'>
            <CardTitle className='text-lg leading-tight font-bold text-foreground'>
              {title}
            </CardTitle>
            {subtitle && (
              <div className='text-sm text-muted-foreground'>{subtitle}</div>
            )}
          </div>
        </div>

        {children}

        {/* Right section: headerRight + actions */}
        {(headerRight || (actions && actions.length > 0)) && (
          <div className='flex items-start gap-4'>
            {headerRight}
            {actions && actions.length > 0 && (
              <ActionCardActions actions={actions} disabled={actionsDisabled} />
            )}
          </div>
        )}
      </div>
    </CardHeader>
  )
}

/**
 * ActionCard content area
 * Pass-through to CardContent with flex-1 for proper layout
 */
function ActionCardContent({
  className,
  children,
  ...props
}: ActionCardContentProps) {
  return (
    <CardContent
      data-slot='action-card-content'
      className={cn('flex-1', className)}
      {...props}
    >
      {children}
    </CardContent>
  )
}

/**
 * ActionCard footer with optional progress bar and action buttons
 * Returns null if no content is provided
 */
function ActionCardFooter({
  progress,
  actions,
  className,
  children,
  ...props
}: ActionCardFooterProps) {
  // Don't render if no content
  if (!progress && !actions && !children) {
    return null
  }

  return (
    <CardFooter
      data-slot='action-card-footer'
      className={cn(
        // add flex-wrap
        'flex flex-col flex-wrap gap-3 border-t bg-muted/50 px-6 py-3',
        className
      )}
      {...props}
    >
      {/* Progress section */}
      {progress && (
        <div className='flex w-full items-center gap-3'>
          <span className='text-xm flex items-center gap-1.5 text-muted-foreground'>
            {progress.icon}
            {progress.label}
          </span>
          <div className='flex flex-1 items-center gap-2'>
            <Progress
              value={
                progress.total > 0
                  ? (progress.completed / progress.total) * 100
                  : 0
              }
              className={cn('h-3 flex-1', progress.progressClassName)}
            />
            <span className='text-m font-medium text-foreground'>
              {progress.completed}/{progress.total}
            </span>
          </div>
        </div>
      )}

      {/* Actions section */}
      {actions && (
        <div className='flex w-full flex-wrap items-center justify-between'>
          {actions}
        </div>
      )}

      {/* Custom children */}
      {children}
    </CardFooter>
  )
}

/**
 * Standalone hover actions dropdown menu
 * Can be placed anywhere within ActionCard (flexible placement)
 * Uses group-hover to show/hide on card hover
 * Destructive actions will show a confirmation dialog before executing
 */
function ActionCardActions({
  actions,
  disabled,
  className,
}: ActionCardActionsProps) {
  const t = useTranslations('common.deleteConfirmation')
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [pendingAction, setPendingAction] =
    React.useState<ActionCardAction | null>(null)

  const handleActionClick = (action: ActionCardAction) => {
    if (action.variant === 'destructive') {
      setPendingAction(action)
      setDeleteDialogOpen(true)
    } else {
      action.onClick()
    }
  }

  const handleConfirmDelete = () => {
    pendingAction?.onClick()
    setDeleteDialogOpen(false)
    setPendingAction(null)
  }

  const handleDialogOpenChange = (open: boolean) => {
    setDeleteDialogOpen(open)
    if (!open) {
      setPendingAction(null)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            size='icon'
            className={cn(
              '-mr-2 h-8 w-8 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100',
              className
            )}
            disabled={disabled}
          >
            <MoreHorizontal className='h-4 w-4' />
            <span className='sr-only'>Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          {actions.map((action, index) => (
            <DropdownMenuItem
              key={index}
              onClick={() => handleActionClick(action)}
              disabled={action.disabled}
              variant={action.variant}
            >
              {action.icon}
              {action.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={handleDialogOpenChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className={buttonVariants({ variant: 'destructive' })}
            >
              {t('confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ==========================================
// Utility Functions
// ==========================================

/**
 * Options for creating edit/delete action pair
 */
interface CreateEditDeleteActionsOptions {
  /** Handler called when Edit action is clicked */
  onEdit: () => void
  /** Handler called when Delete action is clicked */
  onDelete: () => void
  /** Custom labels for actions (default: 'Edit' and 'Delete') */
  labels?: {
    edit?: string
    delete?: string
  }
  /** Icon size in pixels (default: 14) */
  iconSize?: number
}

/**
 * Creates a standard Edit + Delete action pair for ActionCard
 * Provides consistent styling and behavior across all card components
 *
 * @example
 * ```tsx
 * const actions = createEditDeleteActions({
 *   onEdit: () => setDialogOpen(true),
 *   onDelete: () => handleDelete(item.id),
 * })
 *
 * <ActionCardHeader actions={actions} />
 * ```
 */
function createEditDeleteActions({
  onEdit,
  onDelete,
  labels,
  iconSize = 14,
}: CreateEditDeleteActionsOptions): ActionCardAction[] {
  return [
    {
      label: labels?.edit ?? 'Edit',
      icon: <Edit size={iconSize} />,
      onClick: onEdit,
    },
    {
      label: labels?.delete ?? 'Delete',
      icon: <Trash2 size={iconSize} />,
      onClick: onDelete,
      variant: 'destructive',
    },
  ]
}

// ==========================================
// Exports
// ==========================================

export {
  ActionCard,
  ActionCardHeader,
  ActionCardContent,
  ActionCardFooter,
  ActionCardActions,
  createEditDeleteActions,
}

export type {
  ActionCardProps,
  ActionCardHeaderProps,
  ActionCardContentProps,
  ActionCardFooterProps,
  ActionCardActionsProps,
  ActionCardAction,
  ActionCardProgress,
  CreateEditDeleteActionsOptions,
}
