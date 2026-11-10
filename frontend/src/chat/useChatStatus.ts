import { useContext } from 'react'
import { ChatStatusContext, type ChatStatus } from './chat-status-context'

export function useChatStatus(): ChatStatus {
    const value = useContext(ChatStatusContext)
    if (!value)
        throw new Error('useChatStatus must be used inside <ChatRuntimeProvider>')
    return value
}
