/**
 * useSearchParam - React hook for persisting state in URL search parameters
 *
 * This utility hook synchronizes React state with URL query parameters,
 * enabling thread IDs and other state to persist across page refreshes.
 *
 * Use this for:
 * - Persisting thread IDs in URLs
 * - Creating shareable conversation links
 * - Enabling browser back/forward navigation
 * - Bookmarkable chat sessions
 *
 * @example
 * ```typescript
 * import { useSearchParam } from './useSearchParam-utility';
 *
 * function ChatPage() {
 *   const [threadId, setThreadId] = useSearchParam('threadId');
 *
 *   const thread = useStream({
 *     threadId,
 *     onThreadId: setThreadId, // Automatically updates URL
 *   });
 *
 *   // URL will be: /chat?threadId=abc-123
 *   // Refreshing page preserves threadId state
 * }
 * ```
 */

import { useCallback, useState } from 'react'

/**
 * Custom hook to retrieve and persist data in URL as search parameter
 *
 * @param key - The search parameter key to sync with
 * @returns A tuple of [value, updateFunction] similar to useState
 */
export function useSearchParam(key: string) {
  const [value, setValue] = useState<string | null>(() => {
    // Initialize from URL on mount
    if (typeof window === 'undefined') return null
    const params = new URLSearchParams(window.location.search)
    return params.get(key) ?? null
  })

  const update = useCallback(
    (value: string | null) => {
      setValue(value)

      // Update URL without page reload
      if (typeof window === 'undefined') return

      const url = new URL(window.location.href)
      if (value == null) {
        url.searchParams.delete(key)
      } else {
        url.searchParams.set(key, value)
      }

      window.history.pushState({}, '', url.toString())
    },
    [key]
  )

  return [value, update] as const
}

/**
 * Next.js App Router version using useSearchParams
 *
 * @example
 * ```typescript
 * import { useSearchParams, useRouter } from 'next/navigation';
 * import { useSearchParamNextJS } from './useSearchParam-utility';
 *
 * function ChatPage() {
 *   const searchParams = useSearchParams();
 *   const router = useRouter();
 *   const [threadId, setThreadId] = useSearchParamNextJS('threadId', searchParams, router);
 *
 *   const thread = useStream({
 *     threadId,
 *     onThreadId: setThreadId,
 *   });
 * }
 * ```
 */
export function useSearchParamNextJS(
  key: string,
  searchParams: URLSearchParams,
  router: { push: (url: string) => void }
) {
  const [value, setValue] = useState<string | null>(() => {
    return searchParams.get(key) ?? null
  })

  const update = useCallback(
    (value: string | null) => {
      setValue(value)

      const params = new URLSearchParams(searchParams.toString())
      if (value == null) {
        params.delete(key)
      } else {
        params.set(key, value)
      }

      const newUrl = params.toString() ? `?${params.toString()}` : ''
      router.push(newUrl)
    },
    [key, searchParams, router]
  )

  return [value, update] as const
}
