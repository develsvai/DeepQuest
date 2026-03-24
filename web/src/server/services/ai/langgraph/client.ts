import { Client } from '@langchain/langgraph-sdk'
import { LangGraphClientConfig } from './types/client'

// 싱글톤 클라이언트 인스턴스 캐시
let langGraphClient: Client | null = null
let currentConfig: LangGraphClientConfig | null = null

// LangGraph 클라이언트 싱글톤 생성/반환
export const getLangGraphClient = (): Client => {
  const config: LangGraphClientConfig = {
    apiUrl: process.env.LANGGRAPH_API_URL || '',
    apiKey: process.env.LANGSMITH_API_KEY || '',
  }

  if (!config.apiUrl || !config.apiKey) {
    throw new Error(
      'LangGraph configuration is missing. Please check environment variables.'
    )
  }

  // 설정이 변경되었거나 인스턴스가 없으면 새로 생성
  if (
    !langGraphClient ||
    !currentConfig ||
    currentConfig.apiUrl !== config.apiUrl ||
    currentConfig.apiKey !== config.apiKey
  ) {
    langGraphClient = new Client({
      apiUrl: config.apiUrl,
      apiKey: config.apiKey,
    })
    currentConfig = config
  }

  return langGraphClient
}

export function resetLangGraphClient(): void {
  langGraphClient = null
}
