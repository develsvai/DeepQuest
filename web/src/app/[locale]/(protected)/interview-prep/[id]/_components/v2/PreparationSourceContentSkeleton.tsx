/**
 * PreparationSourceContentSkeleton Component
 *
 * Skeleton loader for PreparationSourceContent.
 * Does NOT include TabsList skeleton - TabsList is always visible.
 */

import { TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'

// ═══════════════════════════════════════════════════════════════════════════
// Internal Skeleton Components
// ═══════════════════════════════════════════════════════════════════════════

function ResumeOverviewHeaderSkeleton() {
  return (
    <header className='mb-6'>
      {/* Title Row: Position + Years + Edit Button */}
      <div className='flex items-start justify-between gap-4'>
        <div>
          <div className='flex items-center gap-3'>
            {/* Briefcase icon + Position */}
            <span className='flex items-center gap-1.5'>
              <Skeleton className='size-5' />
              <Skeleton className='h-6 w-40' />
            </span>
            {/* Calendar icon + Years */}
            <span className='flex items-center gap-1.5'>
              <Skeleton className='size-4' />
              <Skeleton className='h-5 w-20' />
            </span>
          </div>
        </div>
        {/* Edit Button */}
        <Skeleton className='h-8 w-16 shrink-0 rounded-md' />
      </div>

      {/* Summary Points (3 items) */}
      <ul className='mt-3 space-y-1.5'>
        {[...Array(3)].map((_, idx) => (
          <li key={idx} className='flex items-start gap-2'>
            <Skeleton className='mt-1.5 size-1.5 shrink-0 rounded-full' />
            <Skeleton className='h-4 w-full max-w-lg' />
          </li>
        ))}
      </ul>
    </header>
  )
}

function ExperienceCardSkeleton() {
  return (
    <article className='flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-background/60 p-6'>
      {/* Header */}
      <header className='mb-4'>
        <div className='mb-2 flex items-start justify-between gap-3'>
          {/* Name */}
          <Skeleton className='h-6 w-3/4' />
          {/* Type Badge */}
          <Skeleton className='h-6 w-16 shrink-0 rounded-full' />
        </div>
        {/* Position */}
        <Skeleton className='h-5 w-1/2' />
        {/* Duration */}
        <span className='mt-2 inline-flex items-center gap-1.5'>
          <Skeleton className='size-3.5' />
          <Skeleton className='h-4 w-32' />
        </span>
      </header>

      {/* Key Achievements */}
      <section className='mb-5 flex-1'>
        <Skeleton className='mb-2.5 h-3 w-28' />
        <ul className='space-y-2'>
          {[...Array(2)].map((_, idx) => (
            <li key={idx} className='flex items-start'>
              <span className='mr-2 text-primary'>•</span>
              <Skeleton className='h-4 w-full' />
            </li>
          ))}
        </ul>
      </section>

      {/* Progress */}
      <section className='mb-5'>
        <header className='mb-2 flex items-center justify-between'>
          <Skeleton className='h-4 w-20' />
          <Skeleton className='h-4 w-12' />
        </header>
        <Skeleton className='h-2.5 w-full rounded-full' />
      </section>

      {/* CTA Button */}
      <footer>
        <Skeleton className='h-10 w-full rounded-md' />
      </footer>
    </article>
  )
}

function AddPlaceholderCardSkeleton() {
  return (
    <div className='flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-background p-6'>
      <Skeleton className='size-12 rounded-full' />
      <Skeleton className='h-5 w-32' />
      <Skeleton className='h-4 w-48' />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════

export function PreparationSourceContentSkeleton() {
  return (
    <>
      {/* Resume Analysis Tab - Skeleton */}
      <TabsContent value='resume' className='mt-0 space-y-6' forceMount>
        {/* Resume Overview Header */}
        <ResumeOverviewHeaderSkeleton />

        {/* Experience Cards Grid */}
        <section className='grid grid-cols-1 gap-5 sm:grid-cols-2'>
          {[...Array(2)].map((_, idx) => (
            <ExperienceCardSkeleton key={`experience-skeleton-${idx}`} />
          ))}
          <AddPlaceholderCardSkeleton />
        </section>
      </TabsContent>
    </>
  )
}
