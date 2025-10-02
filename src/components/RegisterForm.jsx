/**
 * RegisterForm Component
 * Futuristic cyber-themed registration interface
 */

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { register } from '../services/authService'

export default function RegisterForm({ onRegistered, onBack }) {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)

    async function handleSubmit(e) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            await register({ name, email, password })
            setSuccess(true)

            // Redirect after success
            setTimeout(() => {
                if (typeof onRegistered === 'function') {
                    onRegistered()
                } else {
                    window.location.href = '/'
                }
            }, 1500)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-cyber-darker flex items-center justify-center">
            {/* Animated background */}
            <div className="fixed inset-0 mesh-gradient-bg opacity-40" />
            <div className="fixed inset-0 cyber-grid opacity-20" />

            {/* Particles */}
            <div className="particles fixed inset-0 pointer-events-none">
                {[...Array(30)].map((_, i) => (
                    <div
                        key={i}
                        className="particle"
                        style={{
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 20}s`,
                            animationDuration: `${15 + Math.random() * 10}s`
                        }}
                    />
                ))}
            </div>

            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-md mx-auto px-4"
            >
                <div className="glass-strong rounded-3xl p-8 border border-white/20 neon-glow-purple">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                            className="inline-block mb-4"
                        >
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-purple via-neon-pink to-neon-blue animate-gradient-xy flex items-center justify-center text-4xl shadow-2xl neon-glow-purple">
                                ✨
                            </div>
                        </motion.div>
                        <h2 className="text-4xl font-bold text-gradient mb-2">
                            Create Account
                        </h2>
                        <p className="text-white/60">
                            Join the future of AI conversations
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="mb-6 p-4 glass rounded-xl border border-red-500/50 neon-glow-pink"
                        >
                            <div className="flex items-center gap-3 text-red-300">
                                <span className="text-2xl">⚠️</span>
                                <span className="text-sm">{error}</span>
                            </div>
                        </motion.div>
                    )}

                    {/* Success Message */}
                    {success && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mb-6 p-4 glass rounded-xl border border-green-500/50 neon-glow-green"
                        >
                            <div className="flex items-center gap-3 text-green-300">
                                <span className="text-2xl">✅</span>
                                <span className="text-sm">Account created! Redirecting...</span>
                            </div>
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name Input */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-white/80 uppercase tracking-wider">
                                Full Name
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    placeholder="John Doe"
                                    disabled={loading || success}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-neon-purple focus:ring-2 focus:ring-neon-purple/50 transition-all input-glow disabled:opacity-50"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neon-purple">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Email Input */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-white/80 uppercase tracking-wider">
                                Email Address
                            </label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="your@email.com"
                                    disabled={loading || success}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/50 transition-all input-glow disabled:opacity-50"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neon-blue">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-white/80 uppercase tracking-wider">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    disabled={loading || success}
                                    minLength={6}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-neon-pink focus:ring-2 focus:ring-neon-pink/50 transition-all input-glow disabled:opacity-50"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neon-pink">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-xs text-white/40 mt-1">
                                Minimum 6 characters required
                            </p>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || success}
                            className="w-full h-14 rounded-xl bg-gradient-to-r from-neon-purple via-neon-pink to-neon-blue text-white font-bold text-lg btn-cyber neon-glow-purple hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-3">
                                    <span className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    Creating Account...
                                </span>
                            ) : success ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span>✓</span>
                                    <span>Success!</span>
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <span>Create Account</span>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </span>
                            )}
                        </button>

                        {/* Back Button */}
                        {onBack && (
                            <button
                                type="button"
                                onClick={onBack}
                                disabled={loading || success}
                                className="w-full h-12 rounded-xl glass border border-white/30 text-white/80 hover:text-white hover:border-neon-purple font-semibold btn-cyber transition-all disabled:opacity-50"
                            >
                                ← Back to Home
                            </button>
                        )}
                    </form>

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t border-white/10 text-center">
                        <p className="text-xs text-white/40">
                            By creating an account, you agree to our Terms
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
