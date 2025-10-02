/**
 * Utility Helper Functions
 * Reusable helper functions for common operations
 */

/**
 * Format timestamp to readable time
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Formatted time string
 */
export function formatTime(timestamp) {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    })
}

/**
 * Truncate text to max length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncate(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300) {
    let timeout
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout)
            func(...args)
        }
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
    }
}

/**
 * Generate unique ID
 * @returns {string} Unique ID
 */
export function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid email
 */
export function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
}

/**
 * Get error message from error object
 * @param {Error|string} error - Error object or message
 * @returns {string} Error message
 */
export function getErrorMessage(error) {
    if (typeof error === 'string') return error
    if (error?.message) return error.message
    return 'An unknown error occurred'
}

/**
 * Sleep/delay function
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after delay
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Check if user is on mobile device
 * @returns {boolean} Is mobile
 */
export function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text)
        return true
    } catch (err) {
        console.error('Failed to copy:', err)
        return false
    }
}
