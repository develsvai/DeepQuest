/**
 * ExperienceDetailSkeleton Component
 *
 * Loading skeleton for experience detail page.
 * Matches the layout: DetailHeader + Separator + KeyAchievements grid.
 */

import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card'

/**
 * DetailHeader skeleton component
 */
function DetailHeaderSkeleton() {
  return (
    <div className='space-y-4'>
      {/* Badges */}
      <div className='flex gap-2'>
        <Skeleton className='h-5 w-16' />
        <Skeleton className='h-5 w-20' />
      </div>

      {/* Title */}
      <Skeleton className='h-8 w-2/3' />

      {/* Metadata items */}
      <div className='flex flex-wrap gap-4'>
        <div className='flex items-center gap-2'>
          <Skeleton className='h-4 w-4' />
          <Skeleton className='h-4 w-32' />
        </div>
        <div className='flex items-center gap-2'>
          <Skeleton className='h-4 w-4' />
          <Skeleton className='h-4 w-40' />
        </div>
      </div>

      {/* Tech stack tags */}
      <div className='flex flex-wrap gap-2'>
        <Skeleton className='h-6 w-16' />
        <Skeleton className='h-6 w-20' />
        <Skeleton className='h-6 w-14' />
        <Skeleton className='h-6 w-18' />
      </div>

      {/* Description */}
      <div className='space-y-2'>
        <Skeleton className='h-4 w-full' />
        <Skeleton className='h-4 w-5/6' />
        <Skeleton className='h-4 w-4/5' />
      </div>
    </div>
  )
}

/**
 * KeyAchievement card skeleton
 */
function KeyAchievementCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <Skeleton className='h-5 w-3/4' />
          <div className='flex gap-1'>
            <Skeleton className='h-8 w-8' />
            <Skeleton className='h-8 w-8' />
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-5'>
        {/* Situation & Task */}
        <div className='space-y-2'>
          <div className='flex items-center gap-2'>
            <Skeleton className='h-4 w-4' />
            <Skeleton className='h-4 w-28' />
          </div>
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-5/6' />
        </div>

        {/* Action */}
        <div className='space-y-2'>
          <div className='flex items-center gap-2'>
            <Skeleton className='h-4 w-4' />
            <Skeleton className='h-4 w-16' />
          </div>
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-4/5' />
        </div>

        {/* Result */}
        <div className='space-y-2'>
          <div className='flex items-center gap-2'>
            <Skeleton className='h-4 w-4' />
            <Skeleton className='h-4 w-16' />
          </div>
          <Skeleton className='h-4 w-full' />
        </div>

        {/* Reflection */}
        <div className='space-y-2'>
          <div className='flex items-center gap-2'>
            <Skeleton className='h-4 w-4' />
            <Skeleton className='h-4 w-20' />
          </div>
          <Skeleton className='h-4 w-5/6' />
        </div>
      </CardContent>

      <CardFooter className='justify-between'>
        <Skeleton className='h-4 w-24' />
        <div className='flex gap-2'>
          <Skeleton className='h-8 w-24' />
          <Skeleton className='h-8 w-28' />
        </div>
      </CardFooter>
    </Card>
  )
}

/**
 * Full page skeleton for experience detail page
 */
export function ExperienceDetailSkeleton() {
  return (
    <div className='space-y-8'>
      <DetailHeaderSkeleton />
      <Separator className='bg-border' />

      {/* Key Achievements section */}
      <div className='space-y-6'>
        {/* Section header */}
        <div className='flex items-center gap-2'>
          <Skeleton className='h-2 w-2 rounded-full' />
          <Skeleton className='h-4 w-48' />
        </div>

        {/* Achievement cards grid */}
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
          <KeyAchievementCardSkeleton />
          <KeyAchievementCardSkeleton />
          {/* Add placeholder card skeleton */}
          <Card className='flex min-h-[200px] items-center justify-center border-dashed'>
            <div className='flex flex-col items-center gap-2'>
              <Skeleton className='h-10 w-10 rounded-full' />
              <Skeleton className='h-4 w-32' />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
