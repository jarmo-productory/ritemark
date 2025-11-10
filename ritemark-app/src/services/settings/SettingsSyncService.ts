/**
 * SettingsSyncService - Google Drive AppData Settings Sync
 * Sprint 20 Phase 1-4: Cross-Device Settings Sync
 *
 * Features:
 * - Bidirectional settings sync (local IndexedDB ↔ Google Drive AppData)
 * - Cache-first loading strategy (instant load from IndexedDB)
 * - Background auto-sync (30-second interval)
 * - Last-write-wins conflict resolution
 * - Offline support with queue
 * - AES-256-GCM encryption for Drive storage
 */

import { openDB, type IDBPDatabase } from 'idb';
import { encryptSettings, decryptSettings } from '../../utils/settingsEncryption';
import type { UserSettings, EncryptedSettings } from '../../types/settings';
import { tokenManagerEncrypted } from '../auth/TokenManagerEncrypted';
import { reportError } from '../../utils/errorReporter';

const DB_NAME = 'ritemark-settings';
const DB_VERSION = 3; // Sprint 23: Bumped to 3 to fix missing api-keys store
const STORE_NAME = 'settings-cache';
const SYNC_INTERVAL = 30000; // 30 seconds
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API_BASE = 'https://www.googleapis.com/upload/drive/v3';

export class SettingsSyncService {
  private db: IDBPDatabase | null = null;
  private syncInterval: number | null = null;
  private syncing: boolean = false;
  private lastSyncTime: number | null = null;

  /**
   * Initialize IndexedDB for settings caching
   * Sprint 23: Updated to version 2 to share database with API key storage
   */
  private async initDB(): Promise<IDBPDatabase> {
    if (this.db) {
      return this.db;
    }

    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Sprint 20: settings-cache store
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }

        // Sprint 23: api-keys store (MUST be created here since SettingsSyncService runs first)
        if (!db.objectStoreNames.contains('api-keys')) {
          db.createObjectStore('api-keys', { keyPath: 'id' });
        }
      },
    });

    // Request persistent storage
    if (navigator.storage && navigator.storage.persist) {
      await navigator.storage.persist();
    }

    return this.db;
  }

  /**
   * Save settings (local IndexedDB + Google Drive AppData)
   * @param settings - UserSettings to save
   */
  async saveSettings(settings: UserSettings): Promise<void> {
    try {
      // Add timestamp for conflict resolution
      settings.timestamp = Date.now();

      // Cache in IndexedDB (instant)
      const db = await this.initDB();
      await db.put(STORE_NAME, settings, 'current');

      // Encrypt settings
      const encrypted = await encryptSettings(settings);

      // Add userId to encrypted payload (required by EncryptedSettings type)
      const encryptedWithUserId = {
        ...encrypted,
        userId: settings.userId,
      };

      // Upload to Drive AppData (background)
      await this.uploadToDrive(encryptedWithUserId);

      // Update last sync timestamp
      this.lastSyncTime = Date.now();
      await db.put(STORE_NAME, this.lastSyncTime, 'lastSyncTimestamp');
    } catch (error) {
      console.error('[SettingsSync] Failed to save settings:', error);
      throw new Error('Failed to save settings');
    }
  }

  /**
   * Load settings (cache-first strategy)
   * @returns UserSettings or null if not found
   */
  async loadSettings(): Promise<UserSettings | null> {
    try {
      const db = await this.initDB();

      // Try IndexedDB cache first (instant load <10ms)
      const cached = await db.get(STORE_NAME, 'current') as UserSettings | undefined;
      if (cached) {
        // Sync in background (don't block UI)
        this.syncSettings().catch(error => {
          console.error('[SettingsSync] Background sync failed:', error);
        });

        return cached;
      }

      // No cache, fetch from Drive
      const remote = await this.loadFromDrive();
      if (remote) {
        // Cache for next time
        await db.put(STORE_NAME, remote, 'current');
        return remote;
      }

      // No settings found (first-time user)
      return null;
    } catch (error) {
      console.error('[SettingsSync] Failed to load settings:', error);
      throw new Error('Failed to load settings');
    }
  }

  /**
   * Bidirectional sync (last-write-wins conflict resolution)
   */
  async syncSettings(): Promise<void> {
    if (this.syncing) {
      return; // Prevent concurrent syncs
    }

    this.syncing = true;
    try {
      const db = await this.initDB();

      // Get local settings
      const local = await db.get(STORE_NAME, 'current') as UserSettings | undefined;

      // Get remote settings
      const remote = await this.loadFromDrive();

      // Conflict resolution (last-write-wins)
      if (!remote) {
        // No remote, upload local
        if (local) {
          await this.saveSettings(local);
        }
        return;
      }

      if (!local) {
        // No local, download remote
        await db.put(STORE_NAME, remote, 'current');
        this.lastSyncTime = Date.now();
        await db.put(STORE_NAME, this.lastSyncTime, 'lastSyncTimestamp');
        return;
      }

      // Compare timestamps (last-write-wins)
      if (remote.timestamp > local.timestamp) {
        // Remote is newer, update local
        await db.put(STORE_NAME, remote, 'current');
        this.lastSyncTime = Date.now();
        await db.put(STORE_NAME, this.lastSyncTime, 'lastSyncTimestamp');
      } else if (local.timestamp > remote.timestamp) {
        // Local is newer, upload to Drive
        await this.saveSettings(local);
      }
      // Timestamps equal, no sync needed
    } catch (error) {
      console.error('[SettingsSync] Sync failed:', error);
      throw new Error('Settings sync failed');
    } finally {
      this.syncing = false;
    }
  }

  /**
   * Delete settings (local IndexedDB + Google Drive AppData)
   */
  async deleteSettings(): Promise<void> {
    try {
      // Delete from IndexedDB
      const db = await this.initDB();
      await db.delete(STORE_NAME, 'current');
      await db.delete(STORE_NAME, 'lastSyncTimestamp');

      // Delete from Drive AppData
      await this.deleteFromDrive();

      this.lastSyncTime = null;
    } catch (error) {
      console.error('[SettingsSync] Failed to delete settings:', error);
      throw new Error('Failed to delete settings');
    }
  }

  /**
   * Start automatic background sync
   * Triggers: 30s interval, visibility change, online event, app start
   */
  startAutoSync(): void {
    // Sync on app start
    this.syncSettings().catch(error => {
      console.error('[SettingsSync] Initial sync failed:', error);
    });

    // Sync every 30 seconds (if online)
    this.syncInterval = window.setInterval(() => {
      if (navigator.onLine && !this.syncing) {
        this.syncSettings().catch(error => {
          console.error('[SettingsSync] Auto-sync failed:', error);
        });
      }
    }, SYNC_INTERVAL);

    // Sync on visibility change (tab refocus)
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    // Sync on online event
    window.addEventListener('online', this.handleOnlineEvent);
  }

  /**
   * Stop automatic background sync
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('online', this.handleOnlineEvent);
  }

  /**
   * Force sync now (for manual sync button)
   */
  async forceSyncNow(): Promise<void> {
    await this.syncSettings();
  }

  /**
   * Get last sync timestamp
   * @returns Last sync time in milliseconds or null
   */
  getLastSyncTime(): number | null {
    return this.lastSyncTime;
  }

  /**
   * Check if currently syncing
   * @returns true if sync in progress
   */
  isSyncing(): boolean {
    return this.syncing;
  }

  /**
   * Upload encrypted settings to Google Drive AppData
   * @param encrypted - EncryptedSettings to upload
   */
  private async uploadToDrive(encrypted: EncryptedSettings): Promise<void> {
    const accessToken = await tokenManagerEncrypted.getAccessToken();
    if (!accessToken) {
      throw new Error('No access token available for Drive upload');
    }

    // Check if file exists
    const listResponse = await fetch(
      `${DRIVE_API_BASE}/files?spaces=appDataFolder&q=name='settings.json'&fields=files(id)`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!listResponse.ok) {
      throw new Error(`Drive API list failed: ${listResponse.status}`);
    }

    const listData = await listResponse.json();
    const fileId = listData.files?.[0]?.id;

    const fileContent = JSON.stringify(encrypted);

    if (fileId) {
      // Update existing file
      const updateResponse = await fetch(`${UPLOAD_API_BASE}/files/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: fileContent,
      });

      if (!updateResponse.ok) {
        // If file not found (404), fall back to creating a new file
        if (updateResponse.status === 404) {
          console.warn('[SettingsSync] File not found (404), creating new file instead');
          // Fall through to CREATE logic below
        } else {
          throw new Error(`Drive API update failed: ${updateResponse.status}`);
        }
      } else {
        // Update successful, return early
        return;
      }
    }

    // Create new file (either no fileId found, or PATCH returned 404)
    {
      // Create new file
      const metadata = {
        name: 'settings.json',
        parents: ['appDataFolder'],
      };

      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const multipartBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        fileContent +
        closeDelimiter;

      const createResponse = await fetch(
        `${UPLOAD_API_BASE}/files?uploadType=multipart`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartBody,
        }
      );

      if (!createResponse.ok) {
        throw new Error(`Drive API create failed: ${createResponse.status}`);
      }
    }
  }

  /**
   * Load and decrypt settings from Google Drive AppData
   * @returns UserSettings or null if not found
   */
  private async loadFromDrive(): Promise<UserSettings | null> {
    const accessToken = await tokenManagerEncrypted.getAccessToken();
    if (!accessToken) {
      console.warn('[SettingsSync] No access token, cannot load from Drive');
      return null;
    }

    try {
      // Find settings file
      const listResponse = await fetch(
        `${DRIVE_API_BASE}/files?spaces=appDataFolder&q=name='settings.json'&fields=files(id,modifiedTime)`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!listResponse.ok) {
        console.error(`[SettingsSync] Drive API list failed: ${listResponse.status}`);
        return null;
      }

      const listData = await listResponse.json();
      if (!listData.files || listData.files.length === 0) {
        return null;
      }

      const fileId = listData.files[0].id;

      // Download file
      const fileResponse = await fetch(`${DRIVE_API_BASE}/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!fileResponse.ok) {
        throw new Error(`Drive API download failed: ${fileResponse.status}`);
      }

      const encryptedData = await fileResponse.json() as EncryptedSettings;

      // Decrypt settings
      const settings = await decryptSettings(encryptedData);

      return settings;
    } catch (error) {
      // Handle encryption key mismatch (test data from different browser/localhost)
      if (error instanceof Error && error.message.includes('ENCRYPTION_KEY_MISMATCH')) {
        console.warn('[SettingsSync] Settings encrypted with different browser key - deleting incompatible data');
        // Delete incompatible encrypted settings to prevent repeated errors
        await this.deleteFromDrive();
        return null;
      }

      console.error('[SettingsSync] Failed to load from Drive:', error);

      // Report to AI agent monitoring
      if (error instanceof Error) {
        reportError(error, 'SettingsSyncService.loadFromDrive')
      }

      return null;
    }
  }

  /**
   * Delete settings file from Google Drive AppData
   */
  private async deleteFromDrive(): Promise<void> {
    const accessToken = await tokenManagerEncrypted.getAccessToken();
    if (!accessToken) {
      console.warn('[SettingsSync] No access token, cannot delete from Drive');
      return;
    }

    try {
      // Find settings file
      const listResponse = await fetch(
        `${DRIVE_API_BASE}/files?spaces=appDataFolder&q=name='settings.json'&fields=files(id)`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!listResponse.ok) {
        console.error(`[SettingsSync] Drive API list failed: ${listResponse.status}`);
        return;
      }

      const listData = await listResponse.json();
      const fileId = listData.files?.[0]?.id;

      if (fileId) {
        const deleteResponse = await fetch(`${DRIVE_API_BASE}/files/${fileId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!deleteResponse.ok && deleteResponse.status !== 404) {
          throw new Error(`Drive API delete failed: ${deleteResponse.status}`);
        }
        // 404 is OK - file already deleted or never existed
      }
    } catch (error) {
      console.error('[SettingsSync] Failed to delete from Drive:', error);
    }
  }

  /**
   * Handle visibility change event
   */
  private handleVisibilityChange = (): void => {
    if (!document.hidden && navigator.onLine && !this.syncing) {
      this.syncSettings().catch(error => {
        console.error('[SettingsSync] Visibility change sync failed:', error);
      });
    }
  };

  /**
   * Handle online event
   */
  private handleOnlineEvent = (): void => {
    if (!this.syncing) {
      this.syncSettings().catch(error => {
        console.error('[SettingsSync] Online event sync failed:', error);
      });
    }
  };
}

// Export singleton instance
export const settingsSyncService = new SettingsSyncService();
