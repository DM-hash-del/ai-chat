import { useRef, useState, type ReactNode } from 'react'
import {
    AssistantRuntimeProvider,
    useExternalStoreRuntime,
    type AppendMessage,
    type ExternalStoreThreadListAdapter,
    type ThreadMessageLike,
} from '@assistant-ui/react'
import type { Conversation, Message } from './types'

// Phase 1 only: fake data and a fake "AI" that echoes. Replaced in Phase 3.

const MOCK_REPLY_DELAY_MS = 800

const now = () => new Date().toISOString()

const MOCK_CONVERSATIONS: Conversation[] = [
    {
        id: 1,
        user_id: 1,
        title: 'Planning a trip',
        created_at: now(),
        updated_at: now(),
    },
    {
        id: 2,
        user_id: 1,
        title: 'Recipe ideas',
        created_at: now(),
        updated_at: now(),
    },
]

// Turns a Laravel-shaped message into the shape assistant-ui understands.
const convertMessage = (message: Message): ThreadMessageLike => ({
    id: String(message.id),
    role: message.role,
    content: [{ type: 'text', text: message.content }],
    createdAt: new Date(message.created_at),
})

// The composer hands us a list of parts; we only support text.
const getText = (message: AppendMessage): string =>
    message.content
        .map((part) => (part.type === 'text' ? part.text : ''))
        .join('')
        .trim()

export function MockRuntimeProvider({ children }: { children: ReactNode }) {
    const [messages, setMessages] = useState<Message[]>([])
    const [isRunning, setIsRunning] = useState(false)
    const [threadId, setThreadId] = useState<string | undefined>(undefined)
    const nextId = useRef(1)

    const makeMessage = (role: Message['role'], content: string): Message => ({
        id: nextId.current++,
        conversation_id: 0,
        role,
        content,
        created_at: now(),
        updated_at: now(),
    })

    const onNew = async (message: AppendMessage) => {
        const text = getText(message)
        if (!text) return

        setMessages((prev) => [...prev, makeMessage('user', text)])
        setIsRunning(true)

        await new Promise((resolve) => setTimeout(resolve, MOCK_REPLY_DELAY_MS))

        setMessages((prev) => [
            ...prev,
            makeMessage('assistant', `**Echo:** ${text}`),
        ])
        setIsRunning(false)
    }

    const threadList: ExternalStoreThreadListAdapter = {
        threadId,
        threads: MOCK_CONVERSATIONS.map((c) => ({
            status: 'regular',
            id: String(c.id),
            title: c.title,
        })),
        onSwitchToNewThread: () => {
            setThreadId(undefined)
            setMessages([])
        },
        onSwitchToThread: (id) => {
            setThreadId(id)
            setMessages([])
        },
    }

    // Only onNew is provided: no onEdit / onReload / onCancel / setMessages /
    // attachments, so those buttons never appear.
    const runtime = useExternalStoreRuntime({
        messages,
        convertMessage,
        isRunning,
        onNew,
        adapters: { threadList },
    })

    return (
        <AssistantRuntimeProvider runtime={runtime}>
            {children}
        </AssistantRuntimeProvider>
    )
}
