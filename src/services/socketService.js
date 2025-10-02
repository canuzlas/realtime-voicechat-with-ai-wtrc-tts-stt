/**
 * Socket Service
 * Handles WebRTC signaling and Socket.IO communication
 */

import { API_URL } from '../utils/constants'

/**
 * Create Socket.IO connection
 * @returns {Promise<Socket>} Socket instance
 */
export async function createSocket() {
    try {
        const mod = await import('socket.io-client')
        const socket = mod.io(API_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling']
        })

        return new Promise((resolve, reject) => {
            socket.on('connect', () => {
                console.log('[SocketService] Connected:', socket.id)
                resolve(socket)
            })

            socket.on('connect_error', (error) => {
                console.error('[SocketService] Connection error:', error)
                reject(error)
            })

            setTimeout(() => {
                reject(new Error('Socket connection timeout'))
            }, 10000)
        })
    } catch (error) {
        throw new Error('Failed to create socket: ' + error.message)
    }
}

/**
 * Create signaling client for WebRTC
 * @param {Object} options - Configuration options
 * @param {string} options.room - Room name
 * @returns {Object} Signaling client
 */
export function createSignalingClient({ room = null } = {}) {
    let socket = null
    const listeners = {}

    async function connect() {
        if (!socket) {
            socket = await createSocket()

            // Setup event listeners
            socket.on('offer', (payload) => listeners['offer']?.(payload))
            socket.on('answer', (payload) => listeners['answer']?.(payload))
            socket.on('ice-candidate', (payload) => listeners['ice-candidate']?.(payload))
            socket.on('peer-joined', (p) => listeners['peer-joined']?.(p))
            socket.on('peer-left', (p) => listeners['peer-left']?.(p))
            socket.on('transcription', (data) => listeners['transcription']?.(data))
            socket.on('tts-chunk', (data) => listeners['tts-chunk']?.(data))
            socket.on('tts-done', () => listeners['tts-done']?.())

            if (room) {
                socket.emit('join', { room })
            }
        }
        return socket
    }

    function on(event, callback) {
        listeners[event] = callback
    }

    function off(event) {
        delete listeners[event]
    }

    async function sendOffer(offer, opts = {}) {
        await connect()
        socket.emit('offer', { room, offer, ...opts })
    }

    async function sendAnswer(answer, opts = {}) {
        await connect()
        socket.emit('answer', { room, answer, ...opts })
    }

    async function sendIceCandidate(candidate, opts = {}) {
        await connect()
        socket.emit('ice-candidate', { room, candidate, ...opts })
    }

    async function streamAudioChunk(chunk) {
        await connect()
        socket.emit('stream-audio', chunk)
    }

    async function finalizeAudio() {
        await connect()
        socket.emit('finalize-audio')
    }

    async function requestTTS(text) {
        await connect()
        socket.emit('request-tts', { text })
    }

    function leave() {
        if (!socket) return
        if (room) {
            socket.emit('leave', { room })
        }
        socket.disconnect()
        socket = null
    }

    function getSocket() {
        return socket
    }

    function isConnected() {
        return socket?.connected || false
    }

    return {
        connect,
        on,
        off,
        sendOffer,
        sendAnswer,
        sendIceCandidate,
        streamAudioChunk,
        finalizeAudio,
        requestTTS,
        leave,
        getSocket,
        isConnected
    }
}

/**
 * Create WebRTC peer connection
 * @param {Object} config - RTCConfiguration
 * @returns {RTCPeerConnection} Peer connection
 */
export function createPeerConnection(config = {}) {
    const defaultConfig = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }
        ]
    }

    return new RTCPeerConnection({ ...defaultConfig, ...config })
}
