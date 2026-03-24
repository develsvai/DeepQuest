/**
 * TypeScript declarations for next-intl type safety.
 * This enables IntelliSense for translation keys.
 *
 * @see https://next-intl-docs.vercel.app/docs/workflows/typescript
 *
 * NOTE: next-intl 4.0+ uses automatic message inheritance.
 * All namespaces are available in both server and client components.
 * No need for pick() or nested providers.
 */

import type common from '@locales/en/common.json'
import type dashboard from '@locales/en/dashboard.json'
import type interviewPrep from '@locales/en/interview-prep.json'
import type landing from '@locales/en/landing.json'
import type questions from '@locales/en/questions.json'
import type questionSolve from '@locales/en/question-solve.json'
import type errors from '@locales/en/errors.json'
import type experienceDetail from '@locales/en/experience-detail.json'

/**
 * All available message namespaces.
 * Each namespace corresponds to a JSON file in /locales/{locale}/
 *
 * To add a new namespace:
 * 1. Create /locales/{ko,en}/new-namespace.json
 * 2. Add import and type entry here
 * 3. Register in /src/i18n/request.ts
 */
type Messages = {
  common: typeof common
  dashboard: typeof dashboard
  'interview-prep': typeof interviewPrep
  landing: typeof landing
  questions: typeof questions
  'question-solve': typeof questionSolve
  errors: typeof errors
  'experience-detail': typeof experienceDetail
}

/**
 * All available namespace keys for useTranslations()
 * TypeScript will validate that namespace strings match registered namespaces.
 */
export type MessageNamespace = keyof Messages

declare module 'next-intl' {
  interface AppConfig {
    Messages: Messages
    Locale: 'ko' | 'en'
  }
}
