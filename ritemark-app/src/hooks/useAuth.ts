import { useContext } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import type { AuthContextType } from '../types/auth'

/**
 * Custom hook to access authentication context
 * Must be used within AuthProvider component tree
 *
 * @throws Error if used outside AuthProvider
 * @returns AuthContextType with user state and auth methods
 *
 * @example
 * const { user, isAuthenticated, login, logout } = useAuth()
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
