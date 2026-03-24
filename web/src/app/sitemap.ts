import type { MetadataRoute } from 'next'

import { getSiteUrl, siteConfig } from '@/lib/site-config'

/**
 * Static routes that should be indexed by search engines.
 * Only public pages - protected routes are excluded.
 */
const staticRoutes = [
  {
    path: '',
    changeFrequency: 'weekly' as const,
    priority: 1,
  },
]

/**
 * Generate alternates for i18n support.
 * Creates language-specific URLs for each locale.
 */
function generateAlternates(
  siteUrl: string,
  path: string
): Record<string, string> {
  const languages: Record<string, string> = {}

  for (const locale of siteConfig.locales) {
    languages[locale] = `${siteUrl}/${locale}${path}`
  }

  // x-default는 영어로 (비한국어 사용자 → 영어)
  languages['x-default'] = `${siteUrl}/en${path}`

  return languages
}

/**
 * Generate sitemap.xml for search engine indexing.
 * Includes all public pages with i18n alternates.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl()
  const currentDate = new Date()

  // 각 로케일별로 별도 엔트리 생성 (동등한 SEO 처리)
  return staticRoutes.flatMap(route =>
    siteConfig.locales.map(locale => ({
      url: `${siteUrl}/${locale}${route.path}`,
      lastModified: currentDate,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: {
        languages: generateAlternates(siteUrl, route.path),
      },
    }))
  )
}
