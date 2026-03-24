import { getTranslations } from 'next-intl/server'
import { FileQuestion } from 'lucide-react'

import { Link } from '@/i18n/navigation'
import { routes } from '@/lib/routes'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

/**
 * Not Found page for protected routes
 *
 * Displayed when `notFound()` is called within (protected) route segment.
 * Uses server-side translations for SEO and performance.
 *
 * Common triggers:
 * - Invalid interview preparation ID
 * - Deleted or non-existent resources
 * - Invalid experience/question IDs
 */
export default async function ProtectedNotFound() {
  const t = await getTranslations('errors.notFound')

  return (
    <div className='flex min-h-[50vh] items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted'>
            <FileQuestion className='h-6 w-6 text-muted-foreground' />
          </div>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className='w-full'>
            <Link href={routes.dashboard}>{t('backToDashboard')}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
