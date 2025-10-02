/**
 * API Service
 * Handles HTTP requests to the backend API
 */

import { API_URL, ENDPOINTS } from '../utils/constants'
import { getToken } from './authService'

/**
 * Create request headers with authentication
 * @param {Object} customHeaders - Additional headers
 * @returns {Object} Headers object
 */
function getHeaders(customHeaders = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...customHeaders
    }

    const token = getToken()
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    return headers
}

/**
 * Handle API response
 * @param {Response} response - Fetch response
 * @returns {Promise<Object>} Response data
 */
async function handleResponse(response) {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }))
        throw new Error(error.message || `HTTP ${response.status}`)
    }
    return response.json()
}

/**
 * Send a text message to the AI
 * @param {string} message - Message text
 * @returns {Promise<Object>} Response with reply
 */
export async function sendMessage(message) {
    const response = await fetch(`${API_URL}${ENDPOINTS.CHAT.MESSAGE}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ message })
    })

    return handleResponse(response)
}

/**
 * Send voice audio for transcription and AI response
 * @param {Blob} audioBlob - Audio blob
 * @returns {Promise<Object>} Response with transcription and reply
 */
export async function sendVoiceMessage(audioBlob) {
    const formData = new FormData()
    formData.append('audio', audioBlob, 'recording.webm')

    const token = getToken()
    const headers = {}
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_URL}${ENDPOINTS.CHAT.VOICE}`, {
        method: 'POST',
        headers,
        body: formData
    })

    return handleResponse(response)
}

/**
 * Request text-to-speech conversion
 * @param {string} text - Text to convert
 * @returns {Promise<ArrayBuffer>} Audio data
 */
export async function requestTTS(text) {
    const response = await fetch(`${API_URL}${ENDPOINTS.CHAT.TTS}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ text })
    })

    if (!response.ok) {
        throw new Error('TTS request failed')
    }

    const data = await response.json()

    // Backend returns base64 encoded audio
    if (data.audio) {
        // Decode base64 to ArrayBuffer
        const binaryString = atob(data.audio)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
        }
        return bytes.buffer
    }

    throw new Error('No audio data received')
}

/**
 * Get conversation history
 * @returns {Promise<Object>} Conversation data
 */
export async function getConversation() {
    const response = await fetch(`${API_URL}${ENDPOINTS.CHAT.CONVERSATION}`, {
        headers: getHeaders()
    })

    return handleResponse(response)
}

/**
 * Clear conversation history
 * @returns {Promise<Object>} Success response
 */
export async function clearConversation() {
    const response = await fetch(`${API_URL}${ENDPOINTS.CHAT.CONVERSATION}`, {
        method: 'DELETE',
        headers: getHeaders()
    })

    return handleResponse(response)
}

/**
 * Check health status of services
 * @returns {Promise<Object>} Health status
 */
export async function checkHealth() {
    const response = await fetch(`${API_URL}${ENDPOINTS.CHAT.HEALTH}`)
    return handleResponse(response)
}
