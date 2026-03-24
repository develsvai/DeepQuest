import { ClerkProvider as ClerkNextJSProvider } from '@clerk/nextjs'
import { enUS, koKR } from '@clerk/localizations'
import { shadcn } from '@clerk/themes'
import type { Locale } from '@/i18n/routing'

type ClerkProviderProps = React.ComponentProps<typeof ClerkNextJSProvider> & {
  locale?: Locale
}

/**
 * Localization mapping for Clerk.
 * Using explicit enUS instead of undefined for proper locale switching.
 * @see https://github.com/clerk/javascript/issues/1557
 */
const localizationMap: Record<Locale, typeof koKR> = {
  ko: koKR,
  en: enUS,
}

export function ClerkProvider({
  children,
  appearance,
  locale = 'ko',
  ...props
}: ClerkProviderProps) {
  return (
    <ClerkNextJSProvider
      key={locale}
      appearance={{
        theme: shadcn,
        ...appearance,
      }}
      localization={localizationMap[locale]}
      {...props}
    >
      {children}
    </ClerkNextJSProvider>
  )
}
