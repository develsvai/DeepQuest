'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { designTokens } from '@/components/design-system/core'

/**
 * Props for StepIndicator component
 * @property currentStep - Current active step (1-based)
 * @property totalSteps - Total number of steps
 * @property stepLabels - Array of step labels
 * @property className - Additional CSS classes
 */
interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
  stepLabels: string[]
  className?: string
}

/**
 * Multi-step progress indicator component
 * Shows progress through a multi-step process with visual indicators
 * Follows Deep Quest design system colors and responsive design
 */
export function StepIndicator({
  currentStep,
  totalSteps,
  stepLabels,
  className,
}: StepIndicatorProps) {
  return (
    <div className={cn('w-full', className)}>
      {/* Desktop Progress Bar */}
      <div className='hidden md:block'>
        <nav aria-label='Progress'>
          <ol role='list' className='flex items-center'>
            {Array.from({ length: totalSteps }, (_, index) => {
              const stepNumber = index + 1
              const isCompleted = stepNumber < currentStep
              const isActive = stepNumber === currentStep
              const isPending = stepNumber > currentStep
              const isLastStep = stepNumber === totalSteps

              return (
                <li
                  key={stepNumber}
                  className={cn('flex items-center', !isLastStep && 'flex-1')}
                >
                  <div className='flex items-center'>
                    {/* Step Circle */}
                    <span
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-full border-2 font-bold transition-colors',
                        isCompleted && 'bg-primary text-primary-foreground',
                        isActive && 'bg-primary text-primary-foreground',
                        isPending && 'bg-muted text-muted-foreground'
                      )}
                    >
                      {isCompleted ? (
                        <Check className='h-5 w-5' />
                      ) : (
                        <span className='text-base font-bold'>
                          {stepNumber}
                        </span>
                      )}
                    </span>

                    {/* Step Label */}
                    <span
                      className={cn(
                        'ml-4 hidden font-semibold transition-colors sm:block',
                        (isCompleted || isActive) && 'font-semibold',
                        stepNumber > currentStep && 'font-semibold'
                      )}
                      style={{
                        color:
                          isCompleted || isActive
                            ? designTokens.colors.primary.DEFAULT
                            : designTokens.colors.muted.foreground,
                      }}
                    >
                      {stepLabels[index]}
                    </span>
                  </div>

                  {/* Connector Line */}
                  {!isLastStep && (
                    <div
                      className='mx-4 flex-auto border-t-2'
                      style={{
                        borderColor: designTokens.colors.muted.DEFAULT,
                      }}
                    />
                  )}
                </li>
              )
            })}
          </ol>
        </nav>
      </div>

      {/* Mobile Progress Bar */}
      <div className='md:hidden'>
        <div className='mb-4 flex items-center justify-center'>
          <div className='flex items-center space-x-3'>
            {Array.from({ length: totalSteps }, (_, index) => {
              const stepNumber = index + 1
              const isCompleted = stepNumber < currentStep
              const isActive = stepNumber === currentStep
              const isPending = stepNumber > currentStep

              return (
                <div
                  key={stepNumber}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors',
                    isCompleted &&
                      'border-primary bg-primary text-primary-foreground',
                    isActive &&
                      'border-primary bg-primary text-primary-foreground',
                    isPending &&
                      'border-muted bg-background text-muted-foreground'
                  )}
                >
                  {isCompleted ? <Check className='h-5 w-5' /> : stepNumber}
                </div>
              )
            })}
          </div>
        </div>

        {/* Current Step Label */}
        <div className='text-center'>
          <p
            className='text-sm font-medium'
            style={{ color: designTokens.colors.foreground }}
          >
            Step {currentStep} of {totalSteps}
          </p>
          <p
            className='mt-1 text-xs'
            style={{ color: designTokens.colors.muted.foreground }}
          >
            {stepLabels[currentStep - 1]}
          </p>
        </div>
      </div>
    </div>
  )
}
