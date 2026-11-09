import type { ComponentProps } from 'react'
import { Input } from '@/components/ui/input'

type Props = Omit<ComponentProps<'input'>, 'id' | 'name'> & {
    name: string
    label: string
    errors?: string[]
}

// A label, an input and the first validation error from Laravel under it.
export function FormField({ name, label, errors, ...inputProps }: Props) {
    const id = `field-${name}`
    const errorId = `${id}-error`
    const error = errors?.[0]

    return (
        <div className="space-y-1.5">
            <label htmlFor={id} className="text-sm font-medium">
                {label}
            </label>
            <Input
                id={id}
                name={name}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                {...inputProps}
            />
            {error && (
                <p id={errorId} className="text-destructive text-sm">
                    {error}
                </p>
            )}
        </div>
    )
}
