/**
 * LangGraph API Proxy
 *
 * This API route proxies all requests to the LangGraph API, adding authentication
 * headers on the server side to keep API keys secure and out of client bundles.
 *
 * Security: API keys are never exposed to the client - they're only used server-side.
 *
 * IMPORTANT: Current Implementation Limitations
 * - Forwards ALL requests to LangGraph server directly from the browser
 * - No endpoint filtering or authorization checks are performed
 *
 * TODO: Production Improvements Required
 * 1. Limit API calls to a specific subset of required endpoints only
 * 2. Implement proper authorization checks before forwarding requests
 * 3. Add rate limiting to prevent abuse
 * 4. Consider restricting CORS to specific domains (currently allows all origins)
 *
 * @see https://langchain-ai.github.io/langgraphjs/reference/modules/sdk.html
 * @see https://www.assistant-ui.com/docs/runtimes/langgraph
 */

import { type NextRequest, NextResponse } from 'next/server'
import { captureError, ErrorHandler } from '@/lib/error-tracking'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/**
 * Get LangGraph API configuration from environment variables
 */
function getLangGraphConfig() {
  const apiUrl = process.env.LANGGRAPH_API_URL
  const apiKey = process.env.LANGSMITH_API_KEY

  if (!apiUrl || !apiKey) {
    throw new Error(
      'LangGraph configuration is missing. Please check LANGGRAPH_API_URL and LANGSMITH_API_KEY environment variables.'
    )
  }

  return { apiUrl, apiKey }
}

/**
 * Get CORS headers for all responses
 */
function getCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  }
}

/**
 * Forward request headers, excluding sensitive or proxy-specific headers
 */
function getForwardHeaders(request: NextRequest): HeadersInit {
  const headers: HeadersInit = {}

  // Forward content-type if present
  const contentType = request.headers.get('content-type')
  if (contentType) {
    headers['content-type'] = contentType
  }

  // Forward Last-Event-ID for resumable streams
  const lastEventId = request.headers.get('Last-Event-ID')
  if (lastEventId) {
    headers['Last-Event-ID'] = lastEventId
  }

  return headers
}

/**
 * Build target URL from request path and query parameters
 * Filters out Next.js internal query parameters
 */
function buildTargetUrl(
  apiUrl: string,
  path: string,
  searchParams: URLSearchParams
): string {
  const url = new URL(`${apiUrl}/${path}`)

  // Copy search params, excluding Next.js internal parameters
  searchParams.forEach((value, key) => {
    // Filter out Next.js internal params (prefixed with nxtP_ or _)
    if (!key.startsWith('nxtP_') && !key.startsWith('_')) {
      url.searchParams.append(key, value)
    }
  })

  return url.toString()
}

/**
 * Build response headers from upstream response
 */
function buildResponseHeaders(
  upstreamHeaders: Headers,
  includeStreamingHeaders = false
): HeadersInit {
  const headers: Record<string, string> = {
    ...getCorsHeaders(),
    'Content-Type': upstreamHeaders.get('Content-Type') || 'text/plain',
  }

  if (includeStreamingHeaders) {
    headers['Cache-Control'] = 'no-cache'
    headers['Connection'] = 'keep-alive'
  }

  return headers
}

/**
 * Handle proxy requests to LangGraph API
 */
async function handleRequest(
  request: NextRequest,
  params: Promise<{ path: string[] }>,
  method: HttpMethod
): Promise<Response> {
  try {
    const { apiUrl, apiKey } = getLangGraphConfig()

    // Reconstruct path from catch-all route
    const path = (await params).path.join('/')

    // Build target URL with filtered query parameters
    const targetUrl = buildTargetUrl(apiUrl, path, request.nextUrl.searchParams)

    // Build fetch options
    const fetchOptions: RequestInit = {
      method,
      headers: {
        ...getForwardHeaders(request),
        'x-api-key': apiKey, // Add API key server-side only
      },
    }

    // Add body for mutation methods
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      const body = await request.text()
      if (body) {
        fetchOptions.body = body
        // @ts-expect-error - duplex is required for streaming but not in TypeScript types yet
        fetchOptions.duplex = 'half'
      }
    }

    // Forward request to LangGraph API
    const response = await fetch(targetUrl, fetchOptions)

    // Build response with appropriate headers
    const isStreamingMethod = method === 'POST' || method === 'GET'
    const responseHeaders = buildResponseHeaders(
      response.headers,
      isStreamingMethod
    )

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    })
  } catch (error) {
    // Reconstruct path for error context
    const path = (await params).path.join('/')

    captureError(error, {
      handler: ErrorHandler.LANGGRAPH_PROXY,
      extra: {
        path,
        method,
      },
    })

    return new Response(
      JSON.stringify({
        error: 'Failed to proxy request to LangGraph API',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(),
        },
      }
    )
  }
}

/**
 * Route handlers
 */
export const GET = (
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) => handleRequest(request, context.params, 'GET')

export const POST = (
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) => handleRequest(request, context.params, 'POST')

export const PUT = (
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) => handleRequest(request, context.params, 'PUT')

export const PATCH = (
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) => handleRequest(request, context.params, 'PATCH')

export const DELETE = (
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) => handleRequest(request, context.params, 'DELETE')

/**
 * Handle CORS preflight requests
 */
export const OPTIONS = () => {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(),
  })
}
