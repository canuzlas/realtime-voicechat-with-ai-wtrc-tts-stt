import React, { useState, useRef, useEffect } from 'react'
import createSignaler from '../webrtc/signalingClient'
import { Card, Textarea, Button, Avatar, IconButton } from '../react-bits'

export default function ChatPage({ user, onLogout }) {
    const [messages, setMessages] = useState([
        { id: 1, from: 'bot', text: 'Hello! This is a demo chat.' },
    ])
    const [input, setInput] = useState('')
    const [sending, setSending] = useState(false)
    const listRef = useRef(null)
    const audioRef = useRef(null)
    const audioUrlRef = useRef(null)
    const typingTimersRef = useRef({})
    const [recording, setRecording] = useState(false)
    const [webrtcActive, setWebrtcActive] = useState(false)
    const mediaRecorderRef = useRef(null)
    const recordedChunksRef = useRef([])
    const pcRef = useRef(null)
    const remoteAudioQueueRef = useRef([])
    const audioCtxRef = useRef(null)
    const ttsBufferRef = useRef([])
    const audioPlayingRef = useRef(false)
    const signalerRef = useRef(null)
    const sioSocketRef = useRef(null)

    useEffect(() => {
        // smooth scroll to bottom when messages change
        if (listRef.current) {
            // wait for DOM update/layout
            requestAnimationFrame(() => {
                try {
                    listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
                } catch (e) {
                    listRef.current.scrollTop = listRef.current.scrollHeight
                }
            })
        }
    }, [messages])

    useEffect(() => {
        return () => {
            // cleanup any typing timers on unmount
            try {
                Object.values(typingTimersRef.current || {}).forEach((t) => clearInterval(t))
                typingTimersRef.current = {}
            } catch (e) { }
        }
    }, [])

    async function sendMessage() {
        if (!input.trim()) return
        const text = input.trim()
        setInput('')
        await processUserText(text)
    }

    // Helper: send user text to /chat/message, append messages and play TTS
    async function processUserText(text, opts = {}) {
        if (!text) return
        const userMsg = { id: Date.now(), from: 'user', text }
        setMessages((m) => [...m, userMsg])
        setSending(true)
        const token = localStorage.getItem('auth_token')
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
            const res = await fetch(`${API_URL}/chat/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ message: text }),
            })

            if (!res.ok) throw new Error('server error')
            const data = await res.json()
            const full = data.reply || '(no reply)'
            const botId = Date.now() + 1
            const botMsg = { id: botId, from: 'bot', text: full, fullText: full, typedText: '', typing: true }
            setMessages((m) => [...m, botMsg])
            // start typing animation
            startTypingAnimation(botId, full)
            // After receiving bot reply, request TTS and play audio (best-effort)
            // If opts.skipTts is true we assume the realtime path will stream TTS back
            // via socket/datachannel and we should not fetch and play HTTP TTS to avoid duplicates.
            if (!opts.skipTts) {
                try {
                    const ttsRes = await fetch(`${API_URL}/chat/tts`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        },
                        body: JSON.stringify({ text: data.reply || '' }),
                    })

                    if (ttsRes.ok) {
                        const blob = await ttsRes.blob()
                        if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current)
                        audioUrlRef.current = URL.createObjectURL(blob)
                        if (!audioRef.current) {
                            audioRef.current = document.createElement('audio')
                            audioRef.current.style.display = 'none'
                            audioRef.current.autoplay = true
                            document.body.appendChild(audioRef.current)
                        }
                        audioRef.current.src = audioUrlRef.current
                        audioRef.current.play().catch(() => { })
                    }
                } catch (err) {
                    console.warn('TTS play failed', err)
                }
            }
        } catch (err) {
            const full = `Error: ${err.message}. (local fallback)`
            const botId = Date.now() + 1
            const botMsg = { id: botId, from: 'bot', text: full, fullText: full, typedText: '', typing: true }
            setMessages((m) => [...m, botMsg])
            startTypingAnimation(botId, full)
        } finally {
            setSending(false)
        }
    }

    async function startRecording() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert('Microphone not supported in this browser')
            return
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            // ensure webrtc connection is active and send mic track
            if (!webrtcActive) await startWebrtc(stream)
            else {
                // if pc exists, replace tracks
                const pc = pcRef.current
                if (pc) {
                    const senders = pc.getSenders().filter(s => s.track && s.track.kind === 'audio')
                    if (senders.length) senders.forEach(s => s.replaceTrack(stream.getAudioTracks()[0]))
                    else pc.addTrack(stream.getAudioTracks()[0], stream)
                }
            }
            recordedChunksRef.current = []
            const mr = new MediaRecorder(stream)
            mediaRecorderRef.current = mr
            // send chunks immediately as they become available so server can transcribe while speaking
            mr.ondataavailable = async (e) => {
                try {
                    if (e.data && e.data.size > 0) {
                        recordedChunksRef.current.push(e.data)
                        // ensure socket exists
                        if (!sioSocketRef.current) {
                            const sig = createSignaler({ url: API_URL, room: null })
                            await sig.connect()
                            sioSocketRef.current = sig
                            setupSocketHandlers(sig)
                        }
                        const sig = sioSocketRef.current
                        const raw = sig && sig.getSocket && sig.getSocket()
                        const ab = await e.data.arrayBuffer()
                        if (raw && raw.emit) raw.emit('stream-audio', ab)
                    }
                } catch (err) { console.warn('live chunk send failed', err) }
            }

            // stop handler: finalize audio stream and wait for transcript
            mr.onstop = async () => {
                const token = localStorage.getItem('auth_token')
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
                // If socket.io not connected, it should already be created by ondataavailable, but ensure handlers exist
                if (!sioSocketRef.current) {
                    const sig = createSignaler({ url: API_URL, room: null })
                    await sig.connect()
                    sioSocketRef.current = sig
                    setupSocketHandlers(sig)
                }

                // stream recorded chunks to server via socket.io
                try {
                    for (const blobPart of recordedChunksRef.current) {
                        // read as arrayBuffer
                        const ab = await blobPart.arrayBuffer()
                        sioSocketRef.current.sendIce // noop to ensure object exists
                        // socket.io client wrapper expects to use .emit but our signaling helper uses socket.emit under the hood
                        // send binary chunk
                        // use the helper's internal socket by calling its sendOffer/sendIce methods isn't applicable; instead we attach a raw socket
                        // The signalingClient returns an object that wraps socket.io; we can reach the underlying io by accessing sig.socket
                        // but to keep abstraction, the signaling helper exposes emit via connect returning socket under the hood; use a low-level approach:
                        // directly emit using the signaler internal socket if present
                        const sig = sioSocketRef.current
                        const raw = sig && sig.getSocket && sig.getSocket()
                        if (raw && raw.emit) raw.emit('stream-audio', ab)
                        else if (sig && sig.send) sig.send(ab)
                    }
                    // finalize and ask for STT
                    const sig = sioSocketRef.current
                    const raw = sig && sig.getSocket && sig.getSocket()
                    if (raw && raw.emit) raw.emit('finalize-audio')
                    else if (sig && sig.finalizeAudio) sig.finalizeAudio()
                    // listen for transcript
                    // transcript will be delivered via 'stream-audio-final' handler set in setupSocketHandlers
                    // we just wait a short moment for server to respond; the handler will call processUserText
                    await new Promise((r) => setTimeout(r, 200))
                } catch (err) {
                    console.warn('streaming failed, falling back', err)
                    // fallback to previous flow: upload to /chat/voice
                    const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' })
                    const form = new FormData()
                    form.append('audio', blob, 'recording.webm')
                    try {
                        const res = await fetch(`${API_URL}/chat/voice`, {
                            method: 'POST',
                            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                            body: form,
                        })
                        if (!res.ok) throw new Error('server error')
                        const data = await res.json()
                        const botMsg = { id: Date.now() + 1, from: 'bot', text: data.reply || '(no reply)' }
                        setMessages((m) => [...m, botMsg])
                    } catch (err2) {
                        const botMsg = { id: Date.now() + 1, from: 'bot', text: `Error: ${err2.message}. (local fallback)` }
                        setMessages((m) => [...m, botMsg])
                    }
                }
            }
            mr.start()
            setRecording(true)
            // setup simple silence detection to auto-finalize while speaking
            startSilenceDetector(stream)
        } catch (err) {
            alert('Could not start recording: ' + err.message)
        }
    }

    async function startRecording() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert('Microphone not supported in this browser')
            return
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            // ensure webrtc connection is active and send mic track
            if (!webrtcActive) await startWebrtc(stream)
            else {
                // if pc exists, replace tracks
                const pc = pcRef.current
                if (pc) {
                    const senders = pc.getSenders().filter(s => s.track && s.track.kind === 'audio')
                    if (senders.length) senders.forEach(s => s.replaceTrack(stream.getAudioTracks()[0]))
                    else pc.addTrack(stream.getAudioTracks()[0], stream)
                }
            }
            recordedChunksRef.current = []
            const mr = new MediaRecorder(stream)
            mediaRecorderRef.current = mr
            // send chunks immediately as they become available so server can transcribe while speaking
            mr.ondataavailable = async (e) => {
                try {
                    if (e.data && e.data.size > 0) {
                        recordedChunksRef.current.push(e.data)
                        // ensure socket exists
                        if (!sioSocketRef.current) {
                            const sig = createSignaler({ url: API_URL, room: null })
                            await sig.connect()
                            sioSocketRef.current = sig
                            setupSocketHandlers(sig)
                        }
                        const sig = sioSocketRef.current
                        const raw = sig && sig.getSocket && sig.getSocket()
                        const ab = await e.data.arrayBuffer()
                        if (raw && raw.emit) raw.emit('stream-audio', ab)
                    }
                } catch (err) { console.warn('live chunk send failed', err) }
            }

            // stop handler: finalize audio stream and wait for transcript
            mr.onstop = async () => {
                const token = localStorage.getItem('auth_token')
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
                // If socket.io not connected, it should already be created by ondataavailable, but ensure handlers exist
                if (!sioSocketRef.current) {
                    const sig = createSignaler({ url: API_URL, room: null })
                    await sig.connect()
                    sioSocketRef.current = sig
                    setupSocketHandlers(sig)
                }

                // stream recorded chunks to server via socket.io
                try {
                    for (const blobPart of recordedChunksRef.current) {
                        // read as arrayBuffer
                        const ab = await blobPart.arrayBuffer()
                        sioSocketRef.current.sendIce // noop to ensure object exists
                        // socket.io client wrapper expects to use .emit but our signaling helper uses socket.emit under the hood
                        // send binary chunk
                        // use the helper's internal socket by calling its sendOffer/sendIce methods isn't applicable; instead we attach a raw socket
                        // The signalingClient returns an object that wraps socket.io; we can reach the underlying io by accessing sig.socket
                        // but to keep abstraction, the signaling helper exposes emit via connect returning socket under the hood; use a low-level approach:
                        // directly emit using the signaler internal socket if present
                        const sig = sioSocketRef.current
                        const raw = sig && sig.getSocket && sig.getSocket()
                        if (raw && raw.emit) raw.emit('stream-audio', ab)
                        else if (sig && sig.send) sig.send(ab)
                    }
                    // finalize and ask for STT
                    const sig = sioSocketRef.current
                    const raw = sig && sig.getSocket && sig.getSocket()
                    if (raw && raw.emit) raw.emit('finalize-audio')
                    else if (sig && sig.finalizeAudio) sig.finalizeAudio()
                    // listen for transcript
                    // transcript will be delivered via 'stream-audio-final' handler set in setupSocketHandlers
                    // we just wait a short moment for server to respond; the handler will call processUserText
                    await new Promise((r) => setTimeout(r, 200))
                } catch (err) {
                    console.warn('streaming failed, falling back', err)
                    // fallback to previous flow: upload to /chat/voice
                    const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' })
                    const form = new FormData()
                    form.append('audio', blob, 'recording.webm')
                    try {
                        const res = await fetch(`${API_URL}/chat/voice`, {
                            method: 'POST',
                            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                            body: form,
                        })
                        if (!res.ok) throw new Error('server error')
                        const data = await res.json()
                        const botMsg = { id: Date.now() + 1, from: 'bot', text: data.reply || '(no reply)' }
                        setMessages((m) => [...m, botMsg])
                    } catch (err2) {
                        const botMsg = { id: Date.now() + 1, from: 'bot', text: `Error: ${err2.message}. (local fallback)` }
                        setMessages((m) => [...m, botMsg])
                    }
                }
            }
            mr.start()
            setRecording(true)
            // setup simple silence detection to auto-finalize while speaking
            startSilenceDetector(stream)
        } catch (err) {
            alert('Could not start recording: ' + err.message)
        }
    }

    function stopRecording() {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop()
            mediaRecorderRef.current.stream?.getTracks().forEach((t) => t.stop())
        }
        setRecording(false)
        stopSilenceDetector()
    }

    // Typing animation helper: progressively reveals bot's text
    function startTypingAnimation(id, fullText) {
        try {
            const speed = Math.max(12, Math.min(36, Math.floor(600 / Math.max(1, fullText.length))))
            let i = 0
            if (typingTimersRef.current[id]) clearInterval(typingTimersRef.current[id])
            const timer = setInterval(() => {
                i++
                setMessages((prev) => prev.map((msg) => {
                    if (msg.id !== id) return msg
                    const nextText = fullText.slice(0, i)
                    const done = i >= fullText.length
                    return { ...msg, typedText: nextText, typing: !done, text: done ? fullText : msg.text }
                }))
                if (i >= fullText.length) {
                    clearInterval(timer)
                    delete typingTimersRef.current[id]
                }
            }, speed)
            typingTimersRef.current[id] = timer
        } catch (e) { console.warn('typing anim err', e) }
    }

    // Minimal markdown renderer (safe-ish): supports code blocks and links
    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
    }

    function renderMarkdown(raw) {
        if (!raw) return ''
        // Escape first
        let s = escapeHtml(raw)
        // Code blocks ```lang\n...```
        s = s.replace(/```(\w+)?\n([\s\S]*?)```/g, (m, lang, code) => {
            const langClass = lang ? `language-${lang}` : ''
            return `<pre class="bg-gray-100 dark:bg-slate-800 p-3 rounded text-sm overflow-auto"><code class="${langClass}">${code.replace(/</g, '&lt;')}</code></pre>`
        })
        // Inline code `code`
        s = s.replace(/`([^`]+)`/g, (m, c) => `<code class="bg-slate-100 dark:bg-slate-700 px-1 rounded text-sm">${c}</code>`)
        // Links
        s = s.replace(/(https?:\/\/[\w\-./?=&%#]+)/g, '<a class="text-sky-600 dark:text-sky-400 underline" href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
        // Preserve line breaks
        s = s.replace(/\n/g, '<br/>')
        return s
    }

    // --- Socket handlers and silence detection helpers ---
    function setupSocketHandlers(sig) {
        // unify how we receive raw socket
        const raw = sig && sig.getSocket && sig.getSocket()
        if (!raw) return
        // Avoid attaching handlers multiple times
        if (raw.__ttsHandlersAttached) return
        raw.__ttsHandlersAttached = true

        // If WebRTC peer is active we prefer the datachannel path for TTS playback.
        // Ignore socket-based tts playback when webrtcActive is true to prevent duplicate audio.
        raw.on('tts-chunk', async (chunk) => {
            try {
                if (webrtcActive) return
                if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
                ttsBufferRef.current.push(new Uint8Array(chunk))
            } catch (e) { console.warn('tts chunk play err', e) }
        })
        raw.on('tts-chunk-end', async () => {
            try {
                if (webrtcActive) return
                const mp3 = concatBuffers(ttsBufferRef.current)
                ttsBufferRef.current.length = 0
                await playMp3ArrayBuffer(mp3)
            } catch (e) { console.warn('playback err', e) }
        })

        raw.on('stream-audio-final', async (data) => {
            try {
                const transcript = data && data.transcript
                if (!transcript) {
                    const botMsg = { id: Date.now() + 1, from: 'bot', text: '(no speech detected)' }
                    setMessages((m) => [...m, botMsg])
                } else {
                    // When the realtime streaming path is used, the server will stream TTS
                    // back over socket/datachannel; skip the HTTP TTS fetch to avoid duplicate playback.
                    await processUserText(transcript, { skipTts: true })
                }
            } catch (e) { console.warn('handle transcript err', e) }
        })

        raw.on('stream-audio-error', (err) => console.warn('stream-audio-error', err))
    }

    // Silence detection: create analyser and watch RMS; on silence for duration, auto-stop
    let _silenceInterval = null
    function startSilenceDetector(stream) {
        try {
            const ac = new (window.AudioContext || window.webkitAudioContext)()
            audioCtxRef.current = ac
            const src = ac.createMediaStreamSource(stream)
            const analyser = ac.createAnalyser()
            analyser.fftSize = 2048
            src.connect(analyser)
            const data = new Float32Array(analyser.fftSize)
            let silenceStart = null
            _silenceInterval = setInterval(() => {
                analyser.getFloatTimeDomainData(data)
                let rms = 0
                for (let i = 0; i < data.length; i++) rms += data[i] * data[i]
                rms = Math.sqrt(rms / data.length)
                const THRESH = 0.01 // adjust sensitivity
                if (rms < THRESH) {
                    if (!silenceStart) silenceStart = Date.now()
                    else if (Date.now() - silenceStart > 800) {
                        // long silence -> finalize
                        try { const raw = sioSocketRef.current && sioSocketRef.current.getSocket && sioSocketRef.current.getSocket(); raw && raw.emit && raw.emit('finalize-audio') } catch (e) { }
                        stopRecording()
                    }
                } else {
                    silenceStart = null
                }
            }, 200)
        } catch (e) { console.warn('silence detector failed', e) }
    }
    function stopSilenceDetector() {
        try { if (_silenceInterval) clearInterval(_silenceInterval); _silenceInterval = null } catch (e) { }
    }

    // WebRTC client setup: create RTCPeerConnection, send mic track, handle incoming tts datachannel
    async function startWebrtc(stream) {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
        const signaler = createSignaler({ url: API_URL, room: null })
        signalerRef.current = signaler
        await signaler.connect()

        const pc = new RTCPeerConnection()
        pcRef.current = pc

        // create a client commands channel
        const cmdChan = pc.createDataChannel('client-commands')
        cmdChan.onopen = () => console.log('cmd channel open')

        // handle incoming tts channel set by server
        pc.ondatachannel = (ev) => {
            const ch = ev.channel
            if (ch.label === 'tts') {
                ch.binaryType = 'arraybuffer'
                const chunks = []
                ch.onmessage = async (m) => {
                    try {
                        if (typeof m.data === 'string') {
                            const obj = JSON.parse(m.data)
                            if (obj && obj.__end) {
                                // decode whole MP3 buffer and play
                                const mp3 = concatBuffers(chunks)
                                await playMp3ArrayBuffer(mp3)
                                chunks.length = 0
                            }
                            return
                        }
                        // binary chunk
                        chunks.push(new Uint8Array(m.data))
                    } catch (e) { console.warn('tts chunk err', e) }
                }
            }
        }

        // add mic track
        for (const t of stream.getTracks()) pc.addTrack(t, stream)

        // gather local ICE and send to server
        pc.onicecandidate = (e) => {
            if (e.candidate) signaler.sendIce(e.candidate, { to: 'server' })
        }

        // create offer and send to server (target server)
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        // send offer via signaling with to: 'server'
        await signaler.sendOffer(pc.localDescription, { to: 'server' })

        // handle server answer event
        signaler.on('answer', async ({ from, answer }) => {
            if (from !== 'server') return
            try {
                await pc.setRemoteDescription(answer)
                setWebrtcActive(true)
            } catch (e) { console.error('setRemoteDesc err', e) }
        })

        // handle ICE candidates from server
        signaler.on('ice-candidate', async ({ from, candidate }) => {
            if (from === 'server') {
                try { await pc.addIceCandidate(candidate) } catch (e) { }
            }
        })

        setWebrtcActive(true)
    }

    function concatBuffers(chunks) {
        let total = 0
        for (const c of chunks) total += c.length
        const out = new Uint8Array(total)
        let offset = 0
        for (const c of chunks) { out.set(c, offset); offset += c.length }
        return out.buffer
    }

    async function playMp3ArrayBuffer(buffer) {
        try {
            if (audioPlayingRef.current) {
                // already playing; skip overlapping playback
                return
            }
            audioPlayingRef.current = true
            if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
            const ac = audioCtxRef.current
            const audioBuffer = await ac.decodeAudioData(buffer.slice(0))
            const src = ac.createBufferSource()
            src.buffer = audioBuffer
            src.connect(ac.destination)
            src.onended = () => { audioPlayingRef.current = false }
            src.start()
        } catch (e) {
            console.warn('play mp3 failed', e)
        }
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    // cleanup audio URL and element on unmount
    useEffect(() => {
        return () => {
            try {
                if (audioUrlRef.current) {
                    URL.revokeObjectURL(audioUrlRef.current)
                    audioUrlRef.current = null
                }
                if (audioRef.current) {
                    audioRef.current.pause()
                    audioRef.current.src = ''
                    audioRef.current.remove()
                    audioRef.current = null
                }
            } catch (e) {
                // ignore
            }
        }
    }, [])

    return (
        <div className="relative min-h-screen overflow-hidden bg-cyber-darker flex items-center justify-center p-4">
            {/* Animated background */}
            <div className="fixed inset-0 mesh-gradient-bg opacity-30" />
            <div className="fixed inset-0 cyber-grid opacity-10" />

            <Card className="relative z-10 w-11/12 max-w-4xl flex flex-col glass-strong border-2 border-white/20 neon-glow-blue rounded-3xl overflow-hidden" style={{ height: '85vh' }}>
                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-4 border-b-2 border-white/10 bg-gradient-to-r from-white/5 to-white/10">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-blue via-neon-purple to-neon-pink animate-gradient-xy flex items-center justify-center text-3xl shadow-xl neon-glow-purple">
                            🤖
                        </div>
                        <div>
                            <div className="text-xl font-bold text-gradient">AI Voice Assistant</div>
                            <div className="text-sm text-white/70 flex items-center gap-2 mt-1">
                                <span className="w-2.5 h-2.5 bg-neon-green rounded-full animate-pulse shadow-lg shadow-neon-green/50"></span>
                                <span className="font-medium">Online & Ready</span>
                                <span className="text-white/40">•</span>
                                <span className="text-neon-blue">{user?.username || user?.email || 'Guest'}</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <button onClick={onLogout} className="px-6 py-2.5 rounded-xl glass-strong border-2 border-white/20 hover:border-neon-pink text-white font-semibold transition-all btn-cyber hover:scale-105 neon-glow-pink">
                            <span className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Logout
                            </span>
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div ref={listRef} className="flex-1 overflow-auto p-6 space-y-4 bg-gradient-to-b from-white/5 to-transparent" style={{ scrollBehavior: 'smooth' }}>
                    {messages.map((m) => {
                        const isUser = m.from === 'user'
                        const content = m.typing ? (m.typedText || '') : (m.text || m.typedText || '')
                        return (
                            <div key={m.id} className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                                {!isUser && (
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center text-sm font-bold shadow-lg neon-glow-purple text-white">AI</div>
                                    </div>
                                )}
                                <div className={`max-w-[75%] ${isUser ? 'ml-auto' : 'mr-auto'}`}>
                                    <div className={`p-4 rounded-2xl ${isUser ? 'bg-gradient-to-br from-neon-blue to-neon-purple text-white shadow-xl neon-glow-blue' : 'glass-strong border border-white/20 text-white shadow-xl'}`}>
                                        <div className="text-xs font-semibold mb-2 ${isUser ? 'text-white/80' : 'text-neon-blue'}">{isUser ? 'You' : 'AI Assistant'}</div>
                                        <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: m.typing ? (escapeHtml(content) + '<span class="text-white/60 ml-1 inline-block animate-pulse">▋</span>') : renderMarkdown(content) }} />
                                    </div>
                                </div>
                                {isUser && (
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-blue to-cyan-400 flex items-center justify-center text-sm font-bold shadow-lg neon-glow-blue text-white">{user?.username?.[0]?.toUpperCase() || 'U'}</div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Input Area */}
                <div className="p-6 pt-4 bg-gradient-to-t from-white/10 to-transparent border-t-2 border-white/10">
                    <div className="flex gap-3 items-end">
                        <div className="flex-1">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type your message or use voice..."
                                rows={3}
                                className="w-full glass-strong border-2 border-white/20 focus:border-neon-blue rounded-2xl p-4 text-white text-base placeholder-white/50 input-glow resize-none min-h-[100px] max-h-[200px] focus:outline-none focus:ring-2 focus:ring-neon-blue/30"
                                style={{ fontSize: '16px', lineHeight: '1.5' }}
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => (recording ? stopRecording() : startRecording())}
                                title={recording ? 'Stop recording' : 'Start recording'}
                                className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold transition-all shadow-xl ${recording
                                        ? 'bg-gradient-to-br from-red-500 to-red-700 text-white animate-pulse-record neon-glow-pink scale-110'
                                        : 'glass-strong border-2 border-white/30 text-white hover:border-neon-purple hover:scale-105 neon-glow-purple'
                                    }`}
                            >
                                {recording ? (
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                        <rect x="6" y="6" width="12" height="12" rx="2" />
                                    </svg>
                                ) : (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                    </svg>
                                )}
                            </button>
                            <button
                                onClick={sendMessage}
                                disabled={sending || !input.trim()}
                                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-blue via-neon-purple to-neon-pink text-white font-bold flex items-center justify-center shadow-xl neon-glow-blue hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                {sending ? (
                                    <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                    {recording && (
                        <div className="mt-3 flex items-center justify-center gap-2 text-sm text-neon-pink animate-pulse">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="font-medium">Recording... Speak now</span>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    )
}
