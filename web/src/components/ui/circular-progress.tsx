'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * CircularProgress component props
 */
interface CircularProgressProps extends React.ComponentProps<'div'> {
  /** Progress value (0-100) */
  value: number
  /** Size variant - controls overall dimensions */
  size?: 'sm' | 'md' | 'lg'
  /** Show percentage label in center */
  showLabel?: boolean
  /** Stroke width of the progress circle */
  strokeWidth?: number
  /** Custom track color class (default: stroke-muted) */
  trackClassName?: string
  /** Custom progress color class (default: stroke-primary) */
  progressClassName?: string
}

const SIZE_MAP = {
  sm: { dimension: 48, defaultStroke: 4, fontSize: 'text-xs' },
  md: { dimension: 64, defaultStroke: 5, fontSize: 'text-sm' },
  lg: { dimension: 80, defaultStroke: 6, fontSize: 'text-base' },
} as const

/**
 * Circular progress indicator with optional percentage label
 *
 * @example
 * ```tsx
 * <CircularProgress value={75} size="md" showLabel />
 * ```
 */
function CircularProgress({
  value,
  size = 'md',
  showLabel = false,
  strokeWidth,
  trackClassName,
  progressClassName,
  className,
  ...props
}: CircularProgressProps) {
  // Clamp value between 0 and 100
  const clampedValue = Math.min(100, Math.max(0, value))

  const { dimension, defaultStroke, fontSize } = SIZE_MAP[size]
  const stroke = strokeWidth ?? defaultStroke

  // Calculate SVG circle parameters
  const radius = (dimension - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center',
        className
      )}
      style={{ width: dimension, height: dimension }}
      role='progressbar'
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      {...props}
    >
      <svg
        width={dimension}
        height={dimension}
        viewBox={`0 0 ${dimension} ${dimension}`}
        className='-rotate-90'
      >
        {/* Background track circle */}
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill='none'
          strokeWidth={stroke}
          className={cn('stroke-muted', trackClassName)}
        />
        {/* Progress circle */}
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill='none'
          strokeWidth={stroke}
          strokeLinecap='round'
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={cn(
            'stroke-primary transition-[stroke-dashoffset] duration-300 ease-out',
            progressClassName
          )}
        />
      </svg>

      {/* Center label */}
      {showLabel && (
        <span className={cn('absolute font-medium text-foreground', fontSize)}>
          {Math.round(clampedValue)}%
        </span>
      )}
    </div>
  )
}

export { CircularProgress }
export type { CircularProgressProps }
