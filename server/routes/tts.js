const express = require('express')
const verifyJWT = require('../utils/verifyJWT')
const router = express.Router()

// POST /chat/tts - protected
// Accepts { text: string } and returns mp3 audio
router.post('/tts', verifyJWT, async (req, res) => {
    const { text } = req.body || {}
    if (!text) return res.status(400).json({ error: 'text required' })

    // Check for Google credentials before loading the library to avoid the google-auth library trying to load
    const gcpCredPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
    const hasGcpCredFile = gcpCredPath && require('fs').existsSync(gcpCredPath)
    const hasGcpKey = Boolean(process.env.GOOGLE_TTS_KEY || process.env.GOOGLE_TTS_TOKEN)
    if (!hasGcpCredFile && !hasGcpKey) {
        return res.status(501).json({ error: 'TTS not configured. Set GOOGLE_APPLICATION_CREDENTIALS (file must exist) or GOOGLE_TTS_KEY' })
    }

    try {
        // Require lazily now that we've checked for credentials
        let TextToSpeechClient
        try {
            TextToSpeechClient = require('@google-cloud/text-to-speech').TextToSpeechClient
        } catch (requireErr) {
            console.error('tts require error', requireErr && requireErr.message)
            return res.status(500).json({ error: 'tts require failed', details: requireErr.message })
        }

        let ttsClient
        try {
            ttsClient = new TextToSpeechClient()
        } catch (clientErr) {
            console.error('tts client init error', clientErr && clientErr.message)
            return res.status(500).json({ error: 'tts client init failed', details: clientErr.message })
        }

        const request = {
            input: { text },
            voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' },
            audioConfig: { audioEncoding: 'MP3' },
        }

        const [response] = await ttsClient.synthesizeSpeech(request)
        const audioContent = response.audioContent
        if (!audioContent) return res.status(500).json({ error: 'no audio returned' })

        res.setHeader('Content-Type', 'audio/mpeg')
        res.setHeader('Content-Disposition', 'attachment; filename="speech.mp3"')
        return res.send(Buffer.from(audioContent, 'base64'))
    } catch (err) {
        console.error('tts error', err)
        return res.status(500).json({ error: 'tts error', details: err.message })
    }
})

module.exports = router
