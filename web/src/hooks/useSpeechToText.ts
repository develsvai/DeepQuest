/**
 * Speech-to-Text Hook using Web Speech API
 *
 * Provides voice recording capabilities with automatic speech-to-text conversion.
 * Supports browser compatibility detection and comprehensive error handling.
 *
 * @example
 * ```typescript
 * const { isRecording, isSupported, startRecording, stopRecording } = useSpeechToText({
 *   lang: 'ko-KR',
 *   onResult: (transcript) => console.log('Result:', transcript),
 *   onError: (error) => console.error('Error:', error)
 * })
 * ```
 */

'use client'

import { useRef, useState, useCallback, useEffect, useMemo } from 'react'

/**
 * Web Speech API Type Declarations
 * These types are not included in TypeScript's default lib, so we define them here
 */
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }

  interface SpeechRecognition extends EventTarget {
    lang: string
    continuous: boolean
    interimResults: boolean
    maxAlternatives: number
    start(): void
    stop(): void
    abort(): void
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
    onresult: ((event: SpeechRecognitionEvent) => void) | null
    onend: (() => void) | null
  }

  interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList
    resultIndex: number
  }

  interface SpeechRecognitionResultList {
    readonly length: number
    item(index: number): SpeechRecognitionResult
    [index: number]: SpeechRecognitionResult
  }

  interface SpeechRecognitionResult {
    readonly length: number
    item(index: number): SpeechRecognitionAlternative
    [index: number]: SpeechRecognitionAlternative
    readonly isFinal: boolean
  }

  interface SpeechRecognitionAlternative {
    readonly transcript: string
    readonly confidence: number
  }

  interface SpeechRecognitionErrorEvent extends Event {
    error: string
    message: string
  }

  const SpeechRecognition: {
    prototype: SpeechRecognition
    new (): SpeechRecognition
  }
}

/**
 * Configuration options for the speech-to-text hook
 */
export interface UseSpeechToTextOptions {
  /**
   * BCP 47 language tag (e.g., 'ko-KR', 'en-US')
   */
  lang: string

  /**
   * Callback invoked when speech recognition produces interim (non-final) results
   * Useful for real-time preview of speech input
   * @param transcript - The interim recognized text (may change)
   */
  onInterimResult?: (transcript: string) => void

  /**
   * Callback invoked when speech recognition produces a final result
   * This is the confirmed segment that won't change
   * @param transcript - The finalized recognized text
   */
  onFinalResult?: (transcript: string) => void

  /**
   * Callback invoked when an error occurs during recognition
   * @param error - Error object with descriptive message
   */
  onError: (error: Error) => void

  /**
   * Whether to use continuous recognition mode
   * @default true
   */
  continuous?: boolean
}

/**
 * Return type of the useSpeechToText hook
 */
export interface UseSpeechToTextReturn {
  /**
   * Whether recording is currently active
   */
  isRecording: boolean

  /**
   * Whether the Web Speech API is supported in current browser
   */
  isSupported: boolean

  /**
   * Last error that occurred, if any
   */
  error: Error | null

  /**
   * Start voice recording
   */
  startRecording: () => void

  /**
   * Stop voice recording and process final result
   */
  stopRecording: () => void
}

/**
 * Custom hook for speech-to-text functionality using Web Speech API
 *
 * Browser Support:
 * - ✅ Chrome 25+
 * - ✅ Edge 79+
 * - ✅ Safari 14.1+
 * - ❌ Firefox (no Web Speech API support)
 *
 * @param options - Configuration options
 * @returns Speech recognition state and control functions
 */
export function useSpeechToText({
  lang,
  onInterimResult,
  onFinalResult,
  onError,
  continuous = true,
}: UseSpeechToTextOptions): UseSpeechToTextReturn {
  // Ref to hold SpeechRecognition instance
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // State
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Check browser support for Web Speech API (runs once)
   */
  const isSupported = useMemo(() => {
    if (typeof window === 'undefined') return false

    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition

    return !!SpeechRecognitionAPI
  }, [])

  /**
   * Initialize SpeechRecognition instance
   */
  useEffect(() => {
    if (!isSupported) return

    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition

    const recognition = new SpeechRecognitionAPI()
    recognition.lang = lang
    recognition.continuous = continuous
    recognition.interimResults = true // Enable real-time preview
    recognition.maxAlternatives = 1

    /**
     * Handle successful recognition result
     * Uses resultIndex to prevent duplicate text accumulation
     */
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = ''
      let finalTranscript = ''

      // Only process new results (from resultIndex onwards)
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript

        if (event.results[i].isFinal) {
          // Confirmed segment - won't change
          finalTranscript += transcript
        } else {
          // Interim result - may change as user continues speaking
          interimTranscript += transcript
        }
      }

      // Trigger callbacks for new results only
      if (interimTranscript && onInterimResult) {
        onInterimResult(interimTranscript)
      }

      if (finalTranscript && onFinalResult) {
        onFinalResult(finalTranscript)
        setError(null)
      }
    }

    /**
     * Handle recognition errors
     */
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      let errorMessage: string

      switch (event.error) {
        case 'not-allowed':
          errorMessage = 'not-allowed'
          break
        case 'no-speech':
          errorMessage = 'no-speech'
          break
        case 'network':
          errorMessage = 'network'
          break
        case 'aborted':
          // Silent abort (user stopped recording)
          return
        default:
          errorMessage = 'unknown'
      }

      const err = new Error(errorMessage)
      setError(err)
      onError(err)
      setIsRecording(false)
    }

    /**
     * Handle recognition end
     */
    recognition.onend = () => {
      setIsRecording(false)
    }

    recognitionRef.current = recognition

    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
        recognitionRef.current = null
      }
    }
  }, [lang, continuous, onInterimResult, onFinalResult, onError, isSupported])

  /**
   * Start recording
   */
  const startRecording = useCallback(() => {
    if (!isSupported) {
      const err = new Error('not-supported')
      setError(err)
      onError(err)
      return
    }

    if (!recognitionRef.current || isRecording) return

    try {
      recognitionRef.current.start()
      setIsRecording(true)
      setError(null)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('unknown')
      setError(error)
      onError(error)
    }
  }, [isSupported, isRecording, onError])

  /**
   * Stop recording
   */
  const stopRecording = useCallback(() => {
    if (!recognitionRef.current || !isRecording) return

    try {
      recognitionRef.current.stop()
    } catch (err) {
      const error = err instanceof Error ? err : new Error('unknown')
      setError(error)
      onError(error)
    }
  }, [isRecording, onError])

  return {
    isRecording,
    isSupported,
    error,
    startRecording,
    stopRecording,
  }
}
