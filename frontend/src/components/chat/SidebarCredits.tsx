import { useChatStatus } from '@/chat/useChatStatus'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCredits, nextResetLabel } from '@/usage/credits'

// Above the user menu: today's credits for the whole account.
export function SidebarCredits() {
    const { usage: state } = useChatStatus()
    const { usage, status } = state

    return (
        <div className="border-t px-3 py-2 text-xs" aria-live="polite">
            <p className="text-muted-foreground">Daily credits (all chats)</p>
            {status === 'loading' && !usage ? (
                <Skeleton className="mt-1 h-4 w-24" />
            ) : status === 'error' || !usage ? (
                <p className="text-muted-foreground mt-0.5">Credits unavailable</p>
            ) : (
                <>
                    <p className="mt-0.5 text-sm font-medium">
                        {formatCredits(usage.remaining)} of{' '}
                        {formatCredits(usage.daily_allowance)} left
                    </p>
                    <p className="text-muted-foreground">
                        Resets at {nextResetLabel()}
                    </p>
                </>
            )}
        </div>
    )
}
