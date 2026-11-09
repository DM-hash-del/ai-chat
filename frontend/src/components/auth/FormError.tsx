import { CircleAlert } from 'lucide-react'

// A form-level error, for problems that don't belong to one field.
export function FormError({ message }: { message: string | null }) {
    if (!message) return null

    return (
        <div
            role="alert"
            className="border-destructive/30 bg-destructive/5 text-destructive flex items-start gap-2 rounded-lg border p-3 text-sm"
        >
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            <span>{message}</span>
        </div>
    )
}
