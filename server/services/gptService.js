/**
 * GPT/AI Service
 * Handles communication with GPT API for chat completions
 */
const fetch = require('node-fetch')
const { getConfig } = require('../config/env')
const { DEFAULT_GPT_MODEL, DEFAULT_MAX_TOKENS } = require('../config/constants')

/**
 * In-memory conversation store
 * In production, this should be moved to a database or cache layer
 */
const conversations = {}

/**
 * Append message to conversation history
 * @param {string} userId - User identifier
 * @param {string} role - Message role ('user' or 'assistant')
 * @param {string} content - Message content
 */
function appendMessage(userId, role, content) {
    if (!conversations[userId]) {
        conversations[userId] = []
    }

    conversations[userId].push({ role, content })

    // Keep last 40 messages to limit memory
    if (conversations[userId].length > 40) {
        conversations[userId].splice(0, conversations[userId].length - 40)
    }
}

/**
 * Get conversation history for user
 * @param {string} userId - User identifier
 * @returns {Array} Conversation history
 */
function getConversation(userId) {
    return conversations[userId] || []
}

/**
 * Clear conversation history for user
 * @param {string} userId - User identifier
 */
function clearConversation(userId) {
    delete conversations[userId]
}

/**
 * Generate assistant reply using GPT
 * @param {string} userId - User identifier
 * @param {string} userMessage - User's message
 * @returns {Promise<string>} Assistant's reply
 * @throws {Error} If GPT API call fails
 */
async function generateReply(userId, userMessage) {
    const config = getConfig()

    // Append user message
    appendMessage(userId, 'user', userMessage)

    // Fallback echo mode if no GPT configured
    if (!config.gptUrl || !config.gptKey) {
        const reply = `Echo: ${userMessage}`
        appendMessage(userId, 'assistant', reply)
        return reply
    }

    try {
        const messages = getConversation(userId)

        // Build request body based on API type
        let requestBody
        if (config.gptUrl.includes('openai.com') || config.gptUrl.includes('/v1/chat')) {
            requestBody = {
                model: config.gptModel || DEFAULT_GPT_MODEL,
                messages: messages.map(m => ({ role: m.role, content: m.content })),
                max_tokens: DEFAULT_MAX_TOKENS
            }
        } else {
            requestBody = {
                messages,
                max_tokens: DEFAULT_MAX_TOKENS
            }
        }

        const response = await fetch(config.gptUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.gptKey}`
            },
            body: JSON.stringify(requestBody)
        })

        if (!response.ok) {
            const body = await response.text().catch(() => '')
            throw new Error(`GPT API error ${response.status}: ${body}`)
        }

        const data = await response.json()

        // Parse response based on different API response formats
        let assistantText = ''
        if (data.reply) {
            assistantText = data.reply
        } else if (data.assistant_message) {
            assistantText = data.assistant_message
        } else if (data.choices?.[0]?.message?.content) {
            assistantText = data.choices[0].message.content
        } else {
            assistantText = JSON.stringify(data)
        }

        appendMessage(userId, 'assistant', assistantText)
        return assistantText

    } catch (err) {
        console.error('GPT service error:', err)
        const errorReply = `Error: ${err.message}`
        appendMessage(userId, 'assistant', errorReply)
        throw err
    }
}

module.exports = {
    appendMessage,
    getConversation,
    clearConversation,
    generateReply
}
