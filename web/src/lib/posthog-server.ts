import { PostHog } from 'posthog-node'

let posthogClient: PostHog | null = null

export function getPostHogClient(): PostHog | null {
  // Dev 환경에서는 PostHog 완전 비활성화
  if (process.env.NODE_ENV === 'development') {
    return null
  }

  if (!posthogClient) {
    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (!apiKey) {
      return null
    }

    posthogClient = new PostHog(apiKey, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
    })
  }
  return posthogClient
}

export async function shutdownPostHog() {
  if (posthogClient) {
    await posthogClient.shutdown()
  }
}
