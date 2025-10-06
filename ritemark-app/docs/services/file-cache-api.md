# FileCache API Documentation

**Sprint 8 Phase 1: Google Drive API Integration**

## Overview

The FileCache service provides offline-first file persistence using IndexedDB. It enables RiteMark to:

- Cache markdown content locally during offline editing
- Queue pending syncs when network is unavailable
- Recover unsaved work after iOS Safari tab suspension
- Provide seamless offline/online editing experience

## Architecture

### Technology Stack

- **IndexedDB**: Browser-native storage API
- **Database**: `RiteMarkCache` (version 1)
- **Object Store**: `files` (keyPath: `fileId`)
- **Indexes**:
  - `timestamp`: For cache cleanup operations
  - `synced`: For pending sync queries

### Data Model

```typescript
interface CachedFile {
  fileId: string;       // Google Drive file ID (primary key)
  content: string;      // Markdown content
  timestamp: number;    // Cache timestamp (Date.now())
  synced: boolean;      // Drive sync status
}
```

## API Reference

### Singleton Instance

```typescript
import { fileCache } from '@/services/drive/fileCache';
```

The module exports a singleton instance for app-wide use. All methods are async and return Promises.

### Methods

#### `init(): Promise<void>`

Initialize IndexedDB connection. Safe to call multiple times.

```typescript
await fileCache.init();
```

**Notes:**
- Automatically called by other methods
- Uses singleton pattern to prevent duplicate initialization
- Throws `FileCacheError` if IndexedDB not supported

---

#### `cacheFile(fileId: string, content: string, synced?: boolean): Promise<void>`

Cache file content locally.

**Parameters:**
- `fileId`: Google Drive file ID
- `content`: Markdown content to cache
- `synced`: Sync status (default: `false`)

```typescript
await fileCache.cacheFile('doc-123', '# My Document\n\nContent...', false);
```

**Behavior:**
- Overwrites existing cached file with same `fileId`
- Sets `timestamp` to current time
- Use `synced: false` for offline edits
- Use `synced: true` when saving from Drive

---

#### `getCachedFile(fileId: string): Promise<CachedFile | null>`

Retrieve cached file content.

**Returns:** `CachedFile` object or `null` if not found

```typescript
const cached = await fileCache.getCachedFile('doc-123');
if (cached) {
  console.log(cached.content);
  console.log(cached.timestamp);
  console.log(cached.synced);
}
```

---

#### `getPendingSyncs(): Promise<CachedFile[]>`

Get all files pending sync to Drive.

**Returns:** Array of unsynced files (`synced: false`)

```typescript
const pending = await fileCache.getPendingSyncs();
console.log(`${pending.length} files pending sync`);

for (const file of pending) {
  await syncToDrive(file);
  await fileCache.markSynced(file.fileId);
}
```

**Use Cases:**
- Sync queue on network reconnection
- Show "unsaved changes" indicator
- Periodic background sync

---

#### `markSynced(fileId: string): Promise<void>`

Mark file as synced with Drive.

**Parameters:**
- `fileId`: Google Drive file ID

```typescript
await fileCache.markSynced('doc-123');
```

**Throws:** `FileCacheError` if file not found in cache

---

#### `deleteFile(fileId: string): Promise<void>`

Delete cached file.

**Parameters:**
- `fileId`: Google Drive file ID

```typescript
await fileCache.deleteFile('doc-123');
```

**Notes:**
- Does not throw if file doesn't exist
- Use for cache cleanup

---

#### `getAllFiles(): Promise<CachedFile[]>`

Get all cached files.

**Returns:** Array of all cached files

```typescript
const allFiles = await fileCache.getAllFiles();
console.log(`Total cached: ${allFiles.length}`);
```

**Use Cases:**
- Cache maintenance
- Storage usage analysis
- Debugging

---

#### `clearAll(): Promise<void>`

Clear all cached files.

```typescript
await fileCache.clearAll();
```

**Use Cases:**
- Testing/development
- User logout
- Cache reset

---

#### `close(): void`

Close database connection.

```typescript
fileCache.close();
```

**Notes:**
- Use before app shutdown
- Useful for cleanup in tests
- Resets singleton state

---

## Error Handling

All errors throw `FileCacheError` with standardized properties:

```typescript
try {
  await fileCache.markSynced('non-existent');
} catch (error) {
  if (error instanceof FileCacheError) {
    console.error(`[${error.code}] ${error.message}`);

    if (error.recoverable) {
      // Retry operation
    }
  }
}
```

### Error Codes

| Code | Description | Recoverable |
|------|-------------|-------------|
| `DB_NOT_SUPPORTED` | IndexedDB not available | No |
| `DB_OPEN_FAILED` | Failed to open database | Yes |
| `DB_BLOCKED` | Upgrade blocked by another tab | Yes |
| `DB_NOT_READY` | Database not initialized | Yes |
| `CACHE_WRITE_FAILED` | Failed to write to cache | Yes |
| `CACHE_READ_FAILED` | Failed to read from cache | Yes |
| `QUERY_FAILED` | Failed to query files | Yes |
| `FILE_NOT_FOUND` | File not in cache | No |
| `SYNC_UPDATE_FAILED` | Failed to update sync status | Yes |
| `DELETE_FAILED` | Failed to delete file | Yes |
| `GETALL_FAILED` | Failed to retrieve all files | Yes |
| `CLEAR_FAILED` | Failed to clear cache | Yes |
| `TRANSACTION_FAILED` | IndexedDB transaction failed | Yes |

## Usage Patterns

### Pattern 1: Offline Editing

```typescript
// User edits document offline
const fileId = getCurrentFileId();
const content = getEditorContent();

await fileCache.cacheFile(fileId, content, false);

// Later, when online
const pending = await fileCache.getPendingSyncs();
for (const file of pending) {
  await driveService.saveFile(file.fileId, file.content);
  await fileCache.markSynced(file.fileId);
}
```

### Pattern 2: Tab Suspension Recovery

```typescript
// Before tab suspension
document.addEventListener('visibilitychange', async () => {
  if (document.hidden) {
    const content = getEditorContent();
    const fileId = getCurrentFileId();
    await fileCache.cacheFile(fileId, content, false);
  } else {
    // Tab restored
    const pending = await fileCache.getPendingSyncs();
    if (pending.length > 0) {
      showRecoveryPrompt(pending);
    }
  }
});
```

### Pattern 3: Sync Status Indicator

```typescript
async function updateSyncStatus() {
  const pending = await fileCache.getPendingSyncs();

  if (pending.length === 0) {
    showIndicator('✓ All changes synced', 'success');
  } else {
    showIndicator(`⏳ ${pending.length} pending`, 'warning');
  }
}

// Update every 5 seconds
setInterval(updateSyncStatus, 5000);

// Update on network status change
window.addEventListener('online', async () => {
  await syncPendingFiles();
  await updateSyncStatus();
});
```

### Pattern 4: Network Retry with Exponential Backoff

```typescript
async function syncWithRetry(fileId: string, content: string, maxRetries = 3) {
  let retries = 0;

  while (retries < maxRetries) {
    try {
      await driveService.saveFile(fileId, content);
      await fileCache.markSynced(fileId);
      return true;
    } catch (error) {
      retries++;
      if (retries < maxRetries) {
        const delay = Math.pow(2, retries) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  return false; // File remains in pending queue
}
```

### Pattern 5: Cache Maintenance

```typescript
async function cleanOldCache() {
  const allFiles = await fileCache.getAllFiles();
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  for (const file of allFiles) {
    // Delete old synced files
    if (file.synced && file.timestamp < sevenDaysAgo) {
      await fileCache.deleteFile(file.fileId);
    }
  }
}

// Run cleanup daily
setInterval(cleanOldCache, 24 * 60 * 60 * 1000);
```

## Performance Considerations

### Storage Limits

IndexedDB storage limits vary by browser:

| Browser | Limit | Notes |
|---------|-------|-------|
| Chrome | 60% of disk space | Shared quota |
| Firefox | 50% of disk space | Shared quota |
| Safari | 1GB | Per-origin limit |

### Recommendations

1. **Limit cached files**: Keep only recent files cached
2. **Implement cleanup**: Remove old synced files regularly
3. **Monitor storage**: Track cache size and warn users
4. **Optimize content**: Compress large markdown files
5. **Batch operations**: Use Promise.all for concurrent caching

### Concurrent Operations

The FileCache service supports concurrent operations:

```typescript
// Cache multiple files in parallel
await Promise.all([
  fileCache.cacheFile('doc-1', content1, false),
  fileCache.cacheFile('doc-2', content2, false),
  fileCache.cacheFile('doc-3', content3, false),
]);
```

## Browser Compatibility

| Browser | IndexedDB Support | Notes |
|---------|------------------|-------|
| Chrome 24+ | ✅ Full support | Recommended |
| Firefox 16+ | ✅ Full support | Recommended |
| Safari 10+ | ✅ Full support | iOS Safari: Tab suspension requires special handling |
| Edge 12+ | ✅ Full support | Chromium-based Edge recommended |

### iOS Safari Considerations

iOS Safari aggressively suspends tabs to save memory:

1. **Cache frequently**: Save editor state on every change
2. **Use visibility API**: Detect tab suspension/restoration
3. **Test thoroughly**: Simulate tab suspension in development
4. **Provide recovery**: Show unsaved changes on app reopen

## Testing

The FileCache service uses `fake-indexeddb` for testing:

```typescript
import { FileCache } from '@/services/drive/fileCache';
import 'fake-indexeddb/auto';

describe('FileCache', () => {
  let cache: FileCache;

  beforeEach(async () => {
    cache = new FileCache();
    await cache.init();
  });

  afterEach(async () => {
    await cache.clearAll();
    cache.close();
  });

  it('should cache file', async () => {
    await cache.cacheFile('test', 'content', false);
    const cached = await cache.getCachedFile('test');
    expect(cached?.content).toBe('content');
  });
});
```

## Migration & Versioning

Current database version: **1**

Future migrations will use IndexedDB's `onupgradeneeded` event:

```typescript
request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
  const db = (event.target as IDBOpenDBRequest).result;
  const oldVersion = event.oldVersion;

  if (oldVersion < 2) {
    // Add new index or modify schema
  }
};
```

## Security Considerations

1. **Client-side only**: Data stored in browser's IndexedDB
2. **No encryption**: Consider encrypting sensitive content
3. **Same-origin policy**: Data accessible only to ritemark.app domain
4. **User control**: Provide UI to clear cache
5. **Privacy**: No data sent to servers (except Google Drive sync)

## Troubleshooting

### Common Issues

**Problem:** "IndexedDB not supported in this browser"
- **Solution:** Use a modern browser (Chrome, Firefox, Safari 10+)

**Problem:** Database upgrade blocked
- **Solution:** Close other tabs with RiteMark open

**Problem:** Files not syncing
- **Solution:** Check network connection and pending sync queue

**Problem:** Storage quota exceeded
- **Solution:** Run cache cleanup to remove old files

### Debug Helpers

```typescript
// Check database state
const allFiles = await fileCache.getAllFiles();
console.log('Cached files:', allFiles);

const pending = await fileCache.getPendingSyncs();
console.log('Pending syncs:', pending);

// Force cleanup
await fileCache.clearAll();
```

## See Also

- [Google Drive API Integration](./drive-service-api.md)
- [OAuth Token Management](./token-manager-api.md)
- [Offline-First Architecture](../architecture/offline-first.md)
