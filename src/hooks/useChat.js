/**
 * useChat Hook
 * Manages chat messages and AI interactions
 */

import { useState, useCallback, useRef } from 'react'
import * as apiService from '../services/apiService'
import { MESSAGE_TYPES } from '../utils/constants'
import { generateId } from '../utils/helpers'

export function useChat() {
    const [messages, setMessages] = useState([
        {
            id: generateId(),
            from: MESSAGE_TYPES.BOT,
            text: 'Hello! I\'m your AI assistant. How can I help you today?',
            fullText: 'Hello! I\'m your AI assistant. How can I help you today?',
            timestamp: Date.now()
        }
    ])
    const [sending, setSending] = useState(false)
    const [error, setError] = useState(null)

    const addMessage = useCallback((message) => {
        setMessages((prev) => [...prev, { ...message, timestamp: Date.now() }])
    }, [])

    const updateMessage = useCallback((id, updates) => {
        setMessages((prev) =>
            prev.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg))
        )
    }, [])

    const sendTextMessage = useCallback(async (text) => {
        if (!text?.trim()) return

        const userMessage = {
            id: generateId(),
            from: MESSAGE_TYPES.USER,
            text: text.trim()
        }

        addMessage(userMessage)
        setSending(true)
        setError(null)

        try {
            const response = await apiService.sendMessage(text.trim())

            const replyText = response.reply || '(no reply)'
            const botMessage = {
                id: generateId(),
                from: MESSAGE_TYPES.BOT,
                text: '',
                fullText: replyText,
                typing: true
            }

            addMessage(botMessage)
            return { userMessage, botMessage, response }
        } catch (err) {
            const errorMessage = {
                id: generateId(),
                from: MESSAGE_TYPES.SYSTEM,
                text: `Error: ${err.message}`,
                isError: true
            }
            addMessage(errorMessage)
            setError(err.message)
            throw err
        } finally {
            setSending(false)
        }
    }, [addMessage])

    const sendVoiceMessage = useCallback(async (audioBlob) => {
        setError(null)

        try {
            const response = await apiService.sendVoiceMessage(audioBlob)

            // Add transcribed user message
            if (response.transcription) {
                const userMessage = {
                    id: generateId(),
                    from: MESSAGE_TYPES.USER,
                    text: response.transcription,
                    fullText: response.transcription,
                    isVoice: true
                }
                addMessage(userMessage)
            }

            // Add bot reply
            if (response.reply) {
                const botMessage = {
                    id: generateId(),
                    from: MESSAGE_TYPES.BOT,
                    text: '',
                    fullText: response.reply,
                    typing: true
                }
                addMessage(botMessage)
            }

            return response
        } catch (err) {
            const errorMessage = {
                id: generateId(),
                from: MESSAGE_TYPES.SYSTEM,
                text: `Voice error: ${err.message}`,
                isError: true
            }
            addMessage(errorMessage)
            setError(err.message)
            throw err
        }
    }, [addMessage])

    const clearMessages = useCallback(() => {
        setMessages([
            {
                id: generateId(),
                from: MESSAGE_TYPES.BOT,
                text: 'Chat cleared. How can I help you?',
                timestamp: Date.now()
            }
        ])
    }, [])

    return {
        messages,
        sending,
        error,
        sendTextMessage,
        sendVoiceMessage,
        addMessage,
        updateMessage,
        clearMessages
    }
}
