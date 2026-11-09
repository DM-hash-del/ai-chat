// The User object returned by the Laravel API (see docs/api-contract.md).
export type User = {
    id: number
    name: string
    email: string
    tier: 'free' | 'pro'
    email_verified_at: string | null
    created_at: string
    updated_at: string
}

export type RegisterInput = {
    name: string
    email: string
    password: string
    password_confirmation: string
}
