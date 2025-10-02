/**
 * Audio Service
 * Handles audio recording, playback, and processing
 */

import { AUDIO_CONFIG } from '../utils/constants'

/**
 * Check if browser supports audio recording
 * @returns {boolean} Is supported
 */
export function isAudioSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
}

/**
 * Request microphone permission and get audio stream
 * @returns {Promise<MediaStream>} Audio stream
 */
export async function getAudioStream() {
    if (!isAudioSupported()) {
        throw new Error('Audio recording is not supported in this browser')
    }

    try {
        return await navigator.mediaDevices.getUserMedia({
            audio: {
                channelCount: 1,
                sampleRate: AUDIO_CONFIG.SAMPLE_RATE,
                echoCancellation: true,
                noiseSuppression: true
            }
        })
    } catch (error) {
        if (error.name === 'NotAllowedError') {
            throw new Error('Microphone permission denied')
        }
        throw new Error('Failed to access microphone: ' + error.message)
    }
}

/**
 * Create MediaRecorder instance
 * @param {MediaStream} stream - Audio stream
 * @param {Function} onDataAvailable - Callback for data chunks
 * @returns {MediaRecorder} MediaRecorder instance
 */
export function createMediaRecorder(stream, onDataAvailable) {
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'

    const recorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000
    })

    recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
            onDataAvailable(event.data)
        }
    }

    return recorder
}

/**
 * Stop all tracks in a media stream
 * @param {MediaStream} stream - Media stream
 */
export function stopStream(stream) {
    if (stream) {
        stream.getTracks().forEach(track => track.stop())
    }
}

/**
 * Create audio blob from chunks
 * @param {Array<Blob>} chunks - Audio chunks
 * @param {string} mimeType - MIME type
 * @returns {Blob} Audio blob
 */
export function createAudioBlob(chunks, mimeType = 'audio/webm') {
    return new Blob(chunks, { type: mimeType })
}

/**
 * Play audio from URL
 * @param {string} url - Audio URL
 * @returns {Promise<HTMLAudioElement>} Audio element
 */
export function playAudioFromUrl(url) {
    return new Promise((resolve, reject) => {
        const audio = new Audio(url)

        audio.oncanplaythrough = () => {
            audio.play()
                .then(() => resolve(audio))
                .catch(reject)
        }

        audio.onerror = () => reject(new Error('Failed to load audio'))
        audio.src = url
    })
}

/**
 * Play audio from ArrayBuffer
 * @param {ArrayBuffer} buffer - Audio buffer
 * @param {AudioContext} audioContext - Web Audio API context
 * @returns {Promise<void>}
 */
export async function playAudioFromBuffer(buffer, audioContext) {
    try {
        // Resume audio context if suspended (browser autoplay policy)
        if (audioContext.state === 'suspended') {
            await audioContext.resume()
        }

        const audioBuffer = await audioContext.decodeAudioData(buffer)
        const source = audioContext.createBufferSource()
        source.buffer = audioBuffer
        source.connect(audioContext.destination)
        source.start(0)

        return new Promise((resolve, reject) => {
            source.onended = resolve
            source.onerror = reject
        })
    } catch (error) {
        console.error('Audio playback error:', error)
        throw new Error('Failed to play audio: ' + error.message)
    }
}

/**
 * Create audio context
 * @returns {AudioContext} Audio context
 */
export function createAudioContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    return new AudioContextClass()
}

/**
 * Convert audio blob to base64
 * @param {Blob} blob - Audio blob
 * @returns {Promise<string>} Base64 string
 */
export function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(blob)
    })
}

/**
 * Get audio duration
 * @param {Blob} blob - Audio blob
 * @returns {Promise<number>} Duration in seconds
 */
export function getAudioDuration(blob) {
    return new Promise((resolve, reject) => {
        const audio = new Audio()
        audio.onloadedmetadata = () => {
            resolve(audio.duration)
            URL.revokeObjectURL(audio.src)
        }
        audio.onerror = reject
        audio.src = URL.createObjectURL(blob)
    })
}
