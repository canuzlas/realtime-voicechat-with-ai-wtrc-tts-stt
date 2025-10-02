/**
 * Speech-to-Text Service
 * Handles audio transcription using Google Cloud Speech-to-Text
 */
const fs = require('fs')
const { hasGoogleCredentials } = require('../config/env')
const { DEFAULT_LANGUAGE_CODE, AUDIO_ENCODINGS } = require('../config/constants')

/**
 * Transcribe audio file to text
 * @param {string} filePath - Path to audio file
 * @param {string} originalName - Original filename (for encoding detection)
 * @returns {Promise<string>} Transcribed text
 * @throws {Error} If transcription fails or credentials missing
 */
async function transcribeAudio(filePath, originalName = '') {
    if (!hasGoogleCredentials()) {
        throw new Error('STT not configured. Set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_SPEECH_KEY')
    }

    let SpeechClient
    try {
        SpeechClient = require('@google-cloud/speech').SpeechClient
    } catch (err) {
        console.error('Speech client require failed:', err?.message)
        throw new Error('Speech client not installed')
    }

    let speechClient
    try {
        speechClient = new SpeechClient()
    } catch (err) {
        console.error('Speech client init failed:', err?.message)
        throw new Error('Speech client initialization failed')
    }

    // Detect encoding from file extension
    const ext = originalName.split('.').pop().toLowerCase()
    const encoding = AUDIO_ENCODINGS[ext]

    // Read audio file
    const audioBytes = fs.readFileSync(filePath).toString('base64')

    // Build request
    const config = {
        languageCode: DEFAULT_LANGUAGE_CODE
    }

    if (encoding) {
        config.encoding = encoding
    }

    const request = {
        audio: { content: audioBytes },
        config
    }

    try {
        const [response] = await speechClient.recognize(request)
        const transcript = (response.results || [])
            .map(r => r.alternatives?.[0]?.transcript || '')
            .join('\n')
            .trim()

        return transcript || ''
    } catch (err) {
        console.error('STT transcription error:', err)
        throw new Error(`STT failed: ${err.message}`)
    }
}

/**
 * Check if STT service is available
 * @returns {Promise<boolean>}
 */
async function isAvailable() {
    if (!hasGoogleCredentials()) {
        return false
    }

    try {
        const SpeechClient = require('@google-cloud/speech').SpeechClient
        const client = new SpeechClient()
        return true
    } catch {
        return false
    }
}

module.exports = {
    transcribeAudio,
    isAvailable
}
