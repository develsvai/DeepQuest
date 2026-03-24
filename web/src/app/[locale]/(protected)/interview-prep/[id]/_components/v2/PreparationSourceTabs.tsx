'use client'

/**
 * PreparationSourceTabs Component
 *
 * TabsList for PreparationSourceSection.
 * Always visible regardless of loading state.
 */

import { Briefcase, FileText } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

export function PreparationSourceTabs() {
  const t = useTranslations('interview-prep.detail.v2.preparationSource')

  return (
    <TabsList className='mb-6 h-12 w-full max-w-md bg-muted/50'>
      <TabsTrigger
        value='resume'
        className='h-10 gap-2 px-4 text-sm font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm'
      >
        <FileText className='size-4' />
        {t('tabs.resumeAnalysis')}
      </TabsTrigger>
      <TabsTrigger
        value='job-posting'
        disabled
        className='h-10 gap-2 px-4 text-sm'
      >
        <Briefcase className='size-4' />
        {t('tabs.jobPosting')}
        <Badge
          variant='secondary'
          className='ml-1 px-1.5 py-0 text-[10px] font-medium'
        >
          Soon
        </Badge>
      </TabsTrigger>
    </TabsList>
  )
}
