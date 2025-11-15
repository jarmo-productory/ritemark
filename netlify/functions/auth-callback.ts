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
 * - OAuth authentication prevents abuse
 */

import type { Handler, HandlerEvent } from '@netlify/functions'
import { google } from 'googleapis'
import { getStore, connectLambda } from '@netlify/blobs'

// Environment variables
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!

// Fixed redirect URI from environment variable (supports both staging and production)
const FIXED_REDIRECT_URI = process.env.VITE_OAUTH_REDIRECT_URI || 'https://ritemark.netlify.app/.netlify/functions/auth-callback'

// Origin allowlist (security: prevent open redirects)
const ALLOWED_ORIGINS = [
  'https://rm.productory.ai',                  // Production
  'https://ritemark.netlify.app',              // Staging
  /^https:\/\/deploy-preview-\d+--ritemark\.netlify\.app$/,  // Preview deploys
  'http://localhost:5173',                     // Local dev (Vite)
  'http://localhost:8888'                      // Local dev (Netlify CLI)
]

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
  // 🔧 CRITICAL FIX (Sprint 26): Initialize Netlify Blobs for Lambda compatibility mode
  connectLambda(event as any)

  console.log('[auth-callback] Received OAuth callback')

  // Extract and validate state parameter (Codex solution)
  const rawState = event.queryStringParameters?.state
  const code = event.queryStringParameters?.code
  const error = event.queryStringParameters?.error

  // Parse and validate state
  let state: { origin: string; returnPath: string; nonce: string; ts: number }
  try {
    state = parseAndValidateState(rawState)
    console.log('[auth-callback] State validated:', { origin: state.origin, returnPath: state.returnPath, nonce: state.nonce })
  } catch (stateError) {
    console.error('[auth-callback] State validation failed:', stateError)
    // Fallback to staging URL if state validation fails
    const fallbackUrl = 'https://ritemark.netlify.app/app'
    return redirect(fallbackUrl, {
      error: 'invalid_state',
      error_description: stateError instanceof Error ? stateError.message : 'State validation failed'
    })
  }

  // Handle user denial or OAuth errors
  if (error) {
    console.error('[auth-callback] OAuth error:', error)
    return redirect(`${state.origin}${state.returnPath}`, {
      error: error,
      error_description: event.queryStringParameters?.error_description || 'OAuth failed'
    })
  }

  if (!code) {
    console.error('[auth-callback] Missing authorization code')
    return redirect(`${state.origin}${state.returnPath}`, {
      error: 'missing_code',
      error_description: 'Authorization code not provided'
    })
  }

  try {
    // Choose redirect URI for token exchange:
    // - Production uses the fixed production Function URL
    // - Local development uses the Netlify CLI URL
    // - Preview deploys will fail (Google OAuth doesn't support per-PR URLs)
    const requestUrl = event.rawUrl ? new URL(event.rawUrl) : null
    const isLocal = requestUrl?.host?.startsWith('localhost') ?? false
    const redirectUri = isLocal
      ? 'http://localhost:8888/.netlify/functions/auth-callback'
      : FIXED_REDIRECT_URI

    console.log('[auth-callback] Using redirect URI for token exchange:', redirectUri)

    // Initialize OAuth2 client with redirect URI that matches initial request
    // Google requires this to exactly match the redirect_uri from the authorization request
    const oauth2Client = new google.auth.OAuth2(
      CLIENT_ID,
      CLIENT_SECRET,
      redirectUri
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

    // Extract user info from ID token (optional; don't block flow if missing)
    let userId = 'unknown'
    let userEmail = ''
    let userName = ''
    let userPicture = ''

    if (tokens.id_token) {
      try {
        const ticket = await oauth2Client.verifyIdToken({
          idToken: tokens.id_token,
          audience: CLIENT_ID
        })
        const payload = ticket.getPayload()
        if (payload?.sub) {
          userId = payload.sub
          userEmail = payload.email || ''
          userName = payload.name || ''
          userPicture = payload.picture || ''
          console.log('[auth-callback] User info extracted:', { userId, email: userEmail, name: userName })
        } else {
          console.warn('[auth-callback] No user.sub in ID token payload')
        }
      } catch (verifyErr) {
        console.warn('[auth-callback] ID token verification failed:', verifyErr instanceof Error ? verifyErr.message : verifyErr)
      }
    } else {
      console.warn('[auth-callback] No ID token received; continuing without userId')
    }

    // Store refresh token in Netlify Blob (if provided and Blobs configured)
    if (tokens.refresh_token) {
      try {
        const store = getStore(REFRESH_TOKENS_STORE)

        await store.set(userId, tokens.refresh_token, {
          metadata: {
            createdAt: Date.now().toString(),
            expiresAt: (Date.now() + REFRESH_TOKEN_TTL).toString(),
            userId: userId
          }
        })

        console.log('[auth-callback] ✅ Refresh token stored for user:', userId)
      } catch (blobError) {
        // Netlify Blobs not configured - this is OK for testing
        // OAuth flow will still work, but sessions won't persist server-side
        console.warn('[auth-callback] ⚠️  Netlify Blobs not configured, skipping refresh token storage')
        console.warn('[auth-callback] Error:', blobError instanceof Error ? blobError.message : blobError)
      }
    } else {
      console.warn('[auth-callback] No refresh token received (may need prompt=consent)')
    }

    // Redirect to validated origin + returnPath with access token and user info
    // returnPath ensures we hit /app (SPA route), not / (landing page)
    // Note: Access token in URL is OK (short-lived, 1-hour)
    // Refresh token never sent to browser (stored server-side)
    return redirect(`${state.origin}${state.returnPath}`, {
      access_token: tokens.access_token,
      expires_in: '3600', // 1 hour
      token_type: 'Bearer',
      user_id: userId,
      user_email: userEmail,
      user_name: userName,
      user_picture: userPicture
    })

  } catch (error) {
    console.error('[auth-callback] Token exchange failed:', error)

    return redirect(`${state.origin}${state.returnPath}`, {
      error: 'auth_failed',
      error_description: error instanceof Error ? error.message : 'Token exchange failed'
    })
  }
}

/**
 * Helper: Parse and validate state parameter (Codex solution)
 *
 * Security validations:
 * - Decode Base64URL
 * - Check timestamp freshness (within 10 minutes)
 * - Validate origin against allowlist
 *
 * Throws error if validation fails
 */
function parseAndValidateState(rawState: string | undefined): { origin: string; returnPath: string; nonce: string; ts: number } {
  if (!rawState) {
    throw new Error('Missing state parameter')
  }

  try {
    // Decode Base64URL (reverse the encoding from frontend)
    const base64 = rawState
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    // Add padding if needed
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4)

    // Use Buffer.from() instead of atob() for Node.js compatibility
    const decoded = Buffer.from(padded, 'base64').toString('utf8')
    const state = JSON.parse(decoded) as { origin: string; returnPath: string; nonce: string; ts: number }

    // Validate required fields
    if (!state.origin || !state.returnPath || !state.nonce || !state.ts) {
      throw new Error('Invalid state structure')
    }

    // Check timestamp freshness (10 minutes)
    const age = Date.now() - state.ts
    const maxAge = 10 * 60 * 1000 // 10 minutes
    if (age > maxAge) {
      throw new Error(`State expired (age: ${Math.round(age / 1000)}s)`)
    }

    // Validate origin against allowlist (Sprint 22 Security hardening)
    const isAllowed = ALLOWED_ORIGINS.some(allowed => {
      if (typeof allowed === 'string') {
        // Exact string match (production/localhost)
        return state.origin === allowed
      }

      // Sprint 22: For regex patterns, verify both pattern match AND hostname suffix
      // Defense against subdomain attacks (e.g., evil.com/deploy-preview-123--ritemark.netlify.app)
      if (allowed.test(state.origin)) {
        try {
          const url = new URL(state.origin)
          // Verify hostname ends with netlify.app (prevents spoofing)
          return url.hostname.endsWith('netlify.app')
        } catch {
          return false  // Invalid URL format
        }
      }
      return false
    })

    if (!isAllowed) {
      throw new Error(`Origin not allowed: ${state.origin}`)
    }

    return state
  } catch (error) {
    throw new Error(`State validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
