/**
 * Environment configuration
 * Centralized access to environment variables with validation
 */
require('dotenv').config()
const { DEFAULT_PORT, DEFAULT_JWT_SECRET } = require('./constants')

/**
 * Get environment configuration
 * @returns {Object} Environment config object
 */
function getConfig() {
    return {
        // Server
        port: process.env.PORT || DEFAULT_PORT,
        nodeEnv: process.env.NODE_ENV || 'development',

        // Database
        mongodbUri: process.env.MONGODB_URI || process.env.MONGO_URL || null,

        // JWT
        jwtSecret: process.env.JWT_SECRET || DEFAULT_JWT_SECRET,

        // GPT/OpenAI
        gptUrl: process.env.GPT_MINI_URL || process.env.GPT_URL || null,
        gptKey: process.env.GPT_MINI_KEY || process.env.GPT_API_KEY || process.env.GPT_KEY || null,
        gptModel: process.env.GPT_MODEL || null,

        // Google Cloud
        googleCredentials: process.env.GOOGLE_APPLICATION_CREDENTIALS || null,
        googleTtsKey: process.env.GOOGLE_TTS_KEY || process.env.GOOGLE_TTS_TOKEN || null,
        googleSpeechKey: process.env.GOOGLE_SPEECH_KEY || null,

        // Socket.IO
        sioOrigin: process.env.SIO_ORIGIN || '*'
    }
}

/**
 * Validate required environment variables
 * @param {Array<string>} required - Array of required env var names
 * @throws {Error} If required variables are missing
 */
function validateEnv(required = []) {
    const config = getConfig()
    const missing = []

    for (const key of required) {
        if (!config[key]) {
            missing.push(key.toUpperCase())
        }
    }

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
    }
}

/**
 * Check if Google Cloud credentials are available
 * @returns {boolean}
 */
function hasGoogleCredentials() {
    const config = getConfig()
    const fs = require('fs')

    const hasCredFile = config.googleCredentials && fs.existsSync(config.googleCredentials)
    const hasKey = Boolean(config.googleTtsKey || config.googleSpeechKey)

    return hasCredFile || hasKey
}

module.exports = {
    getConfig,
    validateEnv,
    hasGoogleCredentials
}
