'use client'

import { useState, useCallback } from 'react'

/**
 * Data required to check completeness (STAR method)
 * Only requires the fields needed for validation
 */
export interface CompletenessCheckable {
  id: number
  problems: string[]
  actions: string[]
  results: string[]
}

/**
 * Warning dialog state
 */
export interface WarningDialogState {
  isOpen: boolean
  achievementId: number | null
}

/**
 * Checks if a key achievement has sufficient STAR information
 * Requires non-empty problems (Situation), actions (Action), and results (Result)
 *
 * @param achievement - Object with problems, actions, results arrays
 * @returns true if all required fields have at least 1 item
 */
export function checkCompleteness(achievement: CompletenessCheckable): boolean {
  return !!(
    achievement.problems?.length &&
    achievement.actions?.length &&
    achievement.results?.length
  )
}

/**
 * Hook for managing completeness warning dialog state
 *
 * @example
 * const { warningState, triggerWithCheck, handleProceed, closeDialog } =
 *   useCompletenessWarning()
 *
 * // Before generation:
 * const isComplete = triggerWithCheck(achievement)
 * if (!isComplete) return // Dialog is shown
 * // Proceed with generation...
 */
export function useCompletenessWarning() {
  const [warningState, setWarningState] = useState<WarningDialogState>({
    isOpen: false,
    achievementId: null,
  })

  /**
   * Check completeness and show warning dialog if incomplete
   * @returns true if complete (can proceed), false if incomplete (dialog shown)
   */
  const triggerWithCheck = useCallback(
    (achievement: CompletenessCheckable): boolean => {
      if (!checkCompleteness(achievement)) {
        setWarningState({ isOpen: true, achievementId: achievement.id })
        return false
      }
      return true
    },
    []
  )

  /**
   * Handle user clicking "Proceed Anyway"
   * @returns the achievementId that was being validated
   */
  const handleProceed = useCallback((): number | null => {
    const id = warningState.achievementId
    setWarningState({ isOpen: false, achievementId: null })
    return id
  }, [warningState.achievementId])

  /**
   * Close dialog without action
   */
  const closeDialog = useCallback(() => {
    setWarningState({ isOpen: false, achievementId: null })
  }, [])

  return {
    warningState,
    triggerWithCheck,
    handleProceed,
    closeDialog,
  }
}
