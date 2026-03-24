import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

import { LandingHeader } from './_components/LandingHeader'
import { HeroSection } from './_components/HeroSection'
import { ProblemSection } from './_components/ProblemSection'
import { HowItWorksSection } from './_components/HowItWorksSection'
import { CTASection } from './_components/CTASection'
import { FooterSection } from './_components/FooterSection'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('landing.metadata')

  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      type: 'website',
    },
  }
}

/**
 * Landing Page
 *
 * Follows Simon Sinek's "Start with Why" golden circle:
 * WHY → HOW → WHAT
 *
 * Section flow:
 * 1. Hero - The feared interview question + value proposition
 * 2. Problem - Empathy section (interview fears + existing methods' limitations)
 * 3. Solution - How it works (4-step process)
 * 4. CTA - Final conversion with reassurance
 *
 * Design Philosophy: "Editorial Warmth"
 * - Magazine-like refined layouts with warm, human touch
 * - Technical but not cold, professional but approachable
 */
export default async function LandingPage() {
  return (
    <>
      <LandingHeader />
      <main className='relative min-h-screen overflow-hidden'>
        {/* Noise texture overlay for entire page */}
        <div
          className='pointer-events-none fixed inset-0 z-50 opacity-[0.015] dark:opacity-[0.02]'
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* WHY: Value proposition */}
        <HeroSection />

        {/* WHY: Empathy - Interview fears + existing methods' limitations */}
        <ProblemSection />

        {/* HOW: Solution - 4-step process */}
        <HowItWorksSection />

        {/* WHAT: Final CTA with reassurance */}
        <CTASection />

        <FooterSection />
      </main>
    </>
  )
}
