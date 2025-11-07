/**
 * Backend Health Check Utility
 * Sprint 20 - Phase 0: Backend Token Refresh
 *
 * Purpose:
 * - Check if Netlify Functions backend is available
 * - Enable graceful fallback to browser-only OAuth
 * - Cache health status to avoid repeated checks
 */

// Cache for backend health status
let cachedHealth: boolean | null = null
let cacheTime = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Check if Netlify Functions backend is available
 *
 * Strategy:
 * - HEAD request to /refresh-token endpoint
 * - 3-second timeout (fast fail for offline/unavailable)
 * - Cache result for 5 minutes
 * - 405 Method Not Allowed = backend available (expects POST)
 * - Any other response or error = backend unavailable
 *
 * @returns Promise<boolean> - true if backend available, false otherwise
 */
export async function checkBackendHealth(): Promise<boolean> {
  // Check cache first
  if (cachedHealth !== null && Date.now() - cacheTime < CACHE_TTL) {
    console.log('[BackendHealth] Using cached result:', cachedHealth)
    return cachedHealth
  }

  console.log('[BackendHealth] Checking /.netlify/functions/refresh-token')

  try {
    // HEAD request with 3-second timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)

    const response = await fetch('/.netlify/functions/refresh-token', {
      method: 'HEAD',
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    console.log('[BackendHealth] Response:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      ok: response.ok
    })

    // 405 Method Not Allowed = backend available (expects POST, not HEAD)
    // This is the ONLY valid response - Netlify Function returns 405 for HEAD requests
    // Any other status (including 200 from Vite dev server) means backend unavailable
    const isAvailable = response.status === 405

    console.log('[BackendHealth] Backend available:', isAvailable)

    cachedHealth = isAvailable
    cacheTime = Date.now()

    return isAvailable
  } catch (error) {
    // Network error, timeout, or backend unavailable
    console.error('[BackendHealth] Health check failed:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined
    })

    cachedHealth = false
    cacheTime = Date.now()

    return false
  }
}

/**
 * Clear cached backend health status
 * Use when you want to force a fresh check
 */
export function clearBackendHealthCache(): void {
  cachedHealth = null
  cacheTime = 0
}
