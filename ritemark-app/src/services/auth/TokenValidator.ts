/**
 * Sprint 22 - Security Enhancement
 *
 * OAuth Token Introspection Service
 *
 * Purpose:
 * - Periodically validate OAuth tokens with Google
 * - Auto-logout on invalid/expired tokens
 * - Detect token revocation and security issues
 *
 * Implementation:
 * - Checks token validity every 15 minutes
 * - Uses Google's tokeninfo endpoint
 * - Non-blocking (fails open for availability)
 *
 * Usage:
 * import { tokenValidator } from '@/services/auth/TokenValidator'
 * tokenValidator.startValidation() // In AuthContext
 * tokenValidator.stopValidation() // On logout
 */

import { tokenManagerEncrypted } from './TokenManagerEncrypted'
import { loggers } from '../logger'

const logger = loggers.security

/**
 * Token validation response from Google tokeninfo endpoint
 */
interface TokenInfo {
  azp?: string          // Authorized party (client ID)
  aud?: string          // Audience
  sub?: string          // User ID
  scope?: string        // Token scopes
  exp?: string          // Expiration timestamp
  expires_in?: string   // Seconds until expiration
  email?: string        // User email
  email_verified?: string // Email verification status
  access_type?: string  // Access type (online/offline)
}

/**
 * Token Validator Class
 */
class TokenValidator {
  private validationInterval: NodeJS.Timeout | null = null
  private readonly VALIDATION_INTERVAL_MS = 15 * 60 * 1000 // 15 minutes
  private readonly GOOGLE_TOKENINFO_URL = 'https://oauth2.googleapis.com/tokeninfo'
  private onInvalidToken?: () => void

  /**
   * Start periodic token validation
   *
   * @param onInvalidToken - Callback to execute when token is invalid (e.g., logout)
   */
  startValidation(onInvalidToken?: () => void): void {
    this.onInvalidToken = onInvalidToken

    // Clear any existing interval
    this.stopValidation()

    // Validate immediately on start
    this.validateToken()

    // Then validate periodically
    this.validationInterval = setInterval(() => {
      this.validateToken()
    }, this.VALIDATION_INTERVAL_MS)

    logger.info('Token validation started', {
      intervalMs: this.VALIDATION_INTERVAL_MS
    })
  }

  /**
   * Stop periodic token validation
   */
  stopValidation(): void {
    if (this.validationInterval) {
      clearInterval(this.validationInterval)
      this.validationInterval = null
      logger.info('Token validation stopped')
    }
  }

  /**
   * Validate current access token with Google
   *
   * Sprint 22: Non-blocking validation (fails open)
   * - On success: Log success and continue
   * - On failure: Trigger onInvalidToken callback
   * - On network error: Log warning but don't invalidate (fail open)
   */
  private async validateToken(): Promise<void> {
    try {
      const accessToken = await tokenManagerEncrypted.getAccessToken()

      if (!accessToken) {
        logger.debug('No access token to validate')
        return
      }

      // Call Google's tokeninfo endpoint
      const response = await fetch(`${this.GOOGLE_TOKENINFO_URL}?access_token=${accessToken}`)

      if (!response.ok) {
        // Token is invalid or expired
        logger.error('Token validation failed', undefined, {
          status: response.status,
          statusText: response.statusText
        })

        // Trigger logout callback
        if (this.onInvalidToken) {
          this.onInvalidToken()
        }

        return
      }

      const tokenInfo: TokenInfo = await response.json()

      // Validate token properties
      if (!tokenInfo.exp || !tokenInfo.email) {
        logger.warn('Token missing required fields', {
          hasExp: !!tokenInfo.exp,
          hasEmail: !!tokenInfo.email
        })
        return
      }

      logger.debug('Token validation successful', {
        email: tokenInfo.email,
        expiresIn: tokenInfo.expires_in,
        scopes: tokenInfo.scope?.split(' ').length || 0
      })

    } catch (error) {
      // Network error or other failure
      // Sprint 22: Fail open (don't invalidate token on network errors)
      logger.warn('Token validation error (failing open)', {
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  /**
   * Manually trigger token validation
   *
   * @returns Promise<boolean> - True if token is valid, false otherwise
   */
  async checkTokenNow(): Promise<boolean> {
    try {
      const accessToken = await tokenManagerEncrypted.getAccessToken()

      if (!accessToken) {
        return false
      }

      const response = await fetch(`${this.GOOGLE_TOKENINFO_URL}?access_token=${accessToken}`)
      return response.ok

    } catch (error) {
      logger.error('Manual token check failed', error)
      return false
    }
  }
}

/**
 * Singleton instance
 */
export const tokenValidator = new TokenValidator()
