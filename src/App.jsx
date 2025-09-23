import React, { useState, useEffect, Suspense, lazy } from 'react'
const LoginForm = lazy(() => import('./components/LoginForm'))
const RegisterForm = lazy(() => import('./components/RegisterForm'))
const ChatPage = lazy(() => import('./components/ChatPage'))
const Home = lazy(() => import('./components/Home'))
import { Background, Skeleton } from './react-bits'

export default function App() {
    const [user, setUser] = useState(null)
    const [page, setPage] = useState('home') // home | login | chat | register

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
    }, [])

    return (
        <Background variant={user ? 'soft' : 'vivid'}>
            <Suspense fallback={<div className="w-full max-w-3xl p-6"><Skeleton className="h-8 mb-4" /><Skeleton className="h-64" /></div>}>
                {page === 'home' && <Home onStart={(p) => setPage(p)} user={user} onLogout={() => { localStorage.removeItem('auth_token'); setUser(null); setPage('home') }} />}
                {page === 'login' && !user && (
                    <LoginForm
                        onLogin={(u) => {
                            setUser(u)
                            setPage('chat')
                        }}
                        onBack={() => setPage('home')}
                    />
                )}
                {page === 'register' && !user && (
                    <RegisterForm
                        onRegistered={() => {
                            // after successful registration, go to login page
                            setPage('login')
                        }}
                        onBack={() => setPage('home')}
                    />
                )}
                {page === 'chat' && (
                    user ? (
                        <ChatPage
                            user={user}
                            onLogout={() => {
                                localStorage.removeItem('auth_token')
                                setUser(null)
                                setPage('home')
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
