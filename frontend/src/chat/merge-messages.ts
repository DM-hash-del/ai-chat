import type { Message } from './types'

// Optimistic messages (shown before the server confirms them) get negative
// ids, so they can never clash with a real id from Laravel.
export const isTempMessage = (message: Message): boolean => message.id < 0

// Merges messages returned by the API into what is on screen.
// - The optimistic message for this send is removed.
// - So is any earlier optimistic message with the same text as the returned
//   user message: that was a failed attempt the backend just reused.
// - Each returned message replaces the one with the same id, or is appended.
export function mergeMessages(
    current: readonly Message[],
    incoming: readonly Message[],
    tempId: number
): Message[] {
    const sentTexts = new Set(
        incoming.filter((m) => m.role === 'user').map((m) => m.content)
    )

    const next = current.filter(
        (m) =>
            m.id !== tempId && !(isTempMessage(m) && sentTexts.has(m.content))
    )

    for (const message of incoming) {
        const index = next.findIndex((m) => m.id === message.id)
        if (index === -1) next.push(message)
        else next[index] = message
    }

    return next
}
