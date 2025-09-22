import React, { useState } from 'react'

function parseJSONWebToken(token) {
    try {
        const payload = token.split('.')[1]
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
        return JSON.parse(decodeURIComponent(escape(decoded)))
    } catch (err) {
        return null
    }
}

export default function LoginForm({ onLogin }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

    async function handleSubmit(e) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })

            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body.error || 'Login failed')
            }

            const data = await res.json()
            const { token } = data
            if (!token) throw new Error('No token returned')

            localStorage.setItem('auth_token', token)
            const payload = parseJSONWebToken(token)
            onLogin({ email: payload?.email || email })
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="w-96 bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-4">Sign in</h2>

            {error && <div className="text-sm text-red-600 mb-2">{error}</div>}

            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 mb-3 block w-full rounded-md border-gray-200 shadow-sm focus:ring-2 focus:ring-sky-300"
            />

            <label className="block text-sm font-medium text-slate-700">Password</label>
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 mb-4 block w-full rounded-md border-gray-200 shadow-sm focus:ring-2 focus:ring-sky-300"
            />

            <button
                type="submit"
                className="w-full py-2 px-4 bg-sky-600 text-white rounded-md hover:bg-sky-700 disabled:opacity-60"
                disabled={loading}
            >
                {loading ? 'Signing in...' : 'Sign in'}
            </button>
        </form>
    )
}
