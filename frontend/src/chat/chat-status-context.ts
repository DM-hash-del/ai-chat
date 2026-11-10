import { createContext } from 'react'
import type { ApiError } from '@/lib/api-errors'

// Chat details that assistant-ui's own state doesn't know about.
export type ChatStatus = {
    // The last send error for the conversation on screen, if any.
    sendError: ApiError | null
}

export const ChatStatusContext = createContext<ChatStatus | null>(null)
