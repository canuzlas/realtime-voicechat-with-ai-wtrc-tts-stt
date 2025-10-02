/**
 * Application constants
 * Centralized configuration values
 */

module.exports = {
    // Server
    DEFAULT_PORT: 3000,

    // Conversation
    MAX_CONVERSATION_MESSAGES: 40,

    // GPT
    DEFAULT_GPT_MODEL: 'gpt-3.5-turbo',
    DEFAULT_MAX_TOKENS: 300,

    // Audio
    AUDIO_MIME_TYPE: 'audio/webm',
    TTS_CHUNK_SIZE: 64 * 1024, // 64KB

    // JWT
    DEFAULT_JWT_SECRET: 'dev_secret',
    JWT_EXPIRY: '1h',

    // STT Language
    DEFAULT_LANGUAGE_CODE: 'en-US',

    // Audio encodings
    AUDIO_ENCODINGS: {
        wav: 'LINEAR16',
        flac: 'FLAC',
        mp3: 'MP3'
    }
}
