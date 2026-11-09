import type { ReactNode } from 'react'
import { Link } from 'react-router'

type Props = {
    title: string
    footerText: string
    footerLinkText: string
    footerLinkTo: string
    children: ReactNode
}

export function AuthCard({
    title,
    footerText,
    footerLinkText,
    footerLinkTo,
    children,
}: Props) {
    return (
        <div className="flex min-h-dvh items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-xl border p-6">
                <h1 className="text-xl font-semibold">{title}</h1>
                <div className="mt-6">{children}</div>
                <p className="text-muted-foreground mt-6 text-sm">
                    {footerText}{' '}
                    <Link
                        to={footerLinkTo}
                        className="text-foreground underline"
                    >
                        {footerLinkText}
                    </Link>
                </p>
            </div>
        </div>
    )
}
