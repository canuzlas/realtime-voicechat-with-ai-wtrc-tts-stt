/**
 * useTypingAnimation Hook
 * Manages typing animation for bot messages
 */

import { useEffect, useRef, useCallback } from 'react'
import { UI } from '../utils/constants'

export function useTypingAnimation(messages, updateMessage) {
    const timersRef = useRef({})

    const startTypingAnimation = useCallback((messageId, fullText) => {
        // Clear any existing timer for this message
        if (timersRef.current[messageId]) {
            clearInterval(timersRef.current[messageId])
        }

        let charIndex = 0
        const chars = fullText.split('')

        timersRef.current[messageId] = setInterval(() => {
            charIndex++
            const partial = chars.slice(0, charIndex).join('')

            updateMessage(messageId, {
                text: partial,
                typing: charIndex < chars.length
            })

            if (charIndex >= chars.length) {
                clearInterval(timersRef.current[messageId])
                delete timersRef.current[messageId]
            }
        }, UI.TYPING_SPEED)
    }, [updateMessage])

    const stopTypingAnimation = useCallback((messageId) => {
        if (timersRef.current[messageId]) {
            clearInterval(timersRef.current[messageId])
            delete timersRef.current[messageId]
        }
    }, [])

    const stopAllAnimations = useCallback(() => {
        Object.keys(timersRef.current).forEach((id) => {
            clearInterval(timersRef.current[id])
        })
        timersRef.current = {}
    }, [])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopAllAnimations()
        }
    }, [stopAllAnimations])

    // Auto-start typing animation for new bot messages with typing flag
    useEffect(() => {
        messages.forEach((msg) => {
            if (msg.from === 'bot' && msg.typing && msg.fullText && !timersRef.current[msg.id]) {
                const currentLength = msg.text?.length || 0
                const fullText = msg.fullText

                if (currentLength < fullText.length) {
                    startTypingAnimation(msg.id, fullText)
                } else {
                    // Already fully typed
                    updateMessage(msg.id, { typing: false })
                }
            }
        })
    }, [messages, startTypingAnimation, updateMessage])

    return {
        startTypingAnimation,
        stopTypingAnimation,
        stopAllAnimations
    }
}
