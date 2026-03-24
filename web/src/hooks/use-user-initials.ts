import { useMemo } from 'react'

/**
 * Custom hook for calculating user initials from name
 * Optimized with memoization to prevent unnecessary recalculations
 *
 * @param name - User's full name
 * @returns Uppercase initials or 'U' as fallback
 */
export function useUserInitials(name?: string): string {
  return useMemo(() => {
    if (!name) return 'U'

    return (
      name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase() || 'U'
    )
  }, [name])
}
