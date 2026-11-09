import { Link } from 'react-router'

type Props = {
    title: string
    linkText: string
    linkTo: string
}

// Phase 1 placeholder; real forms come in Phase 2.
export function AuthPlaceholder({ title, linkText, linkTo }: Props) {
    return (
        <div className="flex min-h-dvh items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-xl border p-6">
                <h1 className="text-xl font-semibold">{title}</h1>
                <p className="text-muted-foreground mt-2 text-sm">
                    Form coming in Phase 2.
                </p>
                <Link
                    to={linkTo}
                    className="mt-4 inline-block text-sm underline"
                >
                    {linkText}
                </Link>
            </div>
        </div>
    )
}
