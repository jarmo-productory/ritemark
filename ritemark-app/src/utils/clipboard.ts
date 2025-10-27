/**
 * Copy content to clipboard with dual format support
 * Provides both rich HTML and plain markdown for maximum compatibility
 */

export interface ClipboardCopyResult {
  success: boolean
  error?: string
}

export async function copyFormattedContent(
  html: string,
  markdown: string
): Promise<ClipboardCopyResult> {
  // Check browser support
  if (!navigator.clipboard || !window.isSecureContext) {
    return {
      success: false,
      error: 'Clipboard API not available (HTTPS required)'
    }
  }

  try {
    // Create ClipboardItem with both formats
    // CRITICAL: Must provide both text/html AND text/plain (W3C spec)
    const clipboardItem = new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([markdown], { type: 'text/plain' })
    })

    await navigator.clipboard.write([clipboardItem])

    return { success: true }

  } catch (error) {
    console.error('Clipboard copy failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Copy failed'
    }
  }
}

/**
 * Check if clipboard API is available
 */
export function isClipboardSupported(): boolean {
  return !!(navigator.clipboard && window.isSecureContext)
}
