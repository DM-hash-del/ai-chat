import { Route, Routes } from 'react-router'
import { RequireAuth } from '@/auth/RequireAuth'
import { RequireGuest } from '@/auth/RequireGuest'
import { ChatPage } from '@/pages/ChatPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'

function App() {
    return (
        <Routes>
            <Route element={<RequireGuest />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
            </Route>
            <Route element={<RequireAuth />}>
                <Route path="/" element={<ChatPage />} />
                <Route path="/c/:id" element={<ChatPage />} />
            </Route>
        </Routes>
    )
}

export default App
