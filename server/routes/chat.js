/**
 * Chat Routes
 * Handles chat messages, audio processing, and AI services
 */
const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const chatController = require('../controllers/chatController')
const { verifyJWT } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/errorHandler')

// Configure multer for audio uploads
const uploadsDir = path.join(__dirname, '..', 'uploads')
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
}
const upload = multer({ dest: uploadsDir })

// POST /chat/message - Send text message (protected)
router.post('/message', verifyJWT, asyncHandler(chatController.sendMessage))

// POST /chat/voice - Process audio file (STT + GPT + TTS) (protected)
router.post('/voice', verifyJWT, upload.single('audio'), asyncHandler(chatController.processAudio))

// POST /chat/tts - Text to speech conversion
router.post('/tts', verifyJWT, asyncHandler(chatController.textToSpeech))

// GET /chat/conversation - Get conversation history (protected)
router.get('/conversation', verifyJWT, asyncHandler(chatController.getConversation))

// DELETE /chat/conversation - Clear conversation history (protected)
router.delete('/conversation', verifyJWT, asyncHandler(chatController.clearConversation))

// GET /chat/health - Health check for AI services
router.get('/health', asyncHandler(chatController.healthCheck))

module.exports = router

