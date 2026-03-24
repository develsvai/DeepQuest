'use client'

import { useState } from 'react'
import { Briefcase, Calendar } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'

import { HeaderEditDialog } from './HeaderEditDialog'
import type { HeaderData } from './InterviewPrepDetail.types'

interface HeaderSectionProps {
  data: HeaderData
  onSubmit?: (data: HeaderData) => Promise<void>
  isSubmitting?: boolean
}

/**
 * Header section for interview prep detail page
 * Displays title, position, years of experience, and summary
 */
export function HeaderSection({
  data,
  onSubmit,
  isSubmitting,
}: HeaderSectionProps) {
  const t = useTranslations('interview-prep.detail')
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  return (
    <>
      <header className='mx-auto mb-10 max-w-7xl'>
        <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
          <div>
            <div className='mb-2 flex items-center gap-3'>
              <h1 className='font-serif text-3xl font-bold text-foreground'>
                {data.title}
              </h1>
            </div>
            <div className='flex items-center gap-4 text-sm text-muted-foreground'>
              {data.jobTitle && (
                <div className='flex items-center gap-1.5'>
                  <Briefcase size={16} />
                  <span>{data.jobTitle}</span>
                </div>
              )}
              {data.yearsOfExperience !== null && (
                <div className='flex items-center gap-1.5'>
                  <Calendar size={16} />
                  <span>
                    {data.yearsOfExperience}{' '}
                    {t('experienceCard.duration.years')}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className='flex gap-3'>
            <Button variant='outline' onClick={() => setIsEditDialogOpen(true)}>
              {t('editProfile')}
            </Button>
          </div>
        </div>

        {/* Summary Section */}
        {data.summary.length > 0 && (
          <section className='mt-8'>
            <h2 className='mb-3 text-base font-bold text-foreground'>
              Summary
            </h2>
            <ul className='space-y-1.5 text-sm leading-relaxed text-muted-foreground'>
              {data.summary.map((item, idx) => (
                <li key={idx} className='flex items-start gap-2'>
                  <span className='mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground' />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </header>

      {onSubmit && (
        <HeaderEditDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          initialData={data}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </>
  )
}
