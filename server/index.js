require('dotenv').config()
const express = require('express')
const cors = require('cors')
const authRoutes = require('./routes/auth')
const chatRoutes = require('./routes/chat')

// Mount tts routes only when Google TTS credentials are available to avoid
// loading Google libraries at startup when not configured.
let ttsRoutes = null
const gcpCredPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
const hasGcpCredFile = gcpCredPath && require('fs').existsSync(gcpCredPath)
const hasGcpKey = Boolean(process.env.GOOGLE_TTS_KEY || process.env.GOOGLE_TTS_TOKEN)
if (hasGcpCredFile || hasGcpKey) {
    ttsRoutes = require('./routes/tts')
}

const app = express()
app.use(cors())
app.use(express.json())

// --- MongoDB / Mongoose connection ---
const mongoose = require('mongoose')
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL || null
if (MONGODB_URI) {
    mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
        console.log('Connected to MongoDB')
    }).catch((err) => {
        console.error('MongoDB connection error:', err && err.message ? err.message : err)
    })
    mongoose.connection.on('error', (err) => console.error('MongoDB error:', err))
} else {
    console.warn('MONGODB_URI not set — skipping MongoDB connection')
}

// Prevent process from crashing on unhandled promise rejections from optional libs
process.on('unhandledRejection', (reason, promise) => {
    console.warn('unhandledRejection (logged):', reason && reason.message ? reason.message : reason)
})
process.on('uncaughtException', (err) => {
    console.error('uncaughtException (logged):', err && err.stack ? err.stack : err)
})

app.use('/auth', authRoutes)
app.use('/chat', chatRoutes)
if (ttsRoutes) app.use('/chat', ttsRoutes)

// Health endpoint: reports uptime and availability of optional services
app.get('/health', async (req, res) => {
    const info = { ok: true, uptime: process.uptime(), services: {} }

    // TTS availability
    try {
        const gcpCredPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
        const hasGcpCredFile = gcpCredPath && require('fs').existsSync(gcpCredPath)
        const hasGcpKey = Boolean(process.env.GOOGLE_TTS_KEY || process.env.GOOGLE_TTS_TOKEN)
        if (hasGcpCredFile || hasGcpKey) {
            try {
                // attempt to require client lazily
                const TextToSpeechClient = require('@google-cloud/text-to-speech').TextToSpeechClient
                const ttsClient = new TextToSpeechClient()
                info.services.tts = { available: true }
            } catch (e) {
                info.services.tts = { available: false, error: e && e.message }
            }
        } else {
            info.services.tts = { available: false, reason: 'no-credentials' }
        }
    } catch (e) {
        info.services.tts = { available: false, error: e && e.message }
    }

    // STT availability
    try {
        const gcpCredPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
        const hasGcpCredFile = gcpCredPath && require('fs').existsSync(gcpCredPath)
        const hasGcpKey = Boolean(process.env.GOOGLE_SPEECH_KEY || process.env.GOOGLE_TTS_KEY)
        if (hasGcpCredFile || hasGcpKey) {
            try {
                const SpeechClient = require('@google-cloud/speech').SpeechClient
                const sClient = new SpeechClient()
                info.services.stt = { available: true }
            } catch (e) {
                info.services.stt = { available: false, error: e && e.message }
            }
        } else {
            info.services.stt = { available: false, reason: 'no-credentials' }
        }
    } catch (e) {
        info.services.stt = { available: false, error: e && e.message }
    }

    res.json(info)
})

const PORT = process.env.PORT || 3000

// Create an HTTP server and attach socket.io for WebRTC signaling
const http = require('http')
const server = http.createServer(app)
const { Server: IOServer } = require('socket.io')
const io = new IOServer(server, {
    cors: {
        origin: process.env.SIO_ORIGIN || '*',
        methods: ['GET', 'POST']
    }
})

// Attach signaling handlers (kept in separate module)
try {
    require('./signaling')(io)
} catch (e) {
    // Log but don't crash if signaling cannot be attached (e.g., missing native deps)
    console.warn('Could not initialize signaling module:', e && e.message ? e.message : e)
}

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`)
})
