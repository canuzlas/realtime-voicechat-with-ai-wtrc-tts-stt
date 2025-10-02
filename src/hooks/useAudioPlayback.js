/**
 * useAudioPlayback Hook
 * Manages TTS audio playback
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import * as audioService from '../services/audioService'
import * as apiService from '../services/apiService'

export function useAudioPlayback() {
    const [isPlaying, setIsPlaying] = useState(false)
    const [error, setError] = useState(null)

    const audioRef = useRef(null)
    const audioContextRef = useRef(null)
    const audioUrlRef = useRef(null)

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close().catch(() => { })
            }
            if (audioUrlRef.current) {
                URL.revokeObjectURL(audioUrlRef.current)
            }
            if (audioRef.current) {
                audioRef.current.pause()
            }
        }
    }, [])

    const playTextToSpeech = useCallback(async (text) => {
        if (!text?.trim()) {
            console.warn('[AudioPlayback] Empty text, skipping TTS')
            return
        }

        try {
            console.log('[AudioPlayback] Starting TTS for text:', text.substring(0, 50) + '...')
            setIsPlaying(true)
            setError(null)

            // Lazy initialize audio context
            if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                console.log('[AudioPlayback] Creating new AudioContext')
                audioContextRef.current = audioService.createAudioContext()
            }

            console.log('[AudioPlayback] AudioContext state:', audioContextRef.current.state)

            // Request TTS from backend
            console.log('[AudioPlayback] Requesting TTS from backend...')
            const audioBuffer = await apiService.requestTTS(text.trim())
            console.log('[AudioPlayback] Received audio buffer, size:', audioBuffer.byteLength)

            // Play audio
            console.log('[AudioPlayback] Playing audio...')
            await audioService.playAudioFromBuffer(audioBuffer, audioContextRef.current)

            console.log('[AudioPlayback] TTS played successfully')
        } catch (err) {
            console.error('[AudioPlayback] TTS error:', err)
            setError(err.message)
            throw err
        } finally {
            setIsPlaying(false)
        }
    }, [])

    const playAudioUrl = useCallback(async (url) => {
        try {
            setIsPlaying(true)
            setError(null)

            const audio = await audioService.playAudioFromUrl(url)
            audioRef.current = audio

            audio.onended = () => {
                setIsPlaying(false)
                audioRef.current = null
            }

            console.log('[AudioPlayback] Audio URL played')
        } catch (err) {
            console.error('[AudioPlayback] URL playback error:', err)
            setError(err.message)
            setIsPlaying(false)
        }
    }, [])

    const stopPlayback = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current = null
        }
        setIsPlaying(false)
    }, [])

    return {
        isPlaying,
        error,
        playTextToSpeech,
        playAudioUrl,
        stopPlayback
    }
}
