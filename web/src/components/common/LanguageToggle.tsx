'use client'

import { Globe, Check } from 'lucide-react'
import { useLocale } from 'next-intl'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { usePathname, useRouter, type Locale } from '@/i18n/navigation'

/**
 * Language toggle component
 * Allows users to switch between Korean and English
 * Integrates with next-intl routing and preserves current route
 */
export function LanguageToggle() {
  const router = useRouter()
  const pathname = usePathname() // Returns path WITHOUT locale prefix (e.g., '/dashboard')
  const locale = useLocale()

  const languages = [
    { code: 'ko', label: '한국어', flag: '🇰🇷' },
    { code: 'en', label: 'English', flag: '🌎' },
  ] as const

  const handleLanguageChange = (newLocale: Locale) => {
    // next-intl handles locale switching automatically
    // No regex manipulation needed - just pass the locale option
    router.replace(pathname, { locale: newLocale })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='sm' className='gap-2'>
          <Globe className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {languages.map(lang => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className='gap-2'
          >
            <span>{lang.flag}</span>
            <span>{lang.label}</span>
            {locale === lang.code && <Check className='ml-auto h-4 w-4' />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
