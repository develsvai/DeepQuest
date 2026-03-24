import { createNavigation } from 'next-intl/navigation'

import { routing } from './routing'

/**
 * Locale-aware navigation primitives from next-intl.
 * These automatically handle locale prefixing in URLs.
 *
 * @example
 * import { Link, useRouter } from '@/i18n/navigation'
 * import { routes } from '@/lib/routes'
 *
 * // Link - locale prefix added automatically
 * <Link href={routes.dashboard}>Dashboard</Link>
 *
 * // Router - locale prefix added automatically
 * router.push(routes.interviewPrep.detail(id))
 *
 * // Language switch - use locale option
 * router.replace(pathname, { locale: 'en' })
 */
export const {
  Link,
  redirect,
  usePathname,
  useRouter,
  getPathname,
  permanentRedirect,
} = createNavigation(routing)

/**
 * Locale type - single source of truth.
 * @example 'ko' | 'en'
 */
export type Locale = (typeof routing.locales)[number]
