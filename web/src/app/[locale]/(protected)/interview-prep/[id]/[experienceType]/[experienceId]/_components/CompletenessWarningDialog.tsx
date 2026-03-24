'use client'

import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface CompletenessWarningDialogProps {
  /** Whether the dialog is open */
  open: boolean
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void
  /** Callback when user clicks "Generate Anyway" */
  onProceed: () => void
  /** Callback when user clicks "Complete Information" */
  onEdit: () => void
}

/**
 * Warning dialog shown when user tries to generate questions
 * for an incomplete key achievement (missing STAR fields)
 *
 * Uses i18n keys from experience-detail.completeness.dialog.*
 */
export function CompletenessWarningDialog({
  open,
  onOpenChange,
  onProceed,
  onEdit,
}: CompletenessWarningDialogProps) {
  const t = useTranslations('experience-detail')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('completeness.dialog.title')}</DialogTitle>
          <DialogDescription className='whitespace-pre-wrap'>
            {t('completeness.dialog.description')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant='outline' onClick={onProceed}>
            {t('completeness.dialog.proceed')}
          </Button>
          <Button onClick={onEdit}>{t('completeness.dialog.edit')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
