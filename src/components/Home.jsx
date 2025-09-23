import React from 'react'
import { Card, Button, Avatar, Navbar, Hero, FadeInSection } from '../react-bits'
import { FloatingButton } from '../react-bits'

import { Background } from '../react-bits'

export default function Home({ onStart, user, onLogout }) {
    return (
        <Background variant="vivid" className="w-full min-h-screen animate-gradient-x">
            <div className="w-full">
                <Navbar >
                    {user ? (
                        <Button variant="ghost" onClick={onLogout}>Logout</Button>
                    ) : (
                        <Button variant="ghost" onClick={() => onStart('login')}>Login</Button>
                    )}
                </Navbar>

                <FadeInSection>
                    <Hero
                        title={<span className="text-slate-900 dark:text-slate-100">Practice English with an AI — text or realtime voice</span>}
                        subtitle={<span className="text-slate-700 dark:text-slate-200">A small demo that lets you chat by typing or speaking. The server supports TTS and realtime streaming for live conversations.</span>}
                        ctaLabel="Try the chat"
                        onCta={() => onStart(user ? 'chat' : 'login')}
                    >
                        <Card className="p-8 w-full max-w-md shadow-xl border border-sky-100 bg-white/90 dark:bg-slate-900/90">
                            <div className="flex flex-col gap-4">
                                <div className="text-sm text-slate-600 dark:text-slate-300">Quick start</div>
                                <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">Open the chat and say hello.</div>
                                <div className="flex gap-3">
                                    <Button onClick={() => onStart(user ? 'chat' : 'login')}>Open Chat</Button>
                                    {user ? (
                                        <Button variant="ghost" onClick={onLogout}>Logout</Button>
                                    ) : (
                                        <Button variant="ghost" onClick={() => onStart('login')}>Login</Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </Hero>
                </FadeInSection>

                <div id="features" className="max-w-6xl mx-auto px-4 md:px-8 py-16">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <Card className="p-6 bg-white/90 dark:bg-slate-900/90">
                            <h3 className="font-semibold mb-2 text-sky-700 dark:text-sky-300">Text Chat</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300">Type messages and receive replies. TTS will play the AI response.</p>
                        </Card>
                        <Card className="p-6 bg-white/90 dark:bg-slate-900/90">
                            <h3 className="font-semibold mb-2 text-sky-700 dark:text-sky-300">Realtime Voice</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300">Record your voice and stream to the server for real-time transcription and TTS responses.</p>
                        </Card>
                        <Card className="p-6 bg-white/90 dark:bg-slate-900/90">
                            <h3 className="font-semibold mb-2 text-sky-700 dark:text-sky-300">Privacy</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300">Local-first UI, tokens stay in your browser. Server handles audio processing.</p>
                        </Card>
                    </div>
                </div>

                <div id="about" className="max-w-4xl mx-auto px-4 md:px-8 py-10 text-base text-slate-700 dark:text-slate-200 bg-white/80 dark:bg-slate-900/80 rounded-xl shadow border border-sky-100">
                    <p>This is a demo project for practicing English with an AI. It includes both text and realtime voice paths.</p>
                </div>
                <HomeFloatingCTA />
            </div>
        </Background>
    )
}

// Floating CTA for mobile
export function HomeFloatingCTA() {
    return <FloatingButton href="/signup">Sign up — join for free</FloatingButton>
}
