/**
 * QuestionSolveSkeleton Component
 *
 * Loading skeleton for question solve page.
 * Matches the ResizablePanel layout of the actual content.
 */

import { Skeleton } from '@/components/ui/skeleton'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

/**
 * Header skeleton component
 */
function HeaderSkeleton() {
  return (
    <header className='flex h-14 items-center gap-4 border-b bg-background/95 px-6'>
      <Skeleton className='h-8 w-8' />
      <Skeleton className='h-4 w-48' />
    </header>
  )
}

/**
 * Question detail panel skeleton
 */
function QuestionDetailSkeleton() {
  return (
    <div className='flex h-full flex-col overflow-hidden'>
      {/* Question header */}
      <div className='border-b p-6'>
        <div className='mb-4 flex items-center gap-2'>
          <Skeleton className='h-5 w-20' />
          <Skeleton className='h-5 w-16' />
        </div>
        <Skeleton className='mb-2 h-6 w-3/4' />
        <Skeleton className='h-4 w-1/2' />
      </div>

      {/* Attempt tabs */}
      <div className='border-b p-4'>
        <div className='flex gap-2'>
          <Skeleton className='h-8 w-24' />
          <Skeleton className='h-8 w-20' />
          <Skeleton className='h-8 w-20' />
        </div>
      </div>

      {/* Answer area */}
      <div className='flex-1 p-6'>
        <Skeleton className='mb-4 h-4 w-24' />
        <Skeleton className='h-48 w-full' />
      </div>

      {/* Submit button */}
      <div className='border-t p-4'>
        <Skeleton className='ml-auto h-10 w-32' />
      </div>
    </div>
  )
}

/**
 * Feedback panel skeleton
 */
function FeedbackPanelSkeleton() {
  return (
    <div className='flex h-full flex-col overflow-hidden bg-muted/30'>
      {/* Tab header */}
      <div className='border-b p-4'>
        <div className='flex gap-2'>
          <Skeleton className='h-8 w-24' />
          <Skeleton className='h-8 w-28' />
        </div>
      </div>

      {/* Feedback content */}
      <div className='flex-1 space-y-4 overflow-auto p-6'>
        {/* Rating section */}
        <Card>
          <CardHeader>
            <Skeleton className='h-5 w-20' />
          </CardHeader>
          <CardContent>
            <Skeleton className='mb-2 h-8 w-16' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='mt-1 h-4 w-3/4' />
          </CardContent>
        </Card>

        {/* Strengths section */}
        <Card>
          <CardHeader>
            <Skeleton className='h-5 w-24' />
          </CardHeader>
          <CardContent className='space-y-2'>
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-5/6' />
            <Skeleton className='h-4 w-4/5' />
          </CardContent>
        </Card>

        {/* Weaknesses section */}
        <Card>
          <CardHeader>
            <Skeleton className='h-5 w-28' />
          </CardHeader>
          <CardContent className='space-y-2'>
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-5/6' />
          </CardContent>
        </Card>

        {/* Suggestions section */}
        <Card>
          <CardHeader>
            <Skeleton className='h-5 w-28' />
          </CardHeader>
          <CardContent className='space-y-2'>
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-4/5' />
            <Skeleton className='h-4 w-3/4' />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/**
 * Full page skeleton for question solve page
 */
export function QuestionSolveSkeleton() {
  return (
    <div className='flex h-[calc(100vh-4rem)] flex-col gap-0'>
      <HeaderSkeleton />
      <ResizablePanelGroup direction='horizontal' className='min-h-0 flex-1'>
        <ResizablePanel defaultSize={50} minSize={30}>
          <QuestionDetailSkeleton />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50} minSize={30}>
          <FeedbackPanelSkeleton />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
