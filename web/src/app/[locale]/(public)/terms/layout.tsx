import type { ReactNode } from 'react'

import { LandingHeader } from '../_components/LandingHeader'
import { FooterSection } from '../_components/FooterSection'
import { designTokens } from '@/components/design-system/core'

interface TermsLayoutProps {
  children: ReactNode
}

/**
 * Terms Layout
 *
 * Provides consistent Header + Footer wrapping for all terms pages
 * (privacy policy, terms of use, etc.)
 */
export default function TermsLayout({ children }: TermsLayoutProps) {
  return (
    <>
      <LandingHeader />
      <main
        className='min-h-screen py-16'
        style={{ backgroundColor: designTokens.colors.background }}
      >
        <div className='container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8'>
          {children}
        </div>
      </main>
      <FooterSection />
    </>
  )
}
