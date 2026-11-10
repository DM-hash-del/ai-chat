import type { ReactNode } from 'react'
import { ThreadList } from '@/components/assistant-ui/elements/thread-list.aui'
import { UserMenu } from '@/components/UserMenu'

export function ChatLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex h-dvh">
            <aside className="bg-sidebar flex w-64 shrink-0 flex-col border-r">
                <div className="min-h-0 flex-1 overflow-y-auto p-2">
                    <ThreadList />
                </div>
                <UserMenu />
            </aside>
            <main className="min-w-0 flex-1">{children}</main>
        </div>
    )
}
