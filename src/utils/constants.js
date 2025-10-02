/**
 * Application Constants
 * Centralized configuration values for the frontend
 */

// API Configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Storage Keys
export const STORAGE_KEYS = {
    AUTH_TOKEN: 'auth_token',
    THEME: 'theme',
    USER_DATA: 'user_data'
}

// Audio Configuration
export const AUDIO_CONFIG = {
    SAMPLE_RATE: 16000,
    CHUNK_SIZE: 4096,
    MIME_TYPE: 'audio/webm',
    MAX_RECORDING_TIME: 60000, // 60 seconds
}

// WebRTC Configuration
export const WEBRTC_CONFIG = {
    ICE_SERVERS: [
        { urls: 'stun:stun.l.google.com:19302' }
    ]
}

// UI Constants
export const UI = {
    TYPING_SPEED: 30, // ms per character
    MESSAGE_FADE_IN: 300, // ms
    SCROLL_BEHAVIOR: 'smooth',
    MAX_MESSAGE_LENGTH: 500
}

// Message Types
export const MESSAGE_TYPES = {
    USER: 'user',
    BOT: 'bot',
    SYSTEM: 'system'
}

// API Endpoints
export const ENDPOINTS = {
    AUTH: {
        REGISTER: '/auth/register',
        LOGIN: '/auth/login',
        ME: '/auth/me'
    },
    CHAT: {
        MESSAGE: '/chat/message',
        VOICE: '/chat/voice',
        TTS: '/chat/tts',
        CONVERSATION: '/chat/conversation',
        HEALTH: '/chat/health'
    }
}
