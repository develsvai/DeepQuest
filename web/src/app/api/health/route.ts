import { NextResponse } from 'next/server'

/**
 * Health check endpoint for Docker/K8s liveness & readiness probes.
 * GET /api/health → 200 OK
 */
export async function GET() {
  return NextResponse.json({ status: 'ok' }, { status: 200 })
}
