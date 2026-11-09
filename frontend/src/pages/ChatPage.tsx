import { ChatLayout } from '@/components/ChatLayout'
import { MockRuntimeProvider } from '@/chat/MockRuntimeProvider'

export function ChatPage() {
    return (
        <MockRuntimeProvider>
            <ChatLayout />
        </MockRuntimeProvider>
    )
}
