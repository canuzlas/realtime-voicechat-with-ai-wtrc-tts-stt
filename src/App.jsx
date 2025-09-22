import React, { useState, useEffect } from 'react'
import LoginForm from './components/LoginForm'
import ChatPage from './components/ChatPage'

export default function App() {
    const [user, setUser] = useState(null)

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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            {!user ? (
                <LoginForm onLogin={(u) => setUser(u)} />
            ) : (
                <ChatPage
                    user={user}
                    onLogout={() => {
                        localStorage.removeItem('auth_token')
                        setUser(null)
                    }}
                />
            )}
        </div>
    )
}
