/**
 * Google Drive Revisions API Usage Examples
 * Sprint 17: Version History Feature
 *
 * This file demonstrates how to use the revisions service.
 * NOT imported in production - for documentation only.
 */

import {
  listRevisions,
  getRevisionContent,
  restoreRevision,
} from './revisions'
import type { DriveRevision } from '../../types/revisions'

/**
 * Example 1: List all revisions for a file
 */
async function exampleListRevisions(fileId: string, accessToken: string) {
  try {
    const revisions = await listRevisions({
      fileId,
      accessToken,
    })

    console.log(`Found ${revisions.length} revisions:`)
    revisions.forEach((rev: DriveRevision) => {
      const author = rev.lastModifyingUser?.displayName || 'Unknown'
      console.log(`- ${rev.modifiedTime} by ${author}`)
    })

    return revisions
  } catch (error) {
    console.error('Failed to list revisions:', error)
    throw error
  }
}

/**
 * Example 2: Get content from a specific revision
 */
async function exampleGetRevisionContent(
  fileId: string,
  revisionId: string,
  accessToken: string
) {
  try {
    const content = await getRevisionContent(fileId, revisionId, accessToken)
    console.log('Revision content:', content.substring(0, 100) + '...')
    return content
  } catch (error) {
    console.error('Failed to get revision content:', error)
    throw error
  }
}

/**
 * Example 3: Restore file to previous revision
 */
async function exampleRestoreRevision(
  fileId: string,
  revisionId: string,
  accessToken: string
) {
  try {
    const result = await restoreRevision({
      fileId,
      revisionId,
      accessToken,
      onProgress: (status) => {
        console.log(`Restore progress: ${status}`)
      },
    })

    if (result.success) {
      console.log('✅ File restored successfully!')
      console.log('Restored content length:', result.restoredContent?.length)
    } else {
      console.error('❌ Restore failed:', result.error)
    }

    return result
  } catch (error) {
    console.error('Failed to restore revision:', error)
    throw error
  }
}

/**
 * Example 4: Full workflow - List, preview, restore
 */
async function exampleFullWorkflow(fileId: string, accessToken: string) {
  // Step 1: List all revisions
  const revisions = await listRevisions({ fileId, accessToken })

  if (revisions.length === 0) {
    console.log('No revisions found')
    return
  }

  // Step 2: Get the second-most recent revision (index 1)
  const previousRevision = revisions[1]
  console.log(`Selected revision from: ${previousRevision.modifiedTime}`)

  // Step 3: Preview content
  const content = await getRevisionContent(fileId, previousRevision.id, accessToken)
  console.log(`Preview (first 200 chars): ${content.substring(0, 200)}...`)

  // Step 4: Restore if user confirms
  const userConfirmed = confirm('Restore to this version?')
  if (userConfirmed) {
    const result = await restoreRevision({
      fileId,
      revisionId: previousRevision.id,
      accessToken,
    })

    return result
  }
}

/**
 * Example 5: Error handling with retry
 */
async function exampleWithErrorHandling(fileId: string, accessToken: string) {
  try {
    const revisions = await listRevisions({
      fileId,
      accessToken,
    })

    return revisions
  } catch (error: unknown) {
    // Handle specific error types
    const driveError = error as { code?: string; message?: string; retryable?: boolean }

    if (driveError.code === 'TOKEN_EXPIRED') {
      console.error('Session expired - redirect to login')
      // window.location.href = '/login'
    } else if (driveError.code === 'FILE_NOT_FOUND') {
      console.error('File was deleted')
      // Show user-friendly message
    } else if (driveError.code === 'RATE_LIMIT_EXCEEDED') {
      console.error('Rate limited - already retried, try again later')
      // Show retry message
    } else {
      console.error('Unknown error:', driveError.message)
    }

    throw error
  }
}

// Export examples (not used in production)
export {
  exampleListRevisions,
  exampleGetRevisionContent,
  exampleRestoreRevision,
  exampleFullWorkflow,
  exampleWithErrorHandling,
}
