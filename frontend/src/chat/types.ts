// Shapes returned by the Laravel API (see docs/api-contract.md).
// Mock data in Phase 1 uses the same shapes so Phase 3 can swap in real data.

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
