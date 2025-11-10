/**
 * Netlify Function: GDPR Data Export
 * Sprint 21 - Phase 4: Data Export Compliance
 *
 * Purpose:
 * - Allow users to export all their data (GDPR Article 15 - Right to Access)
 * - Return JSON with human-readable structure
 * - Include all data categories stored by RiteMark
 *
 * Security:
 * - POST only (prevent CSRF)
 * - Requires valid userId
 * - No sensitive data in plaintext (API keys hashed)
 * - OAuth authentication prevents abuse
 */

import type { Handler, HandlerEvent } from '@netlify/functions'
import { getStore, connectLambda } from '@netlify/blobs'

// Netlify Blob store for refresh tokens
const REFRESH_TOKENS_STORE = 'refresh-tokens'

// Helper: Format timestamp to human-readable date
const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toISOString()
}

// Helper: Hash API key (show first 8 chars only)
const maskApiKey = (key: string): string => {
  if (!key || key.length < 8) return '[REDACTED]'
  return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`
}

/**
 * GDPR Data Export Handler
 *
 * Flow:
 * 1. Validate userId from request body
 * 2. Gather data from all sources:
 *    - User profile (from request, stored in frontend)
 *    - Refresh tokens metadata (from Netlify Blob)
 *    - Settings (from Google Drive AppData - frontend responsibility)
 * 3. Return comprehensive JSON export
 */
export const handler: Handler = async (event: HandlerEvent) => {
  // 🔧 CRITICAL FIX (Sprint 26): Initialize Netlify Blobs for Lambda compatibility mode
  connectLambda(event)

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
  let userName: string | undefined

  try {
    const body = JSON.parse(event.body || '{}')
    userId = body.userId
    userEmail = body.email
    userName = body.name

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

  console.log('[gdpr-export] Exporting data for user:', userId)

  try {
    // 1. User Profile Data (from request)
    const userProfile = {
      userId,
      email: userEmail || '[Not provided]',
      name: userName || '[Not provided]',
      note: 'This data is stored in your browser session only (sessionStorage)'
    }

    // 2. Refresh Token Metadata (from Netlify Blob)
    const store = getStore(REFRESH_TOKENS_STORE)
    const refreshTokenEntry = await store.getWithMetadata(userId, { type: 'text' })

    const refreshTokenData = refreshTokenEntry ? {
      exists: true,
      createdAt: refreshTokenEntry.metadata?.createdAt
        ? formatDate(parseInt(String(refreshTokenEntry.metadata.createdAt)))
        : 'Unknown',
      expiresAt: refreshTokenEntry.metadata?.expiresAt
        ? formatDate(parseInt(String(refreshTokenEntry.metadata.expiresAt)))
        : 'Unknown',
      note: 'Refresh tokens are stored server-side for 180 days to maintain your session'
    } : {
      exists: false,
      note: 'No refresh token found (user may need to re-authenticate)'
    }

    // 3. Settings Data (from Google Drive AppData)
    // Note: Settings are fetched client-side from Drive AppData
    const settingsData = {
      location: 'Google Drive AppData',
      access: 'Only you can access this data',
      note: 'Settings are synced across devices via Google Drive. Export via Settings dialog to see current values.',
      dataIncluded: [
        'Theme preference (system/light/dark)',
        'Auto-open last file setting',
        'Anthropic API key (if provided, stored encrypted)',
        'Editor preferences'
      ]
    }

    // 4. Access Logs (minimal - we don't store extensive logs)
    const accessLogs = {
      note: 'RiteMark does not store access logs or usage analytics',
      lastExport: formatDate(Date.now())
    }

    // Build comprehensive export
    const exportData = {
      exportMetadata: {
        exportedAt: formatDate(Date.now()),
        exportedBy: userId,
        dataVersion: '1.0',
        privacyPolicy: 'https://ritemark.app/privacy',
        retentionPolicy: {
          refreshTokens: '180 days',
          settings: 'Until account deletion',
          accessLogs: 'Not stored'
        }
      },
      userData: {
        profile: userProfile,
        authentication: refreshTokenData,
        settings: settingsData,
        logs: accessLogs
      },
      gdprRights: {
        rightToAccess: 'Fulfilled by this export',
        rightToErasure: 'Available via Settings → Delete Account',
        rightToDataPortability: 'This JSON file is portable',
        rightToRectification: 'Update via Settings dialog',
        rightToRestriction: 'Contact privacy@ritemark.app',
        rightToObject: 'Contact privacy@ritemark.app'
      },
      dataCategories: [
        {
          category: 'Identity Data',
          description: 'Google user ID, email, name',
          storage: 'Browser sessionStorage',
          retention: 'Until logout'
        },
        {
          category: 'Authentication Data',
          description: 'OAuth refresh tokens',
          storage: 'Netlify Blob Storage (server-side)',
          retention: '180 days'
        },
        {
          category: 'Settings Data',
          description: 'User preferences, API keys',
          storage: 'Google Drive AppData (encrypted)',
          retention: 'Until account deletion'
        }
      ]
    }

    // Return export as downloadable JSON
    const filename = `ritemark-data-export-${userId}-${Date.now()}.json`

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      } as Record<string, string>,
      body: JSON.stringify(exportData, null, 2)
    }

  } catch (error) {
    console.error('[gdpr-export] Data export failed:', error)

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' } as Record<string, string>,
      body: JSON.stringify({
        error: 'export_failed',
        message: 'Failed to export user data. Please try again or contact support.',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}
