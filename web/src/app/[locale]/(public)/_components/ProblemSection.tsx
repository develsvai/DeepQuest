'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { User, Bot, Users, GraduationCap } from 'lucide-react'
import { useInView } from '@/hooks/useInView'

const methodIcons = [User, Bot, Users, GraduationCap]

export function ProblemSection() {
  const t = useTranslations('landing.problem')

  const scenarios = [
    {
      question: t('part1.scenarios.0.question'),
      emotion: t('part1.scenarios.0.emotion'),
    },
    {
      question: t('part1.scenarios.1.question'),
      emotion: t('part1.scenarios.1.emotion'),
    },
    {
      question: t('part1.scenarios.2.question'),
      emotion: t('part1.scenarios.2.emotion'),
    },
  ]

  const methods = [
    {
      method: t('part2.methods.0.method'),
      thought: t('part2.methods.0.thought'),
    },
    {
      method: t('part2.methods.1.method'),
      thought: t('part2.methods.1.thought'),
    },
    {
      method: t('part2.methods.2.method'),
      thought: t('part2.methods.2.thought'),
    },
    {
      method: t('part2.methods.3.method'),
      thought: t('part2.methods.3.thought'),
    },
  ]

  const { ref: part1Ref, isInView: part1InView } = useInView({ threshold: 0.2 })
  const { ref: part2Ref, isInView: part2InView } = useInView({ threshold: 0.2 })
  const { ref: transitionRef, isInView: transitionInView } = useInView({
    threshold: 0.3,
  })

  return (
    <section id='problem' className='relative py-24 md:py-32'>
      {/* Subtle background gradient */}
      <div
        className={cn(
          'absolute inset-0 -z-10',
          'bg-gradient-to-b from-background via-accent/5 to-background'
        )}
      />

      <div className='container mx-auto px-6 lg:px-8'>
        {/* Part 1: Interview Moments */}
        <div ref={part1Ref} className='mx-auto mb-24 max-w-4xl md:mb-32'>
          {/* Section Label */}
          <div
            className={cn(
              'mb-4',
              part1InView
                ? 'translate-y-0 opacity-100'
                : 'translate-y-4 opacity-0',
              'transition-all duration-500'
            )}
          >
            <span
              className={cn(
                'text-xs font-semibold tracking-[0.15em] uppercase',
                'text-muted-foreground'
              )}
            >
              {t('part1.label')}
            </span>
          </div>

          {/* Header */}
          <h2
            className={cn(
              'text-[clamp(1.5rem,4vw,2.25rem)]',
              'leading-tight font-semibold',
              'tracking-[-0.02em]',
              'text-foreground',
              'mb-12 md:mb-16',
              part1InView
                ? 'translate-y-0 opacity-100'
                : 'translate-y-4 opacity-0',
              'transition-all delay-100 duration-500'
            )}
          >
            {t('part1.header')}
          </h2>

          {/* Interview Scenarios - Chat bubble style */}
          <div className='space-y-6 md:space-y-8'>
            {scenarios.map((scenario, index) => (
              <div
                key={index}
                className={cn(
                  'flex flex-col gap-4 md:flex-row md:items-start md:gap-8',
                  part1InView
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-4 opacity-0',
                  'transition-all duration-500'
                )}
                style={{ transitionDelay: `${200 + index * 100}ms` }}
              >
                {/* Interviewer Question - Chat bubble */}
                <div className='relative max-w-lg flex-1'>
                  {/* Bubble tail */}
                  <div
                    className={cn(
                      'absolute top-5 -left-2',
                      'h-0 w-0',
                      'border-t-[10px] border-t-transparent',
                      'border-r-[12px] border-r-accent',
                      'border-b-[10px] border-b-transparent',
                      'hidden md:block'
                    )}
                  />

                  <div
                    className={cn(
                      'relative',
                      'px-5 py-4',
                      'bg-accent',
                      'rounded-2xl rounded-tl-sm md:rounded-tl-2xl md:rounded-bl-sm',
                      'border border-border/30'
                    )}
                  >
                    {/* Interviewer label */}
                    <span
                      className={cn(
                        'mb-2 inline-block',
                        'text-[10px] font-semibold tracking-wider uppercase',
                        'text-muted-foreground'
                      )}
                    >
                      {t('part1.interviewer')}
                    </span>
                    <p className='leading-relaxed font-medium text-foreground'>
                      &ldquo;{scenario.question}&rdquo;
                    </p>
                  </div>
                </div>

                {/* Arrow + Emotion */}
                <div className='flex items-center gap-3 pl-4 md:pt-6 md:pl-0'>
                  <span className='text-xl text-muted-foreground/50'>→</span>
                  <p
                    className={cn(
                      'text-muted-foreground italic',
                      'text-base md:text-lg'
                    )}
                  >
                    {scenario.emotion}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Part 2: Existing Methods */}
        <div ref={part2Ref} className='mx-auto mb-24 max-w-5xl md:mb-32'>
          {/* Section Label */}
          <div
            className={cn(
              'mb-4',
              part2InView
                ? 'translate-y-0 opacity-100'
                : 'translate-y-4 opacity-0',
              'transition-all duration-500'
            )}
          >
            <span
              className={cn(
                'text-xs font-semibold tracking-[0.15em] uppercase',
                'text-muted-foreground'
              )}
            >
              {t('part2.label')}
            </span>
          </div>

          {/* Header */}
          <h2
            className={cn(
              'text-[clamp(1.5rem,4vw,2.25rem)]',
              'leading-tight font-semibold',
              'tracking-[-0.02em]',
              'text-foreground',
              'mb-12 md:mb-16',
              part2InView
                ? 'translate-y-0 opacity-100'
                : 'translate-y-4 opacity-0',
              'transition-all delay-100 duration-500'
            )}
          >
            {t('part2.header')}
          </h2>

          {/* Methods Grid */}
          <div className='grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4'>
            {methods.map((item, index) => {
              const Icon = methodIcons[index]
              return (
                <div
                  key={index}
                  className={cn(
                    'group',
                    'flex flex-col',
                    'p-5 md:p-6',
                    'bg-card',
                    'border border-border/50',
                    'rounded-xl',
                    'hover:border-border hover:shadow-lg hover:shadow-foreground/5',
                    'transition-all duration-300',
                    part2InView
                      ? 'translate-y-0 scale-100 opacity-100'
                      : 'translate-y-4 scale-95 opacity-0',
                    'transition-all duration-500'
                  )}
                  style={{ transitionDelay: `${200 + index * 75}ms` }}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      'mb-5 h-11 w-11',
                      'flex items-center justify-center',
                      'rounded-xl bg-accent',
                      'group-hover:bg-primary/10',
                      'transition-colors duration-300'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5 text-muted-foreground',
                        'group-hover:text-primary',
                        'transition-colors duration-300'
                      )}
                    />
                  </div>

                  {/* Method Name */}
                  <h4 className='mb-3 font-semibold text-foreground'>
                    {item.method}
                  </h4>

                  {/* Inner Thought - Handwritten feel */}
                  <p
                    className={cn(
                      'text-sm text-muted-foreground',
                      'leading-relaxed italic',
                      'opacity-80'
                    )}
                  >
                    {item.thought}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Transition Message */}
        <div
          ref={transitionRef}
          className={cn(
            'relative',
            'mx-auto max-w-2xl',
            'py-12 md:py-16',
            'text-center'
          )}
        >
          {/* Decorative line */}
          <div
            className={cn(
              'absolute top-0 left-1/2 -translate-x-1/2',
              'h-12 w-px',
              'bg-gradient-to-b from-transparent via-border to-border',
              transitionInView ? 'opacity-100' : 'opacity-0',
              'transition-opacity duration-700'
            )}
          />

          <div
            className={cn(
              transitionInView
                ? 'translate-y-0 opacity-100'
                : 'translate-y-6 opacity-0',
              'transition-all delay-200 duration-700'
            )}
          >
            <p
              className={cn(
                'text-xl md:text-2xl lg:text-3xl',
                'leading-relaxed font-semibold',
                'tracking-[-0.01em]'
              )}
            >
              <span className='text-primary'>{t('transition.line1')}</span>
              <br />
              <span className='text-foreground'>
                {t('transition.line2Prefix')}
                <span
                  className={cn('relative mx-1 inline-block', 'text-primary')}
                >
                  &lsquo;{t('transition.line2Emphasis')}&rsquo;
                  {/* Underline accent */}
                  <span
                    className={cn(
                      'absolute right-0 -bottom-1 left-0',
                      'h-[3px] rounded-full bg-primary/30'
                    )}
                  />
                </span>
                {t('transition.line2Suffix')}
              </span>
            </p>
          </div>

          {/* Decorative line */}
          <div
            className={cn(
              'absolute bottom-0 left-1/2 -translate-x-1/2',
              'h-12 w-px',
              'bg-gradient-to-b from-border via-border to-transparent',
              transitionInView ? 'opacity-100' : 'opacity-0',
              'transition-opacity delay-300 duration-700'
            )}
          />
        </div>
      </div>
    </section>
  )
}
