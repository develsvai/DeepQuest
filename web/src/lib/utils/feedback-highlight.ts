/**
 * Feedback Highlight Utilities
 *
 * Utility functions for highlighting structured feedback paragraphs
 * with color-coded sections using design system tokens.
 * Colors are defined in globals.css as RGB values and converted to RGBA with opacity.
 */

import { getCSSVariable } from '@/components/design-system/core'

/**
 * Highlight color keys that cycle through for paragraph highlighting
 */
const HIGHLIGHT_KEYS = [1, 2, 3, 4, 5] as const

/**
 * Default opacity for normal state
 */
const DEFAULT_OPACITY = 0.25

/**
 * Hover opacity for emphasized state
 */
const HOVER_OPACITY = 0.4

/**
 * Convert RGB values from CSS variable to RGBA with opacity
 * @param rgbValues - RGB values as string (e.g., "255, 235, 59")
 * @param opacity - Opacity value between 0 and 1
 * @returns RGBA color string
 */
function convertRGBtoRGBA(rgbValues: string, opacity: number): string {
  // CSS variable returns RGB values like "255, 235, 59"
  const trimmed = rgbValues.trim()
  if (!trimmed) {
    // Fallback to a default color if variable is not found
    return `rgba(128, 128, 128, ${opacity})`
  }
  return `rgba(${trimmed}, ${opacity})`
}

/**
 * Get highlight color for a paragraph by index
 * Colors cycle through the palette using modulo operation
 * @param index - Paragraph index
 * @returns RGBA color string with default opacity
 */
export function getHighlightColor(index: number): string {
  const key = HIGHLIGHT_KEYS[index % HIGHLIGHT_KEYS.length]
  const cssVar = `--highlight-${key}`
  const rgbValue = getCSSVariable(cssVar)
  return convertRGBtoRGBA(rgbValue, DEFAULT_OPACITY)
}

/**
 * Get intensified highlight color for hover state
 * Increases opacity for visual feedback on hover
 * @param index - Paragraph index
 * @returns RGBA color string with hover opacity
 */
export function getHoveredHighlightColor(index: number): string {
  const key = HIGHLIGHT_KEYS[index % HIGHLIGHT_KEYS.length]
  const cssVar = `--highlight-${key}`
  const rgbValue = getCSSVariable(cssVar)
  return convertRGBtoRGBA(rgbValue, HOVER_OPACITY)
}
