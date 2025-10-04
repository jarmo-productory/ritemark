/**
 * Unit Tests for Google OAuth Service
 * Sprint 7: OAuth Testing with real coverage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GoogleAuth } from '../../../src/services/auth/googleAuth'
import type { OAuthConfig } from '../../../src/types/auth'

describe('GoogleAuth Service', () => {
  let googleAuth: GoogleAuth
  let mockConfig: OAuthConfig

  beforeEach(() => {
    mockConfig = {
      clientId: 'test-client-id',
      redirectUri: 'http://localhost:5173',
      scopes: ['openid', 'email', 'profile'],
      useMockOAuth: true,
      enableDevTools: true,
    }

    googleAuth = new GoogleAuth(mockConfig)
    sessionStorage.clear()
  })

  describe('Constructor & Configuration', () => {
    it('should initialize with provided config', () => {
      expect(googleAuth).toBeInstanceOf(GoogleAuth)
    })

    it('should throw error with missing client ID', () => {
      const invalidConfig = { ...mockConfig, clientId: '', useMockOAuth: false }
      expect(() => new GoogleAuth(invalidConfig)).toThrow()
    })
  })

  describe('PKCE Implementation', () => {
    it('should generate authorization URL with PKCE parameters', async () => {
      const authUrl = await googleAuth.login()

      expect(authUrl).toContain('code_challenge=')
      expect(authUrl).toContain('code_challenge_method=S256')
      expect(authUrl).toContain('state=')
      expect(authUrl).toContain('redirect_uri=')
    })

    it('should store PKCE verifier in session', async () => {
      await googleAuth.login()

      const storedState = sessionStorage.getItem('ritemark_oauth_state')
      expect(storedState).toBeTruthy()

      const stateData = JSON.parse(storedState!)
      expect(stateData.codeVerifier).toBeTruthy()
      expect(stateData.state).toBeTruthy()
    })
  })

  describe('OAuth State Management', () => {
    it('should generate unique state parameters', async () => {
      const url1 = await googleAuth.login()
      sessionStorage.clear()
      const url2 = await googleAuth.login()

      const state1 = new URL(url1).searchParams.get('state')
      const state2 = new URL(url2).searchParams.get('state')

      expect(state1).not.toBe(state2)
    })

    it('should validate state expiry', async () => {
      const expiredState = {
        state: 'expired-state',
        timestamp: Date.now() - 11 * 60 * 1000, // 11 minutes ago
        codeVerifier: 'test-verifier',
      }

      sessionStorage.setItem('ritemark_oauth_state', JSON.stringify(expiredState))

      const params = {
        code: 'test-code',
        state: 'expired-state',
      }

      const result = await googleAuth.handleCallback(params)

      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('expired')
    })
  })

  describe('Token Management', () => {
    it('should return null when no token exists', async () => {
      const token = await googleAuth.getAccessToken()
      expect(token).toBeNull()
    })

    it('should clear tokens on logout', async () => {
      sessionStorage.setItem('ritemark_oauth_tokens', JSON.stringify({
        access_token: 'test-token',
      }))

      await googleAuth.logout()

      const tokens = sessionStorage.getItem('ritemark_oauth_tokens')
      expect(tokens).toBeNull()
    })

    it('should check authentication state', () => {
      expect(googleAuth.isAuthenticated()).toBe(false)

      sessionStorage.setItem('ritemark_oauth_tokens', JSON.stringify({
        access_token: 'test-token',
      }))

      expect(googleAuth.isAuthenticated()).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle OAuth errors in callback', async () => {
      const params = {
        error: 'access_denied',
        error_description: 'User denied access',
      }

      const result = await googleAuth.handleCallback(params)

      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
      expect(result.error?.code).toBe('USER_CANCELLED')
    })

    it('should validate state parameter mismatch', async () => {
      const validState = {
        state: 'valid-state',
        timestamp: Date.now(),
        codeVerifier: 'test-verifier',
      }

      sessionStorage.setItem('ritemark_oauth_state', JSON.stringify(validState))

      const params = {
        code: 'test-code',
        state: 'invalid-state', // Mismatch
      }

      const result = await googleAuth.handleCallback(params)

      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('CSRF')
    })
  })

  describe('Security Validation', () => {
    it('should include required OAuth parameters', async () => {
      const authUrl = await googleAuth.login()
      const url = new URL(authUrl)

      expect(url.searchParams.get('response_type')).toBe('code')
      expect(url.searchParams.get('client_id')).toBe(mockConfig.clientId)
      expect(url.searchParams.get('redirect_uri')).toBe(mockConfig.redirectUri)
      expect(url.searchParams.get('scope')).toBeTruthy()
    })

    it('should use HTTPS for authorization endpoint', async () => {
      const authUrl = await googleAuth.login()
      expect(authUrl).toMatch(/^https:/)
    })
  })
})
