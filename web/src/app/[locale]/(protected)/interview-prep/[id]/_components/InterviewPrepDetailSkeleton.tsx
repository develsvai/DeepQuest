/**
 * InterviewPrepDetailSkeleton Component
 *
 * Loading skeleton for interview preparation detail page.
 * Matches the actual InterviewPrepDetail UI structure.
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'

/**
 * Header skeleton matching HeaderSection component
 * - Title
 * - Job title + Years of experience (with icons)
 * - Edit button
 * - Summary bullet list
 */
function HeaderSkeleton() {
  return (
    <header className='mx-auto mb-10 max-w-7xl'>
      <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
        <div>
          {/* Title */}
          <div className='mb-2 flex items-center gap-3'>
            <Skeleton className='h-9 w-64' />
          </div>
          {/* Job title + Years */}
          <div className='flex items-center gap-4'>
            <div className='flex items-center gap-1.5'>
              <Skeleton className='h-4 w-4' />
              <Skeleton className='h-4 w-32' />
            </div>
            <div className='flex items-center gap-1.5'>
              <Skeleton className='h-4 w-4' />
              <Skeleton className='h-4 w-16' />
            </div>
          </div>
        </div>

        {/* Edit button */}
        <div className='flex gap-3'>
          <Skeleton className='h-9 w-24' />
        </div>
      </div>

      {/* Summary Section */}
      <section className='mt-8'>
        <Skeleton className='mb-3 h-5 w-20' />
        <div className='space-y-1.5'>
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className='flex items-start gap-2'>
              <Skeleton className='mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full' />
              <Skeleton className='h-4 w-full max-w-lg' />
            </div>
          ))}
        </div>
      </section>
    </header>
  )
}

/**
 * Tabs skeleton matching the Tabs component structure
 */
function TabsSkeleton() {
  return (
    <div className='mb-4 flex h-auto w-full justify-start gap-0 rounded-none border-b border-border bg-transparent p-0'>
      <div className='flex'>
        <Skeleton className='h-8 w-28 rounded-none' />
        <Skeleton className='ml-2 h-8 w-28 rounded-none' />
      </div>
    </div>
  )
}

/**
 * Section header skeleton matching SectionHeader component
 */
function SectionHeaderSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Skeleton className='h-6 w-32' />
    </div>
  )
}

/**
 * Experience card skeleton matching ExperienceCardV2 component
 * - ActionCardHeader with icon, title, subtitle, actions
 * - ActionCardContent with date, badges, description, tech stack
 * - ActionCardFooter with progress and link
 */
function ExperienceCardSkeleton() {
  return (
    <Card className='overflow-hidden'>
      {/* Header */}
      <CardHeader className='flex flex-row items-start gap-4'>
        {/* Leading icon */}
        <Skeleton className='h-9 w-9 shrink-0' />

        <div className='flex-1 space-y-2'>
          {/* Title */}
          <Skeleton className='h-5 w-3/4' />
          {/* Subtitle (positions) */}
          <div className='flex items-center gap-2'>
            <Skeleton className='h-4 w-24' />
            <Separator orientation='vertical' className='h-4' />
            <Skeleton className='h-4 w-20' />
          </div>
        </div>

        {/* Actions dropdown */}
        <Skeleton className='h-8 w-8 rounded-md' />
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* Date & Badge */}
        <div className='flex items-center gap-3'>
          <Skeleton className='h-4 w-40' />
          <Skeleton className='h-4 w-1' />
          <Skeleton className='h-5 w-20 rounded-full' />
        </div>

        {/* Job level or team info */}
        <Skeleton className='h-4 w-32' />

        {/* Description */}
        <Skeleton className='h-4 w-full' />
        <Skeleton className='h-4 w-4/5' />

        {/* Tech Stack */}
        <div>
          <Skeleton className='mb-2 h-4 w-20' />
          <div className='flex flex-wrap gap-2'>
            {[...Array(5)].map((_, idx) => (
              <Skeleton key={idx} className='h-6 w-16 rounded-full' />
            ))}
          </div>
        </div>
      </CardContent>

      {/* Footer */}
      <div className='flex items-center justify-between border-t px-6 py-4'>
        <div className='flex items-center gap-4'>
          <Skeleton className='h-4 w-24' />
        </div>
        <Skeleton className='h-8 w-32' />
      </div>
    </Card>
  )
}

/**
 * Education card skeleton matching EducationCard component
 * - ActionCardHeader with badge, title, subtitle, actions
 * - ActionCardContent with date, major badge, description
 */
function EducationCardSkeleton() {
  return (
    <Card>
      {/* Header */}
      <CardHeader className='flex flex-row items-start justify-between'>
        <div className='space-y-2'>
          {/* Title with badge */}
          <div className='flex items-center gap-2'>
            <Skeleton className='h-5 w-12 rounded-md' />
            <Skeleton className='h-5 w-40' />
          </div>
          {/* Subtitle (degree + major) */}
          <Skeleton className='h-4 w-32' />
        </div>

        {/* Actions dropdown */}
        <Skeleton className='h-8 w-8 rounded-md' />
      </CardHeader>

      <CardContent className='pb-6'>
        {/* Date & Major Badge */}
        <div className='mb-4 flex flex-wrap items-center gap-3'>
          <Skeleton className='h-4 w-32' />
          <Skeleton className='h-5 w-24 rounded-full' />
        </div>

        {/* Description */}
        <Skeleton className='h-4 w-full' />
        <Skeleton className='mt-1 h-4 w-3/4' />
      </CardContent>
    </Card>
  )
}

/**
 * Add placeholder card skeleton matching AddPlaceholderCard component
 */
function AddPlaceholderSkeleton() {
  return (
    <Card className='flex h-full min-h-[200px] items-center justify-center border-dashed'>
      <div className='flex flex-col items-center gap-2'>
        <Skeleton className='h-10 w-10 rounded-full' />
        <Skeleton className='h-4 w-24' />
        <Skeleton className='h-3 w-32' />
      </div>
    </Card>
  )
}

/**
 * InterviewPrepDetailSkeleton component for loading state
 * Matches the structure of InterviewPrepDetail component
 */
export function InterviewPrepDetailSkeleton() {
  return (
    <div className='-m-6 min-h-screen p-8'>
      {/* Header Section */}
      <HeaderSkeleton />

      {/* Main Content with Tabs */}
      <main className='mx-auto max-w-7xl'>
        {/* Tabs */}
        <TabsSkeleton />

        {/* Resume Tab Content */}
        <div>
          {/* Experiences Section */}
          <SectionHeaderSkeleton className='mb-4' />

          {/* Experience Cards Grid */}
          <div className='grid gap-8 md:grid-cols-2'>
            {[...Array(3)].map((_, idx) => (
              <ExperienceCardSkeleton key={`experience-skeleton-${idx}`} />
            ))}
            <AddPlaceholderSkeleton />
          </div>

          {/* Education Section */}
          <SectionHeaderSkeleton className='mt-12 mb-4' />

          {/* Education Cards Grid */}
          <div className='grid gap-8 md:grid-cols-2'>
            {[...Array(2)].map((_, idx) => (
              <EducationCardSkeleton key={`education-skeleton-${idx}`} />
            ))}
            <AddPlaceholderSkeleton />
          </div>
        </div>
      </main>
    </div>
  )
}
