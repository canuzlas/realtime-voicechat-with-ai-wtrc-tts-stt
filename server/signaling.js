// Simple WebRTC signaling using socket.io
// Events:
// - join: { room }
// - leave: { room }
// - offer: { room, offer } -> forwarded to other peers
// - answer: { room, answer } -> forwarded to offerer
// - ice-candidate: { room, candidate } -> forwarded to other peers

module.exports = function (io) {
    const fs = require('fs')
    // map socket.id -> peer instance (server-side webrtc peers)
    const serverPeers = new Map()

    io.on('connection', (socket) => {
        console.log('socket connected', socket.id)

        socket.on('join', ({ room }) => {
            console.log(`socket ${socket.id} joining room ${room}`)
            socket.join(room)
            socket.to(room).emit('peer-joined', { id: socket.id })
        })

        socket.on('leave', ({ room }) => {
            console.log(`socket ${socket.id} leaving room ${room}`)
            socket.leave(room)
            socket.to(room).emit('peer-left', { id: socket.id })
        })

        // offer can be routed to another client or to the server itself
        socket.on('offer', async ({ room, offer, to }) => {
            console.log(`offer from ${socket.id} in ${room} to ${to || 'room'}`)
            // If target is the literal string 'server', create a server-side peer
            if (to === 'server') {
                try {
                    // defensively clear any cached module to avoid duplicate-define issues
                    try { delete require.cache[require.resolve('./webrtcPeer')] } catch (e) { }
                    const webrtcPeer = require('./webrtcPeer')
                    const peer = await webrtcPeer.createPeer({ socket, offer })
                    // store peer instance by socket id
                    serverPeers.set(socket.id, peer)
                    // send answer back to the client
                    socket.emit('answer', { from: 'server', answer: peer.localDescription })
                } catch (e) {
                    console.error('failed to create server peer', e && e.stack ? e.stack : e)
                    socket.emit('answer-error', { error: e && e.message ? e.message : String(e) })
                }
                return
            }

            if (to) {
                io.to(to).emit('offer', { from: socket.id, offer })
            } else {
                socket.to(room).emit('offer', { from: socket.id, offer })
            }
        })

        // Client requests the server synthesize text and stream MP3 chunks back
        socket.on('request-tts', async ({ text }) => {
            try {
                const fetch = require('node-fetch')
                const jwt = require('jsonwebtoken')
                const apiUrl = `http://127.0.0.1:${process.env.PORT || 4000}`
                // create a short-lived internal token so verifyJWT accepts this internal call
                const token = jwt.sign({ sub: 'internal', iss: 'server' }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '1h' })
                const res = await fetch(`${apiUrl}/chat/tts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ text })
                })
                if (!res.ok) return socket.emit('tts-error', { error: 'tts-failed' })
                const arrayBuffer = await res.arrayBuffer()
                const buffer = Buffer.from(arrayBuffer)
                const chunkSize = 64 * 1024
                for (let i = 0; i < buffer.length; i += chunkSize) {
                    const slice = buffer.slice(i, i + chunkSize)
                    socket.emit('tts-chunk', slice)
                }
                socket.emit('tts-chunk-end')
            } catch (e) {
                console.error('request-tts error', e && e.stack ? e.stack : e)
                socket.emit('tts-error', { error: e && e.message ? e.message : String(e) })
            }
        })

        // Optional: accept small binary audio chunks from client for ASR
        // Client may emit 'stream-audio' with ArrayBuffer or Buffer payloads
        // We'll assemble into a temporary file per-connection and expose a simple 'finalize-audio' event
        let audioBuffers = []
        socket.on('stream-audio', (chunk) => {
            try {
                // chunk can be binary (Buffer) or ArrayBuffer
                if (chunk && chunk.data) {
                    // socket.io binary wrapper
                    audioBuffers.push(Buffer.from(chunk.data))
                } else if (chunk instanceof ArrayBuffer) audioBuffers.push(Buffer.from(chunk))
                else if (Buffer.isBuffer(chunk)) audioBuffers.push(chunk)
            } catch (e) { }
        })

        socket.on('finalize-audio', async () => {
            if (!audioBuffers.length) return socket.emit('stream-audio-error', { error: 'no-data' })
            try {
                const tmpDir = require('os').tmpdir()
                const fname = require('path').join(tmpDir, `${socket.id}-stream.webm`)
                await fs.promises.writeFile(fname, Buffer.concat(audioBuffers))
                // reuse existing /chat/stt by making a multipart/form-data request
                const FormData = require('form-data')
                const fetch = require('node-fetch')
                const jwt = require('jsonwebtoken')
                const form = new FormData()
                form.append('audio', fs.createReadStream(fname))
                const apiUrl = `http://127.0.0.1:${process.env.PORT || 4000}`
                // create internal token so the verifyJWT middleware accepts this internal call
                const token = jwt.sign({ sub: 'internal', iss: 'server' }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '1h' })
                const headers = Object.assign({ Authorization: `Bearer ${token}` }, (form.getHeaders ? form.getHeaders() : {}))
                const res = await fetch(`${apiUrl}/chat/stt`, { method: 'POST', body: form, headers })
                if (!res.ok) return socket.emit('stream-audio-error', { error: 'stt-failed' })
                const data = await res.json()
                socket.emit('stream-audio-final', { transcript: data.transcript })

                // Additionally, generate assistant reply server-side and stream TTS back to the socket
                try {
                    const jwt = require('jsonwebtoken')
                    const token2 = jwt.sign({ sub: 'internal', iss: 'server' }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '1h' })
                    const msgRes = await fetch(`${apiUrl}/chat/message`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token2}` },
                        body: JSON.stringify({ message: data.transcript, userId: socket.id })
                    })
                    if (msgRes.ok) {
                        const msgData = await msgRes.json()
                        const assistantText = msgData.reply || ''
                        // emit assistant message to client so UI can show it without client calling /chat/message
                        socket.emit('assistant-message', { text: assistantText })

                        // synthesize TTS via internal call and stream chunks same as request-tts
                        const ttsRes = await fetch(`${apiUrl}/chat/tts`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token2}` },
                            body: JSON.stringify({ text: assistantText })
                        })
                        if (ttsRes && ttsRes.ok) {
                            const arrayBuffer = await ttsRes.arrayBuffer()
                            const buffer = Buffer.from(arrayBuffer)
                            const chunkSize = 64 * 1024
                            for (let i = 0; i < buffer.length; i += chunkSize) {
                                const slice = buffer.slice(i, i + chunkSize)
                                socket.emit('tts-chunk', slice)
                            }
                            socket.emit('tts-chunk-end')
                        }
                    }
                } catch (e) {
                    console.error('assistant-flow failed', e && e.stack ? e.stack : e)
                }
                // cleanup
                try { await fs.promises.unlink(fname) } catch (e) { }
            } catch (e) {
                socket.emit('stream-audio-error', { error: e && e.message ? e.message : String(e) })
            } finally {
                audioBuffers = []
            }
        })

        socket.on('answer', ({ room, answer, to }) => {
            console.log(`answer from ${socket.id} in ${room} to ${to || 'room'}`)
            if (to) {
                io.to(to).emit('answer', { from: socket.id, answer })
            } else {
                socket.to(room).emit('answer', { from: socket.id, answer })
            }
        })

        socket.on('ice-candidate', ({ room, candidate, to }) => {
            if (to === 'server') {
                const peer = serverPeers.get(socket.id)
                if (peer && peer.addIceCandidate) peer.addIceCandidate(candidate).catch(() => { })
                return
            }
            if (to) {
                io.to(to).emit('ice-candidate', { from: socket.id, candidate })
            } else if (room) {
                socket.to(room).emit('ice-candidate', { from: socket.id, candidate })
            }
        })

        // allow client to request server to synthesize text and stream back over datachannel
        socket.on('synthesize', async ({ text }) => {
            const peer = serverPeers.get(socket.id)
            if (!peer) return socket.emit('synthesize-error', { error: 'no-peer' })
            try {
                await peer.sendTTS(text)
                socket.emit('synthesize-ok')
            } catch (e) {
                console.error('synthesize failed', e && e.stack ? e.stack : e)
                socket.emit('synthesize-error', { error: e && e.message ? e.message : String(e) })
            }
        })

        socket.on('disconnect', (reason) => {
            console.log('socket disconnected', socket.id, reason)
            const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id)
            rooms.forEach((room) => socket.to(room).emit('peer-left', { id: socket.id }))
            const peer = serverPeers.get(socket.id)
            if (peer && peer.close) {
                try { peer.close() } catch (e) { }
            }
            serverPeers.delete(socket.id)
        })
    })
}

