/**
 * API Key Manager
 * Secure storage for OpenAI API keys using IndexedDB with AES-256-GCM encryption
 *
 * Architecture follows Sprint 19 TokenManagerEncrypted pattern:
 * - IndexedDB for browser-based persistence
 * - AES-256-GCM encryption with non-extractable CryptoKey
 * - Encrypted data + IV stored, key kept in memory
 */

import { openDB, type IDBPDatabase } from 'idb'
import { generateEncryptionKey, encryptData, decryptData } from '@/utils/crypto'

const DB_NAME = 'ritemark-settings'
const DB_VERSION = 3 // Sprint 23: Bumped to 3 to fix missing api-keys store
const STORE_NAME = 'api-keys'
const API_KEY_ID = 'openai-key'

// Encryption key storage (separate database like Sprint 20)
const ENCRYPTION_DB_NAME = 'ritemark-encryption'
const ENCRYPTION_DB_VERSION = 1
const ENCRYPTION_STORE_NAME = 'keys'
const ENCRYPTION_KEY_ID = 'api-key-encryption-key'

interface EncryptedAPIKey {
  id: string
  encrypted: Uint8Array  // Changed to match crypto.ts EncryptedData type
  iv: Uint8Array
  timestamp: number
}

// Custom event for API key changes
export const API_KEY_CHANGED_EVENT = 'api-key-changed'

export interface APIKeyChangedEvent extends CustomEvent {
  detail: {
    action: 'stored' | 'deleted'
    hasKey: boolean
  }
}

class APIKeyManager {
  private db: IDBPDatabase | null = null
  private encryptionKey: CryptoKey | null = null

  /**
   * Dispatch event to notify listeners about API key changes
   */
  private dispatchKeyChangeEvent(action: 'stored' | 'deleted', hasKey: boolean) {
    const event = new CustomEvent(API_KEY_CHANGED_EVENT, {
      detail: { action, hasKey }
    })
    window.dispatchEvent(event)
  }

  /**
   * Initialize database and encryption key
   */
  private async init(): Promise<void> {
    if (this.db && this.encryptionKey) {
      return // Already initialized
    }

    // Open/create IndexedDB database with timeout
    // Version 3: Fixed missing api-keys store creation (Sprint 23)
    const dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
      },
      blocked() {
        console.warn('[APIKeyManager] Database upgrade blocked - another connection is open')
      },
      blocking() {
        console.warn('[APIKeyManager] This connection is blocking another upgrade')
      }
    })

    // Add 5-second timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Database open timed out after 5 seconds')), 5000)
    })

    this.db = await Promise.race([dbPromise, timeoutPromise])

    // Get or create persistent encryption key (same pattern as Sprint 20)
    this.encryptionKey = await this.getOrCreateEncryptionKey()
  }

  /**
   * Get or create encryption key stored in IndexedDB
   * Key persists across page reloads (Sprint 20 pattern)
   */
  private async getOrCreateEncryptionKey(): Promise<CryptoKey> {
    // Try to retrieve existing key from IndexedDB
    const storedKey = await this.getFromEncryptionDB<CryptoKey>(ENCRYPTION_KEY_ID)
    if (storedKey) {
      return storedKey
    }

    // Generate new non-extractable AES-256-GCM key
    const key = await generateEncryptionKey()

    // Store key in IndexedDB for future use
    await this.saveToEncryptionDB(ENCRYPTION_KEY_ID, key)

    return key
  }

  /**
   * Get value from encryption IndexedDB
   */
  private async getFromEncryptionDB<T>(key: string): Promise<T | null> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(ENCRYPTION_DB_NAME, ENCRYPTION_DB_VERSION)

      request.onerror = () => {
        reject(new Error(`IndexedDB open failed: ${request.error?.message || 'Unknown error'}`))
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(ENCRYPTION_STORE_NAME)) {
          db.createObjectStore(ENCRYPTION_STORE_NAME)
        }
      }

      request.onsuccess = () => {
        const db = request.result
        try {
          const transaction = db.transaction(ENCRYPTION_STORE_NAME, 'readonly')
          const store = transaction.objectStore(ENCRYPTION_STORE_NAME)
          const getRequest = store.get(key)

          getRequest.onsuccess = () => {
            resolve(getRequest.result || null)
          }

          getRequest.onerror = () => {
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
   * Save value to encryption IndexedDB
   */
  private async saveToEncryptionDB(key: string, value: unknown): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(ENCRYPTION_DB_NAME, ENCRYPTION_DB_VERSION)

      request.onerror = () => {
        reject(new Error(`IndexedDB open failed: ${request.error?.message || 'Unknown error'}`))
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(ENCRYPTION_STORE_NAME)) {
          db.createObjectStore(ENCRYPTION_STORE_NAME)
        }
      }

      request.onsuccess = () => {
        const db = request.result
        try {
          const transaction = db.transaction(ENCRYPTION_STORE_NAME, 'readwrite')
          const store = transaction.objectStore(ENCRYPTION_STORE_NAME)
          const putRequest = store.put(value, key)

          putRequest.onsuccess = () => {
            resolve()
          }

          putRequest.onerror = () => {
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
   * Store OpenAI API key (encrypted)
   * @param apiKey - OpenAI API key (starts with 'sk-')
   */
  async storeAPIKey(apiKey: string): Promise<void> {
    if (!apiKey || !apiKey.trim()) {
      throw new Error('API key cannot be empty')
    }

    if (!apiKey.startsWith('sk-')) {
      throw new Error('Invalid OpenAI API key format (must start with sk-)')
    }

    await this.init()

    if (!this.db || !this.encryptionKey) {
      throw new Error('Failed to initialize storage')
    }

    if (!this.db.objectStoreNames.contains(STORE_NAME)) {
      throw new Error(`Object store '${STORE_NAME}' does not exist! Available: ${Array.from(this.db.objectStoreNames).join(', ')}`)
    }

    // Encrypt API key
    const { encrypted, iv } = await encryptData(apiKey, this.encryptionKey)

    // Store encrypted data in IndexedDB
    const encryptedAPIKey: EncryptedAPIKey = {
      id: API_KEY_ID,
      encrypted,
      iv,
      timestamp: Date.now(),
    }

    // Use explicit transaction for atomicity
    const tx = this.db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    await store.put(encryptedAPIKey)
    await tx.done

    // Verify it was stored
    const verification = await this.db.get(STORE_NAME, API_KEY_ID)
    if (!verification) {
      throw new Error('API key storage verification failed - data was not persisted!')
    }

    // Notify listeners that a key was stored
    this.dispatchKeyChangeEvent('stored', true)
  }

  /**
   * Retrieve OpenAI API key (decrypted)
   * @returns API key or null if not found
   */
  async getAPIKey(): Promise<string | null> {
    await this.init()

    if (!this.db || !this.encryptionKey) {
      throw new Error('Failed to initialize storage')
    }

    // Retrieve encrypted data from IndexedDB
    const encryptedAPIKey = await this.db.get(STORE_NAME, API_KEY_ID) as EncryptedAPIKey | undefined

    if (!encryptedAPIKey) {
      return null // No key stored
    }

    // Validate data structure
    if (!encryptedAPIKey.encrypted || !encryptedAPIKey.iv) {
      console.error('[APIKeyManager] Corrupted data found, deleting...')
      await this.db.delete(STORE_NAME, API_KEY_ID)
      return null
    }

    // Decrypt API key
    try {
      const apiKey = await decryptData(
        { encrypted: encryptedAPIKey.encrypted, iv: encryptedAPIKey.iv },
        this.encryptionKey
      )
      return apiKey
    } catch (error) {
      console.error('[APIKeyManager] Failed to decrypt API key:', error)
      await this.db.delete(STORE_NAME, API_KEY_ID)
      return null
    }
  }

  /**
   * Check if API key exists (without decrypting)
   * @returns true if key exists, false otherwise
   */
  async hasAPIKey(): Promise<boolean> {
    await this.init()

    if (!this.db) {
      throw new Error('Failed to initialize storage')
    }

    const encryptedAPIKey = await this.db.get(STORE_NAME, API_KEY_ID)
    return !!encryptedAPIKey
  }

  /**
   * Delete stored API key
   */
  async deleteAPIKey(): Promise<void> {
    await this.init()

    if (!this.db) {
      throw new Error('Failed to initialize storage')
    }

    await this.db.delete(STORE_NAME, API_KEY_ID)

    // Notify listeners that a key was deleted
    this.dispatchKeyChangeEvent('deleted', false)
  }

  /**
   * Get masked API key for display (e.g., "sk-...****...1234")
   * @returns Masked key or null if not found
   */
  async getMaskedKey(): Promise<string | null> {
    const apiKey = await this.getAPIKey()

    if (!apiKey) {
      return null
    }

    // Show first 7 chars (sk-proj) and last 4 chars
    if (apiKey.length > 11) {
      const start = apiKey.substring(0, 7)
      const end = apiKey.substring(apiKey.length - 4)
      return `${start}...****...${end}`
    }

    return 'sk-...****' // Fallback for short keys
  }
}

// Export singleton instance
export const apiKeyManager = new APIKeyManager()
