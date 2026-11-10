import axios from 'axios'

// The one shared HTTP client. Relative URLs go through the Vite proxy in dev.
// Cookies are sent (Sanctum SPA auth) and Axios copies the XSRF-TOKEN cookie
// into the X-XSRF-TOKEN header on every POST, PATCH and DELETE.
const api = axios.create({
    baseURL: '/',
    // The backend gives the AI up to 30 s, so leave room above that.
    timeout: 45000,
    withCredentials: true,
    withXSRFToken: true,
    xsrfHeaderName: 'X-XSRF-TOKEN',
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
})

// Must be called before login and register (and again after logout).
export async function fetchCsrfCookie(): Promise<void> {
    await api.get('/sanctum/csrf-cookie')
}

// The auth provider registers a callback here so that a 401 from any request
// logs the user out of the UI.
let onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(handler: (() => void) | null): void {
    onUnauthorized = handler
}

// An interceptor runs on every response before the calling code sees it.
api.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            onUnauthorized?.()
        }
        return Promise.reject(error)
    }
)

export default api
