import { useState, type FormEvent } from 'react'
import { useAuth } from '@/auth/useAuth'
import type { RegisterInput } from '@/auth/types'
import { AuthCard } from '@/components/auth/AuthCard'
import { FormError } from '@/components/auth/FormError'
import { FormField } from '@/components/auth/FormField'
import { useAuthForm } from '@/components/auth/useAuthForm'
import { Button } from '@/components/ui/button'

const EMPTY: RegisterInput = {
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
}

// Shown instead of any email error, so the form never reveals whether an
// email already has an account.
const GENERIC_SIGNUP_ERROR =
    "We couldn't create an account with these details. If you already have an account, try logging in."

const MASKED_FIELDS = { email: GENERIC_SIGNUP_ERROR }

export function RegisterPage() {
    const { register } = useAuth()
    const { submitting, fieldErrors, formError, run } = useAuthForm({
        maskedFields: MASKED_FIELDS,
    })
    const [form, setForm] = useState<RegisterInput>(EMPTY)

    const update = (field: keyof RegisterInput) => (value: string) =>
        setForm((prev) => ({ ...prev, [field]: value }))

    // A 201 logs the user in; <RequireGuest> then redirects to /.
    const onSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        void run(() => register(form))
    }

    return (
        <AuthCard
            title="Create an account"
            footerText="Already registered?"
            footerLinkText="Log in"
            footerLinkTo="/login"
        >
            <form onSubmit={onSubmit} className="space-y-4">
                <FormError message={formError} />
                <FormField
                    name="name"
                    label="Name"
                    autoComplete="name"
                    required
                    value={form.name}
                    onChange={(e) => update('name')(e.target.value)}
                    errors={fieldErrors.name}
                />
                <FormField
                    name="email"
                    label="Email"
                    type="email"
                    autoComplete="email"
                    required
                    value={form.email}
                    onChange={(e) => update('email')(e.target.value)}
                />
                <FormField
                    name="password"
                    label="Password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={form.password}
                    onChange={(e) => update('password')(e.target.value)}
                    errors={fieldErrors.password}
                />
                <FormField
                    name="password_confirmation"
                    label="Confirm password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={form.password_confirmation}
                    onChange={(e) =>
                        update('password_confirmation')(e.target.value)
                    }
                    errors={fieldErrors.password_confirmation}
                />
                <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? 'Creating account…' : 'Create account'}
                </Button>
            </form>
        </AuthCard>
    )
}
