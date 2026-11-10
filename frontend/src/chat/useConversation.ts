import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { toApiError, type ApiError, type ApiErrorKind } from '@/lib/api-errors'
import { createConversation, getConversation, sendMessage } from './chat-api'
import { isTempMessage, mergeMessages } from './merge-messages'
import type { ConversationWithMessages, Message } from './types'

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'not_found' | 'error'

type SendError = { conversationId: number | null; error: ApiError }

export type ConversationState = {
    conversationId: number | null
    messages: Message[]
    loadStatus: LoadStatus
    loadError: ApiError | null
    isRunning: boolean
    // Only the error that belongs to the conversation on screen.
    sendError: ApiError | null
    // Resolves when the send is finished. Calls onNotSent with the text when
    // the server saved nothing, so the caller can put it back in the composer.
    send: (text: string, onNotSent: (text: string) => void) => Promise<void>
    // Sends the last message again when it got no reply (same text, so the
    // backend reuses the saved message). Does nothing otherwise.
    retry: (onNotSent: (text: string) => void) => Promise<void>
}

// Errors where the server saved nothing: the message can simply be removed.
// For the others (502, network, 500) the user message is (or may be) saved,
// so it stays on screen and the "no reply" notice appears under it.
const NOTHING_SAVED: readonly ApiErrorKind[] = [
    'unauthenticated',
    'csrf',
    'validation',
    'rate_limited',
    'out_of_credits',
    'not_found',
]

// Lets the sidebar know a new conversation exists.
export type ConversationListEvents = {
    // POST /api/conversations succeeded: we have the conversation itself.
    onCreated: (conversation: ConversationWithMessages) => void
    // It was saved but the AI failed (502): we only know its id.
    onCreatedWithoutReply: () => void
    // Credits may have changed: a reply was saved (false), or the backend
    // refused the send for lack of credits (true).
    onCreditsChanged: (outOfCredits: boolean) => void
}

// "/" → null (new chat), "/c/7" → 7, "/c/abc" → 'invalid'.
function parseRouteId(param: string | undefined): number | null | 'invalid' {
    if (param === undefined) return null
    return /^\d+$/.test(param) ? Number(param) : 'invalid'
}

export function useConversation(
    routeParam: string | undefined,
    { onCreated, onCreatedWithoutReply, onCreditsChanged }: ConversationListEvents
): ConversationState {
    const navigate = useNavigate()
    const routeId = parseRouteId(routeParam)

    const [messages, setMessages] = useState<Message[]>([])
    const [loadStatus, setLoadStatus] = useState<LoadStatus>('idle')
    const [loadError, setLoadError] = useState<ApiError | null>(null)
    const [isRunning, setIsRunning] = useState(false)
    const [sendError, setSendError] = useState<SendError | null>(null)

    // Refs hold values that don't need a re-render when they change.
    // loadedId: the conversation whose messages are in state.
    const loadedId = useRef<number | null>(null)
    // generation: goes up on every route change, so answers to requests made
    // for a previous conversation can be recognised and ignored.
    const generation = useRef(0)
    const nextTempId = useRef(-1)
    // Latest values for retry(), so the callback doesn't change on every render.
    const messagesRef = useRef<Message[]>(messages)
    const isRunningRef = useRef(false)

    useEffect(() => {
        messagesRef.current = messages
        isRunningRef.current = isRunning
    }, [messages, isRunning])

    useEffect(() => {
        // We just created this conversation and navigated here ourselves:
        // the messages are already in state, so don't fetch them again.
        if (routeId !== null && routeId === loadedId.current) return

        generation.current += 1
        const gen = generation.current

        setMessages([])
        setIsRunning(false)
        setLoadError(null)
        // Keep an error only if it belongs to where we're going (a failed
        // new chat navigates to its saved conversation).
        setSendError((prev) =>
            prev && prev.conversationId === routeId ? prev : null
        )

        if (routeId === null) {
            loadedId.current = null
            setLoadStatus('idle')
            return
        }
        if (routeId === 'invalid') {
            loadedId.current = null
            setLoadStatus('not_found')
            return
        }

        loadedId.current = routeId
        setLoadStatus('loading')
        getConversation(routeId)
            .then((conversation) => {
                if (gen !== generation.current) return
                setMessages(conversation.messages)
                setLoadStatus('ready')
            })
            .catch((error: unknown) => {
                if (gen !== generation.current) return
                const apiError = toApiError(error)
                setLoadError(apiError)
                setLoadStatus(apiError.kind === 'not_found' ? 'not_found' : 'error')
            })
    }, [routeId])

    // Shared by send and retry. `existing` is the message being sent again
    // (retry); null means a new message, shown at once with a temporary id.
    const submit = useCallback(
        async (
            text: string,
            existing: Message | null,
            onNotSent: (text: string) => void
        ) => {
            const gen = generation.current
            const conversationId = loadedId.current
            const now = new Date().toISOString()
            const temp: Message = existing ?? {
                id: nextTempId.current--,
                conversation_id: conversationId ?? 0,
                role: 'user',
                content: text,
                created_at: now,
                updated_at: now,
            }

            if (!existing) setMessages((prev) => [...prev, temp])
            setSendError(null)
            isRunningRef.current = true
            setIsRunning(true)

            try {
                if (conversationId === null) {
                    const conversation = await createConversation(text)
                    // It exists on the server even if the user has moved on.
                    onCreated(conversation)
                    onCreditsChanged(false)
                    if (gen !== generation.current) return
                    loadedId.current = conversation.id
                    setMessages((prev) =>
                        mergeMessages(prev, conversation.messages, temp.id)
                    )
                    setLoadStatus('ready')
                    navigate(`/c/${conversation.id}`)
                } else {
                    const result = await sendMessage(conversationId, text)
                    // Credits belong to the account, not this conversation.
                    onCreditsChanged(false)
                    if (gen !== generation.current) return
                    setMessages((prev) =>
                        mergeMessages(
                            prev,
                            [result.user_message, result.assistant_message],
                            temp.id
                        )
                    )
                }
            } catch (error: unknown) {
                const apiError = toApiError(error)
                if (conversationId === null && apiError.conversationId !== undefined) {
                    onCreatedWithoutReply()
                }
                if (apiError.kind === 'out_of_credits') onCreditsChanged(true)
                if (gen !== generation.current) return

                // A new chat failed at the AI step: the conversation and the
                // message are saved. Open it; the page loads what was saved.
                if (conversationId === null && apiError.conversationId !== undefined) {
                    setSendError({ conversationId: apiError.conversationId, error: apiError })
                    navigate(`/c/${apiError.conversationId}`)
                    return
                }

                setSendError({ conversationId, error: apiError })
                // A retried message with a real id is saved on the server:
                // keep it, so it can be retried again.
                if (NOTHING_SAVED.includes(apiError.kind) && isTempMessage(temp)) {
                    setMessages((prev) => prev.filter((m) => m.id !== temp.id))
                    onNotSent(text)
                }
            } finally {
                if (gen === generation.current) {
                    isRunningRef.current = false
                    setIsRunning(false)
                }
            }
        },
        [navigate, onCreated, onCreatedWithoutReply, onCreditsChanged]
    )

    const send = useCallback(
        (text: string, onNotSent: (text: string) => void) =>
            submit(text, null, onNotSent),
        [submit]
    )

    const retry = useCallback(
        async (onNotSent: (text: string) => void) => {
            if (isRunningRef.current) return
            const list = messagesRef.current
            const last = list[list.length - 1]
            if (!last || last.role !== 'user') return
            await submit(last.content, last, onNotSent)
        },
        [submit]
    )

    const currentId = typeof routeId === 'number' ? routeId : null
    const visibleSendError =
        sendError && sendError.conversationId === currentId ? sendError.error : null

    return {
        conversationId: currentId,
        messages,
        loadStatus,
        loadError,
        isRunning,
        sendError: visibleSendError,
        send,
        retry,
    }
}
