/**
 * Sprint 20 Phase 1-4: Settings Encryption Utilities
 *
 * AES-256-GCM encryption for UserSettings before Google Drive upload
 * - Non-extractable CryptoKey stored in IndexedDB
 * - Base64 encoding for encrypted data transmission
 * - Full error handling with typed errors
 *
 * Security Features:
 * - AES-256-GCM authenticated encryption (AEAD mode)
 * - Unique IV per encryption operation
 * - Non-extractable CryptoKey (browser-bound, cannot be exported)
 * - Zero external dependencies (Web Crypto API only)
 */

import type { UserSettings, EncryptedSettings } from '@/types/settings'
import { reportError } from './errorReporter'

/**
 * IndexedDB database and store names for encryption key storage
 */
const DB_NAME = 'ritemark-encryption'
const DB_VERSION = 1
const STORE_NAME = 'keys'
const ENCRYPTION_KEY_ID = 'settings-encryption-key'

/**
 * Encrypt user settings before uploading to Google Drive AppData
 *
 * @param settings - UserSettings object to encrypt
 * @returns Encrypted data with IV (without userId - caller adds it)
 * @throws Error if encryption fails
 *
 * @example
 * const settings: UserSettings = { userId: 'abc', preferences: {...}, timestamp: Date.now(), version: 1 }
 * const encrypted = await encryptSettings(settings)
 * // Upload encrypted to Drive AppData with userId
 */
export async function encryptSettings(
  settings: UserSettings
): Promise<Omit<EncryptedSettings, 'userId'>> {
  try {
    // 1. Serialize settings to JSON
    const plaintext = JSON.stringify(settings)

    // 2. Generate random IV (Initialization Vector) - 96 bits for GCM
    const iv = crypto.getRandomValues(new Uint8Array(12))

    // 3. Get or create encryption key
    const key = await getOrCreateEncryptionKey()

    // 4. Encrypt with AES-256-GCM
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(plaintext)
    )

    // 5. Convert to base64 for storage/transmission
    const encryptedData = arrayBufferToBase64(encryptedBuffer)
    const ivBase64 = uint8ArrayToBase64(iv)

    return {
      encryptedData,
      iv: ivBase64,
      version: settings.version,
      timestamp: settings.timestamp,
    }
  } catch (error) {
    console.error('[settingsEncryption] Encryption failed:', error)
    throw new Error(`Failed to encrypt settings: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Decrypt user settings after downloading from Google Drive AppData
 *
 * @param encrypted - EncryptedSettings object from Drive
 * @returns Decrypted UserSettings object
 * @throws Error if decryption fails (wrong key, corrupted data)
 *
 * @example
 * const encrypted: EncryptedSettings = await downloadFromDrive()
 * const settings = await decryptSettings(encrypted)
 */
export async function decryptSettings(
  encrypted: EncryptedSettings
): Promise<UserSettings> {
  try {
    // 1. Decode base64 to Uint8Array
    const encryptedBuffer = base64ToArrayBuffer(encrypted.encryptedData)
    const ivArray = base64ToUint8Array(encrypted.iv)

    // 2. Get encryption key
    const key = await getOrCreateEncryptionKey()

    // 3. Decrypt with AES-256-GCM
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivArray },
      key,
      encryptedBuffer
    )

    // 4. Parse JSON to UserSettings
    const plaintext = new TextDecoder().decode(decryptedBuffer)
    const settings = JSON.parse(plaintext) as UserSettings

    // 5. Validate decrypted data structure
    if (!settings.userId || !settings.version || !settings.timestamp) {
      console.info('[SettingsSync] 🔄 Settings data incomplete - will reset to defaults (this is normal)')
      throw new Error('ENCRYPTION_KEY_MISMATCH')
    }

    return settings
  } catch (error) {
    // Handle encryption key mismatch gracefully (expected in cross-browser scenarios)
    if (error instanceof Error && error.name === 'OperationError') {
      console.info('[SettingsSync] 🔄 Settings encrypted with different browser - will reset to defaults (this is normal)')
      throw new Error('ENCRYPTION_KEY_MISMATCH')
    }

    // Other errors (corrupted data, network issues, etc.)
    console.error('[settingsEncryption] Decryption failed:', error)

    // Report to AI agent monitoring (but NOT for ENCRYPTION_KEY_MISMATCH - it's expected behavior)
    if (error instanceof Error) {
      reportError(error, 'settingsEncryption.decryptSettings')
    }

    throw new Error(`Failed to decrypt settings: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get or create encryption key (non-extractable CryptoKey)
 *
 * Key is stored in IndexedDB and reused across sessions.
 * If key doesn't exist, generates new AES-256 key.
 *
 * @returns CryptoKey for encryption/decryption
 * @throws Error if key generation or storage fails
 */
async function getOrCreateEncryptionKey(): Promise<CryptoKey> {
  try {
    // Try to retrieve existing key from IndexedDB
    const storedKey = await getFromIndexedDB<CryptoKey>(ENCRYPTION_KEY_ID)
    if (storedKey) {
      return storedKey
    }

    // Generate new non-extractable AES-256-GCM key
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false, // Non-extractable (security best practice - key cannot leave browser)
      ['encrypt', 'decrypt']
    )

    // Store key in IndexedDB for future use
    await saveToIndexedDB(ENCRYPTION_KEY_ID, key)

    return key
  } catch (error) {
    console.error('[settingsEncryption] Failed to get/create encryption key:', error)
    throw new Error(`Encryption key management failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get value from IndexedDB
 *
 * @param key - Key to retrieve
 * @returns Stored value or null if not found
 */
async function getFromIndexedDB<T>(key: string): Promise<T | null> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      console.error('[IndexedDB] Failed to open database:', request.error)
      reject(new Error(`IndexedDB open failed: ${request.error?.message || 'Unknown error'}`))
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }

    request.onsuccess = () => {
      const db = request.result
      try {
        const transaction = db.transaction(STORE_NAME, 'readonly')
        const store = transaction.objectStore(STORE_NAME)
        const getRequest = store.get(key)

        getRequest.onsuccess = () => {
          resolve(getRequest.result || null)
        }

        getRequest.onerror = () => {
          console.error('[IndexedDB] Get request failed:', getRequest.error)
          reject(new Error(`IndexedDB get failed: ${getRequest.error?.message || 'Unknown error'}`))
        }

        transaction.oncomplete = () => {
          db.close()
        }
      } catch (error) {
        db.close()
        reject(error)
      }
    }
  })
}

/**
 * Save value to IndexedDB
 *
 * @param key - Key to store value under
 * @param value - Value to store (supports CryptoKey)
 */
async function saveToIndexedDB(key: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      console.error('[IndexedDB] Failed to open database:', request.error)
      reject(new Error(`IndexedDB open failed: ${request.error?.message || 'Unknown error'}`))
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }

    request.onsuccess = () => {
      const db = request.result
      try {
        const transaction = db.transaction(STORE_NAME, 'readwrite')
        const store = transaction.objectStore(STORE_NAME)
        const putRequest = store.put(value, key)

        putRequest.onsuccess = () => {
          resolve()
        }

        putRequest.onerror = () => {
          console.error('[IndexedDB] Put request failed:', putRequest.error)
          reject(new Error(`IndexedDB put failed: ${putRequest.error?.message || 'Unknown error'}`))
        }

        transaction.oncomplete = () => {
          db.close()
        }
      } catch (error) {
        db.close()
        reject(error)
      }
    }
  })
}

/**
 * Base64 encoding/decoding helpers
 */

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function uint8ArrayToBase64(array: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < array.length; i++) {
    binary += String.fromCharCode(array[i])
  }
  return btoa(binary)
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}
