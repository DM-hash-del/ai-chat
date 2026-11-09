import api, { fetchCsrfCookie } from '@/lib/api'
import type { RegisterInput, User } from './types'

export async function getCurrentUser(): Promise<User> {
    const { data } = await api.get<User>('/api/user')
    return data
}

export async function login(email: string, password: string): Promise<User> {
    await fetchCsrfCookie()
    const { data } = await api.post<{ message: string; user: User }>(
        '/api/login',
        { email, password }
    )
    return data.user
}

export async function register(input: RegisterInput): Promise<User> {
    await fetchCsrfCookie()
    const { data } = await api.post<User>('/api/register', input)
    return data
}

export async function logout(): Promise<void> {
    await api.post('/api/logout')
}
