import { Navigate, Outlet, useLocation } from 'react-router'
import { FullPageSpinner } from './FullPageSpinner'
import { useAuth } from './useAuth'

// Wraps routes that need a logged-in user.
export function RequireAuth() {
    const { status, loggedOutByUser } = useAuth()
    const location = useLocation()

    if (status === 'loading') return <FullPageSpinner />

    if (status === 'guest') {
        // Remember where the user was (unless they chose to log out),
        // so logging in again brings them back.
        const state = loggedOutByUser ? undefined : { from: location.pathname }
        return <Navigate to="/login" replace state={state} />
    }

    return <Outlet />
}
