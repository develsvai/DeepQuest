'use client'

/**
 * ResumeOverviewHeader Component
 *
 * 이력서 분석 결과의 상위 정보를 헤더 형태로 표시:
 * - 지원 직무 (Target Position)
 * - 경력 연차 (Years of Experience)
 * - 핵심 요약 리스트 (Summary Points)
 * - Edit 버튼 (optional)
 */

import { Briefcase, Calendar, Pencil } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface ResumeOverviewHeaderProps {
  /** 지원 직무 (e.g., "백엔드 개발자") */
  targetPosition: string
  /** 경력 연차 */
  yearsOfExperience: number
  /** 핵심 역량/요약 리스트 */
  summaryPoints: string[]
  /** Edit 버튼 클릭 핸들러 (없으면 버튼 숨김) */
  onEdit?: () => void
}

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

export function ResumeOverviewHeader({
  targetPosition,
  yearsOfExperience,
  summaryPoints,
  onEdit,
}: ResumeOverviewHeaderProps) {
  const t = useTranslations('interview-prep.detail.v2.resumeHeader')

  return (
    <header className='mb-6'>
      {/* Title Row: Position + Edit Button */}
      <div className='flex items-start justify-between gap-4'>
        <div>
          <h3 className='flex items-center gap-3 text-xl font-bold text-foreground'>
            <span className='flex items-center gap-1.5'>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Briefcase className='size-5 cursor-help' />
                </TooltipTrigger>
                <TooltipContent>{t('targetPosition')}</TooltipContent>
              </Tooltip>
              {targetPosition}
            </span>
            <span className='flex items-center gap-1.5 text-base font-medium text-muted-foreground'>
              <Calendar className='size-4' />
              {t('yearsExperience', { years: yearsOfExperience })}
            </span>
          </h3>
        </div>

        {onEdit && (
          <Button
            variant='outline'
            size='sm'
            onClick={onEdit}
            className='shrink-0'
          >
            <Pencil className='size-3.5' />
            {t('edit')}
          </Button>
        )}
      </div>

      {/* Summary Points */}
      {summaryPoints.length > 0 && (
        <ul className='mt-3 space-y-1.5'>
          {summaryPoints.map((point, index) => (
            <li
              key={index}
              className='flex items-start gap-2 text-sm text-muted-foreground'
            >
              <span className='mt-1 size-1.5 shrink-0 rounded-full bg-muted-foreground/50' />
              {point}
            </li>
          ))}
        </ul>
      )}
    </header>
  )
}
