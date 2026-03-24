import { Geist_Mono } from 'next/font/google'
import localFont from 'next/font/local'
import { NextIntlClientProvider } from 'next-intl'
import { hasLocale } from 'next-intl'
import { notFound } from 'next/navigation'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'

import type { Metadata } from 'next'
import { routing, type Locale } from '@/i18n/routing'
import { ClerkProvider } from '@/components/clerk-provider'
import { SentryUserProvider } from '@/components/providers/sentry-user-provider'
import { PostHogUserProvider } from '@/components/providers/posthog-user-provider'
import { TRPCProvider } from '@/trpc/provider'
import { Toaster } from '@/components/ui/sonner'
import { JsonLd } from '@/components/common/JsonLd'
import {
  getSiteUrl,
  getLocaleMetadata,
  getAlternateLocales,
  siteConfig,
} from '@/lib/site-config'
import '../globals.css'

const pretendard = localFont({
  src: '../fonts/PretendardVariable.woff2',
  display: 'swap',
  weight: '45 920',
  variable: '--font-pretendard',
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

/**
 * Generate locale-aware metadata for SEO.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const siteUrl = getSiteUrl()
  const localeMetadata = getLocaleMetadata(locale)
  const alternateLocales = getAlternateLocales(locale)

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: localeMetadata.title,
      template: `%s | ${siteConfig.name}`,
    },
    description: localeMetadata.description,
    keywords: localeMetadata.keywords,
    authors: [{ name: siteConfig.name }],
    creator: siteConfig.name,
    icons: {
      icon: [
        { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        { url: '/favicon.ico', sizes: 'any' },
      ],
      apple: '/apple-touch-icon.png',
    },
    manifest: '/site.webmanifest',
    // Open Graph - used by Facebook, KakaoTalk, and most social platforms
    openGraph: {
      type: 'website',
      locale: localeMetadata.ogLocale,
      alternateLocale: alternateLocales,
      siteName: siteConfig.name,
      title: localeMetadata.title,
      description: localeMetadata.description,
      url: siteUrl,
      images: [
        {
          url: siteConfig.ogImage.path,
          width: siteConfig.ogImage.width,
          height: siteConfig.ogImage.height,
          alt: localeMetadata.title,
        },
      ],
    },
    // Twitter Card - also used by Threads (Meta platform)
    twitter: {
      card: 'summary_large_image',
      title: localeMetadata.title,
      description: localeMetadata.description,
      images: [siteConfig.ogImage.path],
    },
    alternates: {
      canonical: `${siteUrl}/${locale}`,
      languages: {
        ko: `${siteUrl}/ko`,
        en: `${siteUrl}/en`,
        'x-default': `${siteUrl}/en`, // 비한국어 사용자 → 영어
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    // Site verification - only include if env var is set
    ...(process.env.NAVER_SITE_VERIFICATION && {
      verification: {
        other: {
          'naver-site-verification': process.env.NAVER_SITE_VERIFICATION,
        },
      },
    }),
  }
}

/**
 * RootLayout Props
 *
 * NOTE: `locale` must be typed as `string` (not `Locale`).
 * Next.js 16 generates `.next/dev/types/validator.ts` with `locale: string` for dynamic route segments.
 * Using `Locale` type causes TS2344 error due to type mismatch.
 * Runtime validation is handled by `hasLocale()` below.
 */
interface RootLayoutProps {
  children: React.ReactNode
  params: Promise<{
    locale: string
  }>
}

export default async function RootLayout({
  children,
  params,
}: RootLayoutProps) {
  const { locale } = await params

  // Ensure that the incoming `locale` is valid
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  // After hasLocale validation, locale is guaranteed to be a valid Locale type
  const validLocale = locale as Locale

  return (
    <ClerkProvider locale={validLocale}>
      <html
        lang={locale}
        className={`${pretendard.variable} ${geistMono.variable}`}
        suppressHydrationWarning
      >
        <head>
          <JsonLd locale={locale} />
        </head>
        <body className='antialiased'>
          {/* JSON-LD structured data for SEO */}
          <SentryUserProvider>
            <PostHogUserProvider>
              <TRPCProvider>
                {/* next-intl 4.0+: messages are automatically inherited from server */}
                <NextIntlClientProvider>
                  {children}
                  <Toaster />
                  <SpeedInsights />
                  <Analytics />
                </NextIntlClientProvider>
              </TRPCProvider>
            </PostHogUserProvider>
          </SentryUserProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
