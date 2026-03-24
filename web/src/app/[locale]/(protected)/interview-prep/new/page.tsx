import { getTranslations } from 'next-intl/server'

import { redirect, type Locale } from '@/i18n/navigation'
import { routes } from '@/lib/routes'

import { PageContainer } from '@/components/layout/PageContainer'
import { BackToDashboardButton } from './_components/BackToDashboardButton'
import { NewInterviewPrep } from './_components/NewInterviewPrep'

interface PageProps {
  params: Promise<{
    locale: string
  }>
}

/**
 * Interview Preparation Creation Page
 *
 * Multi-step wizard for creating new interview preparations.
 * Implements UI-first development strategy with mock data in Phase 1.
 *
 * Features:
 * - Step 1: Job Posting Analysis (URL input, company, position, description)
 * - Step 2: Resume Upload (file upload with drag-and-drop)
 * - Progressive step navigation with state persistence
 * - Responsive design for desktop, tablet, and mobile
 * - Form validation and error handling
 * - Loading states and feedback
 *
 * @param params - Route parameters including locale
 * @param searchParams - URL search parameters including step
 */
export default async function NewInterviewPage({ params }: PageProps) {
  const { locale } = await params

  try {
    // Get translations for page header
    const t = await getTranslations('common')

    return (
      <PageContainer width='full'>
        <PageContainer.Header
          title={t('pageHeaders.newInterviewPrep.title')}
          description={t('pageHeaders.newInterviewPrep.description')}
          action={<BackToDashboardButton />}
        />
        <PageContainer.Content>
          <NewInterviewPrep />
        </PageContainer.Content>
      </PageContainer>
    )
  } catch (error) {
    console.error('New interview page error:', error)
    // Redirect to dashboard on error
    redirect({ href: routes.dashboard, locale: locale as Locale })
  }
}
