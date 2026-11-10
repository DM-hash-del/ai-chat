import { useCallback, useEffect, useRef, useState } from 'react'
import { toApiError, type ApiError, type ApiErrorKind } from '@/lib/api-errors'
import {
    deleteConversation,
    listConversations,
    renameConversation,
} from './chat-api'
import type { Conversation, ConversationWithMessages } from './types'

export type ListStatus = 'loading' | 'ready' | 'error'

// Thrown by rename/remove so the caller can show the message and, for a 404,
// react to the conversation being gone.
export class ListActionError extends Error {
    readonly kind: ApiErrorKind

    constructor(error: ApiError) {
        super(error.message)
        this.kind = error.kind
    }
}

export type ConversationListState = {
    // Newest first, as GET /api/conversations returns them.
    conversations: Conversation[]
    status: ListStatus
    loadError: ApiError | null
    // The last failed rename, shown at the top of the sidebar.
    renameError: ApiError | null
    dismissRenameError: () => void
    reload: () => void
    // A conversation we just created: put it at the top.
    add: (conversation: ConversationWithMessages) => void
    rename: (id: number, title: string) => Promise<void>
    remove: (id: number) => Promise<void>
}

// The list only keeps the conversation fields, never the messages.
const withoutMessages = ({
    id,
    user_id,
    title,
    created_at,
    updated_at,
}: Conversation): Conversation => ({ id, user_id, title, created_at, updated_at })

export function useConversationList(): ConversationListState {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [status, setStatus] = useState<ListStatus>('loading')
    const [loadError, setLoadError] = useState<ApiError | null>(null)
    const [renameError, setRenameError] = useState<ApiError | null>(null)

    // Only the answer to the latest reload is used.
    const requestId = useRef(0)

    // Only the asynchronous part, so the first load (in an effect) doesn't set
    // state synchronously; status already starts as 'loading'.
    const fetchList = useCallback(() => {
        const id = ++requestId.current
        listConversations()
            .then((list) => {
                if (id !== requestId.current) return
                setConversations(list)
                setStatus('ready')
            })
            .catch((error: unknown) => {
                if (id !== requestId.current) return
                setLoadError(toApiError(error))
                setStatus('error')
            })
    }, [])

    useEffect(() => {
        fetchList()
    }, [fetchList])

    const reload = useCallback(() => {
        setStatus('loading')
        setLoadError(null)
        fetchList()
    }, [fetchList])

    const add = useCallback((conversation: ConversationWithMessages) => {
        const item = withoutMessages(conversation)
        setConversations((prev) => [item, ...prev.filter((c) => c.id !== item.id)])
    }, [])

    const dropLocally = (id: number) =>
        setConversations((prev) => prev.filter((c) => c.id !== id))

    const rename = useCallback(async (id: number, title: string) => {
        try {
            const updated = await renameConversation(id, title)
            setRenameError(null)
            setConversations((prev) =>
                prev.map((c) => (c.id === updated.id ? withoutMessages(updated) : c))
            )
        } catch (error: unknown) {
            const apiError = toApiError(error)
            if (apiError.kind === 'not_found') {
                // Already gone (deleted elsewhere, or not yours).
                dropLocally(id)
                setRenameError({
                    ...apiError,
                    message: 'That conversation no longer exists.',
                })
            } else {
                // A 422 has the reason in errors.title.
                const titleError = apiError.fieldErrors.title?.[0]
                setRenameError(
                    titleError ? { ...apiError, message: titleError } : apiError
                )
            }
            throw new ListActionError(apiError)
        }
    }, [])

    const remove = useCallback(async (id: number) => {
        try {
            await deleteConversation(id)
        } catch (error: unknown) {
            const apiError = toApiError(error)
            // A 404 means it is already gone: same result as deleting it.
            if (apiError.kind !== 'not_found') throw new ListActionError(apiError)
        }
        dropLocally(id)
    }, [])

    const dismissRenameError = useCallback(() => setRenameError(null), [])

    return {
        conversations,
        status,
        loadError,
        renameError,
        dismissRenameError,
        reload,
        add,
        rename,
        remove,
    }
}
