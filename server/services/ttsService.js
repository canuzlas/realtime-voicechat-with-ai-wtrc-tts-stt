/**
 * Text-to-Speech Service
 * Handles speech synthesis using Google Cloud Text-to-Speech
 */
const { hasGoogleCredentials } = require('../config/env')
const { DEFAULT_LANGUAGE_CODE } = require('../config/constants')

/**
 * Synthesize text to speech
 * @param {string} text - Text to synthesize
 * @returns {Promise<Buffer>} Audio buffer (MP3)
 * @throws {Error} If synthesis fails or credentials missing
 */
async function synthesizeSpeech(text) {
    if (!text || text.trim() === '') {
        throw new Error('Text is required for TTS')
    }

    if (!hasGoogleCredentials()) {
        throw new Error('TTS not configured. Set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_TTS_KEY')
    }

    let TextToSpeechClient
    try {
        TextToSpeechClient = require('@google-cloud/text-to-speech').TextToSpeechClient
    } catch (err) {
        console.error('TTS client require failed:', err?.message)
        throw new Error('TTS client not installed')
    }

    let ttsClient
    try {
        ttsClient = new TextToSpeechClient()
    } catch (err) {
        console.error('TTS client init failed:', err?.message)
        throw new Error('TTS client initialization failed')
    }

    const request = {
        input: { text },
        voice: {
            languageCode: DEFAULT_LANGUAGE_CODE,
            ssmlGender: 'NEUTRAL'
        },
        audioConfig: {
            audioEncoding: 'MP3'
        }
    }

    try {
        const [response] = await ttsClient.synthesizeSpeech(request)

        if (!response.audioContent) {
            throw new Error('No audio content in TTS response')
        }

        return Buffer.from(response.audioContent)
    } catch (err) {
        console.error('TTS synthesis error:', err)
        throw new Error(`TTS failed: ${err.message}`)
    }
}

/**
 * Check if TTS service is available
 * @returns {Promise<boolean>}
 */
async function isAvailable() {
    if (!hasGoogleCredentials()) {
        return false
    }

    try {
        const TextToSpeechClient = require('@google-cloud/text-to-speech').TextToSpeechClient
        const client = new TextToSpeechClient()
        return true
    } catch {
        return false
    }
}

module.exports = {
    synthesizeSpeech,
    isAvailable
}
