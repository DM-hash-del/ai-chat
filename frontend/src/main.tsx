import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { AuthProvider } from '@/auth/AuthProvider'
import { TooltipProvider } from '@/components/ui/tooltip'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <TooltipProvider>
                    <App />
                </TooltipProvider>
            </AuthProvider>
        </BrowserRouter>
    </StrictMode>
)
