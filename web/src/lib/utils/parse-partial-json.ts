/**
 * Parse partial JSON strings safely with complete field detection
 *
 * Extracts only complete key-value pairs from streaming JSON:
 * 1. Detects fields ending with comma (next field starts)
 * 2. Detects fields ending with closing brace (last field)
 * 3. Transforms snake_case keys to camelCase
 * 4. Validates with Zod schema
 * 5. Returns only fully received fields
 */

import { z } from 'zod'
import { snakeToCamelCase } from './case-transform'

/**
 * Options for partial JSON parsing
 */
interface ParsePartialJsonOptions<T> {
  /** Zod schema for validation */
  schema?: z.ZodType<T>
  /** Fallback value if parsing fails completely (default: null) */
  fallback?: T | null
}

/**
 * Extract complete elements from partial array
 *
 * An array element is considered "complete" when:
 * - Followed by a comma: "item1",
 * - Last element before closing bracket: "item1"]
 *
 * @example
 * ```ts
 * // Input: ["item1", "item2", "item3"
 * // Output: ["item1", "item2"]
 * ```
 */
function extractCompleteArrayElements(arrayContent: string): string {
  // arrayContent should start with '[' and may or may not end with ']'
  if (!arrayContent.startsWith('[')) {
    return '[]'
  }

  // Remove opening '[' and closing ']' if present
  let content = arrayContent.slice(1)
  const hasClosingBracket = content.endsWith(']')
  if (hasClosingBracket) {
    content = content.slice(0, -1)
  }

  const completeElements: string[] = []
  let depth = 0
  let inString = false
  let escapeNext = false
  let currentElement = ''

  for (let i = 0; i < content.length; i++) {
    const char = content[i]

    // Handle escape sequences
    if (escapeNext) {
      currentElement += char
      escapeNext = false
      continue
    }

    if (char === '\\' && inString) {
      escapeNext = true
      currentElement += char
      continue
    }

    // Handle string boundaries
    if (char === '"' && !escapeNext) {
      inString = !inString
      currentElement += char
      continue
    }

    // Only process structural characters outside strings
    if (!inString) {
      // Track nesting depth
      if (char === '{' || char === '[') {
        depth++
        currentElement += char
        continue
      }

      if (char === '}' || char === ']') {
        depth--
        currentElement += char
        continue
      }

      // Comma at depth 0 means element is complete
      if (char === ',' && depth === 0) {
        const trimmed = currentElement.trim()
        if (trimmed.length > 0) {
          completeElements.push(trimmed)
        }
        currentElement = ''
        continue
      }
    }

    currentElement += char
  }

  // Handle last element only if original had closing bracket
  if (hasClosingBracket) {
    const trimmed = currentElement.trim()
    if (trimmed.length > 0 && depth === 0) {
      completeElements.push(trimmed)
    }
  }

  // Build result array
  if (completeElements.length === 0) {
    return '[]'
  }

  return `[${completeElements.join(',')}]`
}

/**
 * Process a complete field to extract progressive array elements
 * @param field - Complete field in format "key": value
 * @returns Processed field with complete array elements, or null if no complete data
 */
function processField(field: string): string | null {
  // Find the colon separator between key and value
  const colonIndex = field.indexOf(':')
  if (colonIndex === -1) {
    return field
  }

  const key = field.substring(0, colonIndex + 1)
  const value = field.substring(colonIndex + 1).trim()

  // Check if value is an array
  if (value.startsWith('[')) {
    const processedArray = extractCompleteArrayElements(value)
    // If no complete elements, return null to exclude this field
    if (processedArray === '[]') {
      return null
    }
    return `${key} ${processedArray}`
  }

  // For non-array values, return as-is
  return field
}

/**
 * Extract only complete key-value pairs from partial JSON
 *
 * A field is considered "complete" when:
 * - Followed by a comma and next key: "key": "value",
 * - Last field before closing brace: "key": "value"}
 * - Array with complete elements: "key": ["item1", "item2"],
 * - Nested object is properly closed: "key": {...},
 *
 * For arrays, complete elements are extracted even if the array is not closed:
 * - "key": ["item1", "item2", "item3" → "key": ["item1", "item2"]
 *
 * @example
 * ```ts
 * // Incomplete: {"rating": "SURF", "strengths": ["item
 * extractCompleteFields(json) // Returns: {}
 *
 * // Progressive array: {"strengths": ["item1", "item2", "item3"
 * extractCompleteFields(json) // Returns: { strengths: ["item1", "item2"] }
 *
 * // Complete: {"rating": "SURFACE", "strengths": ["item"],
 * extractCompleteFields(json) // Returns: { rating: "SURFACE", strengths: ["item"] }
 * ```
 */
function extractCompleteFields(partialJson: string): string {
  const trimmed = partialJson.trim()

  // Empty or not starting with { - return empty object
  if (!trimmed || !trimmed.startsWith('{')) {
    return '{}'
  }

  // Remove opening { and closing } if present
  let content = trimmed.slice(1)
  const hasClosingBrace = content.endsWith('}')
  if (hasClosingBrace) {
    content = content.slice(0, -1)
  }

  const completeFields: string[] = []
  let depth = 0
  let inString = false
  let escapeNext = false
  let currentField = ''

  for (let i = 0; i < content.length; i++) {
    const char = content[i]

    // Handle escape sequences
    if (escapeNext) {
      currentField += char
      escapeNext = false
      continue
    }

    if (char === '\\' && inString) {
      escapeNext = true
      currentField += char
      continue
    }

    // Handle string boundaries
    if (char === '"' && !escapeNext) {
      inString = !inString
      currentField += char
      continue
    }

    // Only process structural characters outside strings
    if (!inString) {
      // Track nesting depth
      if (char === '{' || char === '[') {
        depth++
        currentField += char
        continue
      }

      if (char === '}' || char === ']') {
        depth--
        currentField += char
        continue
      }

      // Comma at depth 0 means field is complete
      if (char === ',' && depth === 0) {
        const trimmedField = currentField.trim()
        if (trimmedField.length > 0) {
          const processedField = processField(trimmedField)
          if (processedField) {
            completeFields.push(processedField)
          }
        }
        currentField = ''
        continue
      }
    }

    currentField += char
  }

  // Handle last field (complete or incomplete)
  if (hasClosingBrace) {
    // Closing brace present - field is complete
    const trimmedField = currentField.trim()
    if (trimmedField.length > 0 && depth === 0) {
      const processedField = processField(trimmedField)
      if (processedField) {
        completeFields.push(processedField)
      }
    }
  } else if (currentField.trim().length > 0) {
    // No closing brace - field may be incomplete
    // Only process if field has array value (for progressive array parsing)
    const trimmedField = currentField.trim()
    const colonIndex = trimmedField.indexOf(':')
    if (colonIndex !== -1) {
      const value = trimmedField.substring(colonIndex + 1).trim()
      if (value.startsWith('[')) {
        // Array field - extract complete elements even if array not closed
        const processedField = processField(trimmedField)
        if (processedField) {
          completeFields.push(processedField)
        }
      }
    }
  }

  // Build result object
  if (completeFields.length === 0) {
    return '{}'
  }

  return `{${completeFields.join(',')}}`
}

/**
 * Safely parse partial JSON string with complete field detection
 *
 * @param partialJson - Incomplete JSON string from streaming API
 * @param options - Parsing options including schema and fallback
 * @returns Validated parsed object with only complete fields, or fallback
 *
 * @example
 * ```ts
 * // Incomplete rating: {"rating": "SURF", "strengths": ["Complete item"]}
 * const result = parsePartialJson(partialJson, {
 *   schema: FeedbackSchema.partial(),
 *   fallback: null
 * })
 * // Returns: {} - rating incomplete, filtered out
 *
 * // Complete rating: {"rating": "SURFACE", "strengths": ["item"]}
 * // Returns: { rating: "SURFACE", strengths: ["item"] }
 * ```
 */
export function parsePartialJson<T>(
  partialJson: unknown,
  options: ParsePartialJsonOptions<T> = {}
): T | null {
  const { schema, fallback = null } = options

  // Ensure partialJson is a string before calling trim()
  if (typeof partialJson !== 'string' || partialJson.trim() === '') {
    return fallback
  }

  // Extract only complete fields
  const completeJson = extractCompleteFields(partialJson)

  // Try parsing complete fields
  let parsed: unknown
  try {
    parsed = JSON.parse(completeJson)
  } catch (error) {
    console.error('Error parsing partial JSON:', error)
    return fallback
  }

  // If parsed is empty object, return fallback (no complete fields)
  if (
    parsed &&
    typeof parsed === 'object' &&
    !Array.isArray(parsed) &&
    Object.keys(parsed).length === 0
  ) {
    return fallback
  }

  // Transform snake_case to camelCase BEFORE schema validation
  const transformed = snakeToCamelCase(parsed)

  // If no schema provided, return transformed object
  if (!schema) {
    return transformed as T
  }

  // Validate with schema (schema should be defined in camelCase)
  const result = schema.safeParse(transformed)
  if (result.success) {
    return result.data as T
  }

  return fallback
}

/**
 * Check if partial JSON is likely complete
 * Useful for determining if streaming has finished
 */
export function isLikelyCompleteJson(json: unknown): boolean {
  // Ensure json is a string before calling trim()
  if (typeof json !== 'string') return false

  const trimmed = json.trim()
  if (trimmed.length === 0) return false

  // Check balanced brackets
  const openBrackets = (trimmed.match(/\[/g) || []).length
  const closeBrackets = (trimmed.match(/\]/g) || []).length
  const openBraces = (trimmed.match(/{/g) || []).length
  const closeBraces = (trimmed.match(/}/g) || []).length
  const quotes = (trimmed.match(/"/g) || []).length

  return (
    openBrackets === closeBrackets &&
    openBraces === closeBraces &&
    quotes % 2 === 0
  )
}
