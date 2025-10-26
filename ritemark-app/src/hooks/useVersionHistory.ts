/**
 * Version History State Management Hook
 * Sprint 17: Version History Link
 *
 * Manages file revision history using Google Drive API v3
 * @see https://developers.google.com/drive/api/v3/reference/revisions
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'

/**
 * Drive Revision from Google Drive API v3
 */
export interface DriveRevision {
  id: string
  modifiedTime: string // ISO 8601
  keepForever?: boolean
  published?: boolean
  lastModifyingUser?: {
    displayName: string
    emailAddress: string
    photoLink?: string
  }
  originalFilename?: string
  md5Checksum?: string
  mimeType?: string
  size?: string
}

/**
 * Revision list response from Drive API
 */
interface RevisionListResponse {
  kind: 'drive#revisionList'
  revisions: DriveRevision[]
  nextPageToken?: string
}

/**
 * Hook return type
 */
export interface UseVersionHistoryReturn {
  revisions: DriveRevision[]
  loading: boolean
  error: Error | null
  selectedRevisionId: string | null
  selectedContent: string | null
  selectRevision: (revisionId: string) => Promise<void>
  restoreRevision: (revisionId: string) => Promise<void>
  refetch: () => Promise<void>
}

/**
 * Fetch revisions for a file
 */
async function fetchRevisions(
  fileId: string,
  accessToken: string
): Promise<DriveRevision[]> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}/revisions?fields=revisions(id,modifiedTime,keepForever,published,lastModifyingUser,originalFilename,md5Checksum,mimeType,size)`

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch revisions: ${response.statusText}`)
  }

  const data: RevisionListResponse = await response.json()
  return data.revisions || []
}

/**
 * Fetch content for a specific revision
 */
async function fetchRevisionContent(
  fileId: string,
  revisionId: string,
  accessToken: string
): Promise<string> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}/revisions/${revisionId}?alt=media`

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch revision content: ${response.statusText}`)
  }

  return await response.text()
}

/**
 * Restore file to a specific revision
 * This copies the revision content to the current file
 */
async function restoreToRevision(
  fileId: string,
  revisionId: string,
  accessToken: string
): Promise<void> {
  // First, fetch the revision content
  const content = await fetchRevisionContent(fileId, revisionId, accessToken)

  // Then update the current file with this content
  const updateUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`

  const response = await fetch(updateUrl, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'text/markdown',
    },
    body: content,
  })

  if (!response.ok) {
    throw new Error(`Failed to restore revision: ${response.statusText}`)
  }
}

/**
 * Version History Hook
 *
 * Manages file revision history with loading states and error handling
 *
 * @param fileId - Google Drive file ID
 * @param accessToken - OAuth2 access token
 * @returns Hook state and functions
 *
 * @example
 * ```tsx
 * const { revisions, loading, selectRevision, restoreRevision } = useVersionHistory(fileId, token)
 *
 * // Display revision list
 * {revisions.map(rev => (
 *   <button onClick={() => selectRevision(rev.id)}>
 *     {new Date(rev.modifiedTime).toLocaleString()}
 *   </button>
 * ))}
 * ```
 */
export function useVersionHistory(
  fileId: string | null,
  accessToken: string | null
): UseVersionHistoryReturn {
  const [revisions, setRevisions] = useState<DriveRevision[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [selectedRevisionId, setSelectedRevisionId] = useState<string | null>(null)
  const [selectedContent, setSelectedContent] = useState<string | null>(null)

  // Cache to avoid unnecessary refetches
  const lastFetchedFileId = useRef<string | null>(null)

  /**
   * Fetch revisions for current file
   */
  const loadRevisions = useCallback(async () => {
    if (!fileId || !accessToken) {
      setRevisions([])
      setError(null)
      return
    }

    // Skip if already loaded for this file
    if (lastFetchedFileId.current === fileId && revisions.length > 0) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const revs = await fetchRevisions(fileId, accessToken)
      setRevisions(revs)
      lastFetchedFileId.current = fileId
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load revisions')
      setError(error)
      toast.error('Failed to load version history', {
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }, [fileId, accessToken, revisions.length])

  /**
   * Manually refetch revisions (clears cache)
   */
  const refetch = useCallback(async () => {
    lastFetchedFileId.current = null
    await loadRevisions()
  }, [loadRevisions])

  /**
   * Select a revision and load its content
   */
  const selectRevision = useCallback(
    async (revisionId: string) => {
      if (!fileId || !accessToken) {
        toast.error('Cannot load revision', {
          description: 'Missing file ID or access token',
        })
        return
      }

      setSelectedRevisionId(revisionId)
      setLoading(true)

      try {
        const content = await fetchRevisionContent(fileId, revisionId, accessToken)
        setSelectedContent(content)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to load revision content')
        toast.error('Failed to load revision', {
          description: error.message,
        })
        setSelectedContent(null)
      } finally {
        setLoading(false)
      }
    },
    [fileId, accessToken]
  )

  /**
   * Restore file to a specific revision
   */
  const restoreRevision = useCallback(
    async (revisionId: string) => {
      if (!fileId || !accessToken) {
        toast.error('Cannot restore revision', {
          description: 'Missing file ID or access token',
        })
        return
      }

      setLoading(true)

      try {
        await restoreToRevision(fileId, revisionId, accessToken)
        toast.success('File restored successfully', {
          description: 'The file has been restored to the selected version',
        })

        // Refetch revisions after restore (creates new revision)
        await refetch()
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to restore revision')
        toast.error('Failed to restore revision', {
          description: error.message,
        })
      } finally {
        setLoading(false)
      }
    },
    [fileId, accessToken, refetch]
  )

  /**
   * Auto-fetch revisions when fileId changes
   */
  useEffect(() => {
    void loadRevisions()
  }, [loadRevisions])

  return {
    revisions,
    loading,
    error,
    selectedRevisionId,
    selectedContent,
    selectRevision,
    restoreRevision,
    refetch,
  }
}
