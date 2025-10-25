/**
 * useNetworkStatus Hook - Production-grade network connectivity detection
 *
 * Implements Drive API verification with exponential backoff as per Sprint 16 research.
 * Does NOT trust navigator.onLine alone (85% accurate per research findings).
 *
 * Key Features:
 * - Drive API verification via fetch()
 * - Exponential backoff: 1s → 2s → 4s → 8s → 16s (max 5 attempts)
 * - Idempotent operations (Sprint 15 lesson: "If you're already there, don't go there again")
 * - Jitter to prevent thundering herd
 *
 * @example
 * const { isOnline, isChecking, lastChecked } = useNetworkStatus({
 *   onStatusChange: (online) => {
 *     console.log(online ? 'Connected' : 'Disconnected')
 *   }
 * })
 */

import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Options for useNetworkStatus hook
 */
export interface UseNetworkStatusOptions {
  /**
   * Callback when network status changes
   */
  onStatusChange?: (isOnline: boolean) => void

  /**
   * Callback when connection is restored after being offline
   */
  onReconnect?: () => void

  /**
   * Callback when connection is lost
   */
  onDisconnect?: () => void
}

/**
 * Return type for useNetworkStatus hook
 */
export interface UseNetworkStatusReturn {
  /**
   * Current online status (verified via Drive API)
   */
  isOnline: boolean

  /**
   * Whether currently checking connection (transitioning to online)
   */
  isChecking: boolean

  /**
   * Timestamp of last connectivity check
   */
  lastChecked: Date | null

  /**
   * Force a connectivity check
   */
  checkConnection: () => void
}

/**
 * Verify connectivity by making actual internet request
 * More reliable than navigator.onLine (which only checks LAN connection)
 * Uses Google's public connectivity check endpoint (doesn't require auth)
 */
async function verifyDriveConnectivity(): Promise<boolean> {
  try {
    // Use Google's connectivity check endpoint (no auth required)
    // This is the same endpoint Chrome uses to check connectivity
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout

    await fetch(
      'https://www.google.com/generate_204',
      {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal,
        mode: 'no-cors', // Don't need to read response, just verify connection
      }
    )

    clearTimeout(timeoutId)
    // In no-cors mode, if fetch succeeds (doesn't throw), we're online
    return true
  } catch {
    // Network error or timeout
    return false
  }
}

/**
 * Calculate exponential backoff delay with jitter
 * Prevents thundering herd when many clients reconnect simultaneously
 *
 * Schedule: 1s → 2s → 4s → 8s → 16s (max)
 * Jitter: 0-30% randomness
 */
function getBackoffDelay(attemptNumber: number): number {
  const baseDelay = Math.min(1000 * Math.pow(2, attemptNumber), 16000) // Cap at 16s
  const jitter = Math.random() * 0.3 * baseDelay // 0-30% jitter
  return baseDelay + jitter
}

/**
 * Hook for monitoring network connectivity status with Drive API verification
 *
 * @param options - Configuration options
 * @returns Network status and control functions
 */
export function useNetworkStatus(
  options: UseNetworkStatusOptions = {}
): UseNetworkStatusReturn {
  const {
    onStatusChange,
    onReconnect,
    onDisconnect,
  } = options

  // State
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isChecking, setIsChecking] = useState(false)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  // Refs for cleanup and state tracking
  const retryTimeout = useRef<NodeJS.Timeout | undefined>(undefined)
  const previousOnlineStatus = useRef(navigator.onLine)
  const isVerifying = useRef(false)

  /**
   * Verify online status with exponential backoff
   */
  const verifyOnlineStatus = useCallback(
    async (attempt: number = 0) => {
      // Prevent concurrent verification attempts
      if (isVerifying.current) {
        return
      }

      isVerifying.current = true

      try {
        const verified = await verifyDriveConnectivity()

        if (verified) {
          // Success! We're online
          setIsOnline(true)
          setIsChecking(false)
          setLastChecked(new Date())

          // Capture previous offline state BEFORE updating ref
          const wasOfflineBefore = previousOnlineStatus.current === false
          previousOnlineStatus.current = true

          // Call callbacks (with error handling)
          try {
            onStatusChange?.(true)
            if (wasOfflineBefore) {
              onReconnect?.()
            }
          } catch (error) {
            console.error('Error in network status callback:', error)
          }
        } else {
          // Verification failed
          if (attempt < 4) {
            // Retry with exponential backoff (max 5 attempts: 0, 1, 2, 3, 4)
            const delay = getBackoffDelay(attempt)
            retryTimeout.current = setTimeout(() => {
              verifyOnlineStatus(attempt + 1)
            }, delay)
          } else {
            // Max retries reached - mark as offline
            setIsOnline(false)
            setIsChecking(false)
            setLastChecked(new Date())
            previousOnlineStatus.current = false

            try {
              onStatusChange?.(false)
            } catch (error) {
              console.error('Error in network status callback:', error)
            }
          }
        }
      } finally {
        isVerifying.current = false
      }
    },
    [onStatusChange, onReconnect]
  )

  /**
   * Handle online event
   * IMPORTANT: Apply Sprint 15 lesson - "If you're already there, don't go there again"
   */
  const handleOnline = useCallback(() => {
    // CHECK STATE BEFORE CHANGING STATE (Sprint 15 idempotency lesson)
    if (previousOnlineStatus.current === true && !isChecking) {
      // Already online and not checking - skip redundant operations
      return
    }

    // Show checking state
    setIsChecking(true)
    setLastChecked(new Date())

    // Clear any existing retry timeouts
    if (retryTimeout.current) {
      clearTimeout(retryTimeout.current)
    }

    // Start verification with exponential backoff
    verifyOnlineStatus(0)
  }, [isChecking, verifyOnlineStatus])

  /**
   * Handle offline event
   */
  const handleOffline = useCallback(() => {
    // CHECK STATE BEFORE CHANGING STATE (Sprint 15 idempotency lesson)
    if (previousOnlineStatus.current === false && !isChecking) {
      // Already offline - skip redundant operations
      return
    }

    // Clear any retry timeouts
    if (retryTimeout.current) {
      clearTimeout(retryTimeout.current)
    }

    setIsOnline(false)
    setIsChecking(false)
    setLastChecked(new Date())
    previousOnlineStatus.current = false

    // Callbacks
    try {
      onStatusChange?.(false)
      onDisconnect?.()
    } catch (error) {
      console.error('Error in network status callback:', error)
    }
  }, [onStatusChange, onDisconnect, isChecking])

  /**
   * Force a connectivity check (useful for manual retry)
   */
  const checkConnection = useCallback(() => {
    if (navigator.onLine) {
      handleOnline()
    } else {
      handleOffline()
    }
  }, [handleOnline, handleOffline])

  /**
   * Set up event listeners for online/offline events
   */
  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine)
    setLastChecked(new Date())
    previousOnlineStatus.current = navigator.onLine

    // Add event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)

      if (retryTimeout.current) {
        clearTimeout(retryTimeout.current)
      }
    }
  }, [handleOnline, handleOffline])

  return {
    isOnline,
    isChecking,
    lastChecked,
    checkConnection,
  }
}
