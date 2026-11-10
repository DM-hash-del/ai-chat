// Shapes returned by the Laravel API (see docs/api-contract.md).

export type MessageRole = 'user' | 'assistant'

export type Message = {
    id: number
    conversation_id: number
    role: MessageRole
    content: string
    created_at: string
    updated_at: string
}

export type Conversation = {
    id: number
    user_id: number
    title: string
    created_at: string
    updated_at: string
}

// GET /api/conversations/{id} and POST /api/conversations (201).
export type ConversationWithMessages = Conversation & { messages: Message[] }

// POST /api/conversations/{id}/messages (201).
export type SendMessageResponse = {
    user_message: Message
    assistant_message: Message
}
