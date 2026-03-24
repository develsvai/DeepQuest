import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

import { Separator } from '@/components/ui/separator'
import { designTokens } from '@/components/design-system/core'
import { routes } from '@/lib/routes'

export function FooterSection() {
  const t = useTranslations('landing.footer')

  const quickLinks = [
    t('quickLinks.items.0'),
    t('quickLinks.items.1'),
    t('quickLinks.items.2'),
  ]

  const legalLinks = [
    { label: t('legal.items.0'), href: routes.terms.termsOfService },
    { label: t('legal.items.1'), href: routes.terms.privacyPolicy },
  ]

  return (
    <footer
      className='py-16'
      style={{ backgroundColor: designTokens.colors.foreground }}
    >
      <div className='container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='mb-12 grid gap-8 md:grid-cols-4'>
          {/* Logo Section */}
          <div className='col-span-1'>
            <h3
              className='mb-4 text-2xl font-bold'
              style={{ color: designTokens.colors.background }}
            >
              Deep Quest
            </h3>
            <p
              className='text-sm leading-relaxed'
              style={{
                color: designTokens.colors.background,
                opacity: 0.8,
              }}
            >
              {t('tagline')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4
              className='mb-4 font-semibold'
              style={{ color: designTokens.colors.background }}
            >
              {t('quickLinks.title')}
            </h4>
            <ul className='space-y-2'>
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <Link
                    href='#'
                    className='cursor-pointer text-sm transition-colors hover:underline'
                    style={{
                      color: designTokens.colors.background,
                      opacity: 0.8,
                    }}
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4
              className='mb-4 font-semibold'
              style={{ color: designTokens.colors.background }}
            >
              {t('legal.title')}
            </h4>
            <ul className='space-y-2'>
              {legalLinks.map(item => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className='cursor-pointer text-sm transition-colors hover:underline'
                    style={{
                      color: designTokens.colors.background,
                      opacity: 0.8,
                    }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4
              className='mb-4 font-semibold'
              style={{ color: designTokens.colors.background }}
            >
              {t('contact.title')}
            </h4>
            <div className='space-y-2'>
              <p
                className='text-sm'
                style={{
                  color: designTokens.colors.background,
                  opacity: 0.8,
                }}
              >
                {t('contact.email')}
              </p>
              <p
                className='text-sm'
                style={{
                  color: designTokens.colors.background,
                  opacity: 0.8,
                }}
              >
                {t('contact.github')}
              </p>
            </div>
          </div>
        </div>

        <Separator
          className='mb-8'
          style={{ backgroundColor: `${designTokens.colors.background}20` }}
        />

        <div className='text-center'>
          <p
            className='text-sm'
            style={{
              color: designTokens.colors.background,
              opacity: 0.6,
            }}
          >
            {t('copyright')}
          </p>
        </div>
      </div>
    </footer>
  )
}
