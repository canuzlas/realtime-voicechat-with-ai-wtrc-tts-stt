/**
 * Socket Service
 * Handles WebRTC signaling and real-time audio streaming
 */
const fs = require('fs').promises
const path = require('path')
const os = require('os')
const FormData = require('form-data')
const fetch = require('node-fetch')
const jwt = require('jsonwebtoken')
const { getConfig } = require('../config/env')
const gptService = require('./gptService')
const sttService = require('./sttService')
const ttsService = require('./ttsService')

// TTS chunk size constant
const TTS_CHUNK_SIZE = 64 * 1024 // 64KB

/**
 * Create internal JWT token for server-to-server calls
 * @returns {string} JWT token
 */
function createInternalToken() {
    const config = getConfig()
    return jwt.sign(
        { sub: 'internal', iss: 'server' },
        config.jwtSecret,
        { expiresIn: '1h' }
    )
}

/**
 * Stream TTS audio to socket in chunks
 * @param {Object} socket - Socket.IO socket
 * @param {string} text - Text to synthesize
 */
async function streamTTS(socket, text) {
    try {
        const audioBuffer = await ttsService.synthesizeSpeech(text)

        // Stream in chunks
        for (let i = 0; i < audioBuffer.length; i += TTS_CHUNK_SIZE) {
            const slice = audioBuffer.slice(i, i + TTS_CHUNK_SIZE)
            socket.emit('tts-chunk', slice)
        }

        socket.emit('tts-chunk-end')
        console.log(`[TTS] Streamed ${audioBuffer.length} bytes in chunks`)
    } catch (err) {
        console.error('[TTS] Streaming error:', err)
        socket.emit('tts-error', { error: err.message })
    }
}

/**
 * Process audio stream and generate assistant response
 * @param {Object} socket - Socket.IO socket
 * @param {Buffer[]} audioBuffers - Array of audio chunks
 */
async function processAudioStream(socket, audioBuffers) {
    if (!audioBuffers.length) {
        return socket.emit('stream-audio-error', { error: 'no-data' })
    }

    const tmpFile = path.join(os.tmpdir(), `${socket.id}-stream.webm`)

    try {
        // Write audio to temporary file
        const audioData = Buffer.concat(audioBuffers)
        await fs.writeFile(tmpFile, audioData)
        console.log(`[Audio] Wrote ${audioData.length} bytes to ${tmpFile}`)

        // Transcribe using STT service
        const transcript = await sttService.transcribeAudio(tmpFile, `${socket.id}.webm`)

        if (!transcript) {
            socket.emit('stream-audio-error', { error: 'No speech detected' })
            return
        }

        console.log(`[STT] Transcript: "${transcript}"`)
        socket.emit('stream-audio-final', { transcript })

        // Generate assistant reply
        const assistantReply = await gptService.generateReply(socket.id, transcript)
        console.log(`[GPT] Reply: "${assistantReply}"`)

        socket.emit('assistant-message', { text: assistantReply })

        // Stream TTS response
        await streamTTS(socket, assistantReply)

    } catch (err) {
        console.error('[Audio Processing] Error:', err)
        socket.emit('stream-audio-error', { error: err.message })
    } finally {
        // Cleanup
        try {
            await fs.unlink(tmpFile)
        } catch (err) {
            // Ignore cleanup errors
        }
    }
}

module.exports = {
    streamTTS,
    processAudioStream,
    createInternalToken
}
