/**
 * Client-Side Error Reporter
 * Sprint 26 MVP: Report errors to Netlify function for AI agent monitoring
 *
 * Usage:
 * try {
 *   await someOperation()
 * } catch (error) {
 *   reportError(error, 'fileName.functionName')
 *   throw error  // Re-throw for normal error handling
 * }
 */

/**
 * Report error to AI agent monitoring
 *
 * @param error - Error object from catch block
 * @param context - Context string in "file.function" format
 *
 * @example
 * reportError(error, 'settingsEncryption.decryptSettings')
 */
export function reportError(error: Error, context: string): void {
  try {
    const errorData = {
      error: error.message,
      context,
      timestamp: Date.now(),
      stack: error.stack,
    }

    // Fire-and-forget (never await, never block user)
    fetch('/.netlify/functions/log-client-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorData),
      keepalive: true, // Allow request to complete even if page unloads
    }).catch(() => {
      // Silent failure - error reporter must never throw
    })
  } catch {
    // Silent failure - error reporter must never break user experience
  }
}
