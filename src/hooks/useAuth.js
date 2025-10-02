/**
 * useAuth Hook
 * Manages authentication state and operations
 */

import { useState, useEffect, useCallback } from 'react'
import * as authService from '../services/authService'

export function useAuth() {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    // Check authentication status on mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const userData = authService.getUserData()
                if (userData && authService.isAuthenticated()) {
                    setUser(userData)
                    setIsAuthenticated(true)
                }
            } catch (err) {
                console.error('Auth check error:', err)
            } finally {
                setLoading(false)
            }
        }

        checkAuth()
    }, [])

    const register = useCallback(async (credentials) => {
        try {
            setLoading(true)
            setError(null)
            const data = await authService.register(credentials)
            setUser(data.user)
            setIsAuthenticated(true)
            return data
        } catch (err) {
            setError(err.message)
            throw err
        } finally {
            setLoading(false)
        }
    }, [])

    const login = useCallback(async (credentials) => {
        try {
            setLoading(true)
            setError(null)
            const data = await authService.login(credentials)
            setUser(data.user)
            setIsAuthenticated(true)
            return data
        } catch (err) {
            setError(err.message)
            throw err
        } finally {
            setLoading(false)
        }
    }, [])

    const logout = useCallback(() => {
        authService.logout()
        setUser(null)
        setIsAuthenticated(false)
        setError(null)
    }, [])

    const refreshUser = useCallback(async () => {
        try {
            const data = await authService.getCurrentUser()
            setUser(data.user)
            return data.user
        } catch (err) {
            console.error('Failed to refresh user:', err)
            logout()
            throw err
        }
    }, [logout])

    return {
        user,
        loading,
        error,
        isAuthenticated,
        register,
        login,
        logout,
        refreshUser
    }
}
