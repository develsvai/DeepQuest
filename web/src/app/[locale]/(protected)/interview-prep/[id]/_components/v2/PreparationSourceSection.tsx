'use client'

/**
 * PreparationSourceSection Component
 *
 * 면접 준비 소스 섹션 - 이력서 분석 / 채용공고 탭:
 * - TabsList는 항상 표시 (로딩 상태와 무관)
 * - isLoading일 때 Content 스켈레톤 표시
 * - 데이터 로드 완료 시 실제 Content 표시
 */

import { Suspense } from 'react'
import { Tabs } from '@/components/ui/tabs'
import { PreparationSourceTabs } from './PreparationSourceTabs'
import { PreparationSourceContent } from './PreparationSourceContent'
import { PreparationSourceContentSkeleton } from './PreparationSourceContentSkeleton'

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

interface PreparationSourceSectionProps {
  /** 로딩 상태 (isPending 등) */
  isLoading?: boolean
}

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

export function PreparationSourceSection({
  isLoading = false,
}: PreparationSourceSectionProps) {
  return (
    <Tabs defaultValue='resume' className='w-full'>
      {/* Tab Navigation - 항상 표시 */}
      <PreparationSourceTabs />

      {/* Tab Content - 조건부 렌더링 */}
      {isLoading ? (
        <PreparationSourceContentSkeleton />
      ) : (
        <Suspense fallback={<PreparationSourceContentSkeleton />}>
          <PreparationSourceContent />
        </Suspense>
      )}
    </Tabs>
  )
}
