import { AuthPlaceholder } from './AuthPlaceholder'

export function LoginPage() {
    return (
        <AuthPlaceholder
            title="Log in"
            linkText="No account? Register"
            linkTo="/register"
        />
    )
}
