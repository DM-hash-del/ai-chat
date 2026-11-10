import type { ThreadMessageLike } from '@assistant-ui/react'
import type { Message } from './types'

// Turns a Laravel-shaped message into the shape assistant-ui understands.
export const convertMessage = (message: Message): ThreadMessageLike => ({
    id: String(message.id),
    role: message.role,
    content: [{ type: 'text', text: message.content }],
    createdAt: new Date(message.created_at),
})
