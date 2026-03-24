'use client'

import { useEffect, useCallback, useRef } from 'react'

interface UseNavigationGuardOptions {
  /** Whether to block navigation */
  enabled: boolean
  /** Custom confirmation message (only shown in confirm dialog for internal navigation) */
  message?: string
}

/**
 * Hook to prevent accidental navigation away from the page
 *
 * Handles:
 * - Browser refresh/close (beforeunload)
 * - Internal link clicks (anchor tags)
 * - Browser back/forward buttons (popstate)
 *
 * @example
 * ```tsx
 * useNavigationGuard({
 *   enabled: isStreaming,
 *   message: 'Streaming in progress. Are you sure you want to leave?'
 * })
 * ```
 */
export function useNavigationGuard({
  enabled,
  message = 'Changes you made may not be saved. Are you sure you want to leave?',
}: UseNavigationGuardOptions) {
  const isBlockingRef = useRef(false)

  // Handle browser refresh/close
  useEffect(() => {
    if (!enabled) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      // Modern browsers ignore custom messages
      return ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [enabled])

  // Handle internal link clicks
  useEffect(() => {
    if (!enabled) return

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const anchor = target.closest('a')

      if (!anchor) return

      // Skip external links, downloads, new tab links
      const href = anchor.getAttribute('href')
      if (
        !href ||
        href.startsWith('http') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        anchor.hasAttribute('download') ||
        anchor.target === '_blank'
      ) {
        return
      }

      // Show confirmation dialog
      const confirmed = window.confirm(message)
      if (!confirmed) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    // Use capture phase to intercept before React Router
    document.addEventListener('click', handleClick, { capture: true })
    return () =>
      document.removeEventListener('click', handleClick, { capture: true })
  }, [enabled, message])

  // Handle browser back/forward buttons
  useEffect(() => {
    if (!enabled) return

    // Push a dummy state to detect back button
    isBlockingRef.current = true
    window.history.pushState({ navigationGuard: true }, '')

    const handlePopState = (_e: PopStateEvent) => {
      if (!isBlockingRef.current) return

      const confirmed = window.confirm(message)
      if (!confirmed) {
        // User cancelled - push state back
        window.history.pushState({ navigationGuard: true }, '')
      } else {
        // User confirmed - allow navigation
        isBlockingRef.current = false
        window.history.back()
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
      // Clean up the dummy state if still blocking
      if (isBlockingRef.current) {
        isBlockingRef.current = false
        window.history.back()
      }
    }
  }, [enabled, message])

  /** Manually allow navigation (useful for programmatic navigation after cleanup) */
  const allowNavigation = useCallback(() => {
    isBlockingRef.current = false
  }, [])

  return { allowNavigation }
}
