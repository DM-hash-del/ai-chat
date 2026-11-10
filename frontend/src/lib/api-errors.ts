import axios from 'axios'
import { fetchCsrfCookie } from './api'

// Turns any error from the API client into something the UI can show.

export type ApiErrorKind =
    | 'unauthenticated'
    | 'csrf'
    | 'validation'
    | 'rate_limited'
    | 'out_of_credits'
    | 'ai_failed'
    | 'not_found'
    | 'server'
    | 'network'

export type ApiError = {
    kind: ApiErrorKind
    status?: number
    message: string
    fieldErrors: Record<string, string[]>
    retryAfter?: number
    conversationId?: number
}

// The JSON error bodies Laravel sends (see docs/api-contract.md).
type ErrorBody = {
    message?: string
    errors?: Record<string, string[]>
    conversation_id?: number
}

const make = (
    kind: ApiErrorKind,
    message: string,
    extra: Partial<ApiError> = {}
): ApiError => ({ kind, message, fieldErrors: {}, ...extra })

const NETWORK_MESSAGE = "Can't reach the server. Check your connection."

export function toApiError(error: unknown): ApiError {
    if (!axios.isAxiosError<ErrorBody>(error) || !error.response) {
        return make('network', NETWORK_MESSAGE)
    }

    const { status, data, headers } = error.response
    const body: ErrorBody = typeof data === 'object' && data ? data : {}

    switch (status) {
        case 401:
            return make('unauthenticated', 'Please log in.', { status })
        case 419:
            // Get a fresh CSRF cookie now so the user's next try works.
            fetchCsrfCookie().catch(() => {})
            return make(
                'csrf',
                'Your session expired. Please try again.',
                { status }
            )
        case 422:
            return make(
                'validation',
                body.message ?? 'Please check the form.',
                { status, fieldErrors: body.errors ?? {} }
            )
        case 429: {
            // The login throttle sends Retry-After; "out of credits" doesn't.
            const retryAfter = Number(headers['retry-after'])
            if (Number.isFinite(retryAfter) && retryAfter > 0) {
                return make(
                    'rate_limited',
                    `Too many attempts. Try again in ${retryAfter} seconds.`,
                    { status, retryAfter }
                )
            }
            return make(
                'out_of_credits',
                "You're out of credits for today.",
                { status }
            )
        }
        case 404:
            return make('not_found', 'Not found.', { status })
        case 502:
            // Laravel's own 502 ("Failed to send message to AI") is JSON with
            // a message. A 502 without one comes from a proxy in front of
            // Laravel (the Vite dev proxy when the backend is down).
            if (typeof body.message !== 'string') {
                return make('network', NETWORK_MESSAGE, { status })
            }
            return make('ai_failed', "The AI couldn't respond, try again.", {
                status,
                conversationId: body.conversation_id,
            })
        case 503:
        case 504:
            // Gateway errors: the server behind the proxy didn't answer.
            return make('network', NETWORK_MESSAGE, { status })
        default:
            return make('server', 'Something went wrong on the server.', {
                status,
            })
    }
}
