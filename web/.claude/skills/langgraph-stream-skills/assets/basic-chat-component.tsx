/**
 * Basic LangGraph Chat Component Template
 *
 * This template provides a simple chat interface using the useStream hook.
 * Features:
 * - Message streaming
 * - Loading states
 * - Thread management
 * - Basic error handling
 */

'use client'

import { useStream } from '@langchain/langgraph-sdk/react'
import type { Message } from '@langchain/langgraph-sdk'
import { useState } from 'react'

interface ChatComponentProps {
  apiUrl: string
  assistantId: string
  initialThreadId?: string | null
}

export default function BasicChatComponent({
  apiUrl,
  assistantId,
  initialThreadId = null,
}: ChatComponentProps) {
  const [threadId, setThreadId] = useState<string | null>(initialThreadId)

  const thread = useStream<{ messages: Message[] }>({
    apiUrl,
    assistantId,
    threadId,
    onThreadId: setThreadId,
    messagesKey: 'messages',
    reconnectOnMount: true,
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const form = e.target as HTMLFormElement
    const message = new FormData(form).get('message') as string

    if (!message.trim()) return

    form.reset()
    thread.submit({ messages: [{ type: 'human', content: message }] })
  }

  return (
    <div className='mx-auto flex h-screen max-w-4xl flex-col p-4'>
      {/* Header */}
      <div className='mb-4'>
        <h1 className='text-2xl font-bold'>Chat</h1>
        {threadId && (
          <p className='text-sm text-gray-500'>Thread: {threadId}</p>
        )}
      </div>

      {/* Messages */}
      <div className='mb-4 flex-1 space-y-4 overflow-y-auto'>
        {thread.messages.map(message => (
          <div
            key={message.id}
            className={`rounded-lg p-4 ${
              message.type === 'human'
                ? 'ml-auto max-w-[80%] bg-blue-100'
                : 'mr-auto max-w-[80%] bg-gray-100'
            }`}
          >
            <div className='mb-1 font-semibold'>
              {message.type === 'human' ? 'You' : 'Assistant'}
            </div>
            <div>{message.content as string}</div>
          </div>
        ))}

        {/* Error Display */}
        {thread.error && (
          <div className='rounded-lg border border-red-400 bg-red-100 p-4'>
            <div className='font-semibold text-red-700'>Error</div>
            <div className='text-red-600'>{thread.error.message}</div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className='flex gap-2'>
        <input
          type='text'
          name='message'
          placeholder='Type your message...'
          disabled={thread.isLoading}
          className='flex-1 rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50'
        />

        {thread.isLoading ? (
          <button
            type='button'
            onClick={() => thread.stop()}
            className='rounded-lg bg-red-500 px-6 py-2 text-white hover:bg-red-600'
          >
            Stop
          </button>
        ) : (
          <button
            type='submit'
            className='rounded-lg bg-blue-500 px-6 py-2 text-white hover:bg-blue-600'
          >
            Send
          </button>
        )}
      </form>
    </div>
  )
}
