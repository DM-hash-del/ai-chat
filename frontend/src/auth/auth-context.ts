import { createContext } from 'react'
import type { RegisterInput, User } from './types'

export type AuthStatus = 'loading' | 'authenticated' | 'guest'

export type AuthContextValue = {
    status: AuthStatus
    user: User | null
    // True right after the user clicked "Log out", so the login page
    // doesn't send them back to the conversation they were on.
    loggedOutByUser: boolean
    login: (email: string, password: string) => Promise<void>
    register: (input: RegisterInput) => Promise<void>
    logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
