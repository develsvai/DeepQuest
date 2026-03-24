import { headers } from 'next/headers'
// eslint-disable-next-line no-restricted-imports -- Root page requires native redirect (outside locale routing)
import { redirect } from 'next/navigation'

export default async function RootPage() {
  // Get the Accept-Language header to detect browser language
  const headersList = await headers()
  const acceptLanguage = headersList.get('accept-language') || ''

  // Parse the primary language from the header
  // Format is typically: "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7"
  const primaryLanguage = acceptLanguage
    .split(',')[0]
    ?.split('-')[0]
    ?.toLowerCase()

  // Determine locale based on browser language
  // Korean -> ko, everything else -> en
  const locale = primaryLanguage === 'ko' ? 'ko' : 'en'

  // Redirect to the appropriate locale landing page
  redirect(`/${locale}`)
}
