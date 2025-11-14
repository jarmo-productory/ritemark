import React, { createContext, useState, useCallback, useEffect } from 'react'
import type { AuthContextType, GoogleUser } from '../types/auth'
import { tokenManagerEncrypted } from '../services/auth/TokenManagerEncrypted'
// Sprint 26: Removed tokenValidator import - validation now handled by useTokenValidator hook in App.tsx

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<GoogleUser | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null) // User.sub for rate limiting

  const isAuthenticated = !!user

  // Restore user session from sessionStorage on mount (with token validation)
  useEffect(() => {
    const storedUser = sessionStorage.getItem('ritemark_user')
    const storedTokens = sessionStorage.getItem('ritemark_oauth_tokens')

    // Only log session restore if there's actually data to restore
    if (storedUser && storedTokens) {
      console.log('[AuthContext] 🔍 Restoring session')

      try {
        const userData = JSON.parse(storedUser) as GoogleUser
        const tokenData = JSON.parse(storedTokens)

        // Check for debug expiry override
        const urlParams = new URLSearchParams(window.location.search)
        const debugExpirySeconds = urlParams.get('debug_token_expiry')

        let expiresAt = tokenData.expiresAt
        if (debugExpirySeconds) {
          const debugExpiry = Date.now() + (parseInt(debugExpirySeconds) * 1000)
          console.warn('[AuthContext] ⚠️  DEBUG MODE: Token expiry overridden', {
            originalExpiry: new Date(expiresAt).toISOString(),
            debugExpiry: new Date(debugExpiry).toISOString(),
            expiresInSeconds: debugExpirySeconds
          })
          expiresAt = debugExpiry
          // Update sessionStorage with debug expiry for consistency
          tokenData.expiresAt = debugExpiry
          sessionStorage.setItem('ritemark_oauth_tokens', JSON.stringify(tokenData))
        }

        // Validate token expiry
        const isExpired = !expiresAt || expiresAt <= Date.now()
        const timeUntilExpiry = expiresAt - Date.now()

        if (isExpired) {
          console.log('[AuthContext] Token expired, refreshing...')

          // CRITICAL FIX: Don't logout immediately - try to refresh token first!
          // Restore user state optimistically (will be cleared if refresh fails)
          setUser(userData)

          // Restore tokens to memory (needed for refresh to work)
          tokenManagerEncrypted
            .storeTokens(tokenData)
            .then(async () => {
              // Restore user.sub from localStorage (needed for backend refresh)
              const { userIdentityManager } = await import('../services/auth/tokenManager')
              const userInfo = userIdentityManager.getUserInfo()

              if (userInfo) {
                setUserId(userInfo.userId)
              }

              // Attempt token refresh
              return tokenManagerEncrypted.refreshAccessToken()
            })
            .then((result) => {
              if (result.success) {
                console.log('[AuthContext] ✅ Token refreshed successfully')
                // Token refresh updates memory automatically, no need to update state
              } else {
                console.warn('[AuthContext] Token refresh failed:', result.error?.message)
                logout()
              }
            })
            .catch((err) => {
              console.error('[AuthContext] Token refresh exception:', err instanceof Error ? err.message : String(err))
              logout()
            })
        } else {
          setUser(userData)

          // CRITICAL: Restore tokens to tokenManagerEncrypted memory FIRST (must complete before validation)
          tokenManagerEncrypted
            .storeTokens(tokenData)
            .then(() => {
              // Sprint 26 Fix: Removed duplicate TokenValidator service call.
              // Token validation is now handled by useTokenValidator hook in App.tsx (periodic checks).
              // The hook's interval starts when isAuthenticated becomes true (after this setUser() call).
              // No need for duplicate validation here - the hook handles it.
            })
            .catch((err) => {
              console.error('[AuthContext] Failed to restore tokens:', err)
              // If token restoration fails, logout immediately
              logout()
            })

          // Restore user.sub from localStorage
          import('../services/auth/tokenManager').then(({ userIdentityManager }) => {
            const userInfo = userIdentityManager.getUserInfo()
            if (userInfo) {
              setUserId(userInfo.userId)
            }
          })
        }
      } catch (err) {
        console.error('Failed to restore user session:', err)
        sessionStorage.removeItem('ritemark_user')
        sessionStorage.removeItem('ritemark_oauth_tokens')
        sessionStorage.removeItem('ritemark_refresh_token')
        setUser(null)
        setUserId(null)
      }
    }
  }, [])

  const login = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // This will be triggered by Google OAuth button in AuthModal
      // The actual OAuth flow is handled by @react-oauth/google
      // This function sets the loading state for UI feedback
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false) // Always clear loading state
    }
  }, [])

  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      setUser(null)
      setUserId(null) // Clear userId state
      setError(null)
      sessionStorage.removeItem('ritemark_user')
      sessionStorage.removeItem('ritemark_oauth_tokens') // Use correct key

      // Clear encrypted tokens from IndexedDB and memory
      tokenManagerEncrypted.clearTokens()

      // Clear user identity on logout
      const { userIdentityManager } = await import('../services/auth/tokenManager')
      userIdentityManager.clearUserInfo()

      // Sprint 26: Token validation stopped automatically by useTokenValidator hook when isAuthenticated becomes false
    } finally {
      setIsLoading(false) // Always clear loading state
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    const tokens = sessionStorage.getItem('ritemark_oauth_tokens') // Use correct key
    if (!tokens) return null

    try {
      const tokenData = JSON.parse(tokens)
      return tokenData.access_token || tokenData.accessToken || null
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
    userId, // Expose userId for rate limiting and sync
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
