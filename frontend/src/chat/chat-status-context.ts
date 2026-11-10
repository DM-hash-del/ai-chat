import { createContext } from 'react'
import type { ApiError } from '@/lib/api-errors'
import type { UsageState } from '@/usage/useUsage'

// Chat details that assistant-ui's own state doesn't know about.
export type ChatStatus = {
    // The last send error for the conversation on screen, if any.
    sendError: ApiError | null
    // Today's credits for the whole account (all chats share them).
    usage: UsageState
    // Sends the last message again when it has no reply.
    retry: () => void
}

export const ChatStatusContext = createContext<ChatStatus | null>(null)
