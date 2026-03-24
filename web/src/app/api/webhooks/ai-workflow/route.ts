import { NextRequest, NextResponse } from 'next/server'
import { WebhookProcessor } from './services/webhook-processor'

/**
 * Main webhook handler for AI workflow results
 */
export async function POST(request: NextRequest) {
  const processor = new WebhookProcessor()
  return processor.handle(request)
}

/**
 * Health check endpoint for webhook
 */
export async function GET() {
  return NextResponse.json(WebhookProcessor.getHealthStatus())
}
