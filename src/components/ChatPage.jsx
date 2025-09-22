import React, { useState, useRef, useEffect } from 'react'
import createSignaler from '../webrtc/signalingClient'

export default function ChatPage({ user, onLogout }) {
    const [messages, setMessages] = useState([
        { id: 1, from: 'bot', text: 'Hello! This is a demo chat.' },
    ])
    const [input, setInput] = useState('')
    const [sending, setSending] = useState(false)
    const listRef = useRef(null)
    const audioRef = useRef(null)
    const audioUrlRef = useRef(null)
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
        // scroll to bottom when messages change
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight
        }
    }, [messages])

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
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'
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
            const botMsg = { id: Date.now() + 1, from: 'bot', text: data.reply || '(no reply)' }
            setMessages((m) => [...m, botMsg])
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
            const botMsg = { id: Date.now() + 1, from: 'bot', text: `Error: ${err.message}. (local fallback)` }
            setMessages((m) => [...m, botMsg])
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
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'
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
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'
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
        <div className="w-11/12 max-w-3xl bg-white p-6 rounded-lg shadow flex flex-col" style={{ height: '80vh' }}>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Chat</h2>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-600">{user?.email}</span>
                    <button onClick={onLogout} className="py-1 px-3 bg-gray-100 rounded-md text-sm hover:bg-gray-200">
                        Logout
                    </button>
                </div>
            </div>

            <div ref={listRef} className="flex-1 overflow-auto border rounded-md p-4 mb-4 space-y-3 bg-slate-50">
                {messages.map((m) => (
                    <div key={m.id} className={`max-w-3/4 p-2 rounded ${m.from === 'user' ? 'ml-auto bg-sky-600 text-white' : 'mr-auto bg-white text-slate-800 shadow'}`}>
                        <div className="text-sm font-medium mb-1">{m.from === 'user' ? 'You' : 'Bot'}</div>
                        <div className="text-sm whitespace-pre-wrap">{m.text}</div>
                    </div>
                ))}
            </div>

            <div className="flex gap-3 items-end">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="flex-1 rounded-md border-gray-200 p-2 h-16 resize-none"
                />
                <div className="flex flex-col items-center gap-2">
                    <button
                        onClick={() => (recording ? stopRecording() : startRecording())}
                        title={recording ? 'Stop recording' : 'Start recording'}
                        className={`p-2 rounded-md border ${recording ? 'bg-red-600 text-white' : 'bg-white text-slate-700'}`}
                    >
                        {recording ? 'Stop' : 'Mic'}
                    </button>
                    <div className="text-xs text-slate-500">{recording ? 'Recording…' : 'Hold to speak'}</div>
                </div>
                <button
                    onClick={sendMessage}
                    disabled={sending}
                    className="px-4 py-2 bg-sky-600 text-white rounded-md disabled:opacity-60"
                >
                    {sending ? 'Sending...' : 'Send'}
                </button>
            </div>
        </div>
    )
}
