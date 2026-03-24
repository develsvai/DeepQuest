import { getRequestConfig } from 'next-intl/server'
import { hasLocale, IntlErrorCode } from 'next-intl'
import * as Sentry from '@sentry/nextjs'
import { routing } from './routing'

type Locale = (typeof routing.locales)[number]

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  const requestedLocale = await requestLocale

  // Ensure that a supported locale is used
  const locale: Locale =
    requestedLocale && hasLocale(routing.locales, requestedLocale)
      ? requestedLocale
      : routing.defaultLocale

  return {
    locale,
    messages: {
      // Load common messages
      common: (await import(`@locales/${locale}/common.json`)).default,
      // Load dashboard specific messages
      dashboard: (await import(`@locales/${locale}/dashboard.json`)).default,
      // Load interview-prep specific messages
      'interview-prep': (await import(`@locales/${locale}/interview-prep.json`))
        .default,
      // Load landing page messages
      landing: (await import(`@locales/${locale}/landing.json`)).default,
      // Load questions specific messages
      questions: (await import(`@locales/${locale}/questions.json`)).default,
      'question-solve': (await import(`@locales/${locale}/question-solve.json`))
        .default,
      // Load error messages
      errors: (await import(`@locales/${locale}/errors.json`)).default,
      // Load experience detail messages
      'experience-detail': (
        await import(`@locales/${locale}/experience-detail.json`)
      ).default,
    },
    onError(error) {
      if (error.code === IntlErrorCode.MISSING_MESSAGE) {
        // Missing translations are expected during development
        console.error('[i18n] Missing translation:', error.message)
      } else {
        // Report other i18n errors to Sentry
        Sentry.captureException(error)
      }
    },
    getMessageFallback({ namespace, key }) {
      return `[Missing: ${namespace}.${key}]`
    },
  }
})
