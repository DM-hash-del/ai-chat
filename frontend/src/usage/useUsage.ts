import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toApiError, type ApiError } from '@/lib/api-errors'
import type { Usage } from './types'
import { getUsage } from './usage-api'

export type UsageStatus = 'loading' | 'ready' | 'error'

export type UsageState = {
    usage: Usage | null
    status: UsageStatus
    error: ApiError | null
    // Sending is refused by the backend: remaining <= 0, or we got a 429.
    outOfCredits: boolean
    // Fetch the numbers again (e.g. after a reply used some credits).
    refresh: () => void
    // A send got "Insufficient credits" (429): block sending and refetch.
    markOutOfCredits: () => void
}

// The account's daily credits. One allowance shared by all conversations.
export function useUsage(): UsageState {
    const [usage, setUsage] = useState<Usage | null>(null)
    const [status, setStatus] = useState<UsageStatus>('loading')
    const [error, setError] = useState<ApiError | null>(null)
    // Set by a 429; cleared once a fetch shows credits left again.
    const [refused, setRefused] = useState(false)

    // Only the answer to the latest request is used.
    const requestId = useRef(0)

    const refresh = useCallback(() => {
        const id = ++requestId.current
        getUsage()
            .then((data) => {
                if (id !== requestId.current) return
                setUsage(data)
                setError(null)
                setStatus('ready')
                if (data.remaining > 0) setRefused(false)
            })
            .catch((err: unknown) => {
                if (id !== requestId.current) return
                setError(toApiError(err))
                setStatus('error')
            })
    }, [])

    useEffect(() => {
        refresh()
        // Back on this tab: the UTC day may have changed since (credits reset).
        const onVisible = () => {
            if (document.visibilityState === 'visible') refresh()
        }
        document.addEventListener('visibilitychange', onVisible)
        return () => document.removeEventListener('visibilitychange', onVisible)
    }, [refresh])

    const markOutOfCredits = useCallback(() => {
        setRefused(true)
        refresh()
    }, [refresh])

    // A failed fetch doesn't block sending: the backend still checks.
    const outOfCredits =
        refused || (status === 'ready' && usage !== null && usage.remaining <= 0)

    // A new object only when something in it changes, so components that
    // read it through context don't re-render for nothing.
    return useMemo(
        () => ({ usage, status, error, outOfCredits, refresh, markOutOfCredits }),
        [usage, status, error, outOfCredits, refresh, markOutOfCredits]
    )
}
