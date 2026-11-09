import { Navigate, Outlet, useLocation } from 'react-router'
import { FullPageSpinner } from './FullPageSpinner'
import { useAuth } from './useAuth'

type FromState = { from?: unknown } | null

// Wraps /login and /register: a logged-in user is sent on to the chat.
// This is also what moves the user on after a successful login or register.
export function RequireGuest() {
    const { status } = useAuth()
    const location = useLocation()

    if (status === 'loading') return <FullPageSpinner />

    if (status === 'authenticated') {
        const from = (location.state as FromState)?.from
        const to = typeof from === 'string' && from.startsWith('/') ? from : '/'
        return <Navigate to={to} replace />
    }

    return <Outlet />
}
