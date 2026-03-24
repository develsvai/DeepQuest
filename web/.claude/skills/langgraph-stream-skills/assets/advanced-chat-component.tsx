/**
 * Advanced LangGraph Chat Component Template
 *
 * This template provides a chat interface with advanced features:
 * - Message streaming with optimistic updates
 * - Thread branching (edit messages, regenerate responses)
 * - Interrupt handling
 * - Cached thread display
 * - TypeScript type safety
 */

'use client'

import { useStream } from '@langchain/langgraph-sdk/react'
import type { Message } from '@langchain/langgraph-sdk'
import { useState } from 'react'

// Define your state type
interface State {
  messages: Message[]
  context?: Record<string, unknown>
}

// Define interrupt type if using interrupts
interface InterruptValue {
  type: string
  data?: unknown
}

interface AdvancedChatComponentProps {
  apiUrl: string
  assistantId: string
  initialThreadId?: string | null
  cachedThreadData?: { values: State } | null
}

function BranchSwitcher({
  branch,
  branchOptions,
  onSelect,
}: {
  branch: string | undefined
  branchOptions: string[] | undefined
  onSelect: (branch: string) => void
}) {
  if (!branchOptions || !branch) return null
  const index = branchOptions.indexOf(branch)

  return (
    <div className='mt-2 flex items-center gap-2 text-sm'>
      <button
        type='button'
        onClick={() => {
          const prevBranch = branchOptions[index - 1]
          if (!prevBranch) return
          onSelect(prevBranch)
        }}
        disabled={index === 0}
        className='rounded bg-gray-200 px-2 py-1 hover:bg-gray-300 disabled:opacity-50'
      >
        ← Prev
      </button>
      <span className='text-gray-600'>
        Branch {index + 1} of {branchOptions.length}
      </span>
      <button
        type='button'
        onClick={() => {
          const nextBranch = branchOptions[index + 1]
          if (!nextBranch) return
          onSelect(nextBranch)
        }}
        disabled={index === branchOptions.length - 1}
        className='rounded bg-gray-200 px-2 py-1 hover:bg-gray-300 disabled:opacity-50'
      >
        Next →
      </button>
    </div>
  )
}

function EditMessage({
  message,
  onEdit,
}: {
  message: Message
  onEdit: (message: Message) => void
}) {
  const [editing, setEditing] = useState(false)

  if (!editing) {
    return (
      <button
        type='button'
        onClick={() => setEditing(true)}
        className='text-sm text-blue-600 hover:underline'
      >
        Edit
      </button>
    )
  }

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        const form = e.target as HTMLFormElement
        const content = new FormData(form).get('content') as string

        form.reset()
        onEdit({ type: 'human', content })
        setEditing(false)
      }}
      className='mt-2'
    >
      <input
        name='content'
        defaultValue={message.content as string}
        className='w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none'
      />
      <div className='mt-2 flex gap-2'>
        <button
          type='submit'
          className='rounded bg-blue-500 px-3 py-1 text-white hover:bg-blue-600'
        >
          Save
        </button>
        <button
          type='button'
          onClick={() => setEditing(false)}
          className='rounded bg-gray-300 px-3 py-1 hover:bg-gray-400'
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export default function AdvancedChatComponent({
  apiUrl,
  assistantId,
  initialThreadId = null,
  cachedThreadData = null,
}: AdvancedChatComponentProps) {
  const [threadId, setThreadId] = useState<string | null>(initialThreadId)

  const thread = useStream<State, { InterruptType: InterruptValue }>({
    apiUrl,
    assistantId,
    threadId,
    onThreadId: setThreadId,
    messagesKey: 'messages',
    reconnectOnMount: true,
    initialValues: cachedThreadData?.values,

    // Event handlers
    onError: error => {
      console.error('Stream error:', error)
    },
    onFinish: (values, run) => {
      console.log('Stream finished:', { values, run })
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const form = e.target as HTMLFormElement
    const message = new FormData(form).get('message') as string

    if (!message.trim()) return

    form.reset()

    const newMessage = { type: 'human' as const, content: message }

    // Submit with optimistic update
    thread.submit(
      { messages: [newMessage] },
      {
        optimisticValues(prev) {
          const prevMessages = prev.messages ?? []
          const newMessages = [...prevMessages, newMessage]
          return { ...prev, messages: newMessages }
        },
        streamResumable: true, // Enable stream resumption
      }
    )
  }

  // Handle interrupts
  if (thread.interrupt) {
    return (
      <div className='mx-auto flex h-screen max-w-4xl flex-col p-4'>
        <div className='flex flex-1 items-center justify-center'>
          <div className='max-w-md rounded-lg border border-yellow-400 bg-yellow-100 p-6'>
            <div className='mb-2 font-semibold text-yellow-700'>
              Interrupted
            </div>
            <div className='mb-4 text-yellow-600'>
              {JSON.stringify(thread.interrupt.value)}
            </div>
            <button
              type='button'
              onClick={() => {
                thread.submit(undefined, { command: { resume: true } })
              }}
              className='rounded bg-yellow-500 px-4 py-2 text-white hover:bg-yellow-600'
            >
              Resume
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='mx-auto flex h-screen max-w-4xl flex-col p-4'>
      {/* Header */}
      <div className='mb-4'>
        <h1 className='text-2xl font-bold'>Advanced Chat</h1>
        {threadId && (
          <p className='text-sm text-gray-500'>Thread: {threadId}</p>
        )}
      </div>

      {/* Messages */}
      <div className='mb-4 flex-1 space-y-4 overflow-y-auto'>
        {thread.messages.map(message => {
          const meta = thread.getMessagesMetadata(message)
          const parentCheckpoint = meta?.firstSeenState?.parent_checkpoint

          return (
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

              {/* Message Actions */}
              <div className='mt-2 flex gap-3'>
                {message.type === 'human' && (
                  <EditMessage
                    message={message}
                    onEdit={editedMessage =>
                      thread.submit(
                        { messages: [editedMessage] },
                        { checkpoint: parentCheckpoint }
                      )
                    }
                  />
                )}

                {message.type === 'ai' && (
                  <button
                    type='button'
                    onClick={() =>
                      thread.submit(undefined, { checkpoint: parentCheckpoint })
                    }
                    className='text-sm text-blue-600 hover:underline'
                  >
                    Regenerate
                  </button>
                )}
              </div>

              {/* Branch Switcher */}
              <BranchSwitcher
                branch={meta?.branch}
                branchOptions={meta?.branchOptions}
                onSelect={branch => thread.setBranch(branch)}
              />
            </div>
          )
        })}

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
