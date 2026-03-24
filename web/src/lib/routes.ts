/**
 * Centralized route definitions for the application.
 * Use with next-intl navigation APIs which handle locale prefixing automatically.
 *
 * @example
 * import { routes } from '@/lib/routes'
 * import { Link, useRouter } from '@/i18n/navigation'
 *
 * // Basic navigation - locale prefix added automatically
 * <Link href={routes.dashboard}>Dashboard</Link>
 *
 * // Dynamic routes
 * <Link href={routes.interviewPrep.detail(id)}>View</Link>
 * router.push(routes.interviewPrep.experience(id, 'career', expId))
 *
 * // With query parameters (use object syntax)
 * <Link href={{ pathname: routes.interviewPrep.questions(id, 'career', expId), query: { keyAchievementId } }}>
 *   Questions
 * </Link>
 */
export const routes = {
  home: '/',
  dashboard: '/dashboard',
  signIn: '/sign-in',
  interviewPrep: {
    new: '/interview-prep/new',
    detail: (id: string) => `/interview-prep/${id}` as const,
    experience: (id: string, type: string, expId: string | number) =>
      `/interview-prep/${id}/${type.toLowerCase()}/${expId}` as const,
    questions: (id: string, type: string, expId: string | number) =>
      `/interview-prep/${id}/${type.toLowerCase()}/${expId}/questions` as const,
    questionDetail: (
      id: string,
      type: string,
      expId: string | number,
      questionId: string
    ) =>
      `/interview-prep/${id}/${type.toLowerCase()}/${expId}/questions/${questionId}` as const,
  },
  settings: '/settings',
  help: '/help',
  terms: {
    privacyPolicy: '/terms/privacy-policy',
    termsOfService: '/terms/terms-of-service',
  },
} as const

/**
 * Type for route values (for type-safe route checking).
 */
export type Route = string
