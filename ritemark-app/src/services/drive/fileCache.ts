/**
 * FileCache Service - IndexedDB wrapper for offline persistence
 * Sprint 8 Google Drive API Integration
 *
 * Provides offline-first file caching with sync queue management
 * Handles iOS Safari tab suspension and network failures
 */

/**
 * Cached file structure stored in IndexedDB
 */
export interface CachedFile {
  fileId: string;       // Google Drive file ID (primary key)
  content: string;      // Markdown content
  timestamp: number;    // Cache timestamp (Date.now())
  synced: boolean;      // Drive sync status
}

/**
 * IndexedDB configuration
 */
const DB_NAME = 'RiteMarkCache';
const DB_VERSION = 1;
const STORE_NAME = 'files';

/**
 * FileCache errors
 */
export class FileCacheError extends Error {
  public code: string;
  public recoverable: boolean;

  constructor(
    message: string,
    code: string,
    recoverable: boolean = false
  ) {
    super(message);
    this.name = 'FileCacheError';
    this.code = code;
    this.recoverable = recoverable;
  }
}

/**
 * FileCache class - IndexedDB wrapper for file persistence
 */
export class FileCache {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize IndexedDB connection
   * Safe to call multiple times - uses singleton pattern
   */
  async init(): Promise<void> {
    // Return existing initialization if in progress or complete
    if (this.initPromise) {
      return this.initPromise;
    }

    // Create new initialization promise
    this.initPromise = new Promise<void>((resolve, reject) => {
      // Check if IndexedDB is available
      if (!window.indexedDB) {
        reject(
          new FileCacheError(
            'IndexedDB not supported in this browser',
            'DB_NOT_SUPPORTED',
            false
          )
        );
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      // Database upgrade/creation
      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, {
            keyPath: 'fileId',
          });

          // Create index for timestamp queries (useful for cleanup)
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });

          // Create index for synced status queries (pending syncs)
          objectStore.createIndex('synced', 'synced', { unique: false });
        }
      };

      // Success handler
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      // Error handler
      request.onerror = () => {
        const error = new FileCacheError(
          `Failed to open IndexedDB: ${request.error?.message || 'Unknown error'}`,
          'DB_OPEN_FAILED',
          true
        );
        reject(error);
      };

      // Blocked handler (another tab has older version open)
      request.onblocked = () => {
        console.warn('IndexedDB upgrade blocked by another tab');
        reject(
          new FileCacheError(
            'Database upgrade blocked. Please close other tabs.',
            'DB_BLOCKED',
            true
          )
        );
      };
    });

    return this.initPromise;
  }

  /**
   * Cache file content locally
   * @param fileId - Google Drive file ID
   * @param content - Markdown content to cache
   * @param synced - Whether content is synced with Drive (default: false)
   */
  async cacheFile(
    fileId: string,
    content: string,
    synced: boolean = false
  ): Promise<void> {
    await this.init();

    if (!this.db) {
      throw new FileCacheError('Database not initialized', 'DB_NOT_READY', true);
    }

    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const cachedFile: CachedFile = {
        fileId,
        content,
        timestamp: Date.now(),
        synced,
      };

      const request = store.put(cachedFile);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(
          new FileCacheError(
            `Failed to cache file: ${request.error?.message || 'Unknown error'}`,
            'CACHE_WRITE_FAILED',
            true
          )
        );
      };

      // Transaction error handler
      transaction.onerror = () => {
        reject(
          new FileCacheError(
            `Transaction failed: ${transaction.error?.message || 'Unknown error'}`,
            'TRANSACTION_FAILED',
            true
          )
        );
      };
    });
  }

  /**
   * Retrieve cached file content
   * @param fileId - Google Drive file ID
   * @returns Cached file or null if not found
   */
  async getCachedFile(fileId: string): Promise<CachedFile | null> {
    await this.init();

    if (!this.db) {
      throw new FileCacheError('Database not initialized', 'DB_NOT_READY', true);
    }

    return new Promise<CachedFile | null>((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(fileId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(
          new FileCacheError(
            `Failed to retrieve cached file: ${request.error?.message || 'Unknown error'}`,
            'CACHE_READ_FAILED',
            true
          )
        );
      };
    });
  }

  /**
   * Get all files pending sync (synced: false)
   * @returns Array of cached files not yet synced to Drive
   */
  async getPendingSyncs(): Promise<CachedFile[]> {
    await this.init();

    if (!this.db) {
      throw new FileCacheError('Database not initialized', 'DB_NOT_READY', true);
    }

    return new Promise<CachedFile[]>((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        // Filter for unsynced files in JavaScript (IndexedDB doesn't support boolean key ranges)
        const allFiles: CachedFile[] = request.result || [];
        const pendingFiles = allFiles.filter(file => !file.synced);
        resolve(pendingFiles);
      };

      request.onerror = () => {
        reject(
          new FileCacheError(
            `Failed to query pending syncs: ${request.error?.message || 'Unknown error'}`,
            'QUERY_FAILED',
            true
          )
        );
      };
    });
  }

  /**
   * Mark file as synced with Drive
   * @param fileId - Google Drive file ID
   */
  async markSynced(fileId: string): Promise<void> {
    await this.init();

    if (!this.db) {
      throw new FileCacheError('Database not initialized', 'DB_NOT_READY', true);
    }

    // Get existing cached file
    const cachedFile = await this.getCachedFile(fileId);

    if (!cachedFile) {
      throw new FileCacheError(
        `File not found in cache: ${fileId}`,
        'FILE_NOT_FOUND',
        false
      );
    }

    // Update synced status
    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const updatedFile: CachedFile = {
        ...cachedFile,
        synced: true,
      };

      const request = store.put(updatedFile);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(
          new FileCacheError(
            `Failed to mark file as synced: ${request.error?.message || 'Unknown error'}`,
            'SYNC_UPDATE_FAILED',
            true
          )
        );
      };
    });
  }

  /**
   * Delete cached file
   * @param fileId - Google Drive file ID
   */
  async deleteFile(fileId: string): Promise<void> {
    await this.init();

    if (!this.db) {
      throw new FileCacheError('Database not initialized', 'DB_NOT_READY', true);
    }

    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(fileId);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(
          new FileCacheError(
            `Failed to delete cached file: ${request.error?.message || 'Unknown error'}`,
            'DELETE_FAILED',
            true
          )
        );
      };
    });
  }

  /**
   * Get all cached files
   * @returns Array of all cached files
   */
  async getAllFiles(): Promise<CachedFile[]> {
    await this.init();

    if (!this.db) {
      throw new FileCacheError('Database not initialized', 'DB_NOT_READY', true);
    }

    return new Promise<CachedFile[]>((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(
          new FileCacheError(
            `Failed to retrieve all files: ${request.error?.message || 'Unknown error'}`,
            'GETALL_FAILED',
            true
          )
        );
      };
    });
  }

  /**
   * Clear all cached files (for testing/cleanup)
   */
  async clearAll(): Promise<void> {
    await this.init();

    if (!this.db) {
      throw new FileCacheError('Database not initialized', 'DB_NOT_READY', true);
    }

    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(
          new FileCacheError(
            `Failed to clear cache: ${request.error?.message || 'Unknown error'}`,
            'CLEAR_FAILED',
            true
          )
        );
      };
    });
  }

  /**
   * Close database connection
   * Useful for cleanup in tests or before app shutdown
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }
}

/**
 * Singleton instance for app-wide use
 */
export const fileCache = new FileCache();
