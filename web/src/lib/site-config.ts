/**
 * Site configuration for SEO and metadata.
 * Used by sitemap.ts, robots.ts, layout.tsx, and other SEO-related files.
 */

/**
 * Get the site URL from environment variables.
 * Falls back to localhost in development.
 */
export function getSiteUrl(): string {
  const url =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL ||
    'http://localhost:3000'

  // Ensure VERCEL_URL has protocol
  if (url.startsWith('http')) {
    return url.replace(/\/$/, '') // Remove trailing slash
  }

  return `https://${url}`.replace(/\/$/, '')
}

/**
 * Supported locales type.
 */
export type SiteLocale = 'ko' | 'en'

/**
 * Locale-specific metadata for SEO.
 */
export interface LocaleMetadata {
  title: string
  description: string
  keywords: string[]
  ogLocale: string
}

/**
 * Site metadata constants with i18n support.
 */
export const siteConfig = {
  name: 'DeepQuest',
  locales: ['ko', 'en'] as const,
  defaultLocale: 'ko' as const,

  /**
   * Locale-specific SEO metadata.
   */
  metadata: {
    ko: {
      title: 'DeepQuest - AI 면접 코칭',
      description:
        '딥퀘스트는 이력서 기반 AI 기술면접 코칭 플랫폼입니다. 개발자를 위한 개인화된 기술면접 질문 생성과 AI 모의면접으로 체계적인 면접 준비를 도와드립니다.',
      keywords: [
        // 브랜드 키워드
        '딥퀘스트',
        'DeepQuest',
        'deep quest',
        // Primary 키워드
        '기술면접',
        '기술면접 준비',
        'AI 기술면접',
        '기술면접 AI',
        '모의면접',
        'AI 모의면접',
        // 예상질문 관련 키워드
        '기술면접 예상질문',
        '기술면접 질문',
        '면접 예상질문',
        '면접 질문',
        '개발자 면접 예상질문',
        // Secondary 키워드
        '이력서 기반 기술면접',
        '개인화된 기술면접',
        '개발자를 위한 AI 모의면접',
        // Long-tail 키워드
        '개발자 이직',
        '개발자 기술면접',
        '개발자 모의면접',
        // 기존 키워드
        '면접 준비',
        '개발자 면접',
        'AI 면접 코칭',
        '이력서 분석',
        '코딩 인터뷰',
      ],
      ogLocale: 'ko_KR',
    },
    en: {
      title: 'DeepQuest - AI Interview Coaching',
      description:
        'DeepQuest is an AI-powered technical interview coaching platform. Personalized technical interview questions and AI mock interviews for developers. Master your next tech interview.',
      keywords: [
        // Brand keywords
        'DeepQuest',
        'deep quest',
        // Primary keywords
        'technical interview',
        'tech interview',
        'AI technical interview',
        'mock interview',
        'AI mock interview',
        // Expected questions keywords
        'technical interview expected questions',
        'tech interview questions',
        'interview expected questions',
        'developer interview questions',
        // Secondary keywords
        'resume-based interview',
        'personalized interview',
        'AI mock interview for developers',
        // Long-tail keywords
        'developer job change',
        'developer technical interview',
        // Existing keywords
        'interview preparation',
        'developer interview',
        'AI interview coaching',
        'resume analysis',
        'coding interview',
      ],
      ogLocale: 'en_US',
    },
  } satisfies Record<SiteLocale, LocaleMetadata>,

  /**
   * Default OG image configuration.
   * Used by Facebook, Threads, KakaoTalk, and other platforms.
   */
  ogImage: {
    path: '/api/og',
    width: 1200,
    height: 630,
  },

  /**
   * Organization info for JSON-LD structured data.
   */
  organization: {
    name: 'DeepQuest',
    logo: '/logo.png',
  },
} as const

/**
 * Get locale-specific metadata.
 */
export function getLocaleMetadata(locale: string): LocaleMetadata {
  const validLocale = (
    siteConfig.locales.includes(locale as SiteLocale) ? locale : 'ko'
  ) as SiteLocale
  return siteConfig.metadata[validLocale]
}

/**
 * Get alternate locales for OG tags.
 */
export function getAlternateLocales(currentLocale: string): string[] {
  return siteConfig.locales
    .filter(l => l !== currentLocale)
    .map(l => siteConfig.metadata[l].ogLocale)
}
