'use client'

import { useLocale, useTranslations } from 'next-intl'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useInView } from '@/hooks/useInView'

const STEP_IMAGE_FILENAMES = [
  '1.create-session.png',
  '3.key-achievement-result.png',
  '4-2.question-categories-detail.png',
  '6-2.question-feedback.png',
] as const

function getLocalizedImagePath(locale: string, filename: string): string {
  return `/images/landing-page/${locale}/${filename}`
}

export function HowItWorksSection() {
  const t = useTranslations('landing.solution')
  const locale = useLocale()

  const stepImages = STEP_IMAGE_FILENAMES.map(filename =>
    getLocalizedImagePath(locale, filename)
  )

  const steps = [
    { title: t('steps.0.title'), description: t('steps.0.description') },
    { title: t('steps.1.title'), description: t('steps.1.description') },
    { title: t('steps.2.title'), description: t('steps.2.description') },
    { title: t('steps.3.title'), description: t('steps.3.description') },
  ]

  const { ref: headerRef, isInView: headerInView } = useInView({
    threshold: 0.3,
  })

  return (
    <section
      id='how-it-works'
      className='relative overflow-hidden py-24 md:py-32'
    >
      {/* Background gradient */}
      <div
        className={cn(
          'absolute inset-0 -z-10',
          'bg-linear-to-b from-accent/10 via-background to-background'
        )}
      />

      <div className='container mx-auto px-6 lg:px-8'>
        {/* Section Header */}
        <div
          ref={headerRef}
          className={cn(
            'mb-20 text-center md:mb-28',
            headerInView
              ? 'translate-y-0 opacity-100'
              : 'translate-y-6 opacity-0',
            'transition-all duration-700'
          )}
        >
          {/* Label */}
          <span
            className={cn(
              'mb-4 inline-block',
              'text-xs font-semibold tracking-[0.2em] uppercase',
              'text-primary'
            )}
          >
            {t('label')}
          </span>

          {/* Header with emphasized "방법" */}
          <h2
            className={cn(
              'text-[clamp(1.75rem,4vw,2.75rem)]',
              'leading-tight font-bold',
              'tracking-[-0.02em]',
              'text-foreground'
            )}
          >
            {t('headerPrefix')}{' '}
            <span className='relative inline-block text-primary'>
              {t('headerEmphasis')}
              <span
                className={cn(
                  'absolute right-0 -bottom-1 left-0',
                  'h-[3px] rounded-full bg-primary/40'
                )}
              />
            </span>
            {t('headerSuffix')}
          </h2>
        </div>

        {/* Steps - Zigzag Layout */}
        <div className='space-y-20 md:space-y-32'>
          {steps.map((step, index) => (
            <StepCard
              key={index}
              step={step}
              stepNumber={index + 1}
              imageSrc={stepImages[index]}
              isReversed={index % 2 === 1}
              stepPrefix={t('stepPrefix')}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

interface StepCardProps {
  step: { title: string; description: string }
  stepNumber: number
  imageSrc: string
  isReversed: boolean
  stepPrefix: string
}

function StepCard({
  step,
  stepNumber,
  imageSrc,
  isReversed,
  stepPrefix,
}: StepCardProps) {
  const { ref, isInView } = useInView({ threshold: 0.15 })

  return (
    <div
      ref={ref}
      className={cn(
        'grid items-center gap-8 lg:grid-cols-12 lg:gap-12',
        isReversed && 'lg:direction-rtl'
      )}
    >
      {/* Image Side */}
      <div
        className={cn(
          'lg:col-span-7',
          isReversed ? 'lg:direction-ltr lg:order-2' : 'lg:order-1',
          isInView
            ? 'translate-x-0 opacity-100'
            : isReversed
              ? 'translate-x-8 opacity-0'
              : '-translate-x-8 opacity-0',
          'transition-all delay-100 duration-700'
        )}
      >
        <div className='relative'>
          {/* Layered shadows for depth */}
          <div
            className={cn(
              'absolute inset-0',
              'bg-foreground/5 dark:bg-foreground/10',
              'rounded-xl',
              isReversed
                ? '-translate-x-3 translate-y-3 transform'
                : 'translate-x-3 translate-y-3 transform',
              'blur-sm'
            )}
          />
          <div
            className={cn(
              'absolute inset-0',
              'bg-foreground/3 dark:bg-foreground/5',
              'rounded-xl',
              isReversed
                ? '-translate-x-6 translate-y-6 transform'
                : 'translate-x-6 translate-y-6 transform',
              'blur-md'
            )}
          />

          {/* Image container */}
          <div
            className={cn(
              'relative',
              'overflow-hidden rounded-xl',
              'border border-border',
              'bg-card'
            )}
          >
            <Image
              src={imageSrc}
              alt={step.title}
              width={700}
              height={450}
              className='h-auto w-full'
            />
          </div>
        </div>
      </div>

      {/* Content Side */}
      <div
        className={cn(
          'lg:col-span-5',
          isReversed
            ? 'lg:direction-ltr lg:order-1 lg:text-right'
            : 'lg:order-2',
          isInView ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
          'transition-all delay-200 duration-700'
        )}
      >
        {/* Step Number - Large, muted */}
        <div
          className={cn(
            'relative mb-6',
            isReversed && 'lg:flex lg:justify-end'
          )}
        >
          <span
            className={cn(
              'text-[5rem] leading-none font-bold md:text-[7rem]',
              'text-foreground/4',
              'select-none'
            )}
          >
            {String(stepNumber).padStart(2, '0')}
          </span>

          {/* Small step indicator */}
          <span
            className={cn(
              'absolute top-1/2 -translate-y-1/2',
              isReversed ? 'right-0 lg:right-auto lg:left-0' : 'left-0',
              'flex items-center gap-2',
              'text-xs font-semibold tracking-[0.15em] uppercase',
              'text-primary'
            )}
          >
            <span
              className={cn('h-px w-8 bg-primary', isReversed && 'lg:order-2')}
            />
            {stepPrefix} {stepNumber}
          </span>
        </div>

        {/* Title */}
        <h3
          className={cn(
            'text-xl md:text-2xl',
            'font-semibold',
            'tracking-[-0.01em]',
            'text-foreground',
            'mb-4'
          )}
        >
          {step.title}
        </h3>

        {/* Description */}
        <p
          className={cn(
            'text-base md:text-lg',
            'leading-relaxed',
            'text-muted-foreground'
          )}
        >
          {step.description}
        </p>
      </div>
    </div>
  )
}
