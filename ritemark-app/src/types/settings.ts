/**
 * Sprint 20 Phase 1-4: Cross-Device Settings Sync
 *
 * TypeScript types for user settings that sync across devices
 * via Google Drive AppData (encrypted storage)
 */

/**
 * User settings synchronized across devices
 * Stored in Google Drive AppData (encrypted) + IndexedDB cache (plaintext)
 */
export interface UserSettings {
  /** User ID from Google OAuth (user.sub) - stable cross-device identifier */
  userId: string

  /** API Keys (encrypted separately before upload) */
  apiKeys?: {
    /** Anthropic Claude API key (BYOK - Bring Your Own Key) */
    anthropic?: string
    /** OpenAI API key (future feature) */
    openai?: string
  }

  /** Editor and app preferences */
  preferences?: {
    /** Theme: light, dark, or system-based */
    theme: 'light' | 'dark' | 'system'
    /** Font size in pixels (14-24) */
    fontSize: number
    /** Font family for editor */
    fontFamily: string
    /** Auto-save enabled */
    autoSave: boolean
    /** Auto-save interval in seconds */
    autoSaveInterval: number
  }

  /** Keyboard shortcuts (future feature) */
  shortcuts?: {
    bold: string    // e.g., 'Mod-B'
    italic: string  // e.g., 'Mod-I'
    // ... more shortcuts as needed
  }

  /** Sync metadata */
  /** Unix timestamp in milliseconds (for conflict resolution) */
  timestamp: number
  /** Schema version (for future migrations) */
  version: number
  /** Device that last synced (for debugging) */
  lastSyncedDevice?: string
}

/**
 * Encrypted settings format stored in Google Drive AppData
 * File: appDataFolder/settings.json
 */
export interface EncryptedSettings {
  /** AES-256-GCM encrypted UserSettings JSON (base64-encoded) */
  encryptedData: string
  /** Initialization vector for AES-GCM (base64-encoded) */
  iv: string
  /** Schema version (for future migrations) */
  version: number
  /** Unix timestamp in milliseconds (same as UserSettings.timestamp) */
  timestamp: number
  /** User ID (plaintext for quick lookup) */
  userId: string
}

/**
 * Settings sync status for UI feedback
 */
export type SettingsSyncStatus =
  | 'idle'      // Not syncing
  | 'syncing'   // Currently uploading/downloading
  | 'error'     // Sync failed

/**
 * Settings sync error types
 */
export interface SettingsSyncError extends Error {
  code:
    | 'NETWORK_ERROR'       // Network connectivity issue
    | 'PERMISSION_DENIED'   // Missing drive.appdata scope
    | 'ENCRYPTION_ERROR'    // Encryption/decryption failed
    | 'CONFLICT_ERROR'      // Conflict resolution failed
    | 'STORAGE_ERROR'       // IndexedDB or Drive API error
}

/**
 * Default settings for new users
 */
export const DEFAULT_USER_SETTINGS: Omit<UserSettings, 'userId' | 'timestamp'> = {
  version: 1,
  preferences: {
    theme: 'system',
    fontSize: 16,
    fontFamily: 'Inter',
    autoSave: true,
    autoSaveInterval: 3, // 3 seconds (matches current behavior)
  },
}
