/**
 * Authentication Service
 * Handles user authentication, token management, and user data
 */

import { API_URL, STORAGE_KEYS, ENDPOINTS } from '../utils/constants'

/**
 * Get authentication token from storage
 * @returns {string|null} Auth token
 */
export function getToken() {
    try {
        return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    } catch (error) {
        console.error('Error getting token:', error)
        return null
    }
}

/**
 * Set authentication token in storage
 * @param {string} token - JWT token
 */
export function setToken(token) {
    try {
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token)
    } catch (error) {
        console.error('Error setting token:', error)
    }
}

/**
 * Remove authentication token from storage
 */
export function removeToken() {
    try {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
        localStorage.removeItem(STORAGE_KEYS.USER_DATA)
    } catch (error) {
        console.error('Error removing token:', error)
    }
}

/**
 * Get user data from storage
 * @returns {Object|null} User data
 */
export function getUserData() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.USER_DATA)
        return data ? JSON.parse(data) : null
    } catch (error) {
        console.error('Error getting user data:', error)
        return null
    }
}

/**
 * Set user data in storage
 * @param {Object} userData - User data object
 */
export function setUserData(userData) {
    try {
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData))
    } catch (error) {
        console.error('Error setting user data:', error)
    }
}

/**
 * Register a new user
 * @param {Object} credentials - User credentials
 * @param {string} credentials.name - User name
 * @param {string} credentials.email - User email
 * @param {string} credentials.password - User password
 * @returns {Promise<Object>} Response with token and user data
 */
export async function register({ name, email, password }) {
    const response = await fetch(`${API_URL}${ENDPOINTS.AUTH.REGISTER}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Registration failed')
    }

    const data = await response.json()

    if (data.token) {
        setToken(data.token)
    }
    if (data.user) {
        setUserData(data.user)
    }

    return data
}

/**
 * Login user
 * @param {Object} credentials - User credentials
 * @param {string} credentials.email - User email
 * @param {string} credentials.password - User password
 * @returns {Promise<Object>} Response with token and user data
 */
export async function login({ email, password }) {
    const response = await fetch(`${API_URL}${ENDPOINTS.AUTH.LOGIN}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Login failed')
    }

    const data = await response.json()

    if (data.token) {
        setToken(data.token)
    }
    if (data.user) {
        setUserData(data.user)
    }

    return data
}

/**
 * Get current user info
 * @returns {Promise<Object>} User data
 */
export async function getCurrentUser() {
    const token = getToken()
    if (!token) {
        throw new Error('No authentication token')
    }

    const response = await fetch(`${API_URL}${ENDPOINTS.AUTH.ME}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })

    if (!response.ok) {
        throw new Error('Failed to get user info')
    }

    const data = await response.json()
    if (data.user) {
        setUserData(data.user)
    }

    return data
}

/**
 * Logout user
 */
export function logout() {
    removeToken()
}

/**
 * Check if user is authenticated
 * @returns {boolean} Is authenticated
 */
export function isAuthenticated() {
    return !!getToken()
}
