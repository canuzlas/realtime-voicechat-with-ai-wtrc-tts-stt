/**
 * Chat Controller
 * Handles chat messages, audio transcription and TTS
 */
const path = require('path')
const fs = require('fs').promises
const gptService = require('../services/gptService')
const sttService = require('../services/sttService')
const ttsService = require('../services/ttsService')
const { APIError } = require('../middleware/errorHandler')

/**
 * Send a text message
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function sendMessage(req, res) {
    const { message } = req.body
    const userId = req.user.userId

    if (!message || typeof message !== 'string') {
        throw new APIError('Message is required', 400)
    }

    const reply = await gptService.generateReply(userId, message)

    res.json({
        success: true,
        reply
    })
}

/**
 * Process audio (STT + GPT + TTS)
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function processAudio(req, res) {
    const userId = req.user.userId
    const audioFile = req.file

    if (!audioFile) {
        throw new APIError('Audio file is required', 400)
    }

    console.log(`[Audio Processing] User: ${userId}, File: ${audioFile.originalname}`)

    try {
        // Step 1: Speech to Text
        const transcription = await sttService.transcribeAudio(
            audioFile.path,
            audioFile.originalname
        )

        if (!transcription) {
            throw new APIError('Could not transcribe audio', 400, {
                reason: 'No speech detected or empty audio'
            })
        }

        console.log(`[STT] Transcription: "${transcription}"`)

        // Step 2: Get GPT response
        const gptReply = await gptService.generateReply(userId, transcription)
        console.log(`[GPT] Reply: "${gptReply}"`)

        // Step 3: Text to Speech
        const audioBuffer = await ttsService.synthesizeSpeech(gptReply)
        console.log(`[TTS] Generated audio: ${audioBuffer.length} bytes`)

        // Step 4: Send response
        res.json({
            success: true,
            transcription,
            reply: gptReply,
            audio: audioBuffer.toString('base64')
        })

    } finally {
        // Clean up uploaded file
        try {
            await fs.unlink(audioFile.path)
        } catch (err) {
            console.warn(`[Cleanup] Failed to delete ${audioFile.path}:`, err.message)
        }
    }
}

/**
 * Text to speech
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function textToSpeech(req, res) {
    const { text } = req.body

    if (!text || typeof text !== 'string') {
        throw new APIError('Text is required', 400)
    }

    const audioBuffer = await ttsService.synthesizeSpeech(text)

    res.json({
        success: true,
        audio: audioBuffer.toString('base64')
    })
}

/**
 * Get conversation history
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function getConversation(req, res) {
    const userId = req.user.userId
    const messages = gptService.getConversation(userId)

    res.json({
        success: true,
        messages
    })
}

/**
 * Clear conversation history
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function clearConversation(req, res) {
    const userId = req.user.userId
    gptService.clearConversation(userId)

    res.json({
        success: true,
        message: 'Conversation cleared'
    })
}

/**
 * Health check for AI services
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function healthCheck(req, res) {
    const status = {
        stt: sttService.isAvailable(),
        tts: ttsService.isAvailable(),
        gpt: true // GPT is always available with API key
    }

    res.json({
        success: true,
        services: status
    })
}

module.exports = {
    sendMessage,
    processAudio,
    textToSpeech,
    getConversation,
    clearConversation,
    healthCheck
}
