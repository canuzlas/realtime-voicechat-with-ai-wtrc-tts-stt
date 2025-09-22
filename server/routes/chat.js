const express = require('express')
const fetch = require('node-fetch')
const verifyJWT = require('../utils/verifyJWT')
const multer = require('multer')
const fs = require('fs')
const path = require('path')
const router = express.Router()
const upload = multer({ dest: path.join(__dirname, '..', 'uploads') })

// ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads')
if (!fs.existsSync(uploadsDir)) {
    try { fs.mkdirSync(uploadsDir) } catch (e) { /* ignore */ }
}

// In-memory conversation store: { userId: [{ role: 'user'|'assistant', content: '...' }, ...] }
const conversations = {}

function appendMessage(userId, role, content) {
    if (!conversations[userId]) conversations[userId] = []
    conversations[userId].push({ role, content })
    // Keep last 20 messages to limit memory
    if (conversations[userId].length > 40) conversations[userId].splice(0, conversations[userId].length - 40)
}

async function generateAssistantReply(uid) {
    const GPT_URL = process.env.GPT_MINI_URL || process.env.GPT_URL || process.env.GPT_URL
    const GPT_KEY = process.env.GPT_MINI_KEY || process.env.GPT_API_KEY || process.env.GPT_KEY

    // fallback echo using last user message
    if (!GPT_URL || !GPT_KEY) {
        const lastUser = (conversations[uid] || []).slice().reverse().find((m) => m.role === 'user')
        const reply = `Echo: ${lastUser ? lastUser.content : ''}`
        appendMessage(uid, 'assistant', reply)
        return reply
    }

    try {
        let requestBody = { messages: conversations[uid] }
        if (GPT_URL.includes('openai.com') || GPT_URL.includes('/v1/chat')) {
            requestBody = {
                model: process.env.GPT_MODEL || 'gpt-3.5-turbo',
                messages: conversations[uid].map((m) => ({ role: m.role, content: m.content })),
                max_tokens: 300,
            }
        } else {
            requestBody = { messages: conversations[uid], max_tokens: 300 }
        }

        const r = await fetch(GPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${GPT_KEY}`,
            },
            body: JSON.stringify(requestBody),
        })

        if (!r.ok) {
            const body = await r.text().catch(() => '')
            throw new Error(`GPT-mini error ${r.status}: ${body}`)
        }

        const data = await r.json()
        let assistantText = ''
        if (data.reply) assistantText = data.reply
        else if (data.assistant_message) assistantText = data.assistant_message
        else if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) assistantText = data.choices[0].message.content
        else assistantText = JSON.stringify(data)

        appendMessage(uid, 'assistant', assistantText)
        return assistantText
    } catch (err) {
        console.error('chat error', err)
        const reply = `Error: ${err.message}`
        appendMessage(uid, 'assistant', reply)
        throw err
    }
}

// POST /chat/message - protected
router.post('/message', verifyJWT, async (req, res) => {
    const { message, userId } = req.body || {}

    if (!message) return res.status(400).json({ error: 'message required' })

    // derive userId from JWT if not provided
    const uid = userId || req.user?.email || req.user?.sub || 'anonymous'

    appendMessage(uid, 'user', message)

    // Call GPT API (config via env). Support multiple env names for flexibility.
    const GPT_URL = process.env.GPT_MINI_URL || process.env.GPT_URL || process.env.GPT_URL
    const GPT_KEY = process.env.GPT_MINI_KEY || process.env.GPT_API_KEY || process.env.GPT_KEY

    if (!GPT_URL || !GPT_KEY) {
        // Fallback: simple echo-based assistant
        const reply = `Echo: ${message}`
        appendMessage(uid, 'assistant', reply)
        return res.json({ reply })
    }

    try {
        // If the GPT URL looks like OpenAI Chat Completions endpoint, send messages in { model, messages } format
        let requestBody = { messages: conversations[uid] }
        if (GPT_URL.includes('openai.com') || GPT_URL.includes('/v1/chat')) {
            requestBody = {
                model: process.env.GPT_MODEL || 'gpt-3.5-turbo',
                messages: conversations[uid].map((m) => ({ role: m.role, content: m.content })),
                max_tokens: 300,
            }
        } else {
            // generic GPT-mini expected format
            requestBody = { messages: conversations[uid], max_tokens: 300 }
        }

        const r = await fetch(GPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${GPT_KEY}`,
            },
            body: JSON.stringify(requestBody),
        })

        if (!r.ok) {
            const body = await r.text().catch(() => '')
            throw new Error(`GPT-mini error ${r.status}: ${body}`)
        }

        const data = await r.json()
        // assume response shape { reply: '...', assistant_message: '...' } or { choices: [{ message: { content } }] }
        let assistantText = ''
        if (data.reply) assistantText = data.reply
        else if (data.assistant_message) assistantText = data.assistant_message
        else if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) assistantText = data.choices[0].message.content
        else assistantText = JSON.stringify(data)

        appendMessage(uid, 'assistant', assistantText)
        res.json({ reply: assistantText })
    } catch (err) {
        console.error('chat error', err)
        const reply = `Error: ${err.message}`
        appendMessage(uid, 'assistant', reply)
        res.status(500).json({ error: 'assistant error', details: err.message })
    }
})

// POST /chat/voice - accept multipart/form-data { audio: File }
router.post('/voice', verifyJWT, upload.single('audio'), async (req, res) => {
    try {
        const uid = req.user?.email || req.user?.sub || 'anonymous'
        if (!req.file) return res.status(400).json({ error: 'audio file required' })

        const filePath = req.file.path

        // Try to transcribe using Google Speech-to-Text if available
        let transcript = null
        try {
            let SpeechClient
            try {
                SpeechClient = require('@google-cloud/speech').SpeechClient
            } catch (reqErr) {
                console.warn('speech require failed', reqErr && reqErr.message)
                SpeechClient = null
            }

            if (SpeechClient) {
                let speechClient
                try {
                    speechClient = new SpeechClient()
                } catch (clientErr) {
                    console.warn('speech client init failed', clientErr && clientErr.message)
                    speechClient = null
                }

                if (speechClient) {
                    const audio = { content: require('fs').readFileSync(filePath).toString('base64') }
                    // Try to infer encoding from filename extension; omit when unknown so API can auto-detect
                    const vext = (req.file.originalname || '').split('.').pop().toLowerCase()
                    let vencoding = undefined
                    if (vext === 'wav') vencoding = 'LINEAR16'
                    else if (vext === 'flac') vencoding = 'FLAC'
                    else if (vext === 'mp3') vencoding = 'MP3'

                    const vconfig = { languageCode: 'en-US' }
                    if (vencoding) vconfig.encoding = vencoding

                    const request = { audio, config: vconfig }
                    const [response] = await speechClient.recognize(request)
                    transcript = response.results.map(r => r.alternatives[0].transcript).join('\n')
                } else {
                    transcript = `*audio received: ${req.file.originalname}*`
                }
            } else {
                transcript = `*audio received: ${req.file.originalname}*`
            }
        } catch (sttErr) {
            // STT not configured or failed — fall back
            console.warn('STT not available or failed:', sttErr && sttErr.message)
            transcript = `*audio received: ${req.file.originalname}*`
        }

        appendMessage(uid, 'user', transcript)
        const assistantReply = await generateAssistantReply(uid)

        // cleanup uploaded file
        try { fs.unlinkSync(filePath) } catch (e) { }

        res.json({ reply: assistantReply })
    } catch (err) {
        console.error('voice handling error', err)
        res.status(500).json({ error: 'voice processing failed', details: err.message })
    }
})

// POST /chat/stt - accept multipart/form-data { audio: File } and return transcript
router.post('/stt', verifyJWT, upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'audio file required' })

        // Ensure Google STT credentials are present before requiring the lib
        const gcpCredPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
        const hasGcpCredFile = gcpCredPath && fs.existsSync(gcpCredPath)
        const hasGcpKey = Boolean(process.env.GOOGLE_SPEECH_KEY || process.env.GOOGLE_TTS_KEY)
        if (!hasGcpCredFile && !hasGcpKey) {
            return res.status(501).json({ error: 'STT not configured. Set GOOGLE_APPLICATION_CREDENTIALS (file must exist) or GOOGLE_SPEECH_KEY' })
        }

        const filePath = req.file.path
        const ext = (req.file.originalname || '').split('.').pop().toLowerCase()
        // Map common extensions to google encoding (only set for safe formats)
        let encoding = undefined
        if (ext === 'wav') encoding = 'LINEAR16'
        else if (ext === 'flac') encoding = 'FLAC'
        else if (ext === 'mp3') encoding = 'MP3'

        // Lazy-require Speech client and transcribe
        let SpeechClient
        try {
            SpeechClient = require('@google-cloud/speech').SpeechClient
        } catch (reqErr) {
            console.error('speech require failed', reqErr && reqErr.message)
            return res.status(500).json({ error: 'speech client not installed', details: reqErr.message })
        }

        let speechClient
        try {
            speechClient = new SpeechClient()
        } catch (initErr) {
            console.error('speech client init failed', initErr && initErr.message)
            return res.status(500).json({ error: 'speech client init failed', details: initErr.message })
        }

        const audioBytes = fs.readFileSync(filePath).toString('base64')
        const config = { languageCode: 'en-US' }
        if (encoding) config.encoding = encoding
        const request = { audio: { content: audioBytes }, config }

        try {
            const [response] = await speechClient.recognize(request)
            const transcript = (response.results || []).map(r => (r.alternatives && r.alternatives[0] && r.alternatives[0].transcript) || '').join('\n')
            try { fs.unlinkSync(filePath) } catch (e) { }
            return res.json({ transcript })
        } catch (transErr) {
            console.error('stt error', transErr)
            try { fs.unlinkSync(filePath) } catch (e) { }
            return res.status(500).json({ error: 'stt failed', details: transErr.message })
        }
    } catch (err) {
        console.error('stt handler error', err)
        return res.status(500).json({ error: 'stt handler failed', details: err.message })
    }
})

module.exports = router

