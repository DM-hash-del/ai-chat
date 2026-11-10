import { useParams } from 'react-router'
import { ChatRuntimeProvider } from '@/chat/ChatRuntimeProvider'
import { useConversation } from '@/chat/useConversation'
import { Thread } from '@/components/assistant-ui/elements/thread.aui'
import { ChatLayout } from '@/components/ChatLayout'
import { ConversationError } from '@/components/chat/ConversationError'

// Used for both "/" (new chat) and "/c/:id". The URL decides which
// conversation is shown.
export function ChatPage() {
    const { id } = useParams()
    const conversation = useConversation(id)
    const { loadStatus, loadError } = conversation

    return (
        <ChatRuntimeProvider conversation={conversation}>
            <ChatLayout>
                {loadStatus === 'not_found' || loadStatus === 'error' ? (
                    <ConversationError status={loadStatus} error={loadError} />
                ) : (
                    <Thread />
                )}
            </ChatLayout>
        </ChatRuntimeProvider>
    )
}
