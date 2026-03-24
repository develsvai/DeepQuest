'use client'

import { useTranslations } from 'next-intl'
import { Info } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

export function StarMethodGuide() {
  const t = useTranslations('experience-detail')

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='ml-1 h-5 w-5 rounded-full text-muted-foreground hover:bg-transparent hover:text-primary'
        >
          <Info className='h-4 w-4' />
          <span className='sr-only'>STAR method guide</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[340px] p-5' align='start' side='bottom'>
        <div className='space-y-4'>
          <div className='space-y-2'>
            <h4 className='text-base leading-none font-semibold text-primary'>
              {t('starGuide.title')}
            </h4>
            <p className='text-sm leading-snug text-muted-foreground'>
              {t('starGuide.description')}
            </p>
          </div>
          <div className='space-y-3 pt-1'>
            <StarItem
              letter='S'
              label={t('starGuide.s.label')}
              desc={t('starGuide.s.desc')}
            />
            <StarItem
              letter='T'
              label={t('starGuide.t.label')}
              desc={t('starGuide.t.desc')}
            />
            <StarItem
              letter='A'
              label={t('starGuide.a.label')}
              desc={t('starGuide.a.desc')}
            />
            <StarItem
              letter='R'
              label={t('starGuide.r.label')}
              desc={t('starGuide.r.desc')}
            />
            <StarItem
              letter='L'
              label={t('starGuide.l.label')}
              desc={t('starGuide.l.desc')}
              isLast
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function StarItem({
  letter,
  label,
  desc,
  isLast,
}: {
  letter: string
  label: string
  desc: string
  isLast?: boolean
}) {
  return (
    <div className='flex gap-3'>
      <div className='flex flex-col items-center'>
        <div className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary'>
          {letter}
        </div>
        {!isLast && <div className='my-1 h-full w-px bg-border' />}
      </div>
      <div className='pb-1'>
        <p className='mb-1.5 text-sm leading-none font-medium'>{label}</p>
        <p className='text-xs leading-relaxed break-keep text-muted-foreground'>
          {desc}
        </p>
      </div>
    </div>
  )
}
