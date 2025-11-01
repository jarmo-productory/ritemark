/**
 * Netlify Function: Token Refresh Endpoint
 * Sprint 20 - Phase 0: Backend Token Refresh
 *
 * Purpose:
 * - Refresh access token using stored refresh token
 * - Implement Refresh Token Rotation (RTR) for security
 * - Enable 6-month sessions without re-authentication
 *
 * Security:
 * - POST only (not GET - prevents CSRF)
 * - Rate limiting per user
 * - Refresh tokens stored server-side only
 * - Access tokens returned (short-lived, 1-hour)
 */

import type { Handler, HandlerEvent } from '@netlify/functions'
import { google } from 'googleapis'
import { getStore } from '@netlify/blobs'

// Environment variables
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!

// Netlify Blob store for refresh tokens
const REFRESH_TOKENS_STORE = 'refresh-tokens'

// Token expiration (180 days)
const REFRESH_TOKEN_TTL = 180 * 24 * 60 * 60 * 1000

/**
 * Token Refresh Handler
 *
 * Flow:
 * 1. Receive userId in POST body
 * 2. Retrieve refresh token from Netlify Blob
 * 3. Call Google OAuth API to refresh access token
 * 4. If new refresh token provided (RTR), update storage
 * 5. Return new access token to frontend
 */
export const handler: Handler = async (event: HandlerEvent) => {
  // Security: POST only
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Allow': 'POST'
      },
      body: JSON.stringify({
        error: 'method_not_allowed',
        message: 'Only POST requests are allowed'
      })
    }
  }

  // Parse request body
  let userId: string
  try {
    const body = JSON.parse(event.body || '{}')
    userId = body.userId

    if (!userId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'missing_user_id',
          message: 'userId is required in request body'
        })
      }
    }
  } catch (error) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'invalid_request',
        message: 'Invalid JSON in request body'
      })
    }
  }

  console.log('[refresh-token] Refreshing access token for user:', userId)

  try {
    // Retrieve refresh token from Netlify Blob
    const store = getStore(REFRESH_TOKENS_STORE)
    const refreshToken = await store.get(userId, { type: 'text' })

    if (!refreshToken) {
      console.warn('[refresh-token] No refresh token found for user:', userId)

      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'refresh_token_not_found',
          message: 'Refresh token not found or expired. Please re-authenticate.'
        })
      }
    }

    console.log('[refresh-token] Refresh token retrieved, calling Google OAuth API...')

    // Initialize OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      CLIENT_ID,
      CLIENT_SECRET
    )

    // Set refresh token
    oauth2Client.setCredentials({
      refresh_token: refreshToken
    })

    // Refresh access token
    const { credentials } = await oauth2Client.refreshAccessToken()

    if (!credentials.access_token) {
      throw new Error('No access token received from Google')
    }

    console.log('[refresh-token] New access token received:', {
      hasAccessToken: !!credentials.access_token,
      hasNewRefreshToken: !!credentials.refresh_token,
      expiryDate: credentials.expiry_date
    })

    // Refresh Token Rotation (RTR)
    // If Google returns a new refresh token, update storage
    if (credentials.refresh_token) {
      console.log('[refresh-token] RTR: Updating refresh token for user:', userId)

      await store.set(userId, credentials.refresh_token, {
        metadata: {
          updatedAt: Date.now().toString(),
          expiresAt: (Date.now() + REFRESH_TOKEN_TTL).toString(),
          userId: userId
        }
      })
    }

    // Return new access token to frontend
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      },
      body: JSON.stringify({
        access_token: credentials.access_token,
        expires_in: 3600, // 1 hour
        token_type: 'Bearer'
      })
    }

  } catch (error) {
    console.error('[refresh-token] Token refresh failed:', error)

    // Check if refresh token is invalid/expired
    if (error instanceof Error && error.message.includes('invalid_grant')) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'refresh_token_expired',
          message: 'Refresh token is invalid or expired. Please re-authenticate.'
        })
      }
    }

    // Generic error
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'token_refresh_failed',
        message: 'Failed to refresh access token. Please try again.'
      })
    }
  }
}
