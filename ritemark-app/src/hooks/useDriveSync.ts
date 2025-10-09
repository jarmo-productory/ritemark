/**
 * useDriveSync Hook - Auto-save hook with fixed 3s debounce
 *
 * Provides auto-save functionality for Google Drive integration with:
 * - Fixed 3-second debounce to prevent rapid API calls
 * - Automatic save on visibility change (app backgrounding)
 * - File loading capability
 * - Force save for explicit user actions
 *
 * @example
 * const { syncStatus, loadFile, forceSave } = useDriveSync(
 *   fileId,
 *   documentTitle,
 *   documentContent,
 *   { onFileCreated: (newFileId) => setFileId(newFileId) }
 * )
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { AutoSaveManager } from '../services/drive/autoSaveManager'
import type { DriveSyncStatus, DriveFile } from '../types/drive'
import { tokenManager } from '../services/auth/tokenManager'

/**
 * Options for useDriveSync hook
 */
export interface UseDriveSyncOptions {
  /**
   * Callback when a new file is created (to update parent component's fileId)
   */
  onFileCreated?: (fileId: string) => void

  /**
   * Callback when authentication error occurs (to show dialog)
   */
  onAuthError?: () => void

  /**
   * Debounce time in milliseconds
   * @default 3000 (3 seconds)
   */
  debounceMs?: number
}

/**
 * Return type for useDriveSync hook
 */
export interface UseDriveSyncReturn {
  /**
   * Current sync status
   */
  syncStatus: DriveSyncStatus

  /**
   * Load a file from Google Drive
   */
  loadFile: (fileId: string) => Promise<{ metadata: DriveFile; content: string }>

  /**
   * Force an immediate save, bypassing debounce
   */
  forceSave: () => Promise<void>
}

/**
 * Hook for auto-saving documents to Google Drive
 *
 * @param fileId - Google Drive file ID (null for new files)
 * @param title - Document title
 * @param content - Document content
 * @param options - Configuration options
 * @returns Sync status, load function, and force save function
 */
export function useDriveSync(
  fileId: string | null,
  title: string,
  content: string,
  options: UseDriveSyncOptions = {}
): UseDriveSyncReturn {
  const { onFileCreated, onAuthError, debounceMs = 3000 } = options

  const [syncStatus, setSyncStatus] = useState<DriveSyncStatus>({
    status: 'synced',
    lastSaved: undefined,
    isSynced: true,
    isSaving: false,
    isOffline: false,
    hasError: false,
  })

  const autoSaveManager = useRef<AutoSaveManager | null>(null)
  const currentFileId = useRef<string | null>(fileId)

  // Update currentFileId when fileId prop changes
  useEffect(() => {
    currentFileId.current = fileId
    if (autoSaveManager.current && fileId) {
      autoSaveManager.current.setFileId(fileId)
    }
  }, [fileId])

  /**
   * Initialize auto-save manager with save function
   */
  useEffect(() => {
    const saveFunction = async (contentToSave: string) => {
      setSyncStatus({
        status: 'saving',
        lastSaved: undefined,
        isSynced: false,
        isSaving: true,
        isOffline: false,
        hasError: false,
      })

      try {
        const accessToken = await tokenManager.getAccessToken()
        if (!accessToken) {
          throw new Error('Not authenticated - please sign in')
        }

        // Create or update file in Google Drive
        if (currentFileId.current) {
          // Update existing file
          await updateDriveFile(currentFileId.current, contentToSave, accessToken)
        } else {
          // Create new file
          const newFileId = await createDriveFile(
            title || 'Untitled Document',
            contentToSave,
            accessToken
          )
          currentFileId.current = newFileId
          onFileCreated?.(newFileId)
        }

        const now = new Date().toISOString()
        setSyncStatus({
          status: 'synced',
          lastSaved: now,
          isSynced: true,
          isSaving: false,
          isOffline: false,
          hasError: false,
        })
      } catch (error) {
        console.error('Save failed:', error)
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred'

        // Check if it's an authentication error
        if (errorMessage.includes('Not authenticated') || errorMessage.includes('authentication')) {
          // Only trigger auth error dialog if we have a document (user was working)
          // If no document, user should see welcome screen instead
          if (fileId) {
            onAuthError?.()
          }
          // Don't set error status for auth errors - they're handled by dialog or welcome screen
          return
        }

        setSyncStatus({
          status: 'error',
          lastSaved: undefined,
          error: errorMessage,
          isSynced: false,
          isSaving: false,
          isOffline: false,
          hasError: true,
        })
      }
    }

    autoSaveManager.current = new AutoSaveManager(fileId, saveFunction, {
      debounceMs,
    })

    return () => {
      autoSaveManager.current?.destroy()
      autoSaveManager.current = null
    }
  }, [fileId, debounceMs, onFileCreated, title])

  /**
   * Trigger auto-save on content change
   */
  useEffect(() => {
    if (content && autoSaveManager.current) {
      autoSaveManager.current.scheduleSave(content)
    }
  }, [content])

  /**
   * Force save on visibility change (app backgrounding)
   * This ensures changes are saved when user switches tabs or apps
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && autoSaveManager.current) {
        autoSaveManager.current.forceSave().catch((error) => {
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  /**
   * Load a file from Google Drive
   */
  const loadFile = useCallback(
    async (loadFileId: string): Promise<{ metadata: DriveFile; content: string }> => {
      // Validate fileId before making API call
      if (!loadFileId || typeof loadFileId !== 'string' || loadFileId.trim() === '') {
        const error = new Error('Invalid file ID - cannot load file')
        setSyncStatus({
          status: 'error',
          lastSaved: undefined,
          error: error.message,
          isSynced: false,
          isSaving: false,
          isOffline: false,
          hasError: true,
        })
        throw error
      }

      setSyncStatus((prev) => ({
        ...prev,
        status: 'saving', // Reusing 'saving' status for loading
        isSaving: true,
      }))

      try {
        const accessToken = await tokenManager.getAccessToken()
        if (!accessToken) {
          throw new Error('Not authenticated - please sign in')
        }

        const { metadata, content: fileContent } = await loadDriveFile(
          loadFileId,
          accessToken
        )

        setSyncStatus({
          status: 'synced',
          lastSaved: metadata.modifiedTime,
          isSynced: true,
          isSaving: false,
          isOffline: false,
          hasError: false,
        })

        return { metadata, content: fileContent }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to load file'

        // Check if it's an authentication error
        if (errorMessage.includes('Not authenticated') || errorMessage.includes('authentication')) {
          // Only trigger auth error dialog if we have a document (user was working)
          // If no document, user should see welcome screen instead
          if (currentFileId.current) {
            onAuthError?.()
          }
          throw error
        }

        setSyncStatus({
          status: 'error',
          lastSaved: undefined,
          error: errorMessage,
          isSynced: false,
          isSaving: false,
          isOffline: false,
          hasError: true,
        })

        throw error
      }
    },
    []
  )

  /**
   * Force an immediate save, bypassing debounce
   */
  const forceSave = useCallback(async () => {
    if (autoSaveManager.current) {
      await autoSaveManager.current.forceSave()
    }
  }, [])

  return {
    syncStatus,
    loadFile,
    forceSave,
  }
}

// ============================================================================
// Placeholder Drive API Functions
// TODO: Replace these with actual driveClient service when implemented
// ============================================================================

/**
 * Placeholder: Create a new file in Google Drive
 * Will be replaced with driveClient.createFile()
 */
async function createDriveFile(
  name: string,
  content: string,
  accessToken: string
): Promise<string> {
  const metadata = {
    name,
    mimeType: 'text/markdown',
  }

  const boundary = '-------314159265358979323846'
  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${boundary}`,
    'Content-Type: text/markdown',
    '',
    content,
    `--${boundary}--`,
  ].join('\r\n')

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Failed to create file')
  }

  const result = await response.json()
  return result.id
}

/**
 * Placeholder: Update an existing file in Google Drive
 * Will be replaced with driveClient.updateFile()
 */
async function updateDriveFile(
  fileId: string,
  content: string,
  accessToken: string
): Promise<void> {
  const response = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'text/markdown',
      },
      body: content,
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Failed to update file')
  }
}

/**
 * Placeholder: Load a file from Google Drive
 * Will be replaced with driveClient.getFile()
 */
async function loadDriveFile(
  fileId: string,
  accessToken: string
): Promise<{ metadata: DriveFile; content: string }> {
  // Validate inputs
  if (!fileId || !accessToken) {
    throw new Error('Invalid parameters: fileId and accessToken required')
  }

  // Fetch metadata first (smaller request, fails fast if permission issue)
  const metaResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,modifiedTime,createdTime,size,parents,webViewLink&supportsAllDrives=true`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!metaResponse.ok) {
    // Enhanced error handling with specific messages
    if (metaResponse.status === 404) {
      throw new Error(
        'File not found. This may happen if you selected a file that the app does not have permission to access. Please try creating a new file or opening a file created by this app.'
      )
    } else if (metaResponse.status === 403) {
      throw new Error(
        'Permission denied. Please ensure you granted the app permission to access your Google Drive files.'
      )
    } else if (metaResponse.status === 401) {
      throw new Error('Authentication expired. Please sign in again.')
    }

    // Try to get detailed error from response
    try {
      const error = await metaResponse.json()
      throw new Error(error.error?.message || `Failed to load file (${metaResponse.status})`)
    } catch {
      throw new Error(`Failed to load file metadata (HTTP ${metaResponse.status})`)
    }
  }

  const metadata = await metaResponse.json()

  // Fetch content with retry logic for transient 404s
  let retries = 2
  let contentResponse: Response | null = null

  while (retries >= 0) {
    try {
      contentResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (contentResponse.ok) {
        break // Success
      }

      // If 404 and we have retries left, wait and retry (transient permission propagation)
      if (contentResponse.status === 404 && retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000)) // Wait 1s
        retries--
        continue
      }

      // Other errors - don't retry
      break
    } catch (networkError) {
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        retries--
      } else {
        throw new Error(`Network error: ${networkError instanceof Error ? networkError.message : 'Unknown error'}`)
      }
    }
  }

  if (!contentResponse || !contentResponse.ok) {
    if (contentResponse?.status === 404) {
      throw new Error(
        'Unable to read file content. This file may not have been created by this app, or permission is pending. Try creating a new file instead.'
      )
    } else if (contentResponse?.status === 403) {
      throw new Error('Permission denied when reading file content.')
    }

    try {
      const error = await contentResponse?.json()
      throw new Error(error?.error?.message || 'Failed to load file content')
    } catch {
      throw new Error(`Failed to load file content (HTTP ${contentResponse?.status || 'unknown'})`)
    }
  }

  const content = await contentResponse.text()

  return { metadata, content }
}
