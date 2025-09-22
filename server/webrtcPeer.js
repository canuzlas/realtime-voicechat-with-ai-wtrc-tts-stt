// Server-side WebRTC peer using wrtc. Creates a PeerConnection that accepts
// incoming media (microphone) from the client and exposes a datachannel
// to stream TTS audio back to the client as binary MP3 chunks.

const fs = require('fs')

async function createPeer({ socket, offer }) {
    // lazy require to avoid loading native deps unnecessarily
    let wrtc
    try {
        wrtc = require('wrtc')
    } catch (e) {
        throw new Error('wrtc not installed or failed to load: ' + (e && e.message))
    }

    const pc = new wrtc.RTCPeerConnection()

    // keep local description for answer
    let localDesc = null

    // datachannel for TTS streaming
    let ttsChannel = null

    pc.ondatachannel = (ev) => {
        const ch = ev.channel
        if (ch.label === 'client-commands') {
            ch.onmessage = (msg) => {
                try {
                    const obj = JSON.parse(msg.data)
                    if (obj && obj.type === 'synthesize' && obj.text) {
                        sendTts(obj.text).catch((e) => console.error('synth err', e))
                    }
                } catch (e) { }
            }
        }
    }

    // Create an outbound datachannel for sending mp3 chunks
    ttsChannel = pc.createDataChannel('tts')
    ttsChannel.binaryType = 'arraybuffer'

    // helper to add ice candidates
    async function addIceCandidate(candidate) {
        if (!candidate) return
        try {
            await pc.addIceCandidate(candidate)
        } catch (e) {
            // ignore
        }
    }

    // wire remote (client) tracks to log activity
    pc.ontrack = (ev) => {
        console.log('server peer received track, kind=', ev.track.kind)
        // We could process incoming audio here (ASR, etc.)
        ev.track.onmute = () => console.log('track muted')
    }

    // set remote offer and create answer
    await pc.setRemoteDescription(offer)
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    localDesc = pc.localDescription

    // implement sendTTS: call existing TTS route/functionality by issuing an internal request
    async function sendTts(text) {
        if (!ttsChannel || ttsChannel.readyState !== 'open') {
            // wait for it to open briefly
            await new Promise((resolve, reject) => {
                const to = setTimeout(() => reject(new Error('tts channel not open')), 3000)
                ttsChannel.onopen = () => { clearTimeout(to); resolve() }
            })
        }

        // We'll synthesize MP3 via Google TTS if available by calling /chat/tts endpoint locally.
        // Use a local HTTP POST to the app server to reuse existing TTS logic.
        const apiUrl = `http://127.0.0.1:${process.env.PORT || 4000}`
        try {
            const fetch = require('node-fetch')
            const res = await fetch(`${apiUrl}/chat/tts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            })
            if (!res.ok) throw new Error('tts request failed')
            const arrayBuffer = await res.arrayBuffer()
            // send in chunks to avoid large single messages
            const chunkSize = 64 * 1024
            const buffer = Buffer.from(arrayBuffer)
            for (let i = 0; i < buffer.length; i += chunkSize) {
                const slice = buffer.slice(i, i + chunkSize)
                if (ttsChannel.readyState === 'open') ttsChannel.send(slice)
                else break
            }
            // signal end
            if (ttsChannel.readyState === 'open') ttsChannel.send(JSON.stringify({ __end: true }))
        } catch (e) {
            console.error('sendTts error', e && e.stack ? e.stack : e)
            throw e
        }
    }

    function close() {
        try { pc.close() } catch (e) { }
    }

    // expose the peer
    return {
        localDescription: localDesc,
        addIceCandidate,
        sendTTS: sendTts,
        close
    }
}

module.exports = { createPeer }
