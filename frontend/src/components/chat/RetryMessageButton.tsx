import { RotateCcw } from 'lucide-react'
import { useAuiState } from '@assistant-ui/react'
import { TooltipIconButton } from '@/components/assistant-ui/elements/tooltip-icon-button'
import { useChatStatus } from '@/chat/useChatStatus'

// Shown under a user message that got no reply: the last message is from the
// user and nothing is running (the same rule as ChatNotice, worked out from
// the data, so it also shows after a refresh). Sends the same text again.
export function RetryMessageButton() {
    const { retry, usage } = useChatStatus()
    const isFailed = useAuiState(
        (s) =>
            s.message.role === 'user' && s.message.isLast && !s.thread.isRunning
    )

    if (!isFailed) return null

    return (
        <div className="col-start-2 flex justify-end">
            <TooltipIconButton
                tooltip={usage.outOfCredits ? 'Out of credits' : 'Retry'}
                className="text-muted-foreground"
                disabled={usage.outOfCredits}
                onClick={retry}
            >
                <RotateCcw />
            </TooltipIconButton>
        </div>
    )
}
