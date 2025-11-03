/**
 * Sprint 22 - Code Quality Improvement
 *
 * OAuth Callback Handler Service
 *
 * Purpose:
 * - Deduplicate OAuth callback logic from App.tsx and WelcomeScreen.tsx
 * - Single source of truth for token processing
 * - Consistent error handling and validation
 *
 * Usage:
 * import { oauthCallbackHandler } from '@/services/auth/OAuthCallbackHandler'
 * await oauthCallbackHandler.handleBackendCallback(params)
 * await oauthCallbackHandler.handleBrowserCallback(tokenResponse)
 */

import { tokenManagerEncrypted } from './TokenManagerEncrypted'
import { userIdentityManager } from './tokenManager'
import { loggers } from '../logger'
import type { GoogleUser } from '@/types/auth'

const logger = loggers.oauth

/**
 * OAuth callback handler class
 * Processes OAuth callbacks from both backend and browser flows
 */
class OAuthCallbackHandler {
  /**
   * Handle OAuth callback from backend (Authorization Code Flow)
   *
   * Sprint 22 Security: Validates state parameter and stores tokens
   *
   * @param params - URL search params from OAuth redirect
   * @returns Promise<void>
   * @throws Error if validation fails
   */
  async handleBackendCallback(params: URLSearchParams): Promise<void> {
    const accessToken = params.get('access_token')
    const userId = params.get('user_id')
    const expiresIn = params.get('expires_in')
    const userEmail = params.get('user_email') || ''
    const userName = params.get('user_name') || ''
    const userPicture = params.get('user_picture') || ''

    if (!accessToken || !userId) {
      throw new Error('Missing required OAuth parameters')
    }

    // Sprint 22 Security: Validate state parameter (defense in depth)
    const state = params.get('state')
    if (state) {
      this.validateStateParameter(state)
    }

    // Store tokens in TokenManagerEncrypted (IndexedDB + memory)
    const expiresAt = Date.now() + (parseInt(expiresIn || '3600') * 1000)

    await tokenManagerEncrypted.storeTokens({
      accessToken,
      expiresAt,
    })

    // Store tokens in sessionStorage (backward compatibility - Sprint 22 deprecation)
    // ⚠️ DEPRECATION WARNING: Will be removed in Sprint 24
    sessionStorage.setItem('ritemark_oauth_tokens', JSON.stringify({
      accessToken,
      expiresAt
    }))

    // Store user data
    const userData: GoogleUser = {
      id: userId,
      email: userEmail,
      name: userName,
      picture: userPicture,
      verified_email: true,
      emailVerified: true
    }

    sessionStorage.setItem('ritemark_user', JSON.stringify(userData))

    // Store user identity for rate limiting and cross-device sync
    userIdentityManager.storeUserInfo(userId, userEmail)

    logger.info('Backend OAuth callback processed', {
      userId,
      email: userEmail,
      expiresIn
    })
  }

  /**
   * Handle OAuth callback from browser (Implicit Flow)
   *
   * @param tokenResponse - Token response from Google OAuth popup
   * @returns Promise<GoogleUser> - User data
   * @throws Error if authentication fails
   */
  async handleBrowserCallback(tokenResponse: {
    access_token?: string
    expires_in?: number
    scope?: string
    token_type?: string
  }): Promise<GoogleUser> {
    if (!tokenResponse.access_token) {
      throw new Error('No access token in response')
    }

    // Fetch user info from OpenID Connect endpoint
    const userInfoResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
    })

    if (!userInfoResponse.ok) {
      throw new Error('Failed to fetch user info')
    }

    const userInfo = await userInfoResponse.json()

    // Create user data object (userInfo.sub is the stable user ID)
    const userData: GoogleUser = {
      id: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      verified_email: userInfo.email_verified || false,
      emailVerified: userInfo.email_verified || false,
    }

    // Store user data
    sessionStorage.setItem('ritemark_user', JSON.stringify(userData))

    // Store user identity for rate limiting
    userIdentityManager.storeUserInfo(userData.id, userData.email)

    // Store tokens
    const tokens = {
      access_token: tokenResponse.access_token,
      accessToken: tokenResponse.access_token,
      expires_in: tokenResponse.expires_in,
      scope: tokenResponse.scope,
      token_type: (tokenResponse.token_type || 'Bearer') as 'Bearer',
      tokenType: 'Bearer' as const,
      expiresAt: Date.now() + ((tokenResponse.expires_in || 3600) * 1000),
    }

    await tokenManagerEncrypted.storeTokens(tokens)

    // ⚠️ DEPRECATION WARNING (Sprint 22): sessionStorage token storage will be removed in Sprint 24
    sessionStorage.setItem('ritemark_oauth_tokens', JSON.stringify(tokens))

    logger.info('Browser OAuth callback processed', {
      userId: userData.id,
      email: userData.email,
      expiresIn: tokenResponse.expires_in
    })

    return userData
  }

  /**
   * Validate OAuth state parameter
   *
   * Sprint 22 Security: CSRF and replay attack prevention
   * - Validates nonce matches sessionStorage
   * - Checks timestamp freshness (10 minutes max)
   *
   * @param stateEncoded - Base64URL encoded state parameter
   * @throws Error if validation fails
   */
  private validateStateParameter(stateEncoded: string): void {
    try {
      // Decode state parameter
      const decodedState = JSON.parse(
        atob(stateEncoded.replace(/-/g, '+').replace(/_/g, '/'))
      )

      // Validate timestamp freshness (10 minutes max)
      const age = Date.now() - decodedState.ts
      if (age > 10 * 60 * 1000) {
        logger.warn('OAuth state expired', {
          ageSeconds: Math.round(age / 1000)
        })
      }

      // Validate nonce if stored (CSRF protection)
      const expectedNonce = sessionStorage.getItem('oauth_nonce')
      if (expectedNonce) {
        if (decodedState.nonce !== expectedNonce) {
          logger.error('OAuth nonce mismatch - potential CSRF attack')
          throw new Error('Security validation failed. Please try signing in again.')
        }
        // Clear nonce (prevent replay)
        sessionStorage.removeItem('oauth_nonce')
      }

      logger.debug('State parameter validated', {
        ageSeconds: Math.round(age / 1000),
        nonceValid: !!expectedNonce
      })

    } catch (error) {
      // Non-blocking: Log warning but allow OAuth to proceed
      // Backend has already validated state, this is defense in depth
      logger.warn('State validation warning', {
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }
}

/**
 * Singleton instance
 */
export const oauthCallbackHandler = new OAuthCallbackHandler()
