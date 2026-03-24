'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import * as Sentry from '@sentry/nextjs'
import { AlertCircle, RefreshCw } from 'lucide-react'

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

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Error boundary for protected routes
 *
 * Catches uncaught exceptions in (protected) route segment and displays
 * a user-friendly error UI with recovery options.
 *
 * Features:
 * - Sentry error reporting with context
 * - Localized error messages (ko/en)
 * - Reset button to retry rendering
 * - Navigation back to dashboard
 * - Dev-only error details
 *
 * Authentication is guaranteed by Clerk middleware in proxy.ts,
 * so this boundary only handles unexpected runtime errors.
 */
export default function ProtectedError({ error, reset }: ErrorProps) {
  const t = useTranslations('errors.unexpected')

  useEffect(() => {
    Sentry.captureException(error, {
      tags: {
        error_boundary: 'protected',
        error_name: error.name,
      },
      extra: {
        digest: error.digest,
      },
    })
  }, [error])

  return (
    <div className='flex min-h-[50vh] items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10'>
            <AlertCircle className='h-6 w-6 text-destructive' />
          </div>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col gap-3'>
          <Button onClick={reset} className='w-full'>
            <RefreshCw className='mr-2 h-4 w-4' />
            {t('retry')}
          </Button>
          <Button variant='outline' asChild className='w-full'>
            <Link href={routes.dashboard}>{t('backToDashboard')}</Link>
          </Button>
          {process.env.NODE_ENV === 'development' && (
            <details className='mt-4 rounded-md bg-muted p-3 text-xs'>
              <summary className='cursor-pointer font-medium'>
                Error Details (Dev Only)
              </summary>
              <pre className='mt-2 overflow-auto whitespace-pre-wrap'>
                {error.message}
                {error.digest && `\nDigest: ${error.digest}`}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
