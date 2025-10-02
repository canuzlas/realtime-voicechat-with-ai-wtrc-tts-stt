// Minimal signaling client example using socket.io-client
// Usage: import createSignaler from './webrtc/signalingClient'
// const { socket, createOffer, handleOffer } = createSignaler({ room: 'test-room' })

export default function createSignaler({ url = (import.meta.env.VITE_API_URL || 'http://localhost:3000'), room }) {
    // lazy load socket.io-client to avoid bundling in node-only contexts
    // import('socket.io-client') returns a promise
    let socket = null

    const listeners = {}

    async function connect() {
        if (!socket) {
            const mod = await import('socket.io-client')
            socket = mod.io(url, {
                withCredentials: true,
                transports: ['websocket', 'polling']
            })
            socket.on('connect', () => console.log('signaler connected', socket.id))
            socket.on('offer', (payload) => listeners['offer'] && listeners['offer'](payload))
            socket.on('answer', (payload) => listeners['answer'] && listeners['answer'](payload))
            socket.on('ice-candidate', (payload) => listeners['ice-candidate'] && listeners['ice-candidate'](payload))
            socket.on('peer-joined', (p) => listeners['peer-joined'] && listeners['peer-joined'](p))
            socket.on('peer-left', (p) => listeners['peer-left'] && listeners['peer-left'](p))
            if (room) socket.emit('join', { room })
        }
        return socket
    }

    function on(event, cb) { listeners[event] = cb }

    async function sendOffer(offer, opts = {}) {
        await connect()
        socket.emit('offer', { room, offer, ...opts })
    }

    async function sendAnswer(answer, opts = {}) {
        await connect()
        socket.emit('answer', { room, answer, ...opts })
    }

    async function sendIce(candidate, opts = {}) {
        await connect()
        socket.emit('ice-candidate', { room, candidate, ...opts })
    }

    async function leave() {
        if (!socket) return
        socket.emit('leave', { room })
        socket.disconnect()
        socket = null
    }

    // expose underlying socket instance via `.socket` so callers can emit custom events
    function getSocket() { return socket }

    return { connect, on, sendOffer, sendAnswer, sendIce, leave, getSocket }
}
