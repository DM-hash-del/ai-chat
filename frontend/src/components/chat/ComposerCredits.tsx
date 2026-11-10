import { CircleAlert } from 'lucide-react'
import { useChatStatus } from '@/chat/useChatStatus'
import { formatCredits, nextResetLabel } from '@/usage/credits'

// Under the composer. Says clearly that the credits are shared by all chats,
// not a limit for this one conversation.
export function ComposerCredits() {
    const { usage: state } = useChatStatus()
    const { usage, status, outOfCredits } = state

    if (outOfCredits) {
        return (
            <p
                role="alert"
                className="text-destructive flex items-start gap-2 px-2 text-sm"
            >
                <CircleAlert className="mt-0.5 size-4 shrink-0" />
                <span>
                    You’ve used today’s credits for all your chats. Sending is
                    paused until {nextResetLabel()} (midnight UTC).
                </span>
            </p>
        )
    }

    if (status !== 'ready' || !usage) return null

    return (
        <p className="text-muted-foreground px-2 text-xs">
            {formatCredits(usage.remaining)} daily credits left across all your
            chats
        </p>
    )
}
