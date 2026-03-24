'use client'

import { FileText } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { designTokens } from '@/components/design-system/core'
import { cn } from '@/lib/utils'

interface PdfViewerProps {
  file: File | null
  fileUrl: string | null
  className?: string
}

export function PdfViewer({ file, fileUrl, className }: PdfViewerProps) {
  const t = useTranslations('interview-prep.new.pdfViewer')

  return (
    <Card
      className={cn(
        'flex flex-col gap-0 overflow-hidden pb-0 shadow-none',
        className
      )}
      style={{ backgroundColor: `${designTokens.colors.muted.DEFAULT}30` }}
    >
      <CardHeader
        className='flex h-12 shrink-0 flex-row items-center justify-between space-y-0 border-b p-0 px-4 backdrop-blur'
        style={{ backgroundColor: `${designTokens.colors.background}50` }}
      >
        <CardTitle
          className='flex min-w-0 items-center gap-2 text-sm font-medium'
          style={{ color: designTokens.colors.muted.foreground }}
        >
          <FileText className='h-4 w-4 shrink-0' />
          <span className='truncate'>
            {file ? file.name : t('defaultTitle')}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent
        className='relative min-h-[500px] flex-1 p-0'
        style={{
          backgroundColor: `${designTokens.colors.secondary.DEFAULT}20`,
        }}
      >
        {fileUrl ? (
          <iframe
            src={fileUrl}
            className='absolute inset-0 h-full w-full'
            title={t('iframeTitle')}
          />
        ) : (
          <div
            className='absolute inset-0 flex flex-col items-center justify-center p-6 text-center'
            style={{ color: designTokens.colors.muted.foreground }}
          >
            <div
              className='mb-4 flex h-16 w-16 items-center justify-center rounded-full'
              style={{ backgroundColor: designTokens.colors.muted.DEFAULT }}
            >
              <FileText className='h-8 w-8 opacity-50' />
            </div>
            <p
              className='mb-1 text-lg font-medium'
              style={{ color: designTokens.colors.foreground }}
            >
              {t('placeholder.title')}
            </p>
            <p className='max-w-xs text-sm'>{t('placeholder.description')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
