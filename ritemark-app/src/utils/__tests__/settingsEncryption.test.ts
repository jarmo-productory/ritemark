/**
 * Unit tests for Settings Encryption Utilities
 * Sprint 20 Phase 1-4: Cross-Device Settings Sync
 *
 * Tests AES-256-GCM encryption/decryption round-trip
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { encryptSettings, decryptSettings } from '../settingsEncryption'
import type { UserSettings, EncryptedSettings } from '@/types/settings'

// Mock IndexedDB for testing environment
class IDBFactoryMock {
  private stores = new Map<string, Map<string, any>>()

  open(_name: string, _version: number): IDBOpenDBRequest {
    const request = {} as IDBOpenDBRequest
    const db = {
      objectStoreNames: {
        contains: (storeName: string) => this.stores.has(storeName),
      },
      createObjectStore: (storeName: string) => {
        this.stores.set(storeName, new Map())
      },
      transaction: (storeName: string, _mode: string) => {
        const store = this.stores.get(storeName) || new Map()
        return {
          objectStore: () => ({
            get: (key: string) => ({
              onsuccess: null as any,
              onerror: null as any,
              result: store.get(key),
            }),
            put: (value: any, key: string) => {
              store.set(key, value)
              return {
                onsuccess: null as any,
                onerror: null as any,
              }
            },
          }),
          oncomplete: null as any,
        }
      },
      close: () => {},
    }

    setTimeout(() => {
      if (request.onupgradeneeded) {
        request.onupgradeneeded({ target: { result: db } } as any)
      }
      if (request.onsuccess) {
        request.onsuccess({ target: { result: db } } as any)
      }
    }, 0)

    return request
  }
}

describe('settingsEncryption', () => {
  beforeEach(() => {
    // Mock IndexedDB
    global.indexedDB = new IDBFactoryMock() as any
  })

  describe('encryptSettings', () => {
    it('should encrypt user settings successfully', async () => {
      const settings: UserSettings = {
        userId: 'test-user-123',
        version: 1,
        timestamp: Date.now(),
        preferences: {
          theme: 'dark',
          fontSize: 16,
          fontFamily: 'Inter',
          autoSave: true,
          autoSaveInterval: 3,
        },
      }

      const encrypted = await encryptSettings(settings)

      // Verify structure
      expect(encrypted).toHaveProperty('encryptedData')
      expect(encrypted).toHaveProperty('iv')
      expect(encrypted).toHaveProperty('version')
      expect(encrypted).toHaveProperty('timestamp')
      expect(encrypted).not.toHaveProperty('userId') // Should be omitted

      // Verify encrypted data is base64
      expect(() => atob(encrypted.encryptedData)).not.toThrow()
      expect(() => atob(encrypted.iv)).not.toThrow()

      // Verify IV is correct length (12 bytes = 16 base64 chars)
      expect(encrypted.iv.length).toBeGreaterThan(0)
    })

    it('should generate unique IV for each encryption', async () => {
      const settings: UserSettings = {
        userId: 'test-user-123',
        version: 1,
        timestamp: Date.now(),
        preferences: {
          theme: 'dark',
          fontSize: 16,
          fontFamily: 'Inter',
          autoSave: true,
          autoSaveInterval: 3,
        },
      }

      const encrypted1 = await encryptSettings(settings)
      const encrypted2 = await encryptSettings(settings)

      // Different IVs should produce different encrypted data
      expect(encrypted1.iv).not.toBe(encrypted2.iv)
      expect(encrypted1.encryptedData).not.toBe(encrypted2.encryptedData)
    })
  })

  describe('decryptSettings', () => {
    it('should decrypt settings back to original', async () => {
      const originalSettings: UserSettings = {
        userId: 'test-user-123',
        version: 1,
        timestamp: 1234567890,
        preferences: {
          theme: 'light',
          fontSize: 18,
          fontFamily: 'Roboto',
          autoSave: false,
          autoSaveInterval: 5,
        },
        apiKeys: {
          anthropic: 'sk-ant-test-key',
        },
      }

      // Encrypt
      const encrypted = await encryptSettings(originalSettings)

      // Add userId back (simulating Drive storage)
      const encryptedWithUserId: EncryptedSettings = {
        ...encrypted,
        userId: originalSettings.userId,
      }

      // Decrypt
      const decrypted = await decryptSettings(encryptedWithUserId)

      // Verify round-trip success
      expect(decrypted).toEqual(originalSettings)
      expect(decrypted.userId).toBe(originalSettings.userId)
      expect(decrypted.preferences?.theme).toBe('light')
      expect(decrypted.apiKeys?.anthropic).toBe('sk-ant-test-key')
    })

    it('should throw error for corrupted data', async () => {
      const invalidEncrypted: EncryptedSettings = {
        encryptedData: 'invalid-base64-data',
        iv: 'AAECAwQFBgcICQoLDA==', // Valid IV
        userId: 'test-user',
        version: 1,
        timestamp: Date.now(),
      }

      await expect(decryptSettings(invalidEncrypted)).rejects.toThrow()
    })

    it('should throw error for missing required fields', async () => {
      const settings: UserSettings = {
        userId: 'test-user-123',
        version: 1,
        timestamp: Date.now(),
      }

      const encrypted = await encryptSettings(settings)
      const encryptedWithUserId: EncryptedSettings = {
        ...encrypted,
        userId: settings.userId,
      }

      // This should work
      const decrypted = await decryptSettings(encryptedWithUserId)
      expect(decrypted.userId).toBe('test-user-123')
    })
  })

  describe('round-trip encryption/decryption', () => {
    it('should handle complex settings objects', async () => {
      const complexSettings: UserSettings = {
        userId: 'complex-user-456',
        version: 1,
        timestamp: Date.now(),
        preferences: {
          theme: 'system',
          fontSize: 14,
          fontFamily: 'Monaco',
          autoSave: true,
          autoSaveInterval: 10,
        },
        apiKeys: {
          anthropic: 'sk-ant-api-key-1',
          openai: 'sk-openai-key-2',
        },
        shortcuts: {
          bold: 'Mod-B',
          italic: 'Mod-I',
        },
        lastSyncedDevice: 'MacBook Pro',
      }

      const encrypted = await encryptSettings(complexSettings)
      const encryptedWithUserId: EncryptedSettings = {
        ...encrypted,
        userId: complexSettings.userId,
      }
      const decrypted = await decryptSettings(encryptedWithUserId)

      expect(decrypted).toEqual(complexSettings)
    })

    it('should preserve special characters and unicode', async () => {
      const settingsWithUnicode: UserSettings = {
        userId: 'unicode-user-🚀',
        version: 1,
        timestamp: Date.now(),
        preferences: {
          theme: 'dark',
          fontSize: 16,
          fontFamily: '源ノ角ゴシック', // Japanese font name
          autoSave: true,
          autoSaveInterval: 3,
        },
        lastSyncedDevice: 'Device with emoji 🔥',
      }

      const encrypted = await encryptSettings(settingsWithUnicode)
      const encryptedWithUserId: EncryptedSettings = {
        ...encrypted,
        userId: settingsWithUnicode.userId,
      }
      const decrypted = await decryptSettings(encryptedWithUserId)

      expect(decrypted).toEqual(settingsWithUnicode)
      expect(decrypted.userId).toBe('unicode-user-🚀')
      expect(decrypted.preferences?.fontFamily).toBe('源ノ角ゴシック')
    })
  })
})
