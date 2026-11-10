import { CircleAlert } from 'lucide-react'
import { useAuiState } from '@assistant-ui/react'
import { useChatStatus } from '@/chat/useChatStatus'

const NO_REPLY = 'No reply. Send your message again to retry.'

// Shown under the messages when something went wrong.
// The "no reply" case is worked out from the data (the last message is from
// the user and nothing is running), so it also shows after a refresh.
export function ChatNotice() {
    const { sendError } = useChatStatus()
    const isRunning = useAuiState((s) => s.thread.isRunning)
    const lastIsUser = useAuiState((s) => {
        const list = s.thread.messages
        return list.length > 0 && list[list.length - 1].role === 'user'
    })

    if (isRunning) return null

    let text: string | null = null
    if (lastIsUser) {
        text = sendError ? `${sendError.message} ${NO_REPLY}` : NO_REPLY
    } else if (sendError) {
        // Nothing was saved (e.g. out of credits): the message was removed
        // and its text put back in the composer.
        text = sendError.message
    }
    if (!text) return null

    return (
        <div
            role="alert"
            className="border-destructive bg-destructive/10 text-destructive mx-2 flex items-start gap-2 rounded-md border p-3 text-sm"
        >
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            <p>{text}</p>
        </div>
    )
}
