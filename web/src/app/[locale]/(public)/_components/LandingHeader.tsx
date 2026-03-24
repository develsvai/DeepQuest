'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useUser } from '@clerk/nextjs'
import { Menu, X, ArrowUpRight, Sparkles } from 'lucide-react'

import { useRouter } from '@/i18n/navigation'
import { routes } from '@/lib/routes'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { LinkButton } from '@/components/ui/custom/link-button'
import { LanguageToggle } from '@/components/common/LanguageToggle'

interface NavigationItem {
  key: string
  href: string
  label: string
}

export function LandingHeader() {
  const t = useTranslations('landing')
  const router = useRouter()
  const { isSignedIn } = useUser()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  // Navigation items - aligned with landing page flow: Problem → Solution → CTA
  const navigationItems: NavigationItem[] = [
    {
      key: 'problem',
      href: '#problem',
      label: t('header.nav.problem'),
    },
    {
      key: 'solution',
      href: '#how-it-works',
      label: t('header.nav.solution'),
    },
    {
      key: 'start',
      href: '#cta',
      label: t('header.nav.start'),
    },
  ]

  // Track active section based on scroll position
  const updateActiveSection = useCallback(() => {
    const sections = ['problem', 'how-it-works', 'cta']
    const scrollPosition = window.scrollY + 150

    for (const sectionId of sections) {
      const element = document.getElementById(sectionId)
      if (element) {
        const { offsetTop, offsetHeight } = element
        if (
          scrollPosition >= offsetTop &&
          scrollPosition < offsetTop + offsetHeight
        ) {
          setActiveSection(`#${sectionId}`)
          return
        }
      }
    }
    setActiveSection(null)
  }, [])

  // Scroll-based header visibility and background
  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== 'undefined') {
        const currentScrollY = window.scrollY

        // Background opacity based on scroll
        setIsScrolled(currentScrollY > 20)

        // Hide/show based on scroll direction (with threshold)
        if (currentScrollY > lastScrollY && currentScrollY > 150) {
          setIsVisible(false)
        } else {
          setIsVisible(true)
        }
        setLastScrollY(currentScrollY)

        // Update active section
        updateActiveSection()
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', handleScroll, { passive: true })
      return () => window.removeEventListener('scroll', handleScroll)
    }
  }, [lastScrollY, updateActiveSection])

  // Handle navigation - smooth scroll for hash links, router push for paths
  const handleNavigation = (href: string) => {
    setIsMobileMenuOpen(false)

    if (href.startsWith('#')) {
      const element = document.querySelector(href)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    } else {
      router.push(href)
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <header
        className={cn(
          'fixed top-0 right-0 left-0 z-40',
          'transition-all duration-500 ease-out',
          isVisible ? 'translate-y-0' : '-translate-y-full',
          isScrolled
            ? 'border-b border-foreground/4 bg-background/60 backdrop-blur-xl'
            : 'bg-transparent'
        )}
      >
        {/* Subtle gradient overlay when scrolled */}
        {isScrolled && (
          <div className='pointer-events-none absolute inset-0 bg-linear-to-b from-background/20 to-transparent' />
        )}

        <nav className='relative container mx-auto max-w-7xl px-6 lg:px-8'>
          <div className='flex h-16 items-center justify-between lg:h-20'>
            {/* Logo - Editorial Typography */}
            <button
              onClick={scrollToTop}
              className={cn(
                'group flex items-baseline gap-0.5',
                'transition-all duration-300'
              )}
            >
              <span
                className={cn(
                  'text-xl font-semibold tracking-[-0.02em] lg:text-2xl',
                  'text-primary',
                  'transition-all duration-300',
                  'group-hover:tracking-[-0.01em]'
                )}
              >
                Deep
              </span>
              <span
                className={cn(
                  'text-xl font-light tracking-[-0.02em] lg:text-2xl',
                  'text-foreground/80',
                  'transition-all duration-300',
                  'group-hover:text-foreground'
                )}
              >
                Quest
              </span>
              {/* Subtle dot accent */}
              <span className='ml-0.5 h-1.5 w-1.5 rounded-full bg-primary/60 transition-colors duration-300 group-hover:bg-primary' />
            </button>

            {/* Desktop Navigation - Clean Editorial Style */}
            <div className='hidden items-center lg:flex'>
              <div className='flex items-center gap-1'>
                {navigationItems.map((item, index) => (
                  <button
                    key={item.key}
                    onClick={() => handleNavigation(item.href)}
                    className={cn(
                      'group relative px-4 py-2',
                      'transition-all duration-300'
                    )}
                  >
                    {/* Label */}
                    <span
                      className={cn(
                        'text-sm font-medium',
                        'transition-all duration-300',
                        activeSection === item.href
                          ? 'text-foreground'
                          : 'text-muted-foreground group-hover:text-foreground'
                      )}
                    >
                      {item.label}
                    </span>

                    {/* Active/Hover indicator - horizontal line */}
                    <span
                      className={cn(
                        'absolute right-4 bottom-1 left-4',
                        'h-px bg-primary',
                        'origin-left transition-all duration-300',
                        activeSection === item.href
                          ? 'scale-x-100 opacity-100'
                          : 'scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-60'
                      )}
                    />

                    {/* Separator between items */}
                    {index < navigationItems.length - 1 && (
                      <span className='absolute top-1/2 right-0 h-3 w-px -translate-y-1/2 bg-foreground/10' />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop Right Section */}
            <div className='hidden items-center gap-4 lg:flex'>
              {/* Language Toggle - Minimal */}
              <div className='opacity-70 transition-opacity duration-300 hover:opacity-100'>
                <LanguageToggle />
              </div>

              {/* Divider */}
              <span className='h-5 w-px bg-foreground/10' />

              {/* Auth Button - Editorial CTA */}
              {isSignedIn ? (
                <LinkButton
                  href={routes.dashboard}
                  variant='default'
                  size='sm'
                  className={cn(
                    'group gap-2 px-4',
                    'text-sm font-medium tracking-wide',
                    'transition-all duration-300'
                  )}
                >
                  {t('header.auth.openApp')}
                  <ArrowUpRight className='h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5' />
                </LinkButton>
              ) : (
                <LinkButton
                  href={routes.signIn}
                  size='sm'
                  className={cn(
                    'group gap-2 px-5',
                    'text-sm font-medium tracking-wide',
                    'bg-foreground text-background',
                    'hover:bg-foreground/90',
                    'shadow-none hover:shadow-lg hover:shadow-foreground/10',
                    'transition-all duration-300'
                  )}
                >
                  <Sparkles className='h-3.5 w-3.5 opacity-60' />
                  {t('header.auth.getStarted')}
                </LinkButton>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className='lg:hidden'>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={cn(
                  'relative h-10 w-10',
                  'hover:bg-foreground/4',
                  'transition-all duration-300'
                )}
              >
                <Menu
                  className={cn(
                    'absolute h-5 w-5',
                    'transition-all duration-300',
                    isMobileMenuOpen
                      ? 'rotate-90 opacity-0'
                      : 'rotate-0 opacity-100'
                  )}
                />
                <X
                  className={cn(
                    'absolute h-5 w-5',
                    'transition-all duration-300',
                    isMobileMenuOpen
                      ? 'rotate-0 opacity-100'
                      : '-rotate-90 opacity-0'
                  )}
                />
                <span className='sr-only'>
                  {isMobileMenuOpen
                    ? t('header.menu.close')
                    : t('header.menu.open')}
                </span>
              </Button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Menu - Full Screen Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-30 lg:hidden',
          'transition-all duration-500 ease-out',
          isMobileMenuOpen
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0'
        )}
      >
        {/* Backdrop */}
        <div
          className={cn(
            'absolute inset-0 bg-background/95 backdrop-blur-xl',
            'transition-opacity duration-500',
            isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
          )}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Menu Content */}
        <div
          className={cn(
            'relative flex h-full flex-col px-6 pt-24 pb-8',
            'transition-all duration-500 ease-out',
            isMobileMenuOpen ? 'translate-y-0' : '-translate-y-8'
          )}
        >
          {/* Navigation Links - Large Editorial Typography */}
          <nav className='flex flex-1 flex-col justify-center gap-1'>
            {navigationItems.map((item, index) => (
              <button
                key={item.key}
                onClick={() => handleNavigation(item.href)}
                className={cn(
                  'group flex items-center justify-between py-4',
                  'text-left',
                  'transition-all duration-300',
                  isMobileMenuOpen
                    ? 'translate-x-0 opacity-100'
                    : '-translate-x-4 opacity-0'
                )}
                style={{
                  transitionDelay: isMobileMenuOpen
                    ? `${(index + 1) * 75}ms`
                    : '0ms',
                }}
              >
                {/* Label */}
                <span
                  className={cn(
                    'text-2xl font-medium tracking-[-0.01em]',
                    'transition-colors duration-300',
                    activeSection === item.href
                      ? 'text-foreground'
                      : 'text-foreground/70 group-hover:text-foreground'
                  )}
                >
                  {item.label}
                </span>

                {/* Arrow on hover */}
                <ArrowUpRight
                  className={cn(
                    'h-5 w-5',
                    'transition-all duration-300',
                    'text-muted-foreground/40 group-hover:text-foreground/60',
                    'translate-x-0 group-hover:translate-x-1 group-hover:-translate-y-1'
                  )}
                />
              </button>
            ))}
          </nav>

          {/* Bottom Section */}
          <div
            className={cn(
              'space-y-6 border-t border-foreground/6 pt-8',
              'transition-all duration-500 ease-out',
              isMobileMenuOpen
                ? 'translate-y-0 opacity-100'
                : 'translate-y-4 opacity-0'
            )}
            style={{
              transitionDelay: isMobileMenuOpen ? '300ms' : '0ms',
            }}
          >
            {/* Language Toggle */}
            <div className='flex items-center justify-between'>
              <span className='text-xs font-medium tracking-[0.15em] text-muted-foreground/60 uppercase'>
                {t('header.language.toggle')}
              </span>
              <LanguageToggle />
            </div>

            {/* Auth Button - Primary */}
            {isSignedIn ? (
              <LinkButton
                href={routes.dashboard}
                size='lg'
                className='w-full justify-center gap-2'
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t('header.auth.openApp')}
                <ArrowUpRight className='h-4 w-4' />
              </LinkButton>
            ) : (
              <LinkButton
                href={routes.signIn}
                size='lg'
                className='w-full justify-center gap-2'
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Sparkles className='h-4 w-4' />
                {t('header.auth.getStarted')}
              </LinkButton>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
