/**
 * Question Category Constants
 *
 * Single source of truth for question category UI mappings.
 * - Icons: Lucide React icons for each category
 * - Colors: Design token color keys for each category
 *
 * 4대 핵심 카테고리 (STAR 매핑 기반):
 * - TECHNICAL_DECISION: 기술적 의사결정 (설계 단계 논리와 전략)
 * - TECHNICAL_DEPTH: 기술적 깊이와 원리 (도구 작동 원리, CS 기초)
 * - PROBLEM_SOLVING: 문제 해결 및 검증 (논리적 해결, 성과 인과관계)
 * - SCALABILITY: 확장 가능성 (미래 시야, 아키텍처 한계)
 */

import {
  Lightbulb,
  Layers,
  Wrench,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import { QuestionCategory } from '@/generated/prisma/enums'

/**
 * Category icon mapping
 */
export const CATEGORY_ICONS: Record<QuestionCategory, LucideIcon> = {
  [QuestionCategory.TECHNICAL_DECISION]: Lightbulb, // 의사결정 - 아이디어/전략
  [QuestionCategory.TECHNICAL_DEPTH]: Layers, // 기술적 깊이 - 레이어/구조
  [QuestionCategory.PROBLEM_SOLVING]: Wrench, // 문제 해결 - 도구/수리
  [QuestionCategory.SCALABILITY]: TrendingUp, // 확장성 - 성장/트렌드
}

/**
 * Category color key type (matches design tokens)
 */
export type CategoryColorKey = 'chart.1' | 'chart.2' | 'chart.3' | 'chart.4'

/**
 * Category color mapping
 */
export const CATEGORY_COLORS: Record<QuestionCategory, CategoryColorKey> = {
  [QuestionCategory.TECHNICAL_DECISION]: 'chart.1',
  [QuestionCategory.TECHNICAL_DEPTH]: 'chart.2',
  [QuestionCategory.PROBLEM_SOLVING]: 'chart.3',
  [QuestionCategory.SCALABILITY]: 'chart.4',
}

/**
 * Get icon for a category
 */
export function getCategoryIcon(category: QuestionCategory): LucideIcon {
  return CATEGORY_ICONS[category]
}

/**
 * Get color key for a category
 */
export function getCategoryColorKey(
  category: QuestionCategory
): CategoryColorKey {
  return CATEGORY_COLORS[category]
}
