/**
 * Common API response type definitions
 */

/**
 * Generic API response structure
 */
export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
}

/**
 * Paginated API response structure
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    total: number
    hasNext: boolean
  }
}

/**
 * API error response structure
 */
export interface ApiError {
  message: string
  code?: string
  details?: Record<string, unknown>
}
