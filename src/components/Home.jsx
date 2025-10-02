import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Card, Button } from '../react-bits'

// Animated particles component
const Particles = () => {
    const particlesRef = useRef(null)

    useEffect(() => {
        const container = particlesRef.current
        if (!container) return

        const particleCount = 50
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div')
            particle.className = 'particle'
            particle.style.left = `${Math.random() * 100}%`
            particle.style.animationDelay = `${Math.random() * 20}s`
            particle.style.animationDuration = `${15 + Math.random() * 10}s`
            container.appendChild(particle)
        }

        return () => {
            if (container) {
                container.innerHTML = ''
            }
        }
    }, [])

    return <div ref={particlesRef} className="particles" />
}

export default function Home({ onStart, user, onLogout }) {
    return (
        <div className="relative min-h-screen overflow-hidden bg-cyber-darker">
            {/* Animated mesh gradient background */}
            <div className="fixed inset-0 mesh-gradient-bg opacity-25" />

            {/* Cyber grid overlay */}
            <div className="fixed inset-0 cyber-grid opacity-10" />

            {/* Floating particles */}
            <Particles />

            {/* Navbar */}
            <motion.nav
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="relative z-20 glass-strong border-b border-white/10"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        {/* Logo */}
                        <motion.div
                            className="flex items-center space-x-3"
                            whileHover={{ scale: 1.05 }}
                        >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-blue via-neon-purple to-neon-pink animate-gradient-xy flex items-center justify-center neon-glow-blue">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            </div>
                            <span className="text-2xl font-bold text-gradient">VoiceAI</span>
                        </motion.div>

                        {/* Auth buttons */}
                        <div className="flex items-center space-x-4">
                            {user ? (
                                <>
                                    <div className="hidden sm:flex items-center space-x-3 glass px-4 py-2 rounded-xl">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-white font-semibold">
                                            {user.username?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                        <span className="text-white/90">{user.username}</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        onClick={onLogout}
                                        className="btn-cyber px-6 py-2 text-black/80 hover:text-neon-pink font-medium border border-white/30 hover:border-neon-pink transition-all duration-300 rounded-xl"
                                    >
                                        Logout
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        variant="ghost"
                                        onClick={() => onStart('login')}
                                        className="btn-cyber px-6 py-2.5 text-white font-semibold bg-white/10 hover:bg-white/20 border-2 border-white/40 hover:border-white/60 transition-all duration-300 rounded-xl backdrop-blur-sm"
                                    >
                                        Login
                                    </Button>
                                    <Button
                                        onClick={() => onStart('register')}
                                        className="btn-cyber px-6 py-2.5 text-white font-semibold bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink hover:shadow-lg hover:shadow-neon-blue/30 border-0 rounded-xl"
                                    >
                                        Register
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </motion.nav>

            {/* Hero Section */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
                <div className="text-center space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight">
                            <span className="text-gradient">Practice English</span>
                            <br />
                            <span className="text-white">with AI Voice</span>
                        </h1>
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-xl text-white/70 leading-relaxed max-w-2xl mx-auto"
                    >
                        Experience the future of language learning. Chat by typing or speaking with our advanced AI assistant. Get instant feedback with text-to-speech responses.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="flex flex-wrap justify-center gap-4"
                    >
                        <Button
                            onClick={() => onStart(user ? 'chat' : 'login')}
                            className="btn-cyber px-8 py-4 text-lg font-semibold bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink hover:shadow-2xl hover:shadow-neon-purple/50 border-0 animate-pulse-glow"
                        >
                            <svg className="w-6 h-6 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            Start Chatting
                        </Button>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                        className="grid grid-cols-3 gap-6 pt-8 max-w-2xl mx-auto"
                    >
                        <div className="text-center">
                            <div className="text-3xl font-bold text-gradient">24/7</div>
                            <div className="text-sm text-white/60 mt-1">Available</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-gradient">Real-time</div>
                            <div className="text-sm text-white/60 mt-1">Voice Chat</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-gradient">AI</div>
                            <div className="text-sm text-white/60 mt-1">Powered</div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Features Section */}
            <div id="features" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl sm:text-5xl font-bold text-gradient mb-4">
                        Powerful Features
                    </h2>
                    <p className="text-xl text-white/70">
                        Everything you need to practice English effectively
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        {
                            icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
                            title: "Text Chat",
                            description: "Type messages and receive instant AI responses. Perfect for written practice and vocabulary building.",
                            delay: 0
                        },
                        {
                            icon: "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z",
                            title: "Real-time Voice",
                            description: "Speak naturally and get instant transcription and audio responses. Practice pronunciation in real-time.",
                            delay: 0.2
                        },
                        {
                            icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
                            title: "Privacy First",
                            description: "Your conversations are private. Authentication tokens stay in your browser, server only processes audio.",
                            delay: 0.4
                        }
                    ].map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: feature.delay }}
                            viewport={{ once: true }}
                        >
                            <Card className="glass-strong p-8 rounded-3xl border border-white/20 hover:border-neon-blue transition-all duration-300 card-hover h-full">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-blue to-neon-pink flex items-center justify-center mb-6 neon-glow-blue">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                                <p className="text-white/70 leading-relaxed">{feature.description}</p>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* CTA Section */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    className="glass-strong rounded-3xl p-12 text-center border border-white/20 neon-glow-blue"
                >
                    <h2 className="text-4xl sm:text-5xl font-bold text-gradient mb-6">
                        Ready to Start Learning?
                    </h2>
                    <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
                        Join thousands of learners improving their English with AI-powered conversations
                    </p>
                    <Button
                        onClick={() => onStart(user ? 'chat' : 'register')}
                        className="btn-cyber px-12 py-5 text-xl font-semibold bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink hover:shadow-2xl hover:shadow-neon-purple/50 border-0 animate-pulse-glow"
                    >
                        {user ? 'Open Chat' : 'Get Started Free'}
                    </Button>
                </motion.div>
            </div>

            {/* Footer */}
            <div className="relative z-10 glass-strong border-t border-white/10 py-8 mt-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white/60">
                    <p>© 2025 VoiceAI. Powered by OpenAI & Google Cloud.</p>
                </div>
            </div>
        </div>
    )
}
