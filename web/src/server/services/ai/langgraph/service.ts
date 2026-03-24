import { camelToSnakeCase } from '@/lib/utils/case-transform'
import { getLangGraphClient } from './client'
import { GraphName, GraphNameType } from './types/graphs'
import { GraphRunPayload } from './types/runs'
import { KeyAchievementQuestionGenInput } from '@/server/services/ai/contracts/schemas/keyAchievementQuestionGen'
import type { ResumeParsingV2Input } from '@/server/services/ai/contracts/schemas/resumeParsingV2'
import { captureError, ErrorHandler } from '@/lib/error-tracking'

// Lazy init: 빌드 시(env 없음) 모듈 로드만 되고, 런타임에 첫 사용 시에만 클라이언트 생성
function getClient() {
  return getLangGraphClient()
}

export const langGraphService = {
  async runResumeParser(
    input: ResumeParsingV2Input,
    preparationId: string,
    locale: string
  ) {
    const thread = await _createThread()
    const run = await _runGraph(thread.thread_id, GraphName.RESUME_PARSER, {
      input: input,
      webhook: _generateWebhookUrl(GraphName.RESUME_PARSER, preparationId),
      metadata: {
        locale: locale,
      },
    })
    return run
  },
  async runQuestionGen(
    input: KeyAchievementQuestionGenInput,
    keyAchievementId: string
  ) {
    const thread = await _createThread()
    const run = await _runGraph(thread.thread_id, GraphName.QUESTION_GEN, {
      input: input,
      webhook: _generateWebhookUrl(
        GraphName.QUESTION_GEN,
        undefined,
        keyAchievementId
      ),
    })
    return run
  },
  async cleanUpThread(threadId: string) {
    try {
      const client = getClient()
      const thread = await client.threads.get(threadId)

      if (thread.thread_id) {
        await client.threads.delete(thread.thread_id)
        return true
      }

      return false
    } catch (error) {
      captureError(error, {
        handler: ErrorHandler.LANGGRAPH_SERVICE,
        extra: {
          phase: 'thread-cleanup',
          threadId,
        },
      })
      return false
    }
  },
}

async function _createThread() {
  const client = getClient()
  const thread = await client.threads.create()
  return thread
}

async function _runGraph(
  threadId: string | null,
  graphName: GraphNameType,
  payload: GraphRunPayload<Record<string, unknown>>
) {
  try {
    const client = getClient()
    // Convert camelCase to snake_case for payload.input
    if (payload.input) payload.input = camelToSnakeCase(payload.input)

    const run = await client.runs.create(threadId, graphName, payload)

    return run
  } catch (error) {
    captureError(error, {
      handler: ErrorHandler.LANGGRAPH_SERVICE,
      extra: { phase: 'graph-run-with-thread', graphName },
    })
    throw new Error('Graph run with thread failed')
  }
}

async function _runGraphWait<T>(
  graphName: GraphNameType,
  payload: GraphRunPayload<Record<string, unknown>>
) {
  try {
    const client = getClient()
    // Convert camelCase to snake_case for payload.input
    if (payload.input) payload.input = camelToSnakeCase(payload.input)

    const result = await client.runs.wait(null, graphName, payload)

    return result as T
  } catch (error) {
    captureError(error, {
      handler: ErrorHandler.LANGGRAPH_SERVICE,
      extra: { phase: 'graph-run-wait', graphName },
    })
    throw new Error('Graph run failed')
  }
}

function _generateWebhookUrl(
  graphName: GraphNameType,
  preparationId?: string,
  keyAchievementId?: string
) {
  const webhookSecret = process.env.AI_WEBHOOK_SECRET ?? 'default_secret'
  const scheme = process.env.NODE_ENV === 'production' ? 'https://' : 'http://'

  // NEXT_PUBLIC_APP_URL 대신 서버용 환경변수 사용
  const appUrl =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000'
  if (!appUrl) {
    throw new Error(
      'APP_URL or NEXT_PUBLIC_APP_URL environment variable is not set'
    )
  }

  // URL이 이미 프로토콜을 포함하는 경우 scheme 제거
  const baseUrl = appUrl.startsWith('http') ? appUrl : scheme + appUrl

  const params = new URLSearchParams({
    type: graphName,
  })

  if (preparationId) {
    params.append('preparationId', preparationId)
  }

  if (keyAchievementId) {
    params.append('keyAchievementId', keyAchievementId)
  }

  params.append('signature', webhookSecret)

  return `${baseUrl}/api/webhooks/ai-workflow?${params.toString()}`
}
