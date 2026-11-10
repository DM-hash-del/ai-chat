import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import {
    AssistantRuntimeProvider,
    useExternalStoreRuntime,
    type AppendMessage,
    type AssistantRuntime,
    type ExternalStoreThreadListAdapter,
} from '@assistant-ui/react'
import { ChatStatusContext } from './chat-status-context'
import { convertMessage } from './convert-message'
import type { ConversationState } from './useConversation'
import { ListActionError, type ConversationListState } from './useConversationList'
import type { UsageState } from '@/usage/useUsage'

// The composer hands us a list of parts; we only support text.
const getText = (message: AppendMessage): string =>
    message.content
        .map((part) => (part.type === 'text' ? part.text : ''))
        .join('')
        .trim()

type Props = {
    conversation: ConversationState
    list: ConversationListState
    usage: UsageState
    children: ReactNode
}

// Connects assistant-ui to our own state (an "external store"): React state
// holds the messages Laravel returned, and assistant-ui only displays them.
export function ChatRuntimeProvider({
    conversation,
    list,
    usage,
    children,
}: Props) {
    const navigate = useNavigate()
    const { send, messages, isRunning, loadStatus, conversationId, sendError } =
        conversation
    const { conversations, status: listStatus, rename, remove } = list

    // Lets onNew put text back in the composer after a send that saved nothing.
    const runtimeRef = useRef<AssistantRuntime | null>(null)

    const onNew = useCallback(
        async (message: AppendMessage) => {
            const text = getText(message)
            if (!text) return
            await send(text, (unsent) =>
                runtimeRef.current?.thread.composer.setText(unsent)
            )
        },
        [send]
    )

    // The sidebar. assistant-ui draws it and calls these handlers; we call
    // Laravel and update our own state. The URL decides which conversation is
    // open: switching only navigates, and the page reads the id from the URL.
    const threads = useMemo(
        () =>
            conversations.map((c) => ({
                status: 'regular' as const,
                id: String(c.id),
                title: c.title,
            })),
        [conversations]
    )

    const threadList = useMemo<ExternalStoreThreadListAdapter>(() => {
        const leaveIfOpen = (id: number) => {
            if (id === conversationId) navigate('/', { replace: true })
        }
        return {
            threadId: conversationId === null ? undefined : String(conversationId),
            threads,
            isLoading: listStatus === 'loading' && threads.length === 0,
            onSwitchToNewThread: () => navigate('/'),
            onSwitchToThread: (id) => navigate(`/c/${id}`),
            onRename: async (id, title) => {
                try {
                    await rename(Number(id), title)
                } catch (error: unknown) {
                    if (error instanceof ListActionError && error.kind === 'not_found')
                        leaveIfOpen(Number(id))
                    // Rethrow so the rename input stays open.
                    throw error
                }
            },
            onDelete: async (id) => {
                await remove(Number(id))
                leaveIfOpen(Number(id))
            },
        }
    }, [conversationId, threads, listStatus, rename, remove, navigate])

    // Only onNew is provided: no onEdit / onReload / onCancel / setMessages /
    // attachments, so those buttons never appear. No onArchive either (the API
    // has no archive); the Archive menu item is removed from the thread list.
    const runtime = useExternalStoreRuntime({
        messages,
        convertMessage,
        isRunning,
        isLoading: loadStatus === 'loading',
        // Out of credits: Send and Enter do nothing, but typing still works.
        isSendDisabled: usage.outOfCredits,
        onNew,
        adapters: { threadList },
    })

    useEffect(() => {
        runtimeRef.current = runtime
    }, [runtime])

    const status = useMemo(() => ({ sendError, usage }), [sendError, usage])

    return (
        <AssistantRuntimeProvider runtime={runtime}>
            <ChatStatusContext.Provider value={status}>
                {children}
            </ChatStatusContext.Provider>
        </AssistantRuntimeProvider>
    )
}
