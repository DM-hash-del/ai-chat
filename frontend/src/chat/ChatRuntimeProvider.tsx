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

// The composer hands us a list of parts; we only support text.
const getText = (message: AppendMessage): string =>
    message.content
        .map((part) => (part.type === 'text' ? part.text : ''))
        .join('')
        .trim()

type Props = {
    conversation: ConversationState
    children: ReactNode
}

// Connects assistant-ui to our own state (an "external store"): React state
// holds the messages Laravel returned, and assistant-ui only displays them.
export function ChatRuntimeProvider({ conversation, children }: Props) {
    const navigate = useNavigate()
    const { send, messages, isRunning, loadStatus, conversationId, sendError } =
        conversation

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

    // Phase 3: no conversation list yet (that's Phase 4). The adapter only
    // knows the current id, and "New chat" goes to "/".
    const threadList = useMemo<ExternalStoreThreadListAdapter>(
        () => ({
            threadId: conversationId === null ? undefined : String(conversationId),
            threads: [],
            onSwitchToNewThread: () => navigate('/'),
            onSwitchToThread: (id) => navigate(`/c/${id}`),
        }),
        [conversationId, navigate]
    )

    // Only onNew is provided: no onEdit / onReload / onCancel / setMessages /
    // attachments, so those buttons never appear.
    const runtime = useExternalStoreRuntime({
        messages,
        convertMessage,
        isRunning,
        isLoading: loadStatus === 'loading',
        onNew,
        adapters: { threadList },
    })

    useEffect(() => {
        runtimeRef.current = runtime
    }, [runtime])

    const status = useMemo(() => ({ sendError }), [sendError])

    return (
        <AssistantRuntimeProvider runtime={runtime}>
            <ChatStatusContext.Provider value={status}>
                {children}
            </ChatStatusContext.Provider>
        </AssistantRuntimeProvider>
    )
}
