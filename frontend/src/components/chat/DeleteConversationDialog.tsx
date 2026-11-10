import { useState } from 'react'
import { useAui, useAuiState } from '@assistant-ui/react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

// Asks before deleting. Must be rendered inside a thread list item, so it
// knows which conversation it is about. Deleting goes through the thread list
// adapter (onDelete), which calls DELETE /api/conversations/{id}.
export function DeleteConversationDialog({ open, onOpenChange }: Props) {
    const aui = useAui()
    const title = useAuiState((s) => s.threadListItem.title) || 'New chat'
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const changeOpen = (next: boolean) => {
        if (busy) return
        setError(null)
        onOpenChange(next)
    }

    const onDelete = async () => {
        setBusy(true)
        setError(null)
        try {
            await aui.threadListItem.delete()
            // On success the item leaves the list and this dialog unmounts.
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Could not delete it.')
            setBusy(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={changeOpen}>
            <DialogContent showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle>Delete conversation?</DialogTitle>
                    <DialogDescription className="break-words">
                        “{title}” and all its messages will be deleted. This
                        can’t be undone.
                    </DialogDescription>
                </DialogHeader>
                {error && (
                    <p role="alert" className="text-destructive text-sm">
                        {error}
                    </p>
                )}
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => changeOpen(false)}
                        disabled={busy}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => void onDelete()}
                        disabled={busy}
                    >
                        {busy ? 'Deleting…' : 'Delete'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
