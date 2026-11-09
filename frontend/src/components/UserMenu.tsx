import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/button'

// Bottom of the sidebar: who is logged in, and a logout button.
// After logout, <RequireAuth> sends the user to /login.
export function UserMenu() {
    const { user, logout } = useAuth()
    const [busy, setBusy] = useState(false)

    if (!user) return null

    const onLogout = async () => {
        setBusy(true)
        await logout()
    }

    return (
        <div className="flex items-center gap-2 border-t p-2">
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="text-muted-foreground truncate text-xs">
                    {user.email}
                </p>
            </div>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => void onLogout()}
                disabled={busy}
                aria-label="Log out"
                title="Log out"
            >
                <LogOut />
            </Button>
        </div>
    )
}
