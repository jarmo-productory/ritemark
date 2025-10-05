/**
 * FileCache Usage Examples
 * Sprint 8 Phase 1: Google Drive API Integration
 *
 * Demonstrates offline-first file caching patterns for RiteMark
 */

import { fileCache, FileCacheError } from './fileCache';

/**
 * Example 1: Basic file caching workflow
 */
export async function basicCachingExample() {
  try {
    // Initialize (called automatically by other methods, but shown for clarity)
    await fileCache.init();

    // Cache a file being edited offline
    const fileId = 'doc-abc123';
    const content = '# My Document\n\nEdited offline';
    await fileCache.cacheFile(fileId, content, false);

    console.log('File cached successfully');

    // Retrieve cached content
    const cached = await fileCache.getCachedFile(fileId);
    if (cached) {
      console.log('Cached content:', cached.content);
      console.log('Cached at:', new Date(cached.timestamp));
      console.log('Synced:', cached.synced);
    }
  } catch (error) {
    if (error instanceof FileCacheError) {
      console.error(`Cache error [${error.code}]:`, error.message);
    }
  }
}

/**
 * Example 2: Offline editing with sync queue
 */
export async function offlineEditingExample() {
  try {
    // User edits document while offline
    const edits = [
      { fileId: 'doc-1', content: '# Document 1\n\nFirst edit' },
      { fileId: 'doc-2', content: '# Document 2\n\nSecond edit' },
      { fileId: 'doc-3', content: '# Document 3\n\nThird edit' },
    ];

    // Cache all edits as unsynced
    for (const edit of edits) {
      await fileCache.cacheFile(edit.fileId, edit.content, false);
    }

    console.log('All edits cached locally');

    // Check pending syncs
    const pending = await fileCache.getPendingSyncs();
    console.log(`${pending.length} files pending sync`);

    // Simulate network coming back online
    // Sync files to Drive one by one
    for (const file of pending) {
      try {
        // Call Google Drive API to save (simulated here)
        await saveToDrive(file.fileId, file.content);

        // Mark as synced
        await fileCache.markSynced(file.fileId);
        console.log(`Synced: ${file.fileId}`);
      } catch (error) {
        console.error(`Failed to sync ${file.fileId}:`, error);
        // File remains in pending queue for retry
      }
    }

    // Verify all synced
    const stillPending = await fileCache.getPendingSyncs();
    console.log(`${stillPending.length} files still pending`);
  } catch (error) {
    console.error('Offline editing error:', error);
  }
}

/**
 * Example 3: iOS Safari tab suspension recovery
 */
export async function tabSuspensionRecoveryExample() {
  try {
    // Before tab suspension: cache unsaved work
    await fileCache.cacheFile('important-doc', 'Work in progress...', false);

    // App detects tab is about to be suspended (visibilitychange event)
    document.addEventListener('visibilitychange', async () => {
      if (document.hidden) {
        // Ensure all pending edits are cached
        const currentContent = getCurrentEditorContent();
        const currentFileId = getCurrentFileId();
        await fileCache.cacheFile(currentFileId, currentContent, false);
        console.log('Work cached before tab suspension');
      } else {
        // Tab restored: recover pending syncs
        const pending = await fileCache.getPendingSyncs();
        console.log(`Recovered ${pending.length} unsaved files`);

        // Optionally restore the most recent file
        if (pending.length > 0) {
          const mostRecent = pending.reduce((latest, file) =>
            file.timestamp > latest.timestamp ? file : latest
          );
          console.log('Most recent unsaved file:', mostRecent.fileId);
        }
      }
    });
  } catch (error) {
    console.error('Tab suspension recovery error:', error);
  }
}

/**
 * Example 4: Network failure handling with retry
 */
export async function networkFailureRetryExample() {
  try {
    const fileId = 'network-test-doc';
    const content = '# Network Test\n\nTesting retry logic';

    // Cache file
    await fileCache.cacheFile(fileId, content, false);

    // Attempt sync with retry logic
    const maxRetries = 3;
    let retries = 0;
    let synced = false;

    while (retries < maxRetries && !synced) {
      try {
        await saveToDrive(fileId, content);
        await fileCache.markSynced(fileId);
        synced = true;
        console.log('Sync successful');
      } catch (error) {
        retries++;
        console.error(`Sync attempt ${retries} failed:`, error);

        if (retries < maxRetries) {
          // Exponential backoff
          const delay = Math.pow(2, retries) * 1000;
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    if (!synced) {
      console.error('Max retries reached, file remains in cache');
      // File stays in pending queue for manual sync later
    }
  } catch (error) {
    console.error('Network failure retry error:', error);
  }
}

/**
 * Example 5: Cache cleanup and maintenance
 */
export async function cacheMaintenanceExample() {
  try {
    // Get all cached files
    const allFiles = await fileCache.getAllFiles();
    console.log(`Total cached files: ${allFiles.length}`);

    // Find old cached files (older than 7 days)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const oldFiles = allFiles.filter(file => file.timestamp < sevenDaysAgo);

    console.log(`Found ${oldFiles.length} old files`);

    // Delete old synced files
    for (const file of oldFiles) {
      if (file.synced) {
        await fileCache.deleteFile(file.fileId);
        console.log(`Deleted old cached file: ${file.fileId}`);
      } else {
        console.log(`Keeping unsynced file: ${file.fileId}`);
      }
    }

    // Check storage usage
    const remaining = await fileCache.getAllFiles();
    console.log(`Cached files after cleanup: ${remaining.length}`);
  } catch (error) {
    console.error('Cache maintenance error:', error);
  }
}

/**
 * Example 6: Error handling patterns
 */
export async function errorHandlingExample() {
  try {
    // Attempt to get non-existent file
    const cached = await fileCache.getCachedFile('non-existent');
    if (cached === null) {
      console.log('File not found in cache');
    }

    // Attempt to mark non-existent file as synced
    try {
      await fileCache.markSynced('non-existent');
    } catch (error) {
      if (error instanceof FileCacheError) {
        console.error('Expected error:', error.code);
        if (error.recoverable) {
          console.log('Error is recoverable, can retry');
        }
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

/**
 * Example 7: Real-time collaboration sync status
 */
export async function collaborationSyncStatusExample() {
  // Show sync status indicator in UI
  const updateSyncStatus = async () => {
    const pending = await fileCache.getPendingSyncs();

    if (pending.length === 0) {
      showSyncIndicator('✓ All changes synced', 'success');
    } else {
      showSyncIndicator(`⏳ ${pending.length} changes pending`, 'warning');
    }
  };

  // Update status every 5 seconds
  setInterval(updateSyncStatus, 5000);

  // Update status on network status change
  window.addEventListener('online', async () => {
    console.log('Network online, syncing pending changes...');
    await syncPendingFiles();
    await updateSyncStatus();
  });

  window.addEventListener('offline', () => {
    showSyncIndicator('⚠️ Offline - changes cached locally', 'info');
  });
}

/**
 * Helper: Simulated Drive API save
 */
async function saveToDrive(fileId: string, content: string): Promise<void> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));

  // Simulate 10% network failure rate
  if (Math.random() < 0.1) {
    throw new Error('Network error');
  }

  console.log(`Saved to Drive: ${fileId}`);
}

/**
 * Helper: Sync all pending files
 */
async function syncPendingFiles(): Promise<void> {
  const pending = await fileCache.getPendingSyncs();

  for (const file of pending) {
    try {
      await saveToDrive(file.fileId, file.content);
      await fileCache.markSynced(file.fileId);
    } catch (error) {
      console.error(`Failed to sync ${file.fileId}:`, error);
    }
  }
}

/**
 * Helper: Show sync status indicator (implementation depends on UI framework)
 */
function showSyncIndicator(message: string, type: 'success' | 'warning' | 'info' | 'error'): void {
  console.log(`[${type.toUpperCase()}] ${message}`);
}

/**
 * Helper: Get current editor content (implementation depends on editor)
 */
function getCurrentEditorContent(): string {
  // In real app, get content from Milkdown editor
  return '# Current document\n\nContent...';
}

/**
 * Helper: Get current file ID (implementation depends on app state)
 */
function getCurrentFileId(): string {
  // In real app, get from app state/context
  return 'current-file-id';
}
