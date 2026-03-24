'use client'

import { useEffect, useState, useRef } from 'react'

import { prefersReducedMotion } from '@/components/design-system/core'

const DEFAULT_MAX_PROGRESS = 85
const DEFAULT_DURATION_MS = 120_000
const INTERVAL_MS = 400
const COMPLETION_DISPLAY_MS = 400

export type ProgressState = 'idle' | 'progressing' | 'completing' | 'completed'

export interface UsePreparationProgressOptions {
  /** Whether preparation is in progress */
  isActive: boolean
  /** Maximum progress before completion (default: 85) */
  maxProgress?: number
  /** Duration to reach maxProgress in ms (default: 120000) */
  durationMs?: number
}

export interface UsePreparationProgressReturn {
  /** Current progress value (0-100) */
  progress: number
  /** Current state of the progress animation */
  state: ProgressState
}

/**
 * Hook for managing preparation progress animation
 *
 * @example
 * ```tsx
 * const { progress, state } = usePreparationProgress({
 *   isActive: true,
 *   maxProgress: 85,
 *   durationMs: 120_000,
 * })
 * ```
 */
export function usePreparationProgress({
  isActive,
  maxProgress = DEFAULT_MAX_PROGRESS,
  durationMs = DEFAULT_DURATION_MS,
}: UsePreparationProgressOptions): UsePreparationProgressReturn {
  const [progress, setProgress] = useState(0)
  const [state, setState] = useState<ProgressState>('idle')

  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Start progress animation when active
  useEffect(() => {
    if (!isActive) return

    // Already running
    if (intervalRef.current) return

    setState('progressing')
    setProgress(0)

    // Skip animation if reduced motion preferred
    if (prefersReducedMotion()) {
      setProgress(maxProgress)
      return
    }

    // Calculate increment per interval
    const incrementPerInterval = (maxProgress / durationMs) * INTERVAL_MS

    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + incrementPerInterval
        if (newProgress >= maxProgress) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
          return maxProgress
        }
        return newProgress
      })
    }, INTERVAL_MS)

    // Cleanup only on unmount or when isActive becomes false
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isActive, maxProgress, durationMs])

  // Handle completion when isActive becomes false
  useEffect(() => {
    if (isActive) return
    if (state === 'idle' || state === 'completed') return

    // Clear any running interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    setState('completing')
    setProgress(100)

    const completionTimeout = setTimeout(() => {
      setState('completed')
    }, COMPLETION_DISPLAY_MS)

    return () => clearTimeout(completionTimeout)
  }, [isActive, state])

  // Reset when completed and needs to restart
  useEffect(() => {
    if (!isActive && state === 'completed') {
      setProgress(0)
      setState('idle')
    }
  }, [isActive, state])

  return { progress, state }
}
