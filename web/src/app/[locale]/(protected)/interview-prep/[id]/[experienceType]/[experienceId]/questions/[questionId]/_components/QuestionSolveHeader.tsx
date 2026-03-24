'use client'

import { ChevronLeft } from 'lucide-react'

import { useRouter } from '@/i18n/navigation'

import { Button } from '@/components/ui/button'

export default function QuestionSolveHeader() {
  const router = useRouter()

  return (
    <header className='flex h-14 items-center gap-4 border-b bg-background/95 px-6 backdrop-blur supports-backdrop-filter:bg-background/60'>
      <Button
        variant='ghost'
        size='icon'
        className='-ml-2 h-8 w-8'
        onClick={() => router.back()}
      >
        <ChevronLeft className='h-4 w-4' />
        <span className='sr-only'>Back</span>
      </Button>
      {/* TODO: Add breadcrumb for hierarchical navigation */}
      {/* <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="#">Home</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href="#">Interview Prep</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Question 1</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb> */}
    </header>
  )
}
