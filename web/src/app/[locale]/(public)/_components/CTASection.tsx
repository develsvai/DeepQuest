'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { routes } from '@/lib/routes'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Clock, ArrowRight, Users } from 'lucide-react'
import { useInView } from '@/hooks/useInView'
import posthog from 'posthog-js'
import { POSTHOG_EVENTS } from '@/lib/posthog-events'

const DISCORD_LINK = 'https://discord.gg/w749smqq8Y'

export function CTASection() {
  const t = useTranslations('landing.cta')
  const { ref, isInView } = useInView({ threshold: 0.3 })

  return (
    <section
      id='cta'
      ref={ref}
      className='relative overflow-hidden py-28 md:py-36'
    >
      {/* Multi-layer gradient background */}
      <div className='absolute inset-0 -z-10'>
        {/* Base gradient */}
        <div
          className={cn(
            'absolute inset-0',
            'bg-linear-to-b from-background via-accent/20 to-background'
          )}
        />

        {/* Radial accent */}
        <div
          className={cn(
            'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'aspect-square w-[150%]',
            'bg-gradient-radial from-primary/5 via-transparent to-transparent',
            'opacity-50'
          )}
        />

        {/* Subtle noise texture */}
        <div
          className={cn(
            'absolute inset-0',
            'opacity-[0.03] dark:opacity-[0.02]'
          )}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Decorative elements */}
      <div
        className={cn(
          'absolute top-20 left-10 md:left-20',
          'h-32 w-32 md:h-48 md:w-48',
          'rounded-full bg-primary/10',
          'blur-3xl',
          'pointer-events-none'
        )}
      />
      <div
        className={cn(
          'absolute right-10 bottom-20 md:right-20',
          'h-40 w-40 md:h-56 md:w-56',
          'rounded-full bg-primary/10',
          'blur-3xl',
          'pointer-events-none'
        )}
      />

      <div className='relative container mx-auto px-6 lg:px-8'>
        <div className='mx-auto max-w-2xl text-center'>
          {/* Headline */}
          <h2
            className={cn(
              'text-[clamp(1.75rem,5vw,3rem)]',
              'leading-tight font-bold',
              'tracking-[-0.02em]',
              'text-foreground',
              'mb-4',
              isInView
                ? 'translate-y-0 opacity-100'
                : 'translate-y-6 opacity-0',
              'transition-all duration-700'
            )}
          >
            {t('headlinePrefix')}{' '}
            <span className='relative inline-block text-primary'>
              {t('headlineEmphasis')}
              <span
                className={cn(
                  'absolute right-0 -bottom-1 left-0',
                  'h-[3px] rounded-full bg-primary/40'
                )}
              />
            </span>
            {t('headlineSuffix')}
          </h2>

          {/* Subheadline */}
          <p
            className={cn(
              'text-lg md:text-xl',
              'text-muted-foreground',
              'mb-10',
              isInView
                ? 'translate-y-0 opacity-100'
                : 'translate-y-6 opacity-0',
              'transition-all delay-100 duration-700'
            )}
          >
            {t('subheadline')}
          </p>

          {/* CTA Button - Prominent with glow effect */}
          <div
            className={cn(
              'relative inline-block',
              isInView
                ? 'translate-y-0 opacity-100'
                : 'translate-y-6 opacity-0',
              'transition-all delay-200 duration-700'
            )}
          >
            {/* Glow effect */}
            <div
              className={cn(
                'absolute inset-0',
                'rounded-full bg-primary/40',
                'blur-xl',
                'scale-110',
                'animate-pulse'
              )}
              style={{ animationDuration: '3s' }}
            />

            <Button
              asChild
              size='lg'
              className={cn(
                'relative',
                'h-16 px-10',
                'text-lg font-semibold',
                'shadow-xl shadow-primary/25',
                'hover:shadow-2xl hover:shadow-primary/30',
                'hover:scale-[1.02]',
                'transition-all duration-300',
                'group'
              )}
            >
              <Link
                href={routes.interviewPrep.new}
                className='flex items-center gap-3'
                onClick={() => {
                  posthog.capture(POSTHOG_EVENTS.LANDING.CTA_MAIN_CLICKED, {
                    location: 'cta_section',
                    destination: routes.interviewPrep.new,
                  })
                }}
              >
                {t('button')}
                <ArrowRight
                  className={cn(
                    'h-5 w-5',
                    'group-hover:translate-x-1',
                    'transition-transform duration-300'
                  )}
                />
              </Link>
            </Button>
          </div>

          {/* Reassurance message */}
          <p
            className={cn(
              'flex items-center justify-center gap-2',
              'mt-8',
              'text-sm text-muted-foreground',
              isInView
                ? 'translate-y-0 opacity-100'
                : 'translate-y-6 opacity-0',
              'transition-all delay-300 duration-700'
            )}
          >
            <Clock className='h-4 w-4 text-primary/70' />
            {t('reassurance')}
          </p>

          {/* Divider */}
          <div
            className={cn(
              'mt-14 flex items-center gap-4',
              isInView ? 'opacity-100' : 'opacity-0',
              'transition-opacity delay-400 duration-700'
            )}
          >
            <div className='h-px flex-1 bg-linear-to-r from-transparent via-border to-transparent' />
            <span className='text-xs font-medium tracking-[0.2em] text-muted-foreground/60 uppercase'>
              {t('discord.divider')}
            </span>
            <div className='h-px flex-1 bg-linear-to-r from-transparent via-border to-transparent' />
          </div>

          {/* Discord Community CTA */}
          <div
            className={cn(
              'mt-10',
              isInView
                ? 'translate-y-0 opacity-100'
                : 'translate-y-6 opacity-0',
              'transition-all delay-500 duration-700'
            )}
          >
            {/* Discord Card */}
            <div
              className={cn(
                'group relative',
                'rounded-2xl p-6',
                'bg-linear-to-br from-[#5865F2]/5 via-background to-[#5865F2]/10',
                'border border-[#5865F2]/20',
                'hover:border-[#5865F2]/40',
                'transition-all duration-300'
              )}
            >
              {/* Subtle glow on hover */}
              <div
                className={cn(
                  'absolute inset-0 rounded-2xl',
                  'bg-[#5865F2]/5',
                  'opacity-0 group-hover:opacity-100',
                  '-z-10 blur-xl',
                  'transition-opacity duration-500'
                )}
              />

              {/* Content */}
              <div className='flex flex-col items-center gap-5 sm:flex-row'>
                {/* Discord Icon */}
                <div
                  className={cn(
                    'shrink-0',
                    'h-14 w-14 rounded-xl',
                    'bg-[#5865F2]',
                    'flex items-center justify-center',
                    'shadow-lg shadow-[#5865F2]/25',
                    'group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-[#5865F2]/30',
                    'transition-all duration-300'
                  )}
                >
                  <svg
                    viewBox='0 0 24 24'
                    className='h-7 w-7 text-white'
                    fill='currentColor'
                  >
                    <path d='M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z' />
                  </svg>
                </div>

                {/* Text Content */}
                <div className='flex-1 text-center sm:text-left'>
                  <h3
                    className={cn(
                      'text-base font-semibold',
                      'text-foreground',
                      'mb-1'
                    )}
                  >
                    {t('discord.headline')}
                  </h3>
                  <p className='text-sm text-muted-foreground'>
                    {t('discord.description')}
                  </p>
                </div>

                {/* Discord Button */}
                <Button
                  asChild
                  className={cn(
                    'shrink-0',
                    'bg-[#5865F2] hover:bg-[#4752C4]',
                    'font-medium text-white',
                    'shadow-md shadow-[#5865F2]/20',
                    'hover:shadow-lg hover:shadow-[#5865F2]/30',
                    'transition-all duration-300',
                    'group/btn'
                  )}
                >
                  <a
                    href={DISCORD_LINK}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center gap-2'
                    onClick={() => {
                      posthog.capture(
                        POSTHOG_EVENTS.LANDING.DISCORD_JOIN_CLICKED,
                        {
                          location: 'cta_section',
                          destination: DISCORD_LINK,
                        }
                      )
                    }}
                  >
                    <Users className='h-4 w-4' />
                    {t('discord.button')}
                    <ArrowRight
                      className={cn(
                        'h-4 w-4',
                        'group-hover/btn:translate-x-0.5',
                        'transition-transform duration-200'
                      )}
                    />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
