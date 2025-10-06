/**
 * FileCache Service Tests
 * Sprint 8 Phase 1: Google Drive API Integration
 *
 * Tests IndexedDB operations, sync queue, and offline persistence
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';
import { fileCache, FileCache, FileCacheError, CachedFile } from '../../../src/services/drive/fileCache';

// Setup fake IndexedDB for testing
import 'fake-indexeddb/auto';

describe('FileCache Service', () => {
  let cache: FileCache;

  beforeEach(async () => {
    // Create fresh instance for each test
    cache = new FileCache();
    await cache.init();
  });

  afterEach(async () => {
    // Clean up after each test
    try {
      await cache.clearAll();
      cache.close();
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Initialization', () => {
    it('should initialize IndexedDB successfully', async () => {
      const testCache = new FileCache();
      await expect(testCache.init()).resolves.not.toThrow();
      testCache.close();
    });

    it('should be safe to call init() multiple times', async () => {
      await cache.init();
      await cache.init();
      await cache.init();
      // Should not throw
    });

    it('should handle IndexedDB unavailable', async () => {
      // Mock indexedDB as undefined
      const originalIndexedDB = window.indexedDB;
      Object.defineProperty(window, 'indexedDB', {
        value: undefined,
        configurable: true,
      });

      const testCache = new FileCache();
      await expect(testCache.init()).rejects.toThrow(FileCacheError);
      await expect(testCache.init()).rejects.toThrow('IndexedDB not supported');

      // Restore indexedDB
      Object.defineProperty(window, 'indexedDB', {
        value: originalIndexedDB,
        configurable: true,
      });
    });
  });

  describe('cacheFile()', () => {
    it('should cache file successfully', async () => {
      const fileId = 'test-file-1';
      const content = '# Test Document\n\nHello world!';

      await expect(
        cache.cacheFile(fileId, content, false)
      ).resolves.not.toThrow();
    });

    it('should cache file with synced status', async () => {
      const fileId = 'test-file-2';
      const content = '# Synced Document';

      await cache.cacheFile(fileId, content, true);

      const cachedFile = await cache.getCachedFile(fileId);
      expect(cachedFile).not.toBeNull();
      expect(cachedFile?.synced).toBe(true);
    });

    it('should overwrite existing cached file', async () => {
      const fileId = 'test-file-3';
      const content1 = 'First version';
      const content2 = 'Second version';

      await cache.cacheFile(fileId, content1, false);
      await cache.cacheFile(fileId, content2, false);

      const cachedFile = await cache.getCachedFile(fileId);
      expect(cachedFile?.content).toBe(content2);
    });

    it('should set timestamp correctly', async () => {
      const fileId = 'test-file-4';
      const content = 'Timestamped content';
      const beforeTime = Date.now();

      await cache.cacheFile(fileId, content, false);

      const afterTime = Date.now();
      const cachedFile = await cache.getCachedFile(fileId);

      expect(cachedFile?.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(cachedFile?.timestamp).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('getCachedFile()', () => {
    it('should retrieve cached file', async () => {
      const fileId = 'test-file-5';
      const content = '# Retrievable Document';

      await cache.cacheFile(fileId, content, false);

      const cachedFile = await cache.getCachedFile(fileId);
      expect(cachedFile).not.toBeNull();
      expect(cachedFile?.fileId).toBe(fileId);
      expect(cachedFile?.content).toBe(content);
      expect(cachedFile?.synced).toBe(false);
    });

    it('should return null for non-existent file', async () => {
      const cachedFile = await cache.getCachedFile('non-existent-file');
      expect(cachedFile).toBeNull();
    });
  });

  describe('getPendingSyncs()', () => {
    it('should return empty array when no pending syncs', async () => {
      const pending = await cache.getPendingSyncs();
      expect(pending).toEqual([]);
    });

    it('should return only unsynced files', async () => {
      await cache.cacheFile('file-1', 'Content 1', false); // Pending
      await cache.cacheFile('file-2', 'Content 2', true);  // Synced
      await cache.cacheFile('file-3', 'Content 3', false); // Pending

      const pending = await cache.getPendingSyncs();
      expect(pending).toHaveLength(2);
      expect(pending.every(f => !f.synced)).toBe(true);
      expect(pending.map(f => f.fileId).sort()).toEqual(['file-1', 'file-3']);
    });

    it('should update pending syncs dynamically', async () => {
      await cache.cacheFile('file-1', 'Content 1', false);
      let pending = await cache.getPendingSyncs();
      expect(pending).toHaveLength(1);

      await cache.markSynced('file-1');
      pending = await cache.getPendingSyncs();
      expect(pending).toHaveLength(0);
    });
  });

  describe('markSynced()', () => {
    it('should mark file as synced', async () => {
      const fileId = 'test-file-6';
      await cache.cacheFile(fileId, 'Content', false);

      await cache.markSynced(fileId);

      const cachedFile = await cache.getCachedFile(fileId);
      expect(cachedFile?.synced).toBe(true);
    });

    it('should throw error for non-existent file', async () => {
      await expect(cache.markSynced('non-existent')).rejects.toThrow(
        FileCacheError
      );
      await expect(cache.markSynced('non-existent')).rejects.toThrow(
        'File not found in cache'
      );
    });

    it('should preserve content when marking as synced', async () => {
      const fileId = 'test-file-7';
      const content = 'Important content';

      await cache.cacheFile(fileId, content, false);
      await cache.markSynced(fileId);

      const cachedFile = await cache.getCachedFile(fileId);
      expect(cachedFile?.content).toBe(content);
    });
  });

  describe('deleteFile()', () => {
    it('should delete cached file', async () => {
      const fileId = 'test-file-8';
      await cache.cacheFile(fileId, 'Content', false);

      await cache.deleteFile(fileId);

      const cachedFile = await cache.getCachedFile(fileId);
      expect(cachedFile).toBeNull();
    });

    it('should not throw when deleting non-existent file', async () => {
      await expect(cache.deleteFile('non-existent')).resolves.not.toThrow();
    });
  });

  describe('getAllFiles()', () => {
    it('should return empty array when no files cached', async () => {
      const files = await cache.getAllFiles();
      expect(files).toEqual([]);
    });

    it('should return all cached files', async () => {
      await cache.cacheFile('file-1', 'Content 1', false);
      await cache.cacheFile('file-2', 'Content 2', true);
      await cache.cacheFile('file-3', 'Content 3', false);

      const files = await cache.getAllFiles();
      expect(files).toHaveLength(3);
      expect(files.map(f => f.fileId).sort()).toEqual([
        'file-1',
        'file-2',
        'file-3',
      ]);
    });
  });

  describe('clearAll()', () => {
    it('should clear all cached files', async () => {
      await cache.cacheFile('file-1', 'Content 1', false);
      await cache.cacheFile('file-2', 'Content 2', false);

      await cache.clearAll();

      const files = await cache.getAllFiles();
      expect(files).toEqual([]);
    });
  });

  describe('Singleton instance', () => {
    it('should export singleton fileCache instance', () => {
      expect(fileCache).toBeInstanceOf(FileCache);
    });

    it('should maintain state across module imports', async () => {
      await fileCache.init();
      await fileCache.clearAll();

      const testFileId = 'singleton-test';
      await fileCache.cacheFile(testFileId, 'Singleton content', false);

      const retrieved = await fileCache.getCachedFile(testFileId);
      expect(retrieved?.fileId).toBe(testFileId);

      // Cleanup
      await fileCache.clearAll();
    });
  });

  describe('Error handling', () => {
    it('should throw FileCacheError with correct properties', async () => {
      try {
        await cache.markSynced('non-existent');
        expect.fail('Should have thrown FileCacheError');
      } catch (error) {
        expect(error).toBeInstanceOf(FileCacheError);
        expect((error as FileCacheError).code).toBe('FILE_NOT_FOUND');
        expect((error as FileCacheError).recoverable).toBe(false);
      }
    });
  });

  describe('Offline persistence scenarios', () => {
    it('should handle offline editing workflow', async () => {
      // User edits file offline
      const fileId = 'offline-doc';
      const content = '# Offline Edits\n\nWritten without network';

      await cache.cacheFile(fileId, content, false);

      // Check it's in pending sync queue
      const pending = await cache.getPendingSyncs();
      expect(pending.some(f => f.fileId === fileId)).toBe(true);

      // Simulate sync to Drive
      await cache.markSynced(fileId);

      // Verify it's no longer pending
      const stillPending = await cache.getPendingSyncs();
      expect(stillPending.some(f => f.fileId === fileId)).toBe(false);
    });

    it('should handle iOS Safari tab suspension recovery', async () => {
      // Simulate user editing before tab suspension
      await cache.cacheFile('doc-1', 'Content before suspend', false);
      await cache.cacheFile('doc-2', 'Another doc', false);

      // Simulate tab suspension (close connection)
      cache.close();

      // Simulate tab restoration (reinitialize)
      await cache.init();

      // Should recover pending syncs
      const pending = await cache.getPendingSyncs();
      expect(pending).toHaveLength(2);
    });

    it('should handle network failure recovery', async () => {
      // Multiple saves while network is down
      const edits = [
        { fileId: 'doc-1', content: 'Edit 1' },
        { fileId: 'doc-2', content: 'Edit 2' },
        { fileId: 'doc-3', content: 'Edit 3' },
      ];

      for (const edit of edits) {
        await cache.cacheFile(edit.fileId, edit.content, false);
      }

      // All should be pending
      const pending = await cache.getPendingSyncs();
      expect(pending).toHaveLength(3);

      // Network comes back, sync them one by one
      for (const edit of edits) {
        await cache.markSynced(edit.fileId);
      }

      // All should be synced
      const stillPending = await cache.getPendingSyncs();
      expect(stillPending).toHaveLength(0);
    });
  });

  describe('Performance', () => {
    it('should handle multiple concurrent operations', async () => {
      const operations = [];

      // Concurrent writes
      for (let i = 0; i < 10; i++) {
        operations.push(
          cache.cacheFile(`file-${i}`, `Content ${i}`, false)
        );
      }

      await Promise.all(operations);

      const files = await cache.getAllFiles();
      expect(files).toHaveLength(10);
    });

    it('should handle large content efficiently', async () => {
      const largeContent = 'A'.repeat(100000); // 100KB content
      const fileId = 'large-file';

      const startTime = Date.now();
      await cache.cacheFile(fileId, largeContent, false);
      const cacheTime = Date.now() - startTime;

      expect(cacheTime).toBeLessThan(1000); // Should cache in < 1 second

      const cached = await cache.getCachedFile(fileId);
      expect(cached?.content.length).toBe(100000);
    });
  });
});
