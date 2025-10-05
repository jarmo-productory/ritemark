/**
 * Google Picker API Manager - Desktop File Selection
 * Sprint 8: Google Drive API Integration (GPT-5 Issue #1 fix)
 *
 * Purpose: Enables desktop users (≥768px) to open ANY Drive markdown file
 * Why: drive.file scope requires explicit user selection via Picker
 * Mobile: Uses custom browser (app-created files only)
 */

/// <reference path="../../types/google-api.d.ts" />

// Use types from usePicker.ts (avoid conflicts)
type PickerInstance = {
  setVisible(visible: boolean): void
  dispose?(): void
}

type PickerBuilder = {
  addView(view: unknown): PickerBuilder
  setOAuthToken(token: string): PickerBuilder
  setCallback(callback: (data: PickerCallbackData) => void): PickerBuilder
  setTitle?(title: string): PickerBuilder
  enableFeature?(feature: string): PickerBuilder
  setMaxItems?(maxItems: number): PickerBuilder
  setAppId?(appId: string): PickerBuilder
  setDeveloperKey?(key: string): PickerBuilder
  build(): PickerInstance
}

type PickerView = {
  setMimeTypes(mimeTypes: string): PickerView
  setMode(mode: string): PickerView
}

/**
 * Picker configuration options
 */
export interface PickerConfig {
  clientId: string
  oauthToken: string
  appId?: string
  developerKey?: string
  title?: string
  multiSelect?: boolean
  mimeTypes?: string[]
  viewMode?: 'LIST' | 'GRID'
  enableUpload?: boolean
  maxItems?: number
}

/**
 * Picker error types
 */
export interface PickerError {
  code: string
  message: string
  retryable: boolean
}

export const PICKER_ERRORS = {
  NOT_LOADED: 'PICKER_NOT_LOADED',
  NO_TOKEN: 'PICKER_NO_TOKEN',
  USER_CANCELLED: 'PICKER_USER_CANCELLED',
  INITIALIZATION_FAILED: 'PICKER_INITIALIZATION_FAILED',
  LOAD_FAILED: 'PICKER_LOAD_FAILED',
} as const

/**
 * Picker MIME types for file filtering
 */
export const PICKER_MIME_TYPES = {
  MARKDOWN: 'text/markdown',
  TEXT: 'text/plain',
  ALL_TEXT: 'text/*',
  ALL_DOCS: 'application/vnd.google-apps.document',
} as const

/**
 * Google Picker API Manager
 * Wraps Google Picker API for secure file selection with drive.file scope
 */
export class PickerManager {
  private pickerApiLoaded = false
  private oauthToken: string | null = null
  private loadPromise: Promise<void> | null = null

  /**
   * Initialize Picker API and store OAuth credentials
   * @param _clientId - Google OAuth client ID (unused but kept for API compatibility)
   * @param oauthToken - Valid OAuth access token with drive.file scope
   */
  async initialize(_clientId: string, oauthToken: string): Promise<void> {
    this.oauthToken = oauthToken

    // Return existing load promise if already loading
    if (this.loadPromise) {
      return this.loadPromise
    }

    // Return immediately if already loaded
    if (this.pickerApiLoaded) {
      return Promise.resolve()
    }

    // Create new load promise
    this.loadPromise = new Promise<void>((resolve, reject) => {
      try {
        // Check if gapi is available
        if (typeof window === 'undefined' || !window.gapi) {
          reject(this.createError(
            PICKER_ERRORS.LOAD_FAILED,
            'Google API (gapi) not loaded. Ensure gapi script is included in index.html',
            false
          ))
          return
        }

        // Load Picker API via gapi.load()
        window.gapi.load('picker', {
          callback: () => {
            this.pickerApiLoaded = true
            this.loadPromise = null
            resolve()
          },
        })
      } catch (error) {
        this.loadPromise = null
        reject(this.createError(
          PICKER_ERRORS.INITIALIZATION_FAILED,
          `Picker initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          true
        ))
      }
    })

    return this.loadPromise
  }

  /**
   * Show Google Picker dialog for file selection
   * @param onFileSelect - Callback with selected file ID
   * @param config - Optional picker configuration
   */
  async showPicker(
    onFileSelect: (fileId: string, fileName: string) => void,
    config?: Partial<PickerConfig>
  ): Promise<void> {
    // Validate Picker API is loaded
    if (!this.pickerApiLoaded) {
      throw this.createError(
        PICKER_ERRORS.NOT_LOADED,
        'Picker API not loaded. Call initialize() first',
        false
      )
    }

    // Validate OAuth token exists
    if (!this.oauthToken) {
      throw this.createError(
        PICKER_ERRORS.NO_TOKEN,
        'No OAuth token available. User must authenticate first',
        true
      )
    }

    // Validate google.picker is available
    if (typeof window === 'undefined' || !window.google) {
      throw this.createError(
        PICKER_ERRORS.NOT_LOADED,
        'Google API library not available',
        false
      )
    }

    try {
      // Build Picker configuration
      const mimeTypes = config?.mimeTypes || [
        PICKER_MIME_TYPES.MARKDOWN,
        PICKER_MIME_TYPES.TEXT,
      ]
      const viewMode = config?.viewMode || 'LIST'

      // Access google.picker safely (type assertion for compatibility)
      const googlePicker = (window.google as any).picker
      if (!googlePicker) {
        throw this.createError(
          PICKER_ERRORS.NOT_LOADED,
          'Google Picker not available',
          false
        )
      }

      // Create DocsView for file selection
      const docsView = (new googlePicker.DocsView(googlePicker.ViewId.DOCS) as PickerView)
        .setMimeTypes(mimeTypes.join(','))
        .setMode(googlePicker.DocsViewMode[viewMode])

      // Build Picker instance
      const picker = (new googlePicker.PickerBuilder() as PickerBuilder)
        .addView(docsView)
        .setOAuthToken(this.oauthToken)
        .setCallback((data: PickerCallbackData) => {
          this.handlePickerCallback(data, onFileSelect)
        })

      // Apply optional configurations
      if (config?.title && picker.setTitle) {
        picker.setTitle(config.title)
      }

      if (config?.multiSelect && picker.enableFeature) {
        picker.enableFeature(googlePicker.Feature.MULTISELECT_ENABLED)
      }

      if (config?.maxItems && picker.setMaxItems) {
        picker.setMaxItems(config.maxItems)
      }

      if (config?.appId && picker.setAppId) {
        picker.setAppId(config.appId)
      }

      if (config?.developerKey && picker.setDeveloperKey) {
        picker.setDeveloperKey(config.developerKey)
      }

      // Build and show picker
      const pickerInstance = picker.build()
      pickerInstance.setVisible(true)
    } catch (error) {
      throw this.createError(
        PICKER_ERRORS.INITIALIZATION_FAILED,
        `Failed to show picker: ${error instanceof Error ? error.message : 'Unknown error'}`,
        true
      )
    }
  }

  /**
   * Handle Picker callback events
   * @param data - Picker callback data
   * @param onFileSelect - User's file selection callback
   */
  private handlePickerCallback(
    data: PickerCallbackData,
    onFileSelect: (fileId: string, fileName: string) => void
  ): void {
    if (!window.google) return

    // Type assertion for compatibility with existing code
    const googlePicker = (window.google as any).picker
    if (!googlePicker) return

    // Check if user picked a file
    if (data.action === googlePicker.Action.PICKED) {
      const doc: PickerDocumentType | undefined = data.docs?.[0]

      if (doc?.id) {
        // Call user's callback with file ID and name
        onFileSelect(doc.id, doc.name || 'Untitled')
      }
    }

    // User cancelled - no action needed
    if (data.action === googlePicker.Action.CANCEL) {
      console.log('User cancelled file selection')
    }
  }

  /**
   * Update OAuth token (for token refresh scenarios)
   * @param oauthToken - New OAuth access token
   */
  updateToken(oauthToken: string): void {
    this.oauthToken = oauthToken
  }

  /**
   * Check if Picker API is loaded and ready
   * @returns True if Picker is ready to use
   */
  isReady(): boolean {
    return this.pickerApiLoaded && !!this.oauthToken
  }

  /**
   * Dispose of Picker resources
   */
  dispose(): void {
    this.pickerApiLoaded = false
    this.oauthToken = null
    this.loadPromise = null
  }

  /**
   * Create standardized Picker error
   */
  private createError(code: string, message: string, retryable: boolean): PickerError {
    return {
      code,
      message,
      retryable,
    }
  }
}

/**
 * Singleton instance for application-wide use
 */
export const pickerManager = new PickerManager()
