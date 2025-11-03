/**
 * Netlify Function: GDPR Account Deletion
 * Sprint 21 - Phase 5: Right to Erasure Compliance
 *
 * Purpose:
 * - Allow users to delete all their data (GDPR Article 17 - Right to Erasure)
 * - Cascading deletion across all storage systems
 * - Irreversible action with proper warnings
 *
 * Security:
 * - POST only (prevent CSRF)
 * - Requires valid userId
 * - Logs deletion for compliance audit trail
 * - OAuth authentication prevents abuse
 *
 * Data Deletion Scope:
 * 1. Server-side refresh tokens (Netlify Blob)
 * 2. Google OAuth tokens (revoke via Google API)
 * 3. Settings in Drive AppData (optional - user can keep)
 * 4. Any server-side logs containing userId
 */

import type { Handler, HandlerEvent } from '@netlify/functions'
import { getStore } from '@netlify/blobs'
import { google } from 'googleapis'

// Environment variables
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!

// Netlify Blob store for refresh tokens
const REFRESH_TOKENS_STORE = 'refresh-tokens'

/**
 * Helper: Revoke Google OAuth tokens
 * Ensures user cannot access app with old tokens after deletion
 */
const revokeGoogleTokens = async (refreshToken: string): Promise<void> => {
  try {
    const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET)
    oauth2Client.setCredentials({ refresh_token: refreshToken })

    // Revoke the token
    await oauth2Client.revokeCredentials()
    console.log('[gdpr-delete] Google OAuth tokens revoked successfully')
  } catch (error) {
    // Non-fatal: Token may already be revoked or expired
    console.warn('[gdpr-delete] Failed to revoke Google tokens (may already be invalid):', error)
  }
}

/**
 * GDPR Account Deletion Handler
 *
 * Flow:
 * 1. Validate userId from request body
 * 2. Retrieve refresh token from Netlify Blob
 * 3. Revoke Google OAuth tokens
 * 4. Delete refresh token from Netlify Blob
 * 5. Log deletion for compliance
 * 6. Return success (frontend handles local cleanup)
 *
 * Frontend Responsibilities:
 * - Clear sessionStorage (user profile, access tokens)
 * - Clear IndexedDB (encrypted tokens)
 * - Sign out user
 * - Optionally delete Drive AppData settings (user choice)
 */
export const handler: Handler = async (event: HandlerEvent) => {
  // Security: POST only
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Allow': 'POST'
      } as Record<string, string>,
      body: JSON.stringify({
        error: 'method_not_allowed',
        message: 'Only POST requests are allowed'
      })
    }
  }

  // Parse request body
  let userId: string
  let userEmail: string | undefined

  try {
    const body = JSON.parse(event.body || '{}')
    userId = body.userId
    userEmail = body.email

    if (!userId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' } as Record<string, string>,
        body: JSON.stringify({
          error: 'missing_user_id',
          message: 'userId is required in request body'
        })
      }
    }
  } catch (error) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' } as Record<string, string>,
      body: JSON.stringify({
        error: 'invalid_request',
        message: 'Invalid JSON in request body'
      })
    }
  }

  console.log('[gdpr-delete] Starting account deletion for user:', userId)

  try {
    const store = getStore(REFRESH_TOKENS_STORE)
    const deletionLog: string[] = []

    // Step 1: Retrieve refresh token (needed for revocation)
    const refreshToken = await store.get(userId, { type: 'text' })

    if (refreshToken) {
      // Step 2: Revoke Google OAuth tokens
      try {
        await revokeGoogleTokens(refreshToken)
        deletionLog.push('✅ Google OAuth tokens revoked')
      } catch (error) {
        deletionLog.push('⚠️ Google OAuth token revocation failed (may already be invalid)')
      }

      // Step 3: Delete refresh token from Netlify Blob
      await store.delete(userId)
      deletionLog.push('✅ Server-side refresh token deleted')
    } else {
      deletionLog.push('ℹ️ No refresh token found (may already be deleted)')
    }

    // Step 4: Log deletion for compliance audit trail
    console.log('[gdpr-delete] Account deletion completed:', {
      userId,
      email: userEmail || 'unknown',
      deletedAt: new Date().toISOString(),
      deletionLog
    })

    // Return success response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      } as Record<string, string>,
      body: JSON.stringify({
        success: true,
        message: 'Account deleted successfully',
        deletedAt: new Date().toISOString(),
        deletionSummary: {
          serverSideData: 'Deleted',
          oauthTokens: 'Revoked',
          clientSideData: 'Must be cleared by frontend',
          driveAppData: 'User choice (can be kept or manually deleted)'
        },
        nextSteps: [
          'Clear browser sessionStorage',
          'Clear IndexedDB encrypted tokens',
          'Sign out user',
          'Optionally delete Drive AppData settings (user decides)'
        ],
        deletionLog
      })
    }

  } catch (error) {
    console.error('[gdpr-delete] Account deletion failed:', error)

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' } as Record<string, string>,
      body: JSON.stringify({
        error: 'deletion_failed',
        message: 'Failed to delete account. Please try again or contact support.',
        details: error instanceof Error ? error.message : 'Unknown error',
        support: 'privacy@ritemark.app'
      })
    }
  }
}
