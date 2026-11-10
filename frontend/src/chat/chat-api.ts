import api from '@/lib/api'
import type {
    ConversationWithMessages,
    SendMessageResponse,
} from './types'

// The chat endpoints from docs/api-contract.md. Errors are left to the caller,
// which turns them into something readable with toApiError().

export async function getConversation(
    id: number
): Promise<ConversationWithMessages> {
    const { data } = await api.get<ConversationWithMessages>(
        `/api/conversations/${id}`
    )
    return data
}

// Starts a new chat with its first message; returns both messages.
export async function createConversation(
    content: string
): Promise<ConversationWithMessages> {
    const { data } = await api.post<ConversationWithMessages>(
        '/api/conversations',
        { content }
    )
    return data
}

// Sends a follow-up (or re-sends after a failure); returns only this exchange.
export async function sendMessage(
    conversationId: number,
    content: string
): Promise<SendMessageResponse> {
    const { data } = await api.post<SendMessageResponse>(
        `/api/conversations/${conversationId}/messages`,
        { content }
    )
    return data
}
