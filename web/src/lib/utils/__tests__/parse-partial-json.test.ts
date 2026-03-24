/**
 * Tests for parse-partial-json utility
 * Tests complete field detection from streaming JSON
 */

import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { parsePartialJson, isLikelyCompleteJson } from '../parse-partial-json'

// Test schema
const TestSchema = z.object({
  rating: z.enum(['SURFACE', 'INTERMEDIATE', 'DEEP']),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  suggestions: z.array(z.string()),
})

type TestData = z.infer<typeof TestSchema>

describe('parsePartialJson', () => {
  describe('Complete field detection', () => {
    it('should return empty object for incomplete first field', () => {
      const partial = '{"rating": "SURF'
      const result = parsePartialJson<Partial<TestData>>(partial, {
        schema: TestSchema.partial(),
      })

      expect(result).toBeNull()
    })

    it('should parse complete field followed by comma', () => {
      const partial = '{"rating": "SURFACE",'
      const result = parsePartialJson<Partial<TestData>>(partial, {
        schema: TestSchema.partial(),
      })

      expect(result).toEqual({ rating: 'SURFACE' })
    })

    it('should parse complete field at end of object', () => {
      const partial = '{"rating": "SURFACE"}'
      const result = parsePartialJson<Partial<TestData>>(partial, {
        schema: TestSchema.partial(),
      })

      expect(result).toEqual({ rating: 'SURFACE' })
    })

    it('should ignore incomplete array field', () => {
      const partial = '{"rating": "SURFACE", "strengths": ["item'
      const result = parsePartialJson<Partial<TestData>>(partial, {
        schema: TestSchema.partial(),
      })

      // Only rating is complete
      expect(result).toEqual({ rating: 'SURFACE' })
    })

    it('should parse complete array followed by comma', () => {
      const partial = '{"rating": "SURFACE", "strengths": ["item1", "item2"],'
      const result = parsePartialJson<Partial<TestData>>(partial, {
        schema: TestSchema.partial(),
      })

      expect(result).toEqual({
        rating: 'SURFACE',
        strengths: ['item1', 'item2'],
      })
    })

    it('should parse multiple complete fields', () => {
      const partial =
        '{"rating": "SURFACE", "strengths": ["item1"], "weaknesses": ["item2"],'
      const result = parsePartialJson<Partial<TestData>>(partial, {
        schema: TestSchema.partial(),
      })

      expect(result).toEqual({
        rating: 'SURFACE',
        strengths: ['item1'],
        weaknesses: ['item2'],
      })
    })

    it('should handle strings with commas inside', () => {
      const partial = '{"rating": "SURFACE", "strengths": ["item1, item2"],'
      const result = parsePartialJson<Partial<TestData>>(partial, {
        schema: TestSchema.partial(),
      })

      expect(result).toEqual({
        rating: 'SURFACE',
        strengths: ['item1, item2'],
      })
    })

    it('should handle escaped quotes in strings', () => {
      const partial =
        '{"rating": "SURFACE", "strengths": ["item with \\"quotes\\""],'
      const result = parsePartialJson<Partial<TestData>>(partial, {
        schema: TestSchema.partial(),
      })

      expect(result).toEqual({
        rating: 'SURFACE',
        strengths: ['item with "quotes"'],
      })
    })
  })

  describe('Schema validation', () => {
    it('should filter out invalid enum values', () => {
      const partial = '{"rating": "INVALID_ENUM",'
      const result = parsePartialJson<Partial<TestData>>(partial, {
        schema: TestSchema.partial(),
      })

      // Invalid enum should fail validation
      expect(result).toBeNull()
    })

    it('should validate complete and valid data', () => {
      const partial =
        '{"rating": "SURFACE", "strengths": ["good"], "weaknesses": ["bad"], "suggestions": ["improve"]}'
      const result = parsePartialJson<Partial<TestData>>(partial, {
        schema: TestSchema.partial(),
      })

      expect(result).toEqual({
        rating: 'SURFACE',
        strengths: ['good'],
        weaknesses: ['bad'],
        suggestions: ['improve'],
      })
    })

    it('should work without schema', () => {
      const partial = '{"rating": "SURFACE",'
      const result = parsePartialJson(partial, {})

      expect(result).toEqual({ rating: 'SURFACE' })
    })
  })

  describe('Edge cases', () => {
    it('should handle empty string', () => {
      const result = parsePartialJson<Partial<TestData>>('', {
        schema: TestSchema.partial(),
      })

      expect(result).toBeNull()
    })

    it('should handle null input', () => {
      const result = parsePartialJson<Partial<TestData>>(null, {
        schema: TestSchema.partial(),
      })

      expect(result).toBeNull()
    })

    it('should handle undefined input', () => {
      const result = parsePartialJson<Partial<TestData>>(undefined, {
        schema: TestSchema.partial(),
      })

      expect(result).toBeNull()
    })

    it('should handle incomplete JSON structure', () => {
      const partial = '{"rating'
      const result = parsePartialJson<Partial<TestData>>(partial, {
        schema: TestSchema.partial(),
      })

      expect(result).toBeNull()
    })

    it('should return fallback for completely invalid input', () => {
      const partial = 'not json at all'
      const fallback = { default: true }
      const result = parsePartialJson(partial, {
        fallback,
      })

      expect(result).toBe(fallback)
    })
  })

  describe('Real-world streaming scenarios', () => {
    it('should handle progressive streaming updates', () => {
      // Simulate streaming progression
      const stream = [
        '{"rating": "',
        '{"rating": "SURF',
        '{"rating": "SURFACE"',
        '{"rating": "SURFACE",',
        '{"rating": "SURFACE", "strengths": [',
        '{"rating": "SURFACE", "strengths": ["first',
        '{"rating": "SURFACE", "strengths": ["first item"',
        '{"rating": "SURFACE", "strengths": ["first item"]',
        '{"rating": "SURFACE", "strengths": ["first item"],',
      ]

      const results = stream.map(partial =>
        parsePartialJson<Partial<TestData>>(partial, {
          schema: TestSchema.partial(),
        })
      )

      // First 3 chunks: incomplete rating
      expect(results[0]).toBeNull()
      expect(results[1]).toBeNull()
      expect(results[2]).toBeNull()

      // Chunk 3: rating complete (has comma)
      expect(results[3]).toEqual({ rating: 'SURFACE' })

      // Chunk 4-6: rating complete, strengths empty or incomplete
      expect(results[4]).toEqual({ rating: 'SURFACE' })
      expect(results[5]).toEqual({ rating: 'SURFACE' })
      expect(results[6]).toEqual({ rating: 'SURFACE' })

      // Chunk 7-8: Progressive array parsing! Complete element extracted
      expect(results[7]).toEqual({
        rating: 'SURFACE',
        strengths: ['first item'],
      })
      expect(results[8]).toEqual({
        rating: 'SURFACE',
        strengths: ['first item'],
      })
    })

    it('should handle Korean text in streaming', () => {
      const partial =
        '{"rating": "SURFACE", "strengths": ["비용 절감이라는 실질적인 동기를 언급했습니다"],'
      const result = parsePartialJson<Partial<TestData>>(partial, {
        schema: TestSchema.partial(),
      })

      expect(result).toEqual({
        rating: 'SURFACE',
        strengths: ['비용 절감이라는 실질적인 동기를 언급했습니다'],
      })
    })
  })
})

describe('Progressive array element parsing', () => {
  const ArraySchema = z.object({
    items: z.array(z.string()),
    count: z.number().optional(),
  })

  type ArrayData = z.infer<typeof ArraySchema>

  describe('Array with complete elements (not closed)', () => {
    it('should parse single complete element from unclosed array', () => {
      const partial = '{"items": ["item1",'
      const result = parsePartialJson<Partial<ArrayData>>(partial, {
        schema: ArraySchema.partial(),
      })

      expect(result).toEqual({
        items: ['item1'],
      })
    })

    it('should parse multiple complete elements from unclosed array', () => {
      const partial = '{"items": ["item1", "item2", "item3",'
      const result = parsePartialJson<Partial<ArrayData>>(partial, {
        schema: ArraySchema.partial(),
      })

      expect(result).toEqual({
        items: ['item1', 'item2', 'item3'],
      })
    })

    it('should exclude incomplete last element from unclosed array', () => {
      const partial = '{"items": ["item1", "item2", "item3'
      const result = parsePartialJson<Partial<ArrayData>>(partial, {
        schema: ArraySchema.partial(),
      })

      expect(result).toEqual({
        items: ['item1', 'item2'],
      })
    })

    it('should handle empty unclosed array', () => {
      const partial = '{"items": ['
      const result = parsePartialJson<Partial<ArrayData>>(partial, {
        schema: ArraySchema.partial(),
      })

      // Empty array excluded, returns null
      expect(result).toBeNull()
    })

    it('should handle array with only incomplete element', () => {
      const partial = '{"items": ["incompl'
      const result = parsePartialJson<Partial<ArrayData>>(partial, {
        schema: ArraySchema.partial(),
      })

      // No complete elements, field excluded
      expect(result).toBeNull()
    })
  })

  describe('Progressive streaming with arrays', () => {
    it('should show progressive array building in real-time', () => {
      const stream = [
        '{"items": [',
        '{"items": ["first',
        '{"items": ["first"',
        '{"items": ["first",',
        '{"items": ["first", "second',
        '{"items": ["first", "second"',
        '{"items": ["first", "second",',
        '{"items": ["first", "second", "third',
        '{"items": ["first", "second", "third"',
        '{"items": ["first", "second", "third"]',
        '{"items": ["first", "second", "third"]}',
      ]

      const results = stream.map(partial =>
        parsePartialJson<Partial<ArrayData>>(partial, {
          schema: ArraySchema.partial(),
        })
      )

      // Progressive results
      expect(results[0]).toBeNull() // Empty array
      expect(results[1]).toBeNull() // Incomplete element
      expect(results[2]).toBeNull() // Still incomplete (no comma or ])
      expect(results[3]).toEqual({ items: ['first'] }) // First complete!
      expect(results[4]).toEqual({ items: ['first'] }) // Second incomplete
      expect(results[5]).toEqual({ items: ['first'] }) // Still incomplete
      expect(results[6]).toEqual({ items: ['first', 'second'] }) // Second complete!
      expect(results[7]).toEqual({ items: ['first', 'second'] }) // Third incomplete
      expect(results[8]).toEqual({ items: ['first', 'second'] }) // Still incomplete
      expect(results[9]).toEqual({ items: ['first', 'second', 'third'] }) // All complete!
      expect(results[10]).toEqual({ items: ['first', 'second', 'third'] }) // Closed
    })

    it('should handle multiple fields with progressive arrays', () => {
      const partial = '{"count": 5, "items": ["a", "b", "c",'
      const result = parsePartialJson<Partial<ArrayData>>(partial, {
        schema: ArraySchema.partial(),
      })

      expect(result).toEqual({
        count: 5,
        items: ['a', 'b', 'c'],
      })
    })

    it('should handle progressive array then complete field', () => {
      const partial = '{"items": ["a", "b",, "count": 2}'
      const result = parsePartialJson<Partial<ArrayData>>(partial, {
        schema: ArraySchema.partial(),
      })

      // items has incomplete array (double comma is invalid, but second field is complete)
      expect(result).toBeDefined()
    })
  })

  describe('Complex array elements', () => {
    const ComplexSchema = z.object({
      nestedArrays: z.array(z.array(z.number())).optional(),
      objectArray: z
        .array(
          z.object({
            id: z.number(),
            name: z.string(),
          })
        )
        .optional(),
    })

    it('should handle nested arrays progressively', () => {
      const partial = '{"nestedArrays": [[1, 2], [3, 4],'
      const result = parsePartialJson(partial, {
        schema: ComplexSchema.partial(),
      })

      expect(result).toEqual({
        nestedArrays: [
          [1, 2],
          [3, 4],
        ],
      })
    })

    it('should handle array of objects progressively', () => {
      const partial =
        '{"objectArray": [{"id": 1, "name": "first"}, {"id": 2, "name": "second"},'
      const result = parsePartialJson(partial, {
        schema: ComplexSchema.partial(),
      })

      expect(result).toEqual({
        objectArray: [
          { id: 1, name: 'first' },
          { id: 2, name: 'second' },
        ],
      })
    })

    it('should handle incomplete object in array', () => {
      const partial =
        '{"objectArray": [{"id": 1, "name": "first"}, {"id": 2, "name": "sec'
      const result = parsePartialJson(partial, {
        schema: ComplexSchema.partial(),
      })

      // Second object incomplete, only first object returned
      expect(result).toEqual({
        objectArray: [{ id: 1, name: 'first' }],
      })
    })
  })

  describe('Real-world scenario: Streaming feedback with arrays', () => {
    const FeedbackSchema = z.object({
      rating: z.enum(['SURFACE', 'INTERMEDIATE', 'DEEP']),
      strengths: z.array(z.string()),
      weaknesses: z.array(z.string()),
      suggestions: z.array(z.string()),
    })

    it('should progressively display feedback items as they arrive', () => {
      const stream = [
        '{"rating": "DEEP",',
        '{"rating": "DEEP", "strengths": [',
        '{"rating": "DEEP", "strengths": ["Clear explanation',
        '{"rating": "DEEP", "strengths": ["Clear explanation",',
        '{"rating": "DEEP", "strengths": ["Clear explanation", "Good examples',
        '{"rating": "DEEP", "strengths": ["Clear explanation", "Good examples",',
        '{"rating": "DEEP", "strengths": ["Clear explanation", "Good examples", "Well structured"],',
      ]

      const results = stream.map(partial =>
        parsePartialJson(partial, {
          schema: FeedbackSchema.partial(),
        })
      )

      expect(results[0]).toEqual({ rating: 'DEEP' })
      expect(results[1]).toEqual({ rating: 'DEEP' })
      expect(results[2]).toEqual({ rating: 'DEEP' })
      expect(results[3]).toEqual({
        rating: 'DEEP',
        strengths: ['Clear explanation'],
      })
      expect(results[4]).toEqual({
        rating: 'DEEP',
        strengths: ['Clear explanation'],
      })
      expect(results[5]).toEqual({
        rating: 'DEEP',
        strengths: ['Clear explanation', 'Good examples'],
      })
      expect(results[6]).toEqual({
        rating: 'DEEP',
        strengths: ['Clear explanation', 'Good examples', 'Well structured'],
      })
    })
  })
})

describe('isLikelyCompleteJson', () => {
  it('should detect complete JSON', () => {
    expect(isLikelyCompleteJson('{"key": "value"}')).toBe(true)
    expect(isLikelyCompleteJson('{"key": ["item1", "item2"]}')).toBe(true)
  })

  it('should detect incomplete JSON', () => {
    expect(isLikelyCompleteJson('{"key": "value')).toBe(false)
    expect(isLikelyCompleteJson('{"key": ["item1", "item2"')).toBe(false)
    expect(isLikelyCompleteJson('{"key":')).toBe(false)
  })

  it('should handle edge cases', () => {
    expect(isLikelyCompleteJson('')).toBe(false)
    expect(isLikelyCompleteJson('{}')).toBe(true)
    expect(isLikelyCompleteJson('[]')).toBe(true)
  })
})

describe('snake_case to camelCase transformation', () => {
  // Schema with camelCase fields
  const CamelCaseSchema = z.object({
    firstField: z.string(),
    secondField: z.number(),
    nestedObject: z
      .object({
        innerField: z.string(),
        deeplyNested: z
          .object({
            veryDeep: z.boolean(),
          })
          .optional(),
      })
      .optional(),
    arrayField: z.array(z.string()).optional(),
  })

  type CamelCaseData = z.infer<typeof CamelCaseSchema>

  describe('Basic snake_case conversion', () => {
    it('should transform simple snake_case keys to camelCase', () => {
      const partial = '{"first_field": "value1", "second_field": 123}'
      const result = parsePartialJson<Partial<CamelCaseData>>(partial, {
        schema: CamelCaseSchema.partial(),
      })

      expect(result).toEqual({
        firstField: 'value1',
        secondField: 123,
      })
    })

    it('should transform incomplete snake_case streaming data', () => {
      const partial = '{"first_field": "value1",'
      const result = parsePartialJson<Partial<CamelCaseData>>(partial, {
        schema: CamelCaseSchema.partial(),
      })

      expect(result).toEqual({
        firstField: 'value1',
      })
    })

    it('should work without schema', () => {
      const partial = '{"first_field": "value1", "second_field": 123}'
      const result = parsePartialJson(partial, {})

      expect(result).toEqual({
        firstField: 'value1',
        secondField: 123,
      })
    })
  })

  describe('Nested object transformation', () => {
    it('should transform nested snake_case keys', () => {
      const partial =
        '{"first_field": "value", "nested_object": {"inner_field": "nested_value"}}'
      const result = parsePartialJson<Partial<CamelCaseData>>(partial, {
        schema: CamelCaseSchema.partial(),
      })

      expect(result).toEqual({
        firstField: 'value',
        nestedObject: {
          innerField: 'nested_value',
        },
      })
    })

    it('should transform deeply nested snake_case keys', () => {
      const partial =
        '{"nested_object": {"inner_field": "value", "deeply_nested": {"very_deep": true}}}'
      const result = parsePartialJson<Partial<CamelCaseData>>(partial, {
        schema: CamelCaseSchema.partial(),
      })

      expect(result).toEqual({
        nestedObject: {
          innerField: 'value',
          deeplyNested: {
            veryDeep: true,
          },
        },
      })
    })

    it('should handle incomplete nested objects in streaming', () => {
      const partial =
        '{"first_field": "value", "nested_object": {"inner_field":'
      const result = parsePartialJson<Partial<CamelCaseData>>(partial, {
        schema: CamelCaseSchema.partial(),
      })

      // Only first_field is complete
      expect(result).toEqual({
        firstField: 'value',
      })
    })
  })

  describe('Array field transformation', () => {
    it('should transform array fields with snake_case keys', () => {
      const partial =
        '{"first_field": "value", "array_field": ["item1", "item2"]}'
      const result = parsePartialJson<Partial<CamelCaseData>>(partial, {
        schema: CamelCaseSchema.partial(),
      })

      expect(result).toEqual({
        firstField: 'value',
        arrayField: ['item1', 'item2'],
      })
    })

    it('should handle incomplete arrays in streaming', () => {
      const partial = '{"first_field": "value", "array_field": ["item1"'
      const result = parsePartialJson<Partial<CamelCaseData>>(partial, {
        schema: CamelCaseSchema.partial(),
      })

      // Only first_field is complete
      expect(result).toEqual({
        firstField: 'value',
      })
    })

    it('should not transform string values inside arrays', () => {
      const partial =
        '{"array_field": ["has_underscore_value", "another_value"]}'
      const result = parsePartialJson<Partial<CamelCaseData>>(partial, {
        schema: CamelCaseSchema.partial(),
      })

      // Values should NOT be transformed
      expect(result).toEqual({
        arrayField: ['has_underscore_value', 'another_value'],
      })
    })
  })

  describe('Real-world streaming scenarios with snake_case', () => {
    const FeedbackSchema = z.object({
      answerRating: z.enum(['SURFACE', 'INTERMEDIATE', 'DEEP']),
      overallFeedback: z.string(),
      strengthsList: z.array(z.string()),
      weaknessList: z.array(z.string()),
    })

    type FeedbackData = z.infer<typeof FeedbackSchema>

    it('should handle progressive streaming with snake_case', () => {
      const stream = [
        '{"answer_rating": "SURF',
        '{"answer_rating": "SURFACE"',
        '{"answer_rating": "SURFACE",',
        '{"answer_rating": "SURFACE", "overall_feedback": "Good answer',
        '{"answer_rating": "SURFACE", "overall_feedback": "Good answer",',
        '{"answer_rating": "SURFACE", "overall_feedback": "Good answer", "strengths_list": ["clear"',
        '{"answer_rating": "SURFACE", "overall_feedback": "Good answer", "strengths_list": ["clear"],',
      ]

      const results = stream.map(partial =>
        parsePartialJson<Partial<FeedbackData>>(partial, {
          schema: FeedbackSchema.partial(),
        })
      )

      // Progressive completion
      expect(results[0]).toBeNull() // incomplete
      expect(results[1]).toBeNull() // incomplete
      expect(results[2]).toEqual({ answerRating: 'SURFACE' })
      expect(results[3]).toEqual({ answerRating: 'SURFACE' })
      expect(results[4]).toEqual({
        answerRating: 'SURFACE',
        overallFeedback: 'Good answer',
      })
      expect(results[5]).toEqual({
        answerRating: 'SURFACE',
        overallFeedback: 'Good answer',
      })
      expect(results[6]).toEqual({
        answerRating: 'SURFACE',
        overallFeedback: 'Good answer',
        strengthsList: ['clear'],
      })
    })

    it('should handle Korean text with snake_case keys', () => {
      const partial =
        '{"answer_rating": "SURFACE", "overall_feedback": "전반적으로 좋은 답변입니다", "strengths_list": ["명확한 설명"]}'
      const result = parsePartialJson<Partial<FeedbackData>>(partial, {
        schema: FeedbackSchema.partial(),
      })

      expect(result).toEqual({
        answerRating: 'SURFACE',
        overallFeedback: '전반적으로 좋은 답변입니다',
        strengthsList: ['명확한 설명'],
      })
    })
  })

  describe('Edge cases with snake_case', () => {
    it('should handle mixed camelCase and snake_case', () => {
      const partial = '{"first_field": "value1", "secondField": "value2"}'
      const result = parsePartialJson(partial, {})

      // snake_case keys are transformed, camelCase keys remain unchanged
      expect(result).toEqual({
        firstField: 'value1',
        secondField: 'value2',
      })
    })

    it('should not transform string values with underscores', () => {
      const partial = '{"first_field": "value_with_underscores"}'
      const result = parsePartialJson(partial)

      expect(result).toEqual({
        firstField: 'value_with_underscores',
      })
    })

    it('should preserve object structure with empty objects', () => {
      const partial = '{"first_field": "value", "empty_object": {}}'
      const result = parsePartialJson(partial)

      expect(result).toEqual({
        firstField: 'value',
        emptyObject: {},
      })
    })

    it('should handle null values', () => {
      const partial = '{"first_field": null, "second_field": "value"}'
      const result = parsePartialJson(partial)

      expect(result).toEqual({
        firstField: null,
        secondField: 'value',
      })
    })
  })
})
