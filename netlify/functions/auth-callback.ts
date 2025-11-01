/**
 * Netlify Function: OAuth Callback Handler
 * Sprint 20 - Phase 0: Backend Token Refresh
 *
 * Purpose:
 * - Handle OAuth 2.0 Authorization Code Flow callback from Google
 * - Exchange authorization code for access_token + refresh_token
 * - Store refresh token securely in Netlify Blob
 * - Return access token to frontend via redirect
 *
 * Security:
 * - CLIENT_SECRET used here (never exposed to browser)
 * - Refresh tokens stored server-side only
 * - Access tokens sent to browser (short-lived, 1-hour)
 */

import type { Handler, HandlerEvent } from '@netlify/functions'
import { google } from 'googleapis'
import { getStore } from '@netlify/blobs'

// Environment variables (set in Netlify Dashboard)
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!

/**
 * Detect frontend URL based on deployment context
 * Netlify automatically provides `URL` for all deploys:
 * - Preview deploys: https://deploy-preview-11--ritemark.netlify.app
 * - Production: https://ritemark.netlify.app
 * - Local dev: Falls back to environment variable or localhost
 *
 * See: https://docs.netlify.com/configure-builds/environment-variables/
 */
const FRONTEND_URL = process.env.URL ||
  process.env.NETLIFY_SITE_URL ||
  process.env.FRONTEND_URL ||
  'http://localhost:5173'

// Netlify Blob store for refresh tokens
const REFRESH_TOKENS_STORE = 'refresh-tokens'

// Token expiration (180 days)
const REFRESH_TOKEN_TTL = 180 * 24 * 60 * 60 * 1000

/**
 * OAuth2 Callback Handler
 *
 * Flow:
 * 1. Receive authorization code from Google OAuth redirect
 * 2. Exchange code for tokens (access + refresh)
 * 3. Extract user.sub from ID token
 * 4. Store refresh token in Netlify Blob with userId key
 * 5. Redirect to frontend with access token in URL params
 */
export const handler: Handler = async (event: HandlerEvent) => {
  console.log('[auth-callback] Received OAuth callback')

  // Extract authorization code from query params
  const code = event.queryStringParameters?.code
  const error = event.queryStringParameters?.error

  // Handle user denial or OAuth errors
  if (error) {
    console.error('[auth-callback] OAuth error:', error)
    return redirect(FRONTEND_URL, {
      error: error,
      error_description: event.queryStringParameters?.error_description || 'OAuth failed'
    })
  }

  if (!code) {
    console.error('[auth-callback] Missing authorization code')
    return redirect(FRONTEND_URL, {
      error: 'missing_code',
      error_description: 'Authorization code not provided'
    })
  }

  try {
    // Initialize OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      CLIENT_ID,
      CLIENT_SECRET,
      `${FRONTEND_URL}/.netlify/functions/auth-callback`
    )

    console.log('[auth-callback] Exchanging code for tokens...')

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.access_token) {
      throw new Error('No access token received from Google')
    }

    console.log('[auth-callback] Tokens received:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      hasIdToken: !!tokens.id_token,
      expiryDate: tokens.expiry_date
    })

    // Extract user.sub from ID token
    let userId: string

    if (tokens.id_token) {
      // Verify and decode ID token
      const ticket = await oauth2Client.verifyIdToken({
        idToken: tokens.id_token,
        audience: CLIENT_ID
      })

      const payload = ticket.getPayload()
      if (!payload?.sub) {
        throw new Error('No user.sub found in ID token')
      }

      userId = payload.sub
      console.log('[auth-callback] User ID extracted:', userId)
    } else {
      throw new Error('No ID token received from Google')
    }

    // Store refresh token in Netlify Blob (if provided)
    if (tokens.refresh_token) {
      const store = getStore(REFRESH_TOKENS_STORE)

      await store.set(userId, tokens.refresh_token, {
        metadata: {
          createdAt: Date.now().toString(),
          expiresAt: (Date.now() + REFRESH_TOKEN_TTL).toString(),
          userId: userId
        }
      })

      console.log('[auth-callback] Refresh token stored for user:', userId)
    } else {
      console.warn('[auth-callback] No refresh token received (may need prompt=consent)')
    }

    // Redirect to frontend with access token
    // Note: Access token in URL is OK (short-lived, 1-hour)
    // Refresh token never sent to browser (stored server-side)
    return redirect(FRONTEND_URL, {
      access_token: tokens.access_token,
      expires_in: '3600', // 1 hour
      token_type: 'Bearer',
      user_id: userId
    })

  } catch (error) {
    console.error('[auth-callback] Token exchange failed:', error)

    return redirect(FRONTEND_URL, {
      error: 'auth_failed',
      error_description: error instanceof Error ? error.message : 'Token exchange failed'
    })
  }
}

/**
 * Helper: Redirect with query params
 */
function redirect(baseUrl: string, params: Record<string, string>) {
  const url = new URL(baseUrl)

  // Add query params
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })

  return {
    statusCode: 302,
    headers: {
      Location: url.toString(),
      'Cache-Control': 'no-store, no-cache, must-revalidate'
    },
    body: ''
  }
}
