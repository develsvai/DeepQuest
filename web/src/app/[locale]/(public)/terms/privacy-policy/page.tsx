import { notFound } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import type { Metadata } from 'next'

import { MarkdownDocument } from '@/components/ui/markdown-document'

const DEFAULT_LOCALE = 'ko'

/**
 * Get markdown content for the specified locale
 * Falls back to default locale if the file doesn't exist
 */
async function getMarkdownContent(
  filename: string,
  locale: string
): Promise<string | null> {
  const basePath = join(process.cwd(), 'public', 'terms')

  // Try current locale first
  try {
    const filePath = join(basePath, locale, filename)
    return await readFile(filePath, 'utf-8')
  } catch {
    // File not found for current locale
  }

  // Fallback to default locale
  if (locale !== DEFAULT_LOCALE) {
    try {
      const filePath = join(basePath, DEFAULT_LOCALE, filename)
      return await readFile(filePath, 'utf-8')
    } catch {
      // File not found for default locale either
    }
  }

  return null
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('common')

  return {
    title: t('terms.privacyPolicy'),
    description: t('terms.privacyPolicyDescription'),
  }
}

/**
 * Privacy Policy Page
 *
 * Renders the privacy policy document in the current locale.
 * Falls back to Korean (default) if the translated version is not available.
 */
export default async function PrivacyPolicyPage() {
  const locale = await getLocale()
  const content = await getMarkdownContent('privacy-policy.md', locale)

  if (!content) {
    notFound()
  }

  return <MarkdownDocument>{content}</MarkdownDocument>
}
