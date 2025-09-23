import React, { useState } from 'react'
import { Card, Input, Button, Background, FadeInSection } from '../react-bits'

export default function RegisterForm({ onRegistered, onBack }) {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

    async function handleSubmit(e) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            })

            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body.error || 'Registration failed')
            }

            setSuccess(true)
            // small delay to allow the user to see the message
            setTimeout(() => {
                if (typeof onRegistered === 'function') onRegistered()
                else window.location.href = '/'
            }, 1200)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Background variant="vivid" className="min-h-screen flex items-center justify-center animate-gradient-x">
            <FadeInSection className="w-full max-w-md mx-auto">
                <Card className="p-8 shadow-xl bg-white/90 dark:bg-slate-900/90">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <FadeInSection>
                            <h2 className="text-3xl font-bold mb-2 text-center text-sky-700 dark:text-sky-200">Create account</h2>
                        </FadeInSection>

                        {error && <FadeInSection><div className="text-sm text-red-500 dark:text-red-400 mb-2 text-center">{error}</div></FadeInSection>}
                        {success && <FadeInSection><div className="text-sm text-green-600 dark:text-green-400 mb-2 text-center">Account created. Redirecting...</div></FadeInSection>}

                        <FadeInSection>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Name</label>
                                <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your name" />
                            </div>
                        </FadeInSection>

                        <FadeInSection>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Email</label>
                                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@email.com" />
                            </div>
                        </FadeInSection>

                        <FadeInSection>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Password</label>
                                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
                            </div>
                        </FadeInSection>

                        <FadeInSection>
                            <Button type="submit" className="w-full mt-2" disabled={loading || success}>
                                {loading ? 'Creating...' : 'Create account'}
                            </Button>
                            {onBack && (
                                <Button type="button" variant="ghost" className="w-full mt-2" onClick={onBack}>
                                    Back
                                </Button>
                            )}
                        </FadeInSection>
                    </form>
                </Card>
            </FadeInSection>
        </Background>
    )
}
