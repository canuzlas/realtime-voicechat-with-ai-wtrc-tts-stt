import React, { useState, useEffect, Suspense, lazy } from 'react'
const LoginForm = lazy(() => import('./components/LoginForm'))
const RegisterForm = lazy(() => import('./components/RegisterForm'))
const ChatPage = lazy(() => import('./components/ChatPage'))
const Home = lazy(() => import('./components/Home'))
import { Background, Skeleton } from './react-bits'

export default function App() {
    const [user, setUser] = useState(null)
    const [page, setPage] = useState('home') // home | login | chat | register
    const [pageLoading, setPageLoading] = useState(false)

    function parseToken(token) {
        try {
            const payload = token.split('.')[1]
            const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
            return JSON.parse(decodeURIComponent(escape(decoded)))
        } catch (err) {
            return null
        }
    }

    useEffect(() => {
        const token = localStorage.getItem('auth_token')
        if (token) {
            const payload = parseToken(token)
            if (payload?.email) setUser({ email: payload.email })
        }

        // Hide loading overlay when React mounts
        setTimeout(() => {
            const overlay = document.getElementById('loading-overlay')
            if (overlay) {
                overlay.classList.add('fade-out')
                setTimeout(() => overlay.remove(), 500)
            }
        }, 100)
    }, [])

    // Handle page transitions with loading indicator
    const handlePageChange = (newPage) => {
        setPageLoading(true)
        setTimeout(() => {
            setPage(newPage)
            setPageLoading(false)
        }, 300)
    }

    return (
        <Background variant={user ? 'soft' : 'vivid'}>
            {/* Page transition loading indicator */}
            {pageLoading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-cyber-darker/80 backdrop-blur-sm">
                    <div className="glass-strong rounded-3xl p-8 border-2 border-white/20 neon-glow-blue">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 border-4 border-white/20 border-t-neon-blue rounded-full animate-spin"></div>
                            <div className="text-white font-semibold text-lg">Loading...</div>
                        </div>
                    </div>
                </div>
            )}
            
            <Suspense fallback={<div className="w-full max-w-3xl p-6"><Skeleton className="h-8 mb-4" /><Skeleton className="h-64" /></div>}>
                {page === 'home' && <Home onStart={handlePageChange} user={user} onLogout={() => { localStorage.removeItem('auth_token'); setUser(null); handlePageChange('home') }} />}
                {page === 'login' && !user && (
                    <LoginForm
                        onLogin={(u) => {
                            setUser(u)
                            handlePageChange('chat')
                        }}
                        onBack={() => handlePageChange('home')}
                    />
                )}
                {page === 'register' && !user && (
                    <RegisterForm
                        onRegistered={() => {
                            // after successful registration, go to login page
                            handlePageChange('login')
                        }}
                        onBack={() => handlePageChange('home')}
                    />
                )}
                {page === 'chat' && (
                    user ? (
                        <ChatPage
                            user={user}
                            onLogout={() => {
                                localStorage.removeItem('auth_token')
                                setUser(null)
                                handlePageChange('home')
                            }}
                        />
                    ) : (
                        // If user is not authenticated, redirect to login
                        setPage('login') && null
                    )
                )}
            </Suspense>
        </Background>
    )
}
