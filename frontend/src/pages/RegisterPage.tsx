import { AuthPlaceholder } from './AuthPlaceholder'

export function RegisterPage() {
    return (
        <AuthPlaceholder
            title="Create an account"
            linkText="Already registered? Log in"
            linkTo="/login"
        />
    )
}
