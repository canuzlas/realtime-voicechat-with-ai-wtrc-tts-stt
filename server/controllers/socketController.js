/**
 * Socket Controller
 * Handles Socket.IO events for WebRTC signaling and audio streaming
 */
const { streamTTS, processAudioStream } = require('../services/socketService')

// Map to store server-side WebRTC peers
const serverPeers = new Map()

/**
 * Setup Socket.IO event handlers
 * @param {Object} io - Socket.IO server instance
 */
function setupSocketHandlers(io) {
    io.on('connection', (socket) => {
        console.log(`[Socket] Client connected: ${socket.id}`)

        // Audio buffer for streaming
        let audioBuffers = []

        // WebRTC Signaling Events
        handleSignaling(socket, io, serverPeers)

        // Audio Streaming Events
        handleAudioStream(socket, audioBuffers)

        // TTS Events
        handleTTS(socket)

        // Disconnect Event
        handleDisconnect(socket, serverPeers)
    })
}

/**
 * Handle WebRTC signaling events
 */
function handleSignaling(socket, io, serverPeers) {
    // Join room
    socket.on('join', ({ room }) => {
        console.log(`[Signaling] ${socket.id} joining room ${room}`)
        socket.join(room)
        socket.to(room).emit('peer-joined', { id: socket.id })
    })

    // Leave room
    socket.on('leave', ({ room }) => {
        console.log(`[Signaling] ${socket.id} leaving room ${room}`)
        socket.leave(room)
        socket.to(room).emit('peer-left', { id: socket.id })
    })

    // WebRTC Offer
    socket.on('offer', async ({ room, offer, to }) => {
        console.log(`[Signaling] Offer from ${socket.id} to ${to || room}`)

        // Server-side peer connection (optional, requires wrtc module)
        if (to === 'server') {
            try {
                // Try to load webrtcPeer if available
                let webrtcPeer
                try {
                    webrtcPeer = require('../webrtcPeer')
                } catch (requireErr) {
                    console.warn('[Signaling] webrtcPeer module not available:', requireErr.message)
                    socket.emit('answer-error', { error: 'Server-side WebRTC not available' })
                    return
                }

                const peer = await webrtcPeer.createPeer({ socket, offer })
                serverPeers.set(socket.id, peer)
                socket.emit('answer', { from: 'server', answer: peer.localDescription })
            } catch (err) {
                console.error('[Signaling] Server peer creation failed:', err)
                socket.emit('answer-error', { error: err.message })
            }
            return
        }

        // Forward to specific peer or room
        if (to) {
            io.to(to).emit('offer', { from: socket.id, offer })
        } else {
            socket.to(room).emit('offer', { from: socket.id, offer })
        }
    })

    // WebRTC Answer
    socket.on('answer', ({ room, answer, to }) => {
        console.log(`[Signaling] Answer from ${socket.id} to ${to || room}`)

        if (to) {
            io.to(to).emit('answer', { from: socket.id, answer })
        } else {
            socket.to(room).emit('answer', { from: socket.id, answer })
        }
    })

    // ICE Candidate
    socket.on('ice-candidate', ({ room, candidate, to }) => {
        if (to === 'server') {
            const peer = serverPeers.get(socket.id)
            if (peer && peer.addIceCandidate) {
                peer.addIceCandidate(candidate).catch(() => { })
            }
            return
        }

        if (to) {
            io.to(to).emit('ice-candidate', { from: socket.id, candidate })
        } else if (room) {
            socket.to(room).emit('ice-candidate', { from: socket.id, candidate })
        }
    })

    // Server-side synthesis via datachannel (requires wrtc)
    socket.on('synthesize', async ({ text }) => {
        const peer = serverPeers.get(socket.id)
        if (!peer) {
            console.warn('[Signaling] No peer found for synthesis')
            return socket.emit('synthesize-error', { error: 'Server-side WebRTC not available' })
        }

        try {
            if (typeof peer.sendTTS === 'function') {
                await peer.sendTTS(text)
                socket.emit('synthesize-ok')
            } else {
                socket.emit('synthesize-error', { error: 'sendTTS not supported' })
            }
        } catch (err) {
            console.error('[Signaling] Synthesis failed:', err)
            socket.emit('synthesize-error', { error: err.message })
        }
    })
}

/**
 * Handle audio streaming events
 */
function handleAudioStream(socket, audioBuffers) {
    // Receive audio chunks
    socket.on('stream-audio', (chunk) => {
        try {
            if (chunk && chunk.data) {
                audioBuffers.push(Buffer.from(chunk.data))
            } else if (chunk instanceof ArrayBuffer) {
                audioBuffers.push(Buffer.from(chunk))
            } else if (Buffer.isBuffer(chunk)) {
                audioBuffers.push(chunk)
            }
        } catch (err) {
            console.error('[Audio] Chunk processing error:', err)
        }
    })

    // Finalize audio stream
    socket.on('finalize-audio', async () => {
        console.log(`[Audio] Finalizing stream with ${audioBuffers.length} chunks`)

        await processAudioStream(socket, audioBuffers)

        // Clear buffers
        audioBuffers.length = 0
    })
}

/**
 * Handle TTS events
 */
function handleTTS(socket) {
    socket.on('request-tts', async ({ text }) => {
        console.log(`[TTS] Request from ${socket.id}: "${text}"`)
        await streamTTS(socket, text)
    })
}

/**
 * Handle disconnect event
 */
function handleDisconnect(socket, serverPeers) {
    socket.on('disconnect', (reason) => {
        console.log(`[Socket] Client disconnected: ${socket.id}, reason: ${reason}`)

        // Notify rooms
        const rooms = Array.from(socket.rooms).filter(r => r !== socket.id)
        rooms.forEach(room => {
            socket.to(room).emit('peer-left', { id: socket.id })
        })

        // Cleanup server peer
        const peer = serverPeers.get(socket.id)
        if (peer && peer.close) {
            try {
                peer.close()
            } catch (err) {
                console.error('[Cleanup] Peer close error:', err)
            }
        }
        serverPeers.delete(socket.id)
    })
}

module.exports = setupSocketHandlers
