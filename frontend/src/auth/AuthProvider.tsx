import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { setUnauthorizedHandler } from '@/lib/api'
import * as authApi from './auth-api'
import { AuthContext, type AuthContextValue, type AuthStatus } from './auth-context'
import type { RegisterInput, User } from './types'

export function AuthProvider({ children }: { children: ReactNode }) {
    const [status, setStatus] = useState<AuthStatus>('loading')
    const [user, setUser] = useState<User | null>(null)
    const [loggedOutByUser, setLoggedOutByUser] = useState(false)

    const signIn = (next: User) => {
        setUser(next)
        setStatus('authenticated')
        setLoggedOutByUser(false)
    }

    const signOut = (byUser: boolean) => {
        setUser(null)
        setStatus('guest')
        setLoggedOutByUser(byUser)
    }

    useEffect(() => {
        // Any 401 from any request means the session is gone.
        setUnauthorizedHandler(() => signOut(false))

        // On app load, ask Laravel whether we are logged in.
        let cancelled = false
        authApi
            .getCurrentUser()
            .then((u) => {
                if (!cancelled) signIn(u)
            })
            .catch(() => {
                if (!cancelled) signOut(false)
            })

        return () => {
            cancelled = true
            setUnauthorizedHandler(null)
        }
    }, [])

    const value = useMemo<AuthContextValue>(
        () => ({
            status,
            user,
            loggedOutByUser,
            login: async (email: string, password: string) => {
                signIn(await authApi.login(email, password))
            },
            register: async (input: RegisterInput) => {
                signIn(await authApi.register(input))
            },
            logout: async () => {
                try {
                    await authApi.logout()
                } finally {
                    // Log out of the UI even if the request failed.
                    signOut(true)
                }
            },
        }),
        [status, user, loggedOutByUser]
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
