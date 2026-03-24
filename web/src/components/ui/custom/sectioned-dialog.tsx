import * as React from 'react'
import {
  useState,
  useCallback,
  createContext,
  useContext,
  useMemo,
} from 'react'
import { useTranslations } from 'next-intl'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { cn } from '@/lib/utils'

// ==========================================
// Types
// ==========================================

/**
 * Max width options for the dialog
 */
type DialogMaxWidth = 'sm' | 'md' | 'lg' | 'xl'

interface SectionedDialogProps {
  /** Whether the dialog is open */
  open: boolean
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void
  /** Maximum width of the dialog (default: 'md') */
  maxWidth?: DialogMaxWidth
  /** Additional className for DialogContent */
  className?: string
  /** Dialog content (Header, Body, Footer) */
  children: React.ReactNode
  /** Whether the form has unsaved changes (enables close confirmation) */
  isDirty?: boolean
}

interface SectionedDialogHeaderProps {
  /** Dialog title */
  title: React.ReactNode
  /** Optional description below title */
  description?: React.ReactNode
  /** Optional icon before title */
  icon?: React.ReactNode
  /** Additional className */
  className?: string
}

interface SectionedDialogBodyProps {
  /** Body content */
  children: React.ReactNode
  /** Additional className */
  className?: string
}

interface SectionedDialogFooterProps {
  /** Left side content (e.g., status text like "3 items selected") */
  leftContent?: React.ReactNode
  /** Right side content (buttons) */
  children: React.ReactNode
  /** Additional className */
  className?: string
}

// ==========================================
// Constants
// ==========================================

const maxWidthMap: Record<DialogMaxWidth, string> = {
  sm: 'sm:max-w-[500px]',
  md: 'sm:max-w-[600px]',
  lg: 'sm:max-w-[700px]',
  xl: 'sm:max-w-[800px]',
}

// ==========================================
// Context
// ==========================================

interface SectionedDialogContextValue {
  /** Request to close the dialog - triggers confirmation if dirty */
  requestClose: () => void
}

const SectionedDialogContext =
  createContext<SectionedDialogContextValue | null>(null)

/**
 * Hook to access SectionedDialog context
 *
 * Use this hook in child components (like Footer) to request dialog close
 * in a way that respects the isDirty state and shows confirmation if needed.
 *
 * @example
 * ```tsx
 * function MyDialogFooter() {
 *   const { requestClose } = useSectionedDialog()
 *   return <Button onClick={requestClose}>Cancel</Button>
 * }
 * ```
 */
function useSectionedDialog(): SectionedDialogContextValue {
  const context = useContext(SectionedDialogContext)
  if (!context) {
    throw new Error('useSectionedDialog must be used within SectionedDialog')
  }
  return context
}

// ==========================================
// Components
// ==========================================

/**
 * SectionedDialog - Dialog with distinct header, body, and footer sections
 *
 * @example
 * ```tsx
 * <SectionedDialog open={open} onOpenChange={setOpen} maxWidth="lg">
 *   <SectionedDialogHeader
 *     icon={<Sparkles className="h-5 w-5" />}
 *     title="Generate Questions"
 *     description="Select topics to focus on."
 *   />
 *   <SectionedDialogBody>
 *     {content}
 *   </SectionedDialogBody>
 *   <SectionedDialogFooter leftContent={<span>3 selected</span>}>
 *     <Button>Submit</Button>
 *   </SectionedDialogFooter>
 * </SectionedDialog>
 * ```
 */
function SectionedDialog({
  open,
  onOpenChange,
  maxWidth = 'md',
  className,
  children,
  isDirty = false,
}: SectionedDialogProps) {
  const t = useTranslations('common.unsavedChanges')
  const [showConfirmation, setShowConfirmation] = useState(false)

  // Handle close attempt - show confirmation if dirty
  const handleCloseAttempt = useCallback(() => {
    if (isDirty) {
      setShowConfirmation(true)
    } else {
      onOpenChange(false)
    }
  }, [isDirty, onOpenChange])

  // Confirm discard - close both dialogs
  const handleConfirmClose = useCallback(() => {
    setShowConfirmation(false)
    onOpenChange(false)
  }, [onOpenChange])

  // Cancel discard - keep editing
  const handleCancelClose = useCallback(() => {
    setShowConfirmation(false)
  }, [])

  // Intercept onOpenChange to check dirty state
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen && isDirty) {
        handleCloseAttempt()
      } else {
        onOpenChange(newOpen)
      }
    },
    [isDirty, handleCloseAttempt, onOpenChange]
  )

  // Context value for child components (e.g., Cancel button)
  const contextValue = useMemo<SectionedDialogContextValue>(
    () => ({ requestClose: handleCloseAttempt }),
    [handleCloseAttempt]
  )

  return (
    <SectionedDialogContext.Provider value={contextValue}>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          data-slot='sectioned-dialog'
          className={cn(
            'flex max-h-[90vh] flex-col gap-0 p-0',
            maxWidthMap[maxWidth],
            className
          )}
          onInteractOutside={e => {
            if (isDirty) {
              e.preventDefault()
              handleCloseAttempt()
            }
          }}
          onEscapeKeyDown={e => {
            if (isDirty) {
              e.preventDefault()
              handleCloseAttempt()
            }
          }}
        >
          {children}
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelClose}>
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClose}>
              {t('confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SectionedDialogContext.Provider>
  )
}

/**
 * SectionedDialogHeader - Fixed header with border separation
 */
function SectionedDialogHeader({
  title,
  description,
  icon,
  className,
}: SectionedDialogHeaderProps) {
  return (
    <DialogHeader
      data-slot='sectioned-dialog-header'
      className={cn('border-b px-6 py-4', className)}
    >
      <DialogTitle className='flex items-center gap-2'>
        {icon}
        {title}
      </DialogTitle>
      {description && <DialogDescription>{description}</DialogDescription>}
    </DialogHeader>
  )
}

/**
 * SectionedDialogBody - Scrollable content area
 */
function SectionedDialogBody({
  children,
  className,
}: SectionedDialogBodyProps) {
  return (
    <div
      data-slot='sectioned-dialog-body'
      className={cn('flex-1 overflow-y-auto px-6 py-4', className)}
    >
      {children}
    </div>
  )
}

/**
 * SectionedDialogFooter - Fixed footer with border separation
 * Supports left content (status text) and right content (buttons)
 */
function SectionedDialogFooter({
  leftContent,
  children,
  className,
}: SectionedDialogFooterProps) {
  const hasLeftContent = leftContent !== undefined

  return (
    <div
      data-slot='sectioned-dialog-footer'
      className={cn(
        'border-t px-6 py-4',
        hasLeftContent
          ? 'flex items-center justify-between'
          : 'flex justify-end gap-2',
        className
      )}
    >
      {hasLeftContent && <div>{leftContent}</div>}
      <div className={cn('flex gap-2')}>{children}</div>
    </div>
  )
}

// ==========================================
// Exports
// ==========================================

export {
  SectionedDialog,
  SectionedDialogHeader,
  SectionedDialogBody,
  SectionedDialogFooter,
  useSectionedDialog,
}

export type {
  SectionedDialogProps,
  SectionedDialogHeaderProps,
  SectionedDialogBodyProps,
  SectionedDialogFooterProps,
  DialogMaxWidth,
}
