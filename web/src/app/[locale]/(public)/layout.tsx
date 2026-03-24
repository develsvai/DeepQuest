import { ReactNode } from 'react'

export default function PublicLayout({ children }: { children: ReactNode }) {
  // Public routes have their own navigation (LandingHeader)
  // No sidebar or protected-specific UI needed
  return <>{children}</>
}
