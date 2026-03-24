'use client'

import { Loader2 } from 'lucide-react'

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/**
 * Spinner loading component
 * @property size - Size of the spinner
 * @property className - Additional CSS classes
 */
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <Loader2 className={cn(sizeClasses[size], 'animate-spin text-primary')} />
    </div>
  )
}

/**
 * Progress loading component
 * @property value - Progress value (0-100)
 * @property label - Optional label text
 * @property showPercentage - Whether to show percentage
 */
interface ProgressLoadingProps {
  value: number
  label?: string
  showPercentage?: boolean
}

export function ProgressLoading({
  value,
  label,
  showPercentage = true,
}: ProgressLoadingProps) {
  return (
    <div className='space-y-2'>
      {(label || showPercentage) && (
        <div className='flex justify-between text-sm'>
          {label && <span className='text-muted-foreground'>{label}</span>}
          {showPercentage && <span className='font-medium'>{value}%</span>}
        </div>
      )}
      <div className='h-2 overflow-hidden rounded-full bg-secondary'>
        <div
          className='h-full bg-primary transition-all duration-300 ease-out'
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

/**
 * Card skeleton component
 * Mimics the structure of InterviewPreparationCard
 */
export function CardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className='flex items-start justify-between'>
          <div className='space-y-2'>
            <Skeleton className='h-5 w-32' />
            <Skeleton className='h-4 w-24' />
          </div>
          <Skeleton className='h-6 w-20' />
        </div>
      </CardHeader>
      <CardContent className='space-y-3'>
        <div className='space-y-2'>
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-3/4' />
        </div>
        <Skeleton className='h-2 w-full' />
      </CardContent>
      <CardFooter>
        <Skeleton className='h-10 w-full' />
      </CardFooter>
    </Card>
  )
}

/**
 * List skeleton component
 * Shows multiple skeleton items
 * @property count - Number of skeleton items to show
 */
interface ListSkeletonProps {
  count?: number
}

export function ListSkeleton({ count = 3 }: ListSkeletonProps) {
  return (
    <div className='space-y-4'>
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  )
}

/**
 * Text skeleton component
 * Shows skeleton lines for text content
 * @property lines - Number of lines to show
 * @property className - Additional CSS classes
 */
interface TextSkeletonProps {
  lines?: number
  className?: string
}

export function TextSkeleton({ lines = 3, className }: TextSkeletonProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className='h-4'
          style={{ width: index === lines - 1 ? '75%' : '100%' }}
        />
      ))}
    </div>
  )
}
