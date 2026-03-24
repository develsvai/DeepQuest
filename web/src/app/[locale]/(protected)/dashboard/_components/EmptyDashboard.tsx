'use client'

import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { routes } from '@/lib/routes'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { designTokens } from '@/components/design-system/core'

/**
 * Empty dashboard state component
 *
 * Displayed when the user has no interview preparations yet.
 * Provides encouragement and a clear call-to-action to create
 * their first interview preparation.
 */
export function EmptyDashboard() {
  const t = useTranslations('dashboard.empty')

  return (
    <div className='flex min-h-[400px] flex-col items-center justify-center space-y-6'>
      <Card className='w-full max-w-lg'>
        <CardContent className='space-y-6 p-8 text-center'>
          {/* Empty State Illustration */}
          <div
            className='mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full'
            style={{ backgroundColor: designTokens.colors.muted.DEFAULT }}
          >
            <div
              className='h-12 w-12 rounded-full border-2 border-dashed'
              style={{ borderColor: designTokens.colors.muted.foreground }}
            >
              <div className='flex h-full w-full items-center justify-center'>
                <span
                  className='text-2xl'
                  style={{ color: designTokens.colors.muted.foreground }}
                >
                  📋
                </span>
              </div>
            </div>
          </div>

          {/* Empty State Content */}
          <div className='space-y-3'>
            <h2
              className='text-xl font-semibold tracking-tight'
              style={{ color: designTokens.colors.foreground }}
            >
              {t('title')}
            </h2>

            <h3
              className='text-lg font-medium'
              style={{ color: designTokens.colors.primary.DEFAULT }}
            >
              {t('subtitle')}
            </h3>

            <p
              className='mx-auto max-w-md text-sm leading-relaxed'
              style={{ color: designTokens.colors.muted.foreground }}
            >
              {t('description')}
            </p>
          </div>

          {/* Call to Action */}
          <div className='pt-2'>
            <Button asChild size='lg' className='w-full sm:w-auto'>
              <Link href={routes.interviewPrep.new}>{t('cta')}</Link>
            </Button>
          </div>

          {/* Additional Help Text */}
          <div
            className='border-t pt-4'
            style={{ borderColor: designTokens.colors.border }}
          >
            <p
              className='text-xs'
              style={{ color: designTokens.colors.muted.foreground }}
            >
              {t('helpText')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
