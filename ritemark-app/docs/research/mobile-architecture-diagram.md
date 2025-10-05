# RiteMark Mobile Drive API - Technical Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        RiteMark PWA                              │
│                   (Mobile-First Web App)                         │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   React UI   │    │   TipTap     │    │   Auth UI    │
│  Components  │    │   Editor     │    │  (OAuth)     │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────────┐
        │        Application State Layer               │
        │  - AuthContext (user, tokens)                │
        │  - EditorContext (document state)            │
        │  - FileContext (Drive files list)            │
        └─────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  GoogleAuth  │    │ DriveService │    │ SyncQueue    │
│   Service    │    │              │    │   Service    │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ TokenManager │    │ NetworkMgr   │    │ OfflineStore │
│(sessionStorage)│   │ (retry logic)│    │  (IndexedDB) │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────────┐
        │          Service Worker Layer                │
        │  - Cache static assets                       │
        │  - Offline fallback pages                    │
        │  - Background sync queue (Android)           │
        └─────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Google     │    │  Google      │    │  Browser     │
│   OAuth 2.0  │    │  Drive API   │    │  Storage     │
│   (accounts) │    │  (REST v3)   │    │  (IDB/Cache) │
└──────────────┘    └──────────────┘    └──────────────┘
```

---

## Data Flow Diagrams

### 1. OAuth Login Flow (Mobile Safari)

```
User clicks "Sign in with Google"
        │
        ▼
┌─────────────────────────────────────────────┐
│ GoogleAuth.login()                           │
│ - Generate PKCE challenge                    │
│ - Generate state (CSRF protection)           │
│ - Store in sessionStorage                    │
└─────────────────────────────────────────────┘
        │
        ▼
window.location.href = "https://accounts.google.com/o/oauth2/v2/auth"
        │
        ▼
┌─────────────────────────────────────────────┐
│ Safari Browser                               │
│ - User sees Google consent screen            │
│ - User authorizes Drive access               │
│ - Google redirects to callback URL           │
└─────────────────────────────────────────────┘
        │
        ▼
https://app.ritemark.com/auth/callback?code=XXX&state=YYY
        │
        ▼
┌─────────────────────────────────────────────┐
│ GoogleAuth.handleCallback()                  │
│ - Validate state parameter                   │
│ - Exchange code for tokens (via proxy)       │
│ - Fetch user profile                         │
│ - Store tokens in TokenManager               │
└─────────────────────────────────────────────┘
        │
        ▼
User is authenticated
AuthContext updates → UI shows user info
```

### 2. File Save Flow (With Network Resilience)

```
User types in editor
        │
        ▼
TipTap onUpdate() fires
        │
        ▼
┌─────────────────────────────────────────────┐
│ Debounced save handler (500ms)               │
│ - Collect latest content                     │
│ - Check if changed from last save            │
└─────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────┐
│ NetworkManager.checkStatus()                 │
│ - Online? → Direct upload                    │
│ - Offline? → Queue for later                 │
│ - Slow network? → Compress first             │
└─────────────────────────────────────────────┘
        │
        ├─── Online ──────────────┐
        │                          │
        ▼                          ▼
┌──────────────────┐    ┌──────────────────┐
│ Save to IndexedDB│    │ Upload to Drive  │
│ (instant)        │    │ (with retry)     │
└──────────────────┘    └──────────────────┘
        │                          │
        │                          ▼
        │              ┌──────────────────┐
        │              │ Success? Update  │
        │              │ IndexedDB status │
        │              └──────────────────┘
        │                          │
        └──────────┬───────────────┘
                   ▼
        Show "Saved" indicator in UI


┌─── Offline ───────────────────────────────┐
│                                            │
│  ┌──────────────────┐                     │
│  │ Save to IndexedDB│                     │
│  └──────────────────┘                     │
│           │                                │
│           ▼                                │
│  ┌──────────────────┐                     │
│  │ Add to SyncQueue │                     │
│  └──────────────────┘                     │
│           │                                │
│           ▼                                │
│  Show "Offline - will sync when online"   │
│                                            │
│  When network returns:                    │
│  window.addEventListener('online')         │
│           │                                │
│           ▼                                │
│  ┌──────────────────┐                     │
│  │ SyncQueue.process│                     │
│  │ - Upload pending  │                     │
│  │ - Mark as synced  │                     │
│  └──────────────────┘                     │
└────────────────────────────────────────────┘
```

### 3. File Browse Flow (Mobile Custom Picker)

```
User clicks "Open file"
        │
        ▼
┌─────────────────────────────────────────────┐
│ MobileFileBrowser.tsx renders                │
│ - Show loading skeleton                      │
└─────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────┐
│ DriveService.listFiles()                     │
│ GET /drive/v3/files?pageSize=20              │
│ - Filter: mimeType = text/markdown           │
│ - Order: modifiedTime desc                   │
│ - Fields: id, name, thumbnail, modified      │
└─────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────┐
│ Render file list with:                       │
│ - Virtual scrolling (react-virtual)          │
│ - Touch-friendly cards (56px height)         │
│ - Swipe gestures (react-swipeable)           │
│ - Pull-to-refresh                            │
└─────────────────────────────────────────────┘
        │
        ▼
User swipes right on file → Open
        │
        ▼
┌─────────────────────────────────────────────┐
│ DriveService.getFile(fileId)                 │
│ GET /drive/v3/files/{fileId}?alt=media       │
│ - Download file content                      │
│ - Cache in IndexedDB for offline             │
└─────────────────────────────────────────────┘
        │
        ▼
Load content into TipTap editor
```

---

## Component Architecture

### Core Services

```typescript
// src/services/drive/MobileDriveService.ts
export class MobileDriveService {
  private networkManager: NetworkManager;
  private syncQueue: SyncQueue;
  private offlineStore: OfflineStore;
  private tokenManager: TokenManager;

  // File operations
  async listFiles(query?: string): Promise<DriveFile[]>
  async getFile(fileId: string): Promise<string>
  async saveFile(fileId: string, content: string): Promise<void>
  async createFile(name: string, content: string): Promise<string>
  async deleteFile(fileId: string): Promise<void>

  // Network resilience
  private async saveWithRetry(fileId: string, content: string): Promise<void>
  private async queueForSync(fileId: string, content: string): Promise<void>
}
```

```typescript
// src/services/drive/NetworkManager.ts
export class NetworkManager {
  private effectiveType: ConnectionType;
  private isOnline: boolean;

  // Network detection
  detectNetworkType(): ConnectionType
  isConnected(): boolean
  getAutoSaveInterval(): number

  // Retry logic
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxAttempts: number
  ): Promise<T>

  // Event listeners
  onOnline(callback: () => void): void
  onOffline(callback: () => void): void
  onNetworkChange(callback: (type: ConnectionType) => void): void
}
```

```typescript
// src/services/drive/SyncQueue.ts
export class SyncQueue {
  private queue: PendingEdit[];
  private isProcessing: boolean;

  // Queue operations
  async enqueue(edit: PendingEdit): Promise<void>
  async processQueue(): Promise<void>
  async flushAll(): Promise<void>

  // Status
  getPendingCount(): number
  getOldestPendingEdit(): PendingEdit | null
}
```

```typescript
// src/services/drive/OfflineStore.ts
export class OfflineStore {
  private db: IDBDatabase;

  // CRUD operations
  async save(fileId: string, content: string, metadata?: FileMetadata): Promise<void>
  async get(fileId: string): Promise<OfflineFile | null>
  async list(): Promise<OfflineFile[]>
  async delete(fileId: string): Promise<void>

  // Sync status
  async markAsSynced(fileId: string): Promise<void>
  async getPendingFiles(): Promise<OfflineFile[]>
}
```

### React Components

```typescript
// src/components/files/MobileFileBrowser.tsx
export function MobileFileBrowser({
  onFileSelect,
  onFileDelete
}: MobileFileBrowserProps) {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Infinite scroll with virtual rendering
  const virtualizer = useVirtualizer({
    count: files.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 56, // 56px per row
  });

  return (
    <div className="mobile-file-browser">
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search Drive..."
      />

      <FilterChips>
        <Chip active>Recent</Chip>
        <Chip>Shared</Chip>
        <Chip>Starred</Chip>
      </FilterChips>

      <VirtualList ref={scrollRef}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <SwipeableFileCard
            key={files[virtualRow.index].id}
            file={files[virtualRow.index]}
            onSwipeLeft={() => onFileDelete(files[virtualRow.index].id)}
            onSwipeRight={() => onFileSelect(files[virtualRow.index])}
            style={{
              height: virtualRow.size,
              transform: `translateY(${virtualRow.start}px)`
            }}
          />
        ))}
      </VirtualList>
    </div>
  );
}
```

```typescript
// src/components/network/NetworkStatus.tsx
export function NetworkStatus() {
  const { isOnline, effectiveType } = useNetworkStatus();
  const { pendingCount } = useSyncQueue();

  if (isOnline) {
    return (
      <div className="network-status online">
        <WifiIcon />
        <span>{effectiveType.toUpperCase()}</span>
      </div>
    );
  }

  return (
    <div className="network-status offline">
      <OfflineIcon />
      <span>Offline</span>
      {pendingCount > 0 && (
        <Badge>{pendingCount} pending</Badge>
      )}
    </div>
  );
}
```

### Custom Hooks

```typescript
// src/hooks/useNetworkStatus.ts
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [effectiveType, setEffectiveType] = useState<ConnectionType>('4g');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const connection = (navigator as any).connection;
    if (connection) {
      setEffectiveType(connection.effectiveType);
      connection.addEventListener('change', () => {
        setEffectiveType(connection.effectiveType);
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, effectiveType };
}
```

```typescript
// src/hooks/useDriveFile.ts
export function useDriveFile(fileId?: string) {
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const driveService = useMobileDriveService();

  // Load file
  useEffect(() => {
    if (fileId) {
      driveService.getFile(fileId).then(setContent);
    }
  }, [fileId]);

  // Auto-save with throttling
  const debouncedSave = useMemo(
    () =>
      debounce(async (newContent: string) => {
        setIsSaving(true);
        await driveService.saveFile(fileId!, newContent);
        setLastSaved(new Date());
        setIsSaving(false);
      }, 2000),
    [fileId]
  );

  const updateContent = (newContent: string) => {
    setContent(newContent);
    if (fileId) {
      debouncedSave(newContent);
    }
  };

  return {
    content,
    updateContent,
    isSaving,
    lastSaved
  };
}
```

---

## IndexedDB Schema

```typescript
// Database: ritemark_offline
// Version: 1

interface OfflineFile {
  id: string;              // Drive file ID
  content: string;         // Markdown content
  lastModified: number;    // Unix timestamp
  syncStatus: 'pending' | 'synced' | 'error';
  retryCount: number;
  metadata: {
    name: string;
    size: number;
    mimeType: string;
  };
}

interface SyncQueueItem {
  id: string;              // Unique edit ID
  fileId: string;          // Drive file ID
  content: string;         // Content to sync
  timestamp: number;       // When edit was made
  attempts: number;        // Retry count
  status: 'pending' | 'syncing' | 'failed';
}

// Object Stores
const db = openDatabase('ritemark_offline', 1, {
  stores: [
    {
      name: 'files',
      keyPath: 'id',
      indexes: [
        { name: 'syncStatus', keyPath: 'syncStatus' },
        { name: 'lastModified', keyPath: 'lastModified' }
      ]
    },
    {
      name: 'syncQueue',
      keyPath: 'id',
      indexes: [
        { name: 'timestamp', keyPath: 'timestamp' },
        { name: 'status', keyPath: 'status' }
      ]
    }
  ]
});
```

---

## Service Worker Cache Strategy

```typescript
// src/workers/service-worker.ts
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST);

// Cache Google Drive API responses (short TTL)
registerRoute(
  ({ url }) => url.origin === 'https://www.googleapis.com',
  new NetworkFirst({
    cacheName: 'drive-api',
    networkTimeoutSeconds: 10,
    plugins: [
      {
        cacheWillUpdate: async ({ response }) => {
          // Only cache successful responses
          return response.status === 200 ? response : null;
        }
      }
    ]
  })
);

// Cache static assets (CSS, JS, fonts)
registerRoute(
  ({ request }) => request.destination === 'style' ||
                   request.destination === 'script' ||
                   request.destination === 'font',
  new CacheFirst({
    cacheName: 'static-assets',
  })
);

// Cache images
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
  })
);

// Background sync for Drive uploads
self.addEventListener('sync', (event) => {
  if (event.tag === 'drive-sync') {
    event.waitUntil(syncPendingEdits());
  }
});

async function syncPendingEdits() {
  const db = await openIndexedDB();
  const pendingEdits = await getPendingEdits(db);

  for (const edit of pendingEdits) {
    try {
      await uploadToDrive(edit);
      await markAsSynced(db, edit.id);
    } catch (error) {
      console.error('Background sync failed:', error);
    }
  }
}
```

---

## Mobile-Specific CSS Patterns

```css
/* Mobile-first responsive design */
.editor {
  /* Mobile base (375px - iPhone SE) */
  font-size: 16px;
  padding: 16px;
  max-width: 100vw;
}

@media (min-width: 768px) {
  /* Tablet */
  .editor {
    font-size: 18px;
    padding: 24px;
    max-width: 720px;
    margin: 0 auto;
  }
}

@media (min-width: 1024px) {
  /* Desktop */
  .editor {
    padding: 48px;
    max-width: 800px;
  }
}

/* Touch-friendly targets (48px minimum) */
.button,
.file-card,
.menu-item {
  min-height: 48px;
  min-width: 48px;
  padding: 12px 16px;
}

/* Enhanced mobile selection */
@media (max-width: 768px) {
  .ProseMirror ::selection {
    background: rgba(59, 130, 246, 0.2);
  }

  /* Prevent zoom on input focus (iOS) */
  input,
  textarea,
  .ProseMirror {
    font-size: 16px; /* Prevents iOS zoom */
  }
}

/* Safe area for notched phones */
.app-header {
  padding-top: env(safe-area-inset-top);
}

.app-footer {
  padding-bottom: env(safe-area-inset-bottom);
}
```

---

## Error Handling Patterns

```typescript
// Comprehensive error handling for mobile
export class MobileErrorHandler {
  static handle(error: unknown, context: string): UserFacingError {
    // Network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        title: 'Connection Lost',
        message: 'Your changes are saved locally and will sync when you\'re back online.',
        action: 'retry',
        severity: 'warning'
      };
    }

    // Google API errors
    if (error?.status === 401) {
      return {
        title: 'Session Expired',
        message: 'Please sign in again to continue.',
        action: 'login',
        severity: 'error'
      };
    }

    if (error?.status === 429) {
      return {
        title: 'Too Many Requests',
        message: 'Please wait a moment before trying again.',
        action: 'wait',
        severity: 'warning'
      };
    }

    // Storage quota exceeded
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      return {
        title: 'Storage Full',
        message: 'Your device is running low on storage. Please free up space.',
        action: 'cleanup',
        severity: 'error'
      };
    }

    // Generic fallback
    return {
      title: 'Something Went Wrong',
      message: 'Please try again. If the problem persists, contact support.',
      action: 'retry',
      severity: 'error'
    };
  }
}
```

---

## Performance Optimization Checklist

- [ ] **Bundle Size**: < 1.5MB total (gzip)
- [ ] **Code Splitting**: Lazy load file browser, settings
- [ ] **Image Optimization**: WebP with fallback, lazy loading
- [ ] **Font Loading**: Preload critical fonts, swap strategy
- [ ] **Critical CSS**: Inline above-the-fold styles
- [ ] **Service Worker**: Cache static assets, offline fallback
- [ ] **Virtual Scrolling**: For 1000+ file lists
- [ ] **Debounced Auto-Save**: 2s on fast networks, 5s on slow
- [ ] **Request Deduplication**: Cancel stale requests
- [ ] **Compression**: Gzip content before upload
- [ ] **Diff Patching**: Send only changes, not full document

---

This architecture ensures RiteMark works seamlessly on mobile devices with Google Drive integration while handling network variability and offline scenarios gracefully.
