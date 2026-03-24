import { getSiteUrl, getLocaleMetadata, siteConfig } from '@/lib/site-config'

interface JsonLdProps {
  locale: string
}

/**
 * Generate Organization JSON-LD structured data.
 * Helps search engines understand the site owner/brand.
 */
function getOrganizationJsonLd(siteUrl: string) {
  return {
    '@type': 'Organization',
    '@id': `${siteUrl}/#organization`,
    name: siteConfig.organization.name,
    url: siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${siteUrl}${siteConfig.organization.logo}`,
    },
  }
}

/**
 * Generate WebSite JSON-LD structured data.
 * Enables sitelinks search box in Google results.
 */
function getWebSiteJsonLd(siteUrl: string, locale: string) {
  const localeMetadata = getLocaleMetadata(locale)

  return {
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    url: siteUrl,
    name: siteConfig.name,
    description: localeMetadata.description,
    inLanguage: locale === 'ko' ? 'ko-KR' : 'en-US',
    publisher: {
      '@id': `${siteUrl}/#organization`,
    },
  }
}

/**
 * Generate WebPage JSON-LD for the current page.
 */
function getWebPageJsonLd(siteUrl: string, locale: string) {
  const localeMetadata = getLocaleMetadata(locale)

  return {
    '@type': 'WebPage',
    '@id': `${siteUrl}/${locale}/#webpage`,
    url: `${siteUrl}/${locale}`,
    name: localeMetadata.title,
    description: localeMetadata.description,
    inLanguage: locale === 'ko' ? 'ko-KR' : 'en-US',
    isPartOf: {
      '@id': `${siteUrl}/#website`,
    },
  }
}

/**
 * Generate SoftwareApplication JSON-LD.
 * Helps search engines understand this is a web application.
 */
function getSoftwareApplicationJsonLd(siteUrl: string, locale: string) {
  const isKorean = locale === 'ko'

  return {
    '@type': 'SoftwareApplication',
    '@id': `${siteUrl}/#software`,
    name: 'DeepQuest',
    alternateName: isKorean ? '딥퀘스트' : 'Deep Quest',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: isKorean ? 'KRW' : 'USD',
    },
    description: isKorean
      ? '이력서 기반 AI 기술면접 코칭 플랫폼. 개인화된 면접 질문 생성과 AI 피드백 제공'
      : 'AI-powered technical interview coaching platform with resume-based personalized questions and feedback',
    featureList: isKorean
      ? ['이력서 분석', '맞춤 면접 질문 생성', 'AI 피드백', '경험 기반 코칭']
      : [
          'Resume Analysis',
          'Custom Interview Questions',
          'AI Feedback',
          'Experience-based Coaching',
        ],
  }
}

/**
 * Build the complete JSON-LD object.
 * All data comes from trusted siteConfig - no user input.
 */
function buildJsonLdGraph(locale: string) {
  const siteUrl = getSiteUrl()

  return {
    '@context': 'https://schema.org',
    '@graph': [
      getOrganizationJsonLd(siteUrl),
      getWebSiteJsonLd(siteUrl, locale),
      getWebPageJsonLd(siteUrl, locale),
      getSoftwareApplicationJsonLd(siteUrl, locale),
    ],
  }
}

/**
 * JSON-LD structured data component for SEO.
 * Renders Organization, WebSite, and WebPage schemas.
 *
 * This is a Server Component that renders JSON-LD as a script tag.
 * Content is generated from trusted siteConfig only (no user input).
 *
 * @see https://developers.google.com/search/docs/appearance/structured-data
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/metadata#json-ld
 */
export function JsonLd({ locale }: JsonLdProps) {
  const jsonLd = buildJsonLdGraph(locale)

  return (
    <script
      type='application/ld+json'
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
