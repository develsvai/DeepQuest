/**
 * Next.js 16 Proxy (formerly middleware.ts)
 *
 * Combines Clerk authentication with next-intl internationalization.
 * Runs BEFORE server components, ensuring auth state is available.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/proxy
 * @see https://clerk.com/docs/references/nextjs/clerk-middleware
 */
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import createMiddleware from 'next-intl/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { routing, type Locale } from './i18n/routing'

/**
 * Locale-neutral paths for Clerk Legal Acceptance.
 * These paths are used in Clerk Dashboard for Terms of Service and Privacy Policy URLs.
 * Users accessing these paths without locale prefix will be redirected to their preferred locale.
 */
const LOCALE_NEUTRAL_PATHS = [
  '/terms/terms-of-service',
  '/terms/privacy-policy',
]

/**
 * Check if the pathname is a locale-neutral path
 */
function isLocaleNeutralPath(pathname: string): boolean {
  return LOCALE_NEUTRAL_PATHS.some(path => pathname === path)
}

/**
 * Get user's preferred locale from cookies or Accept-Language header.
 * Priority: 1. NEXT_LOCALE cookie, 2. Accept-Language header, 3. Default locale
 */
function getPreferredLocale(request: NextRequest): Locale {
  // Check for locale cookie set by next-intl
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value
  if (cookieLocale && routing.locales.includes(cookieLocale as Locale)) {
    return cookieLocale as Locale
  }

  // Parse Accept-Language header
  const acceptLanguage = request.headers.get('accept-language') || ''
  const primaryLang = acceptLanguage.split(',')[0]?.split('-')[0]?.toLowerCase()

  return primaryLang === 'ko' ? 'ko' : 'en'
}

// Create the next-intl middleware
const intlMiddleware = createMiddleware(routing)

/**
 * Protected routes that require authentication
 *
 * createRouteMatcher accepts an array of route patterns:
 * - Supports glob patterns: '/dashboard(.*)' matches /dashboard, /dashboard/settings, etc.
 * - Supports path parameters: '/:locale/dashboard(.*)' matches /ko/dashboard, /en/dashboard/...
 * - Multiple patterns can be combined in array
 */
const isProtectedRoute = createRouteMatcher([
  '/:locale/dashboard(.*)',
  '/:locale/interview-prep(.*)',
])

/**
 * Routes that should bypass i18n middleware entirely.
 * These routes don't need locale prefixing.
 */
const isBypassRoute = createRouteMatcher([
  '/api/(.*)',
  '/trpc/(.*)',
  '/sitemap.xml',
  '/robots.txt',
  '/favicon.ico',
  '/site.webmanifest',
  '/monitoring(.*)',
  '/ingest(.*)',
])

/**
 * Clerk middleware wrapper for Next.js 16
 *
 * Flow:
 * 1. Skip intl for API routes (early return) - NO auth.protect() here!
 * 2. Protect authenticated routes - redirect to login if not authenticated
 * 3. Apply intl middleware for locale handling
 *
 * NOTE: API 경로에서는 auth.protect()를 사용하지 않습니다.
 * - API 인증은 tRPC의 protectedProcedure에서 처리
 * - auth.protect()는 인증 실패 시 sign-in 리다이렉트를 발생시키는데,
 *   API 요청에서는 JSON 에러 응답이 필요함 (리다이렉트 X)
 * - 첫 번째 클라이언트 API 요청 시 Clerk 세션 쿠키가 아직 준비되지 않아
 *   불필요한 리다이렉트가 발생할 수 있음
 */
export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl

  // Skip intl middleware for bypass routes (API, sitemap, robots, etc.)
  // API 인증은 tRPC protectedProcedure에서 처리 (리다이렉트 대신 401 에러 반환)
  if (isBypassRoute(request)) {
    return
  }

  // Handle locale-neutral paths for Clerk Legal Acceptance
  // Redirect /terms/terms-of-service → /ko/terms/terms-of-service or /en/terms/terms-of-service
  if (isLocaleNeutralPath(pathname)) {
    const locale = getPreferredLocale(request)
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}${pathname}`
    return NextResponse.redirect(url)
  }

  // Protect routes - redirect unauthenticated users to login page
  if (isProtectedRoute(request)) {
    const { isAuthenticated, redirectToSignIn } = await auth()

    if (!isAuthenticated) {
      // Redirect to sign-in page with return URL
      return redirectToSignIn({ returnBackUrl: request.url })
    }
  }

  // Apply next-intl middleware for internationalization
  return intlMiddleware(request)
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    // Video/audio: mp4, webm, ogg, mov, mp3, wav
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|mp4|webm|ogg|mov|mp3|wav)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
