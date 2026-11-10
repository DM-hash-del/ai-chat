const oneDecimal = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 })

// Credits as shown to the user: never below 0, at most one decimal place.
export const formatCredits = (credits: number): string =>
    oneDecimal.format(Math.max(0, credits))

// "Today" is the UTC day, so credits reset at the next 00:00 UTC.
// Returned in the user's local time, e.g. "01:00".
export function nextResetLabel(now: Date = new Date()): string {
    const reset = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
    )
    return reset.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
    })
}
