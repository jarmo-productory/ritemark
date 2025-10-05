/**
 * useDriveFiles Hook - File list management hook
 *
 * Provides file list management for Google Drive integration with:
 * - Automatic file list loading on mount
 * - Manual refresh capability
 * - Pagination support with loadMore
 * - Loading and error states
 * - Filtering for markdown files
 * - Search functionality
 *
 * @example
 * const { files, isLoading, error, fetchFiles, refresh, loadMore, searchFiles } = useDriveFiles()
 */

import { useState, useEffect, useCallback } from 'react'
import { tokenManager } from '../services/auth/tokenManager'
import type { DriveFile, DriveError } from '../types/drive'

/**
 * Return type for useDriveFiles hook
 */
export interface UseDriveFilesReturn {
  /**
   * Array of Drive files
   */
  files: DriveFile[]

  /**
   * Loading state
   */
  isLoading: boolean

  /**
   * Error state
   */
  error: DriveError | null

  /**
   * Whether there are more files to load
   */
  hasMore: boolean

  /**
   * Initial fetch of files from Google Drive
   */
  fetchFiles: () => Promise<void>

  /**
   * Load more files (pagination)
   */
  loadMore: () => Promise<void>

  /**
   * Refresh the file list from Google Drive
   */
  refresh: () => Promise<void>

  /**
   * Search files by name
   */
  searchFiles: (query: string) => Promise<void>
}

/**
 * Hook for managing file lists from Google Drive
 *
 * Automatically loads files on mount and provides refresh capability.
 * Filters for markdown and plain text files by default.
 *
 * @returns File list, loading state, error state, and utility functions
 */
export function useDriveFiles(): UseDriveFilesReturn {
  const [files, setFiles] = useState<DriveFile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<DriveError | null>(null)
  const [nextPageToken, setNextPageToken] = useState<string | undefined>()

  /**
   * Internal function to fetch files from Google Drive with pagination support
   */
  const fetchFilesInternal = useCallback(
    async (pageToken?: string): Promise<void> => {
      setIsLoading(true)
      setError(null)

      try {
        const accessToken = await tokenManager.getAccessToken()
        if (!accessToken) {
          throw new Error('Not authenticated - please sign in')
        }

        const fileList = await listDriveFiles(accessToken, pageToken)

        setFiles((prev) => (pageToken ? [...prev, ...fileList.files] : fileList.files))
        setNextPageToken(fileList.nextPageToken)
      } catch (err) {
        console.error('Failed to load files:', err)

        const driveError: DriveError = {
          code: 'FILE_LIST_FAILED',
          message: err instanceof Error ? err.message : 'Failed to load files',
          retryable: true,
          recoverable: true,
        }

        setError(driveError)
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  /**
   * Initial fetch of files from Google Drive
   */
  const fetchFiles = useCallback(async () => {
    setFiles([])
    setNextPageToken(undefined)
    await fetchFilesInternal()
  }, [fetchFilesInternal])

  /**
   * Load more files (pagination)
   */
  const loadMore = useCallback(async () => {
    if (nextPageToken && !isLoading) {
      await fetchFilesInternal(nextPageToken)
    }
  }, [nextPageToken, isLoading, fetchFilesInternal])

  /**
   * Refresh file list from beginning
   */
  const refresh = useCallback(async () => {
    setFiles([])
    setNextPageToken(undefined)
    await fetchFilesInternal()
  }, [fetchFilesInternal])

  /**
   * Search files by name
   */
  const searchFiles = useCallback(
    async (query: string): Promise<void> => {
      if (!query.trim()) {
        await refresh()
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const accessToken = await tokenManager.getAccessToken()
        if (!accessToken) {
          throw new Error('Not authenticated - please sign in')
        }

        const fileList = await searchDriveFiles(accessToken, query)

        setFiles(fileList.files)
        setNextPageToken(undefined)
      } catch (err) {
        console.error('Failed to search files:', err)

        const driveError: DriveError = {
          code: 'FILE_SEARCH_FAILED',
          message: err instanceof Error ? err.message : 'Failed to search files',
          retryable: true,
          recoverable: true,
        }

        setError(driveError)
      } finally {
        setIsLoading(false)
      }
    },
    [refresh]
  )

  /**
   * Load files on mount
   */
  useEffect(() => {
    fetchFilesInternal()
  }, [fetchFilesInternal])

  return {
    files,
    isLoading,
    error,
    hasMore: !!nextPageToken,
    fetchFiles,
    loadMore,
    refresh,
    searchFiles,
  }
}

// ============================================================================
// Placeholder Drive API Functions
// TODO: Replace with actual driveClient service when implemented
// ============================================================================

interface FileListResult {
  files: DriveFile[]
  nextPageToken?: string
}

/**
 * Placeholder: List files from Google Drive
 * Will be replaced with driveClient.listFiles()
 */
async function listDriveFiles(
  accessToken: string,
  pageToken?: string
): Promise<FileListResult> {
  const query = "trashed=false and (mimeType='text/markdown' or mimeType='text/plain')"
  const params = new URLSearchParams({
    q: query,
    fields:
      'files(id,name,mimeType,modifiedTime,createdTime,size,parents,webViewLink,owners,lastModifyingUser,capabilities),nextPageToken',
    orderBy: 'modifiedTime desc',
    pageSize: '20',
  })

  if (pageToken) {
    params.append('pageToken', pageToken)
  }

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?${params}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Failed to list files')
  }

  const data = await response.json()
  return {
    files: data.files || [],
    nextPageToken: data.nextPageToken,
  }
}

/**
 * Placeholder: Search files from Google Drive
 * Will be replaced with driveClient.searchFiles()
 */
async function searchDriveFiles(
  accessToken: string,
  searchQuery: string
): Promise<FileListResult> {
  // Escape single quotes in search query to prevent Drive API 400 errors
  const escapedQuery = searchQuery.replace(/'/g, "\\'")
  const query = `trashed=false and (mimeType='text/markdown' or mimeType='text/plain') and name contains '${escapedQuery}'`
  const params = new URLSearchParams({
    q: query,
    fields:
      'files(id,name,mimeType,modifiedTime,createdTime,size,parents,webViewLink,owners,lastModifyingUser,capabilities)',
    orderBy: 'modifiedTime desc',
    pageSize: '20',
  })

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?${params}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Failed to search files')
  }

  const data = await response.json()
  return {
    files: data.files || [],
  }
}
