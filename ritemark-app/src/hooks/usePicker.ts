/**
 * usePicker Hook - Google Picker initialization hook (desktop only)
 *
 * Provides Google Picker API integration for desktop browsers with:
 * - Automatic Picker API initialization
 * - OAuth token integration
 * - Desktop-only detection (≥768px)
 * - File selection callback handling
 *
 * Note: Google Picker API only works on desktop browsers (viewport width ≥768px)
 * Mobile users should use the custom file browser component instead.
 *
 * @example
 * const { isPickerReady, showPicker } = usePicker()
 *
 * // Show picker when user clicks "Open from Drive"
 * const handleOpenFile = () => {
 *   showPicker((fileId) => {
 *     console.log('User selected file:', fileId)
 *   })
 * }
 */

import { useState, useEffect, useCallback } from 'react'
import { tokenManagerEncrypted } from '../services/auth/TokenManagerEncrypted'

/**
 * Return type for usePicker hook
 */
export interface UsePickerReturn {
  /**
   * Whether the Google Picker API is ready to use
   */
  isPickerReady: boolean

  /**
   * Show the Google Picker dialog
   *
   * Sprint 27: Now async to fetch fresh token before showing picker
   *
   * @param onFileSelect - Callback when user selects a file (receives DriveFile object)
   * @param onCancel - Optional callback when user cancels the picker
   * @param onError - Optional callback when picker fails to open
   * @returns Promise<boolean> - true if picker opened successfully, false otherwise
   */
  showPicker: (
    onFileSelect: (file: { id: string; name: string; mimeType: string }) => void,
    onCancel?: () => void,
    onError?: (error: string) => void
  ) => Promise<boolean>
}

/**
 * Check if viewport is desktop size (≥768px)
 */
function isDesktop(): boolean {
  return window.innerWidth >= 768
}

/**
 * Load Google Picker API script
 */
async function loadPickerAPI(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    if (window.gapi && window.google?.picker) {
      resolve()
      return
    }

    // Create script element
    const script = document.createElement('script')
    script.src = 'https://apis.google.com/js/api.js'
    script.async = true
    script.defer = true

    script.onload = () => {
      // Load the picker library
      if (window.gapi) {
        window.gapi.load('picker', {
          callback: () => resolve(),
        })
      } else {
        reject(new Error('Failed to load Google API client'))
      }
    }

    script.onerror = () => {
      reject(new Error('Failed to load Google Picker API script'))
    }

    document.body.appendChild(script)
  })
}

/**
 * Hook for Google Picker API integration
 *
 * Automatically initializes the Google Picker API on desktop browsers.
 * Returns ready state and a function to show the picker dialog.
 *
 * Note: Only works on desktop (viewport width ≥768px)
 *
 * @returns Picker ready state and show picker function
 */
export function usePicker(): UsePickerReturn {
  const [isPickerReady, setIsPickerReady] = useState(false)

  /**
   * Initialize Google Picker API on mount (desktop only)
   *
   * Sprint 27 Fix: Removed oauthToken state - we fetch fresh token on EVERY picker open
   * to avoid stale token issues when token expires or gets refreshed.
   */
  useEffect(() => {
    // Only initialize on desktop
    if (!isDesktop()) {
      console.log('Picker API disabled on mobile - use custom file browser')
      return
    }

    const initPicker = async () => {
      try {
        // Check if user is authenticated (but don't capture token here)
        const token = await tokenManagerEncrypted.getAccessToken()
        if (!token) {
          console.warn('No OAuth token available - user must sign in')
          return
        }

        console.log('[usePicker] User authenticated, loading Picker API...')

        // Load Google Picker API
        await loadPickerAPI()

        setIsPickerReady(true)
        console.log('Google Picker API ready')
      } catch (error) {
        console.error('Failed to initialize Google Picker:', error)
        setIsPickerReady(false)
      }
    }

    initPicker()
  }, [])

  /**
   * Show the Google Picker dialog
   *
   * Sprint 27 Fix: Fetch fresh token on EVERY picker open to avoid stale token issues.
   * This ensures that if token was refreshed while picker was idle, we use the new token.
   */
  const showPicker = useCallback(
    async (
      onFileSelect: (file: { id: string; name: string; mimeType: string }) => void,
      onCancel?: () => void,
      onError?: (error: string) => void
    ) => {
      if (!isPickerReady) {
        const error = 'Picker not ready - please wait'
        console.warn(error)
        onError?.(error)
        return false
      }

      if (!window.google?.picker) {
        const error = 'Google Picker API not loaded'
        console.error(error)
        onError?.(error)
        return false
      }

      try {
        // Sprint 27 Fix: Get FRESH token right before showing picker
        // This ensures we always use the latest token (even if it was just refreshed)
        const freshToken = await tokenManagerEncrypted.getAccessToken()

        if (!freshToken) {
          const error = 'No valid access token - please sign in'
          console.warn('[usePicker] No access token available')
          onError?.(error)
          return false
        }

        console.log('[usePicker] Using fresh token for picker:', freshToken.substring(0, 20) + '...')

        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
        if (!clientId) {
          const error = 'Google Client ID not configured'
          console.error(error)
          onError?.(error)
          return false
        }

        // Extract project number from client ID (format: 730176557860-xxx.apps.googleusercontent.com)
        const projectNumber = clientId.split('-')[0]

        // Create Picker instance with FRESH token
        const pickerBuilder = new window.google.picker.PickerBuilder()
          .addView(
            new window.google.picker.DocsView(window.google.picker.ViewId.DOCS)
              .setMimeTypes('text/markdown,text/plain')
              .setMode(window.google.picker.DocsViewMode.LIST)
          )
          .setOAuthToken(freshToken)  // ← FRESH TOKEN, not stale state!
          .setAppId(projectNumber) // Use project number, not full client ID
          .enableFeature(window.google.picker.Feature.NAV_HIDDEN)
          .enableFeature(window.google.picker.Feature.MINE_ONLY)

        // Only set developer key if it's configured (optional)
        const developerKey = import.meta.env.VITE_GOOGLE_API_KEY
        if (developerKey && developerKey.trim()) {
          pickerBuilder.setDeveloperKey(developerKey)
        }

        const picker = pickerBuilder
          .setCallback((data) => {
            if (data.action === window.google?.picker.Action.PICKED) {
              const doc = data.docs?.[0]
              if (doc && doc.id) {
                // Convert PickerDocument to minimal DriveFile-compatible object
                onFileSelect({
                  id: doc.id,
                  name: doc.name,
                  mimeType: doc.mimeType,
                })
              }
            } else if (data.action === window.google?.picker.Action.CANCEL) {
              console.log('User cancelled picker')
              onCancel?.()
            }
          })
          .build()

        // Show picker
        picker.setVisible(true)
        return true
      } catch (error) {
        const errorMsg = `Failed to show Google Picker: ${error instanceof Error ? error.message : 'Unknown error'}`
        console.error(errorMsg)
        onError?.(errorMsg)
        return false
      }
    },
    [isPickerReady]  // ← Removed oauthToken dependency - we fetch it fresh each time
  )

  return {
    isPickerReady,
    showPicker,
  }
}
