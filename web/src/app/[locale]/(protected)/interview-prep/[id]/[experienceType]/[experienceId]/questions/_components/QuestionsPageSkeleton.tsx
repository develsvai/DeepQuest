/**
 * QuestionsPageSkeleton Component
 *
 * Loading skeleton for questions list page.
 * Matches the layout: DetailHeader + KeyAchievement (optional) + Separator + Questions list.
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
      </div>

      {/* Description */}
      <div className='space-y-2'>
        <Skeleton className='h-4 w-full' />
        <Skeleton className='h-4 w-5/6' />
      </div>
    </div>
  )
}

/**
 * KeyAchievement card skeleton
 */
function KeyAchievementSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className='h-5 w-3/4' />
      </CardHeader>

      <CardContent>
        <div className='grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6'>
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
        </div>
      </CardContent>

      <CardFooter>
        <Skeleton className='h-4 w-24' />
      </CardFooter>
    </Card>
  )
}

/**
 * Question card skeleton
 */
function QuestionCardSkeleton() {
  return (
    <Card className='p-4'>
      <div className='flex items-start justify-between'>
        <div className='flex-1 space-y-2'>
          <div className='flex items-center gap-2'>
            <Skeleton className='h-5 w-8' />
            <Skeleton className='h-5 w-20' />
          </div>
          <Skeleton className='h-5 w-full' />
          <Skeleton className='h-4 w-4/5' />
        </div>
        <Skeleton className='ml-4 h-9 w-20' />
      </div>
    </Card>
  )
}

/**
 * Full page skeleton for questions list page
 */
export function QuestionsPageSkeleton() {
  return (
    <div className='space-y-8'>
      <DetailHeaderSkeleton />

      {/* Optional KeyAchievement */}
      <KeyAchievementSkeleton />

      <Separator className='bg-border' />

      {/* Questions section */}
      <div className='space-y-6'>
        {/* Stats and filter */}
        <div className='flex items-center justify-between'>
          <Skeleton className='h-4 w-32' />
        </div>

        {/* Category filter */}
        <div className='flex gap-2'>
          <Skeleton className='h-8 w-16 rounded-full' />
          <Skeleton className='h-8 w-24 rounded-full' />
          <Skeleton className='h-8 w-20 rounded-full' />
          <Skeleton className='h-8 w-28 rounded-full' />
        </div>

        {/* Question cards */}
        <div className='space-y-3'>
          <QuestionCardSkeleton />
          <QuestionCardSkeleton />
          <QuestionCardSkeleton />
          <QuestionCardSkeleton />
        </div>
      </div>
    </div>
  )
}
