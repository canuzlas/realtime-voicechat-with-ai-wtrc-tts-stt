/**
 * useAudioRecording Hook
 * Manages audio recording functionality
 */

import { useState, useCallback, useRef } from 'react'
import * as audioService from '../services/audioService'

export function useAudioRecording() {
    const [isRecording, setIsRecording] = useState(false)
    const [error, setError] = useState(null)
    const [duration, setDuration] = useState(0)

    const mediaRecorderRef = useRef(null)
    const chunksRef = useRef([])
    const streamRef = useRef(null)
    const durationIntervalRef = useRef(null)

    const startRecording = useCallback(async () => {
        try {
            setError(null)
            setDuration(0)

            // Get audio stream
            const stream = await audioService.getAudioStream()
            streamRef.current = stream

            // Create recorder
            const recorder = audioService.createMediaRecorder(stream, (chunk) => {
                chunksRef.current.push(chunk)
            })

            mediaRecorderRef.current = recorder
            recorder.start(250) // Collect data every 250ms
            setIsRecording(true)

            // Start duration timer
            const startTime = Date.now()
            durationIntervalRef.current = setInterval(() => {
                setDuration(Math.floor((Date.now() - startTime) / 1000))
            }, 1000)

            console.log('[AudioRecording] Recording started')
        } catch (err) {
            setError(err.message)
            throw err
        }
    }, [])

    const stopRecording = useCallback(() => {
        return new Promise((resolve, reject) => {
            try {
                if (!mediaRecorderRef.current || !isRecording) {
                    reject(new Error('Not recording'))
                    return
                }

                const recorder = mediaRecorderRef.current

                recorder.onstop = () => {
                    try {
                        // Clear duration timer
                        if (durationIntervalRef.current) {
                            clearInterval(durationIntervalRef.current)
                            durationIntervalRef.current = null
                        }

                        // Create audio blob
                        const audioBlob = audioService.createAudioBlob(
                            chunksRef.current,
                            recorder.mimeType
                        )

                        // Cleanup
                        audioService.stopStream(streamRef.current)
                        chunksRef.current = []
                        streamRef.current = null
                        mediaRecorderRef.current = null
                        setIsRecording(false)

                        console.log('[AudioRecording] Recording stopped, blob size:', audioBlob.size)
                        resolve(audioBlob)
                    } catch (err) {
                        setError(err.message)
                        reject(err)
                    }
                }

                recorder.stop()
            } catch (err) {
                setError(err.message)
                reject(err)
            }
        })
    }, [isRecording])

    const cancelRecording = useCallback(() => {
        if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current)
            durationIntervalRef.current = null
        }

        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
        }

        audioService.stopStream(streamRef.current)
        chunksRef.current = []
        streamRef.current = null
        mediaRecorderRef.current = null
        setIsRecording(false)
        setDuration(0)
        console.log('[AudioRecording] Recording cancelled')
    }, [isRecording])

    return {
        isRecording,
        error,
        duration,
        startRecording,
        stopRecording,
        cancelRecording
    }
}
