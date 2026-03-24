'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { routes } from '@/lib/routes'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Upload,
  Search,
  MessageSquareText,
  CheckCircle,
  ChevronRight,
} from 'lucide-react'
import posthog from 'posthog-js'
import { POSTHOG_EVENTS } from '@/lib/posthog-events'

function getLocalizedImagePath(locale: string, filename: string): string {
  return `/images/landing-page/${locale}/${filename}`
}

export function HeroSection() {
  const t = useTranslations('landing.hero')
  const locale = useLocale()
  const heroImageSrc = getLocalizedImagePath(
    locale,
    '4-2.question-categories-detail.png'
  )

  const processSteps = [
    { icon: Upload, label: t('flow.step1') },
    { icon: Search, label: t('flow.step2') },
    { icon: MessageSquareText, label: t('flow.step3') },
    { icon: CheckCircle, label: t('flow.step4') },
  ]

  return (
    <section
      className={cn(
        'relative min-h-[90vh]',
        'flex items-center',
        'pt-20 pb-16 md:pt-24 md:pb-20'
      )}
    >
      {/* Subtle gradient background */}
      <div
        className={cn(
          'absolute inset-0 -z-10',
          'bg-linear-to-br from-background via-background to-accent/20'
        )}
      />

      <div className='container mx-auto px-6 lg:px-8'>
        <div className='grid items-center gap-12 lg:grid-cols-12 lg:gap-8'>
          {/* Left Content - Text */}
          <div className='space-y-8 lg:col-span-6 xl:col-span-5'>
            {/* Label */}
            <div
              className={cn(
                'inline-block',
                'animate-[fade-up_0.5s_ease-out_forwards] opacity-0'
              )}
            >
              <span
                className={cn(
                  'text-xs font-semibold tracking-[0.2em] uppercase',
                  'text-primary'
                )}
              >
                Deep Quest
              </span>
            </div>

            {/* Headline with decorative quote */}
            <div
              className={cn(
                'relative',
                'animate-[fade-up_0.6s_ease-out_0.1s_forwards] opacity-0'
              )}
            >
              {/* Large decorative opening quote */}
              <span
                className={cn(
                  'absolute -top-6 -left-2 md:-top-8 md:-left-6',
                  'text-[5rem] leading-none md:text-[7rem]',
                  'text-primary/10',
                  'font-serif select-none',
                  'pointer-events-none'
                )}
                aria-hidden='true'
              >
                &ldquo;
              </span>

              {/* SEO용 H1 - 시각적으로 숨김, 검색엔진용 */}
              <h1 className='sr-only'>{t('seoHeadline')}</h1>

              {/* 디자인용 표시 텍스트 */}
              <p
                role='heading'
                aria-level={2}
                className={cn(
                  'text-[clamp(2rem,5vw,3.5rem)]',
                  'leading-[1.1] font-bold',
                  'tracking-[-0.02em]',
                  'text-foreground'
                )}
              >
                {t('headline')}
                <span
                  className='ml-1 font-serif text-primary/40'
                  aria-hidden='true'
                >
                  &rdquo;
                </span>
              </p>
            </div>

            {/* Subheadline - Why message */}
            <div
              className={cn(
                'space-y-1',
                'animate-[fade-up_0.5s_ease-out_0.25s_forwards] opacity-0'
              )}
            >
              <p className='text-lg leading-relaxed text-muted-foreground md:text-xl'>
                {t('subheadline1')}
              </p>
              <p className='text-lg leading-relaxed md:text-xl'>
                <span className='font-medium text-primary'>
                  {t('subheadline2.emphasis')}
                </span>{' '}
                <span className='text-foreground'>
                  {t('subheadline2.conclusion')}
                </span>
              </p>
            </div>

            {/* Process Flow */}
            <div
              className={cn(
                'flex flex-wrap items-center gap-2 md:gap-3',
                'py-4',
                'animate-[fade-up_0.4s_ease-out_0.4s_forwards] opacity-0'
              )}
            >
              {processSteps.map((step, index) => (
                <div
                  key={step.label}
                  className='flex items-center gap-2 md:gap-3'
                >
                  <div
                    className={cn(
                      'flex items-center gap-2',
                      'px-3 py-2',
                      'rounded-full bg-accent/50',
                      'border border-border/50'
                    )}
                  >
                    <step.icon className='h-4 w-4 text-primary' />
                    <span className='text-sm font-medium whitespace-nowrap text-foreground'>
                      {step.label}
                    </span>
                  </div>
                  {index < processSteps.length - 1 && (
                    <ChevronRight className='hidden h-4 w-4 text-muted-foreground/50 sm:block' />
                  )}
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <div
              className={cn(
                'pt-2',
                'animate-[fade-up_0.4s_ease-out_0.55s_forwards] opacity-0'
              )}
            >
              <Button
                asChild
                size='lg'
                className={cn(
                  'h-14 px-8',
                  'text-base font-semibold',
                  'shadow-lg shadow-primary/20',
                  'hover:shadow-xl hover:shadow-primary/25',
                  'transition-all duration-300'
                )}
              >
                <Link
                  href={routes.interviewPrep.new}
                  onClick={() => {
                    posthog.capture(POSTHOG_EVENTS.LANDING.HERO_CTA_CLICKED, {
                      location: 'hero_section',
                      destination: routes.interviewPrep.new,
                    })
                  }}
                >
                  {t('cta')}
                </Link>
              </Button>
            </div>
          </div>

          {/* Right Content - Visual */}
          <div
            className={cn(
              'lg:col-span-6 xl:col-span-7',
              'animate-[fade-up_0.8s_ease-out_0.2s_forwards] opacity-0'
            )}
          >
            <div className='relative'>
              {/* Screenshot container with layered shadows */}
              <div className='relative'>
                {/* Shadow layers for depth */}
                <div
                  className={cn(
                    'absolute inset-0',
                    'bg-foreground/5 dark:bg-foreground/10',
                    'rounded-xl',
                    'translate-x-3 translate-y-3 transform',
                    'blur-sm'
                  )}
                />
                <div
                  className={cn(
                    'absolute inset-0',
                    'bg-foreground/3 dark:bg-foreground/5',
                    'rounded-xl',
                    'translate-x-6 translate-y-6 transform',
                    'blur-md'
                  )}
                />

                {/* Main image container */}
                <div
                  className={cn(
                    'relative',
                    'overflow-hidden rounded-xl',
                    'border border-border',
                    'bg-card'
                  )}
                >
                  <Image
                    src={heroImageSrc}
                    alt={t('imageAlt')}
                    width={800}
                    height={500}
                    className='h-auto w-full'
                    priority
                  />
                </div>
              </div>

              {/* Floating accent element */}
              <div
                className={cn(
                  'absolute -bottom-4 -left-4 md:-bottom-6 md:-left-6',
                  'h-24 w-24 md:h-32 md:w-32',
                  'bg-linear-to-br from-primary/20 to-primary/5',
                  'rounded-full blur-2xl',
                  'pointer-events-none'
                )}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className={cn(
          'absolute bottom-8 left-1/2 -translate-x-1/2',
          'flex flex-col items-center gap-2',
          'animate-[fade-up_0.4s_ease-out_0.8s_forwards] opacity-0'
        )}
      >
        <div
          className={cn(
            'h-10 w-6 rounded-full',
            'border-2 border-muted-foreground/30',
            'flex justify-center pt-2'
          )}
        >
          <div
            className={cn(
              'h-2 w-1 rounded-full',
              'bg-muted-foreground/50',
              'animate-bounce'
            )}
          />
        </div>
      </div>
    </section>
  )
}
