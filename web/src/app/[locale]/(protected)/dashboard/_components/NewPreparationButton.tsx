'use client'

import { Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { routes } from '@/lib/routes'

import { Button } from '@/components/ui/button'

/**
 * NewPreparationButton Component
 *
 * Navigation button to create a new interview preparation.
 * Client component using next-intl hooks for translations.
 */
export function NewPreparationButton() {
  const t = useTranslations('dashboard.actions')

  return (
    <Button asChild size='default'>
      <Link href={routes.interviewPrep.new} className='gap-2'>
        <Plus className='h-4 w-4' />
        {t('newPreparation')}
      </Link>
    </Button>
  )
}
