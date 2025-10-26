/**
 * Google Drive Version History Service
 * Sprint 17: Version History Link
 *
 * Opens file in Google Drive where users can access version history via UI.
 *
 * Note: Google Drive does not provide a direct URL to version history.
 * The recommended approach is to open the file in Drive, then users can:
 * - Click File > Version History, OR
 * - Use keyboard shortcut: Cmd/Ctrl+Alt+Shift+H
 */

export interface VersionHistoryOptions {
  fileId: string
  onError?: (error: Error) => void
}

/**
 * Opens file in Google Drive where version history can be accessed
 *
 * Opens the file in Drive's native UI, where users can:
 * 1. Click "File" menu → "Version history" → "See version history"
 * 2. Use keyboard shortcut: Cmd/Ctrl+Alt+Shift+H
 *
 * @param options - Configuration object with fileId and optional error handler
 * @returns void
 *
 * @example
 * ```typescript
 * openVersionHistory({
 *   fileId: 'abc123',
 *   onError: (error) => toast.error(error.message)
 * })
 * ```
 */
export function openVersionHistory({ fileId, onError }: VersionHistoryOptions): void {
  if (!fileId) {
    const error = new Error('No file ID provided')
    onError?.(error)
    return
  }

  try {
    // Use drive.google.com/open?id= pattern - opens file in Drive UI
    // User can then access version history via File menu or Cmd/Ctrl+Alt+Shift+H
    const url = `https://drive.google.com/open?id=${fileId}`

    // Open in new tab with security features
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer')

    // Check if popup was blocked
    if (!newWindow) {
      const error = new Error('Popup blocked - please allow popups for this site')
      onError?.(error)
      return
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Failed to open file in Drive')
    onError?.(err)
  }
}
