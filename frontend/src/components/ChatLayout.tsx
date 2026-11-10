import { useEffect, useState, type MouseEvent, type ReactNode } from 'react'
import { useLocation } from 'react-router'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserMenu } from '@/components/UserMenu'
import { cn } from '@/lib/utils'

type Props = {
    // The sidebar's content (notice + conversation list).
    sidebar: ReactNode
    children: ReactNode
}

// Clicking one of these in the sidebar should close it on small screens,
// even when it doesn't change the URL (e.g. the chat that is already open).
const CLOSES_SIDEBAR =
    '[data-slot="aui_thread-list-item-trigger"], [data-slot="aui_thread-list-new"]'

// From the md breakpoint up the sidebar is always visible. Below that it is
// hidden behind a menu button and opens on top of the chat.
export function ChatLayout({ sidebar, children }: Props) {
    const { pathname } = useLocation()
    // Remembers on which page it was opened, so any navigation closes it
    // without needing an effect.
    const [openOn, setOpenOn] = useState<string | null>(null)
    const open = openOn === pathname
    const close = () => setOpenOn(null)

    // Escape closes it.
    useEffect(() => {
        if (!open) return
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpenOn(null)
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open])

    const onSidebarClick = (event: MouseEvent<HTMLElement>) => {
        if (event.target instanceof Element && event.target.closest(CLOSES_SIDEBAR))
            close()
    }

    return (
        <div className="flex h-dvh">
            {open && (
                <div
                    aria-hidden
                    className="fixed inset-0 z-30 bg-black/10 md:hidden"
                    onClick={close}
                />
            )}
            <aside
                id="chat-sidebar"
                onClick={onSidebarClick}
                className={cn(
                    'bg-sidebar w-64 shrink-0 flex-col border-r',
                    'fixed inset-y-0 left-0 z-40 md:static md:z-auto md:flex',
                    open ? 'flex' : 'hidden'
                )}
            >
                <div className="flex justify-end p-2 pb-0 md:hidden">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={close}
                        aria-label="Close sidebar"
                    >
                        <X />
                    </Button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-2">{sidebar}</div>
                <UserMenu />
            </aside>
            <main className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center border-b p-2 md:hidden">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setOpenOn(pathname)}
                        aria-label="Open sidebar"
                        aria-controls="chat-sidebar"
                        aria-expanded={open}
                    >
                        <Menu />
                    </Button>
                </div>
                <div className="min-h-0 flex-1">{children}</div>
            </main>
        </div>
    )
}
