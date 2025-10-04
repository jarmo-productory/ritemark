import React, { createContext, useState, useCallback, useEffect } from 'react'
import type { AuthContextType, GoogleUser } from '../types/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<GoogleUser | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const isAuthenticated = !!user

  // Restore user session from sessionStorage on mount
  useEffect(() => {
    const storedUser = sessionStorage.getItem('ritemark_user')
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser) as GoogleUser
        setUser(userData)
      } catch (err) {
        console.error('Failed to restore user session:', err)
        sessionStorage.removeItem('ritemark_user')
      }
    }
  }, [])

  const login = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    // This will be triggered by Google OAuth button in AuthModal
    // The actual OAuth flow is handled by @react-oauth/google
    // This function sets the loading state for UI feedback
  }, [])

  const logout = useCallback(async () => {
    setUser(null)
    setError(null)
    sessionStorage.removeItem('ritemark_user')
    sessionStorage.removeItem('ritemark_tokens')
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    const tokens = sessionStorage.getItem('ritemark_tokens')
    if (!tokens) return null

    try {
      const tokenData = JSON.parse(tokens)
      return tokenData.accessToken || tokenData.access_token || null
    } catch {
      return null
    }
  }, [])

  const refreshToken = useCallback(async (): Promise<void> => {
    // Token refresh will be implemented when backend is ready
    console.warn('Token refresh not yet implemented')
  }, [])

  // Note: User authentication is handled by AuthModal component
  // which directly updates sessionStorage and triggers page reload

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    clearError,
    getAccessToken,
    refreshToken,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }
