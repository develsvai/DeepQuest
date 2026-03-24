'use client'

import { ArrowLeft } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { routes } from '@/lib/routes'

import { Button } from '@/components/ui/button'

/**
 * BackToDashboardButton Component
 *
 * Navigation button to return to the dashboard from interview prep pages.
 * Client component using next-intl hooks for translations.
 */
export function BackToDashboardButton() {
  const t = useTranslations('common.actions')

  return (
    <Button variant='ghost' size='sm' asChild>
      <Link href={routes.dashboard} className='gap-2'>
        <ArrowLeft className='h-4 w-4' />
        {t('backToDashboard')}
      </Link>
    </Button>
  )
}
