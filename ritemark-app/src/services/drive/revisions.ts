/**
 * Google Drive Revisions API Service
 * Sprint 17: Version History Feature
 *
 * Features:
 * - List all revisions for a file with pagination support
 * - Get revision content (raw markdown)
 * - Restore previous revision by fetching content and updating file
 * - Exponential backoff retry logic (1s, 2s, 4s, 8s)
 * - Comprehensive error handling (401, 404, 429 rate limits)
 * - Network timeout handling
 *
 * @see https://developers.google.com/drive/api/v3/reference/revisions
 */

import type {
  DriveRevision,
  DriveRevisionListResponse,
  ListRevisionsOptions,
  RestoreRevisionOptions,
  RestoreRevisionResult,
} from '../../types/revisions'
import { DEFAULT_REVISION_FIELDS, DEFAULT_REVISIONS_PAGE_SIZE } from '../../types/revisions'
import { DRIVE_ERRORS, type DriveError } from '../../types/drive'

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3'
const UPLOAD_API_BASE = 'https://www.googleapis.com/upload/drive/v3'

/**
 * Retry configuration for exponential backoff
 */
interface RetryConfig {
  maxRetries: number
  delays: number[] // [1000, 2000, 4000, 8000]
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 4,
  delays: [1000, 2000, 4000, 8000],
}

/**
 * List all revisions for a file with pagination support
 *
 * @param options - Configuration with fileId, accessToken, and optional pagination
 * @returns Array of revision metadata
 *
 * @example
 * ```typescript
 * const revisions = await listRevisions({
 *   fileId: 'abc123',
 *   accessToken: 'ya29...'
 * })
 * console.log(`Found ${revisions.length} revisions`)
 * ```
 */
export async function listRevisions(
  options: ListRevisionsOptions
): Promise<DriveRevision[]> {
  const { fileId, accessToken, pageSize = DEFAULT_REVISIONS_PAGE_SIZE, pageToken } = options

  // Build query parameters
  const params = new URLSearchParams({
    fields: `nextPageToken,revisions(${DEFAULT_REVISION_FIELDS})`,
    pageSize: String(pageSize),
  })

  if (pageToken) {
    params.append('pageToken', pageToken)
  }

  const url = `${DRIVE_API_BASE}/files/${fileId}/revisions?${params.toString()}`

  return executeWithRetry(async () => {
    const response = await makeAuthenticatedRequest(url, accessToken, {
      method: 'GET',
    })

    const data = (await response.json()) as DriveRevisionListResponse

    // Handle pagination - fetch all revisions
    let allRevisions = data.revisions || []

    if (data.nextPageToken) {
      const nextPageRevisions = await listRevisions({
        ...options,
        pageToken: data.nextPageToken,
      })
      allRevisions = [...allRevisions, ...nextPageRevisions]
    }

    return allRevisions
  })
}

/**
 * Get revision content as plain text markdown
 *
 * Downloads the actual file content from a specific revision.
 * Uses alt=media query parameter to get raw content instead of metadata.
 *
 * @param fileId - File ID
 * @param revisionId - Revision ID
 * @param accessToken - OAuth access token
 * @returns Markdown content as string
 *
 * @example
 * ```typescript
 * const content = await getRevisionContent('abc123', 'rev456', 'ya29...')
 * console.log(content) // "# My Document\n\nContent..."
 * ```
 */
export async function getRevisionContent(
  fileId: string,
  revisionId: string,
  accessToken: string
): Promise<string> {
  const url = `${DRIVE_API_BASE}/files/${fileId}/revisions/${revisionId}?alt=media`

  return executeWithRetry(async () => {
    const response = await makeAuthenticatedRequest(url, accessToken, {
      method: 'GET',
    })

    // Check if response is actually text (not JSON error)
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      // This might be an error response
      const errorData = await response.json()
      throw createError(
        DRIVE_ERRORS.INVALID_OPERATION,
        `Failed to get revision content: ${JSON.stringify(errorData)}`,
        response.status,
        false
      )
    }

    return response.text()
  })
}

/**
 * Restore a file to a previous revision
 *
 * This works by:
 * 1. Fetching the content from the specified revision
 * 2. Updating the current file with that content
 * 3. This creates a new revision with the old content
 *
 * Note: This does NOT delete newer revisions - it creates a new revision
 * with the old content, preserving full version history.
 *
 * @param options - Configuration with fileId, revisionId, accessToken
 * @returns Result object with success status and optional error
 *
 * @example
 * ```typescript
 * const result = await restoreRevision({
 *   fileId: 'abc123',
 *   revisionId: 'rev456',
 *   accessToken: 'ya29...',
 *   onProgress: (status) => console.log(status)
 * })
 *
 * if (result.success) {
 *   console.log('Restored successfully!')
 * }
 * ```
 */
export async function restoreRevision(
  options: RestoreRevisionOptions
): Promise<RestoreRevisionResult> {
  const { fileId, revisionId, accessToken, onProgress } = options

  try {
    // Step 1: Fetch revision content
    onProgress?.('fetching')
    const content = await getRevisionContent(fileId, revisionId, accessToken)

    // Step 2: Update current file with old content
    onProgress?.('restoring')
    await updateFileContent(fileId, content, accessToken)

    onProgress?.('complete')
    return {
      success: true,
      restoredContent: content,
    }
  } catch (error) {
    const driveError = error as DriveError
    return {
      success: false,
      error: driveError.message || 'Failed to restore revision',
    }
  }
}

/**
 * Update file content (internal helper for restore operation)
 *
 * @param fileId - File ID to update
 * @param content - New markdown content
 * @param accessToken - OAuth access token
 */
async function updateFileContent(
  fileId: string,
  content: string,
  accessToken: string
): Promise<void> {
  const url = `${UPLOAD_API_BASE}/files/${fileId}?uploadType=media`

  return executeWithRetry(async () => {
    await makeAuthenticatedRequest(url, accessToken, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'text/markdown',
      },
      body: content,
    })
  })
}

/**
 * Make authenticated request to Drive API with comprehensive error handling
 *
 * Handles:
 * - 401 Unauthorized (token expired)
 * - 404 Not Found (file or revision doesn't exist)
 * - 429 Rate Limit (too many requests)
 * - 500+ Server Errors
 * - Network timeouts
 *
 * @param url - API endpoint
 * @param accessToken - OAuth access token
 * @param options - Fetch options
 * @returns Response object
 */
async function makeAuthenticatedRequest(
  url: string,
  accessToken: string,
  options: RequestInit
): Promise<Response> {
  if (!accessToken) {
    throw createError(
      DRIVE_ERRORS.TOKEN_EXPIRED,
      'No access token available. Please sign in again.',
      401,
      false
    )
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000) // 30s timeout

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      },
      signal: controller.signal,
    })

    clearTimeout(timeout)

    // Handle 401 - Token expired
    if (response.status === 401) {
      throw createError(
        DRIVE_ERRORS.TOKEN_EXPIRED,
        'Access token expired. Please sign in again.',
        401,
        false
      )
    }

    // Handle 404 - File or revision not found
    if (response.status === 404) {
      throw createError(
        DRIVE_ERRORS.FILE_NOT_FOUND,
        'File or revision not found. It may have been deleted.',
        404,
        false
      )
    }

    // Handle 429 - Rate limit exceeded (retryable)
    if (response.status === 429) {
      throw createError(
        DRIVE_ERRORS.RATE_LIMIT_EXCEEDED,
        'Too many requests. Please try again in a moment.',
        429,
        true
      )
    }

    // Handle 500+ - Server errors (retryable)
    if (response.status >= 500) {
      throw createError(
        DRIVE_ERRORS.SERVER_ERROR,
        `Google Drive server error (${response.status}). Retrying...`,
        response.status,
        true
      )
    }

    // Handle other errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw createError(
        DRIVE_ERRORS.INVALID_REQUEST,
        (errorData as { message?: string }).message || `Request failed: ${response.status}`,
        response.status,
        false
      )
    }

    return response
  } catch (error) {
    clearTimeout(timeout)

    // Handle network timeout
    if (error instanceof Error && error.name === 'AbortError') {
      throw createError(
        DRIVE_ERRORS.TIMEOUT,
        'Request timed out. Please check your connection and try again.',
        0,
        true
      )
    }

    // Re-throw DriveErrors as-is
    if ((error as DriveError).code) {
      throw error
    }

    // Handle network errors
    throw createError(
      DRIVE_ERRORS.NETWORK_ERROR,
      `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      0,
      true
    )
  }
}

/**
 * Execute function with exponential backoff retry logic
 *
 * Retry delays: 1s, 2s, 4s, 8s
 * Only retries errors marked as retryable (429, 500+, network issues)
 *
 * @param fn - Function to execute
 * @returns Result from function
 */
async function executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: DriveError | null = null

  for (let attempt = 0; attempt < DEFAULT_RETRY_CONFIG.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      const driveError = error as DriveError
      lastError = driveError

      // Don't retry non-retryable errors
      if (!driveError.retryable) {
        throw driveError
      }

      // Don't retry on last attempt
      if (attempt === DEFAULT_RETRY_CONFIG.maxRetries - 1) {
        throw driveError
      }

      // Get delay for this attempt (1s, 2s, 4s, 8s)
      const delay = DEFAULT_RETRY_CONFIG.delays[attempt] || 8000

      console.warn(
        `Revisions API request failed (attempt ${attempt + 1}/${DEFAULT_RETRY_CONFIG.maxRetries}), retrying in ${delay}ms...`,
        driveError.message
      )

      await sleep(delay)
    }
  }

  throw lastError
}

/**
 * Create standardized Drive error
 */
function createError(
  code: string,
  message: string,
  status: number,
  retryable: boolean
): DriveError {
  return {
    code,
    message,
    status,
    retryable,
  }
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
