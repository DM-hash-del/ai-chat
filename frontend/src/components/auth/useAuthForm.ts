import { useState } from 'react'
import { toApiError } from '@/lib/api-errors'

type Options = {
    // Fields whose 422 errors must not be shown as-is (for example, so the
    // register form doesn't reveal that an email already has an account).
    // Maps the field name to the generic form-level message to show instead.
    maskedFields?: Record<string, string>
}

// Shared submit logic for the login and register forms:
// tracks "submitting", field errors (422) and a form-level error (the rest).
export function useAuthForm({ maskedFields = {} }: Options = {}) {
    const [submitting, setSubmitting] = useState(false)
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>(
        {}
    )
    const [formError, setFormError] = useState<string | null>(null)

    const run = async (action: () => Promise<void>) => {
        setSubmitting(true)
        setFieldErrors({})
        setFormError(null)
        try {
            await action()
        } catch (error) {
            const apiError = toApiError(error)
            if (apiError.kind === 'validation') {
                const visible = { ...apiError.fieldErrors }
                let masked: string | null = null
                for (const [field, message] of Object.entries(maskedFields)) {
                    if (visible[field]) {
                        delete visible[field]
                        masked = message
                    }
                }
                setFieldErrors(visible)
                setFormError(masked)
            } else {
                setFormError(apiError.message)
            }
        } finally {
            setSubmitting(false)
        }
    }

    return { submitting, fieldErrors, formError, run }
}
