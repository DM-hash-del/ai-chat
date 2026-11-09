import { useState, type FormEvent } from 'react'
import { useAuth } from '@/auth/useAuth'
import { AuthCard } from '@/components/auth/AuthCard'
import { FormError } from '@/components/auth/FormError'
import { FormField } from '@/components/auth/FormField'
import { useAuthForm } from '@/components/auth/useAuthForm'
import { Button } from '@/components/ui/button'

export function LoginPage() {
    const { login } = useAuth()
    const { submitting, fieldErrors, formError, run } = useAuthForm()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    // On success the auth state changes and <RequireGuest> redirects.
    const onSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        void run(() => login(email, password))
    }

    return (
        <AuthCard
            title="Log in"
            footerText="No account?"
            footerLinkText="Register"
            footerLinkTo="/register"
        >
            <form onSubmit={onSubmit} className="space-y-4">
                <FormError message={formError} />
                <FormField
                    name="email"
                    label="Email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    errors={fieldErrors.email}
                />
                <FormField
                    name="password"
                    label="Password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    errors={fieldErrors.password}
                />
                <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? 'Logging in…' : 'Log in'}
                </Button>
            </form>
        </AuthCard>
    )
}
