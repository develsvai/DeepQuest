import type { MetadataRoute } from 'next'

import { getSiteUrl } from '@/lib/site-config'

/**
 * Generate robots.txt for search engine crawling directives.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl()

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/', // API routes
          '/sign-in/', // Auth pages
          '/sign-up/', // Auth pages
          '/_next/', // Next.js internals
          '/dashboard/', // Protected user data
          '/interview-prep/', // Protected user data
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
