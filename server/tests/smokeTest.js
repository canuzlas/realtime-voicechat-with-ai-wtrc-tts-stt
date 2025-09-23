const io = require('socket.io-client')
const fs = require('fs')

const SERVER = process.env.SIO_URL || 'http://127.0.0.1:3000'
const ROOM = 'smoke-room-' + Math.random().toString(36).slice(2, 8)

function wait(ms) { return new Promise(r => setTimeout(r, ms)) }

async function run() {
    console.log('Connecting clients to', SERVER)
    const a = io(SERVER, { transports: ['websocket'] })
    const b = io(SERVER, { transports: ['websocket'] })

    let offerReceived = false

    b.on('connect', () => {
        console.log('clientB connected', b.id)
        b.emit('join', { room: ROOM })
    })
    a.on('connect', () => {
        console.log('clientA connected', a.id)
        a.emit('join', { room: ROOM })
    })

    b.on('offer', (data) => {
        console.log('clientB got offer from', data.from)
        console.log('offer payload:', data.offer && (data.offer.type || '[sdp]'))
        offerReceived = true
    })

    // Wait for both to be connected
    await wait(500)

    console.log('ClientA sending offer to room', ROOM)
    a.emit('offer', { room: ROOM, offer: { type: 'offer', sdp: 'v=0\n...' } })

    // Wait for forwarded offer
    for (let i = 0; i < 20; i++) {
        if (offerReceived) break
        await wait(200)
    }

    if (!offerReceived) {
        console.error('ERROR: offer not forwarded')
    } else {
        console.log('OK: offer forwarded')
    }

    // Now test request-tts
    const chunks = []
    a.on('tts-chunk', (chunk) => {
        console.log('received tts chunk', chunk && chunk.length)
        if (Buffer.isBuffer(chunk)) chunks.push(chunk)
        else if (chunk && chunk.data) chunks.push(Buffer.from(chunk.data))
    })
    a.on('tts-chunk-end', () => {
        console.log('tts stream ended, writing file')
        try {
            fs.mkdirSync(__dirname + '/out', { recursive: true })
            const outPath = __dirname + '/out/tts_output.mp3'
            fs.writeFileSync(outPath, Buffer.concat(chunks))
            console.log('WROTE', outPath)
            cleanup(0)
        } catch (e) {
            console.error('write failed', e)
            cleanup(2)
        }
    })
    a.on('tts-error', (err) => {
        console.error('tts-error from server', err)
        cleanup(5)
    })

    a.emit('request-tts', { text: 'Hello from smoke test' })

    // safety timeout
    setTimeout(() => {
        console.error('Timeout waiting for tts-chunk-end')
        cleanup(3)
    }, 20000)

    function cleanup(code) {
        try { a.disconnect(); b.disconnect() } catch (e) { }
        process.exit(code)
    }
}

run().catch((e) => { console.error('smoke test error', e && e.stack || e); process.exit(4) })
