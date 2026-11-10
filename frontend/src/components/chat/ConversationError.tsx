import { CircleAlert } from 'lucide-react'
import { Link } from 'react-router'
import type { LoadStatus } from '@/chat/useConversation'
import type { ApiError } from '@/lib/api-errors'

type Props = {
    status: Extract<LoadStatus, 'not_found' | 'error'>
    error: ApiError | null
}

// Replaces the thread when a conversation can't be loaded.
// A 404 also covers conversations that belong to another user.
export function ConversationError({ status, error }: Props) {
    const title =
        status === 'not_found'
            ? 'Conversation not found'
            : "Couldn't load this conversation"
    const detail =
        status === 'not_found'
            ? "It doesn't exist, or it isn't yours."
            : (error?.message ?? 'Please try again.')

    return (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <CircleAlert className="text-muted-foreground size-8" />
            <h1 className="text-lg font-medium">{title}</h1>
            <p className="text-muted-foreground text-sm">{detail}</p>
            <Link
                to="/"
                className="bg-primary text-primary-foreground hover:bg-primary/80 rounded-lg px-3 py-1.5 text-sm font-medium"
            >
                Start a new chat
            </Link>
        </div>
    )
}
