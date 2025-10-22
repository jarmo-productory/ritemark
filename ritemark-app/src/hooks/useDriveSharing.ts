/**
 * useDriveSharing Hook - Share button integration for Google Drive
 *
 * Opens file in Google Drive where user can use native Share button.
 *
 * Features:
 * - Opens file in Drive (new tab)
 * - Loading states during operation
 * - Error handling with callbacks
 * - Keyboard shortcut (Cmd/Ctrl+Shift+S)
 * - Disabled state when no file is open
 *
 * @example
 * const { handleShare, isSharing, error } = useDriveSharing(fileId)
 *
 * <Button onClick={handleShare} disabled={!fileId || isSharing}>
 *   <Share2 className="h-4 w-4" />
 *   Share
 * </Button>
 */

import { useState, useCallback, useEffect } from 'react'

/**
 * Options for useDriveSharing hook
 */
export interface UseDriveSharingOptions {
  /**
   * Callback when sharing succeeds
   */
  onSuccess?: () => void

  /**
   * Callback when sharing fails
   */
  onError?: (error: Error) => void
}

/**
 * Return type for useDriveSharing hook
 */
export interface UseDriveSharingReturn {
  /**
   * Function to open share dialog
   */
  handleShare: () => Promise<void>

  /**
   * Loading state during share operation
   */
  isSharing: boolean

  /**
   * Error message if sharing failed
   */
  error: string | null
}

/**
 * Hook for Drive sharing button functionality
 *
 * @param fileId - Google Drive file ID (null if no file open)
 * @param options - Configuration options
 * @returns Share handler, loading state, and error state
 */
export function useDriveSharing(
  fileId: string | null,
  options: UseDriveSharingOptions = {}
): UseDriveSharingReturn {
  const { onSuccess, onError } = options

  const [isSharing, setIsSharing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Handle share button click
   */
  const handleShare = useCallback(async () => {
    // Don't proceed if no file is open
    if (!fileId) {
      return
    }

    // Clear previous errors
    setError(null)
    setIsSharing(true)

    try {
      // Dynamically import sharing service to avoid circular dependencies
      const { openShareDialog } = await import('../services/drive/sharing')

      // Open file in Google Drive
      await openShareDialog({
        fileId,
        onSuccess: () => {
          setIsSharing(false)
          onSuccess?.()
        },
        onError: (err: Error) => {
          const errorMessage = err.message || 'Failed to open file in Drive'
          setError(errorMessage)
          setIsSharing(false)
          onError?.(err)
        },
      })

      // If openShareDialog returns without error, it succeeded
      setIsSharing(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      setIsSharing(false)

      // Call error callback
      onError?.(err instanceof Error ? err : new Error(errorMessage))
    }
  }, [fileId, onSuccess, onError])

  /**
   * Keyboard shortcut: Cmd/Ctrl+Shift+S
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Cmd/Ctrl+Shift+S
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const modifierKey = isMac ? event.metaKey : event.ctrlKey

      if (modifierKey && event.shiftKey && event.key.toLowerCase() === 's') {
        // Don't trigger if no file is open
        if (!fileId) return

        // Don't trigger if already sharing
        if (isSharing) return

        event.preventDefault()
        handleShare()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [fileId, isSharing, handleShare])

  return {
    handleShare,
    isSharing,
    error,
  }
}
