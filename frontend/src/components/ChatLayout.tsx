import { Thread } from '@/components/assistant-ui/elements/thread.aui'
import { ThreadList } from '@/components/assistant-ui/elements/thread-list.aui'

export function ChatLayout() {
    return (
        <div className="flex h-dvh">
            <aside className="bg-sidebar w-64 shrink-0 overflow-y-auto border-r p-2">
                <ThreadList />
            </aside>
            <main className="min-w-0 flex-1">
                <Thread />
            </main>
        </div>
    )
}
