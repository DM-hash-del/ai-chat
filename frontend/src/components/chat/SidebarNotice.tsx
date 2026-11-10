import { CircleAlert, X } from 'lucide-react'
import type { ConversationListState } from '@/chat/useConversationList'
import { Button } from '@/components/ui/button'

type Props = Pick<
    ConversationListState,
    'status' | 'loadError' | 'renameError' | 'dismissRenameError' | 'reload'
>

// Top of the sidebar: the list couldn't load, or a rename failed.
export function SidebarNotice({
    status,
    loadError,
    renameError,
    dismissRenameError,
    reload,
}: Props) {
    if (status === 'error') {
        return (
            <div
                role="alert"
                className="text-destructive mx-0.5 mb-1 flex flex-col gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-sm"
            >
                <p className="flex items-start gap-2">
                    <CircleAlert className="mt-0.5 size-4 shrink-0" />
                    <span>
                        Couldn’t load your conversations.{' '}
                        {loadError?.message}
                    </span>
                </p>
                <Button variant="outline" size="sm" onClick={reload}>
                    Try again
                </Button>
            </div>
        )
    }

    if (renameError) {
        return (
            <div
                role="alert"
                className="text-destructive mx-0.5 mb-1 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-sm"
            >
                <CircleAlert className="mt-0.5 size-4 shrink-0" />
                <p className="min-w-0 flex-1">
                    Rename failed. {renameError.message}
                </p>
                <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={dismissRenameError}
                    aria-label="Dismiss"
                >
                    <X />
                </Button>
            </div>
        )
    }

    return null
}
