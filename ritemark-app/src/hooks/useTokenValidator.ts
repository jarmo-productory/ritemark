/**
 * Token Validator Hook
 * Sprint 18: Quick Fix for Token Expiration Detection
 *
 * Periodically checks if OAuth access token has expired and triggers
 * logout + sign-in dialog when expiration is detected.
 *
 * Features:
 * - Checks token every 5 minutes
 * - Validates token on mount
 * - Triggers logout on expiration
 * - Returns flag to show authentication dialog
 *
 * @example
 * ```tsx
 * const { shouldShowAuthDialog } = useTokenValidator()
 *
 * return (
 *   <>
 *     {shouldShowAuthDialog && <AuthModal />}
 *   </>
 * )
 * ```
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { tokenManagerEncrypted } from '../services/auth/TokenManagerEncrypted'

/**
 * Token validation check interval (5 minutes)
 */
const TOKEN_CHECK_INTERVAL = 5 * 60 * 1000 // 5 minutes

/**
 * Hook return type
 */
export interface UseTokenValidatorReturn {
  /**
   * Flag indicating if authentication dialog should be shown
   */
  shouldShowAuthDialog: boolean

  /**
   * Manually trigger token validation
   */
  validateToken: () => void

  /**
   * Reset the auth dialog flag (after user dismisses or authenticates)
   */
  dismissAuthDialog: () => void

  /**
   * Imperatively show the auth dialog (e.g., on 401 from API)
   */
  triggerAuthDialog: () => void
}

/**
 * Periodically validates OAuth token and triggers logout on expiration
 *
 * @returns Token validator state and control functions
 */
export function useTokenValidator(): UseTokenValidatorReturn {
  const { isAuthenticated, logout } = useAuth()
  const [shouldShowAuthDialog, setShouldShowAuthDialog] = useState(false)

  /**
   * Check if token is expired and handle accordingly
   *
   * Sprint 26 Fix: Use tokenManagerEncrypted (memory-based) instead of old tokenManager (sessionStorage).
   * TokenManagerEncrypted automatically handles token refresh in getAccessToken(), so we don't need
   * to call logout() here. Only logout if the token is null (meaning refresh failed).
   */
  const validateToken = useCallback(async () => {
    // Only check if user is authenticated
    if (!isAuthenticated) {
      return
    }

    // Check if token is still valid by attempting to get it
    // TokenManagerEncrypted.getAccessToken() will automatically refresh if needed
    const token = await tokenManagerEncrypted.getAccessToken()

    // Only logout if we truly have no token (refresh failed)
    if (!token) {
      console.warn('[TokenValidator] No valid access token (refresh failed), logging out user')

      // Clear tokens and user session
      logout()

      // Show authentication dialog
      setShouldShowAuthDialog(true)
    }
  }, [isAuthenticated, logout])

  /**
   * Dismiss authentication dialog
   */
  const dismissAuthDialog = useCallback(() => {
    setShouldShowAuthDialog(false)
  }, [])

  /**
   * Imperatively open the auth dialog
   */
  const triggerAuthDialog = useCallback(() => {
    setShouldShowAuthDialog(true)
  }, [])

  /**
   * Set up periodic token validation
   */
  useEffect(() => {
    // Skip if not authenticated
    if (!isAuthenticated) {
      return
    }

    // Validate immediately on mount
    validateToken()

    // Set up interval for periodic checks
    const intervalId = setInterval(() => {
      validateToken()
    }, TOKEN_CHECK_INTERVAL)

    console.log(
      `[TokenValidator] Started periodic token validation (every ${TOKEN_CHECK_INTERVAL / 1000 / 60} minutes)`
    )

    // Cleanup interval on unmount
    return () => {
      clearInterval(intervalId)
      console.log('[TokenValidator] Stopped periodic token validation')
    }
  }, [isAuthenticated, validateToken])

  return {
    shouldShowAuthDialog,
    validateToken,
    dismissAuthDialog,
    triggerAuthDialog,
  }
}
