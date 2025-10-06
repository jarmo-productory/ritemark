# Mobile-Specific Google Drive API Integration Research
**Research Date:** October 2025
**Project:** RiteMark WYSIWYG Markdown Editor
**Focus:** Mobile browser compatibility, UX patterns, and technical constraints

---

## Executive Summary

**Key Finding:** Browser-based PWA approach is VIABLE and RECOMMENDED for RiteMark's mobile Drive API integration, with specific optimizations required for iOS Safari and mobile network conditions.

**Critical Constraints:**
1. **iOS Safari OAuth Restrictions** - Google blocks WKWebView, requires SFSafariViewController or Safari redirect flow
2. **No Native File Picker on Mobile** - Google Picker API is desktop-only, requires custom mobile file browser
3. **Background Sync Limitations** - iOS Safari has limited service worker support, requires careful state management
4. **Network Variability** - Mobile networks (3G/4G/5G switching) require aggressive retry logic and throttling

**Strategic Recommendation:** Implement Progressive Web App (PWA) with mobile-first optimizations rather than native wrapper (Capacitor/React Native) to maintain simplicity and avoid additional complexity.

---

## 1. Mobile Browser Drive API Compatibility

### ✅ **Supported Platforms (2025)**

| Platform | Browser | OAuth Support | Drive API | File Access | Notes |
|----------|---------|---------------|-----------|-------------|-------|
| **iOS Safari** | Safari 16+ | ✅ Redirect flow | ✅ REST API | ✅ Via custom UI | **Requires SFSafariViewController for OAuth** |
| **iOS Chrome** | Chrome Mobile | ✅ Redirect flow | ✅ REST API | ✅ Via custom UI | Uses Safari under the hood (iOS restriction) |
| **Android Chrome** | Chrome 100+ | ✅ Full support | ✅ REST API | ✅ Via custom UI | Best mobile experience |
| **Android Firefox** | Firefox 100+ | ✅ Full support | ✅ REST API | ✅ Via custom UI | Good compatibility |

### ❌ **Unsupported/Restricted**

- **iOS WKWebView**: Google blocks OAuth in embedded webviews (security policy)
- **iOS UIWebView** (deprecated): Not supported
- **Google Picker API on mobile**: Desktop-only, not mobile-responsive
- **PWA in iOS standalone mode**: OAuth requires Safari redirect (returns to PWA after auth)

### 🔧 **Technical Requirements**

**OAuth 2.0 Flow for Mobile Browsers:**
```typescript
// CORRECT: Redirect-based OAuth flow for mobile
const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
window.location.href = authUrl; // Redirect to Safari/Chrome

// After Google auth, redirect back to:
// https://app.ritemark.com/auth/callback?code=...&state=...

// INCORRECT: Embedded webview (blocked by Google)
// const iframe = document.createElement('iframe');
// iframe.src = authUrl; // ❌ Will fail with "disallowed_useragent"
```

**ITP (Intelligent Tracking Prevention) Considerations:**
- iOS Safari requires `redirect` mode for Sign In With Google
- Third-party cookies blocked by default
- OAuth state must use sessionStorage (not cookies)

---

## 2. Mobile File Management UX Patterns

### 🚫 **Google Picker API Limitations**

**Problem:** Google Picker API is NOT mobile-responsive and unusable on small screens.

```typescript
// Google Picker API - Desktop Only
google.picker.PickerBuilder()
  .addView(google.picker.ViewId.DOCS)
  .build()
  .setVisible(true); // ❌ Renders desktop UI, broken on mobile
```

**Research Findings:**
- Picker modal is 800px+ wide, doesn't fit mobile screens
- Touch targets too small (designed for mouse)
- No swipe gestures or mobile navigation patterns
- Community consensus: "Use Google Picker for desktop, build custom UI for mobile"

### ✅ **Recommended Mobile File Browser Pattern**

**Custom Mobile-Optimized File List:**
```typescript
// Use Google Drive Files API directly
const response = await gapi.client.drive.files.list({
  pageSize: 20,
  fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, iconLink, thumbnailLink)',
  orderBy: 'modifiedTime desc',
  q: "mimeType='text/markdown' or mimeType='text/plain'"
});

// Render with mobile-friendly component:
// - Large touch targets (48px minimum)
// - Swipe-to-delete gestures
// - Pull-to-refresh
// - Virtual scrolling for 1000+ files
// - Responsive card/list layout
```

**Mobile File Picker Features:**
- **Touch-Friendly List**: 56px tall items with 48px+ touch zones
- **Swipe Gestures**: Swipe right to open, swipe left for delete/rename
- **Search Bar**: Sticky header with autocomplete
- **Filter Chips**: Recent, Shared, Starred (horizontal scrollable)
- **Virtual Scrolling**: Load 20 items at a time (infinite scroll)
- **Offline Indicator**: Show cached files with sync status
- **Loading Skeleton**: Immediate visual feedback on slow networks

### 📱 **Mobile-Specific UI Components**

**File List Card (Mobile):**
```tsx
<div className="file-card" style={{ minHeight: '56px', padding: '12px 16px' }}>
  <div className="file-icon" style={{ width: '40px', height: '40px' }}>
    {thumbnailUrl ? <img src={thumbnailUrl} /> : <FileIcon />}
  </div>
  <div className="file-info" style={{ flex: 1, marginLeft: '12px' }}>
    <div className="file-name" style={{ fontSize: '16px', fontWeight: 500 }}>
      {fileName}
    </div>
    <div className="file-meta" style={{ fontSize: '14px', color: '#666' }}>
      Modified {formatRelativeTime(modifiedTime)}
    </div>
  </div>
  <button className="file-menu" style={{ width: '48px', height: '48px' }}>
    <MoreVertIcon />
  </button>
</div>
```

---

## 3. Network Considerations

### 📶 **Mobile Network Challenges**

| Network Type | Latency | Bandwidth | Auto-Save Strategy |
|--------------|---------|-----------|-------------------|
| **5G** | 10-30ms | 100+ Mbps | Real-time (every 2s) |
| **4G LTE** | 30-70ms | 10-50 Mbps | Standard (every 5s) |
| **4G** | 50-100ms | 5-15 Mbps | Conservative (every 10s) |
| **3G** | 100-500ms | 1-5 Mbps | Minimal (every 30s) |
| **Offline** | N/A | N/A | Queue locally |

### ⚡ **Auto-Save Throttling Strategy**

**Network-Aware Throttling:**
```typescript
// Detect network type and adjust save frequency
const connection = (navigator as any).connection;
const effectiveType = connection?.effectiveType || '4g';

const saveIntervals = {
  '4g': 2000,      // 2 seconds on fast networks
  '3g': 5000,      // 5 seconds on slower networks
  'slow-2g': 10000, // 10 seconds on very slow networks
  '2g': 15000      // 15 seconds on 2G
};

const throttledSave = useMemo(() =>
  throttle(
    async (content: string) => {
      await saveToDrive(content);
    },
    saveIntervals[effectiveType]
  ),
  [effectiveType]
);
```

**Exponential Backoff for API Rate Limits:**
```typescript
async function saveToDriveWithRetry(content: string, attempt = 0): Promise<void> {
  try {
    await gapi.client.drive.files.update({
      fileId: currentFileId,
      uploadType: 'media',
      resource: { name: fileName },
      media: { body: content }
    });
  } catch (error) {
    // Google Drive API: 403 User rate limit exceeded or 429 Too many requests
    if ((error.status === 403 || error.status === 429) && attempt < 5) {
      const backoffDelay = Math.min(1000 * Math.pow(2, attempt), 32000); // Max 32s
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
      return saveToDriveWithRetry(content, attempt + 1);
    }
    throw error;
  }
}
```

### 🔄 **Background Sync Capabilities**

**PWA Background Sync API:**
```typescript
// Register background sync for offline saves
if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
  const registration = await navigator.serviceWorker.ready;
  await registration.sync.register('drive-sync');
}

// Service worker sync event
self.addEventListener('sync', (event) => {
  if (event.tag === 'drive-sync') {
    event.waitUntil(syncPendingChanges());
  }
});

async function syncPendingChanges() {
  const pendingEdits = await getPendingEditsFromIndexedDB();
  for (const edit of pendingEdits) {
    await saveToDrive(edit.content);
    await markEditAsSynced(edit.id);
  }
}
```

**iOS Safari Limitations:**
- ⚠️ Background Sync API **NOT fully supported on iOS Safari** (as of 2025)
- Alternative: Use Periodic Background Sync or `visibilitychange` events
- Store pending changes in IndexedDB, sync when app regains focus

**Android Chrome:**
- ✅ Full Background Sync API support
- Syncs even after browser is closed
- Respects battery optimization settings

### 📊 **Data Usage Optimization**

**Compression & Deduplication:**
```typescript
// 1. Compress content before upload (Gzip)
const compressed = await compressText(content);

// 2. Send only diffs (not full document)
const diff = computeDiff(lastSavedContent, currentContent);
await sendPatch(fileId, diff); // 80% smaller than full upload

// 3. Batch multiple edits
const batchedEdits = collectEditsFromLast5Seconds();
await saveBatch(batchedEdits); // Single API call instead of 5
```

**Estimated Data Usage:**
- **Full document save**: 10KB average markdown file = 10KB/save
- **With compression**: 3-5KB/save (70% reduction)
- **With diff patches**: 0.5-2KB/edit (90% reduction)
- **Auto-save every 5s for 10 minutes**: 120 saves × 2KB = 240KB (acceptable)

---

## 4. Mobile-Specific Edge Cases

### 📱 **App Backgrounding During Save**

**Problem:** User switches to another app mid-save, network request is paused/killed.

**Solution: State Persistence + Retry**
```typescript
// Detect app backgrounding
document.addEventListener('visibilitychange', async () => {
  if (document.hidden) {
    // App going to background, save immediately
    await forceSaveBeforeBackground();
  } else {
    // App returning from background, check sync status
    await checkAndResumePendingSync();
  }
});

// iOS-specific: beforeunload doesn't work reliably
window.addEventListener('pagehide', async (e) => {
  // Last chance to save before iOS kills the page
  await forceSaveBeforeBackground();
});
```

**IndexedDB Persistence:**
```typescript
// Save to IndexedDB first (synchronous, survives backgrounding)
await saveToIndexedDB(content, { status: 'pending', timestamp: Date.now() });

// Then upload to Drive (may be interrupted)
try {
  await saveToDrive(content);
  await markIndexedDBStatus(contentId, 'synced');
} catch (error) {
  // Will retry on next app open
  console.error('Save interrupted:', error);
}
```

### 🔄 **Network Switching (WiFi → Cellular)**

**Problem:** User walks away from WiFi, connection drops mid-request, switches to cellular.

**Solution: Network Change Detection + Request Retry**
```typescript
// Detect network change
const connection = (navigator as any).connection;
connection?.addEventListener('change', async () => {
  console.log(`Network changed to ${connection.effectiveType}`);

  // Check if requests are pending
  const pendingRequests = getPendingDriveRequests();
  if (pendingRequests.length > 0) {
    // Abort stale requests
    pendingRequests.forEach(req => req.abort());

    // Retry with new network
    await retryPendingRequests();
  }
});

// AbortController for request cancellation
const controller = new AbortController();
fetch(url, { signal: controller.signal });

// On network change:
controller.abort(); // Cancel old request
// Start new request with fresh network
```

### 💾 **Low Storage Warnings**

**Problem:** Mobile device running out of storage, IndexedDB writes may fail.

**Solution: Storage Quota Management**
```typescript
// Check available storage
if ('storage' in navigator && 'estimate' in navigator.storage) {
  const estimate = await navigator.storage.estimate();
  const percentUsed = (estimate.usage! / estimate.quota!) * 100;

  if (percentUsed > 90) {
    // Warn user and disable offline caching
    showStorageWarning();
    disableOfflineCache();
  }
}

// Request persistent storage (prevents eviction)
if ('storage' in navigator && 'persist' in navigator.storage) {
  const granted = await navigator.storage.persist();
  if (granted) {
    console.log('Storage will not be evicted');
  }
}
```

**Fallback Strategy:**
- If IndexedDB full: Use sessionStorage (survives tab close)
- If sessionStorage full: Use in-memory cache (lost on refresh)
- Always show "unsaved changes" indicator when local-only

### 🔋 **Battery Optimization Impact on Sync**

**Problem:** iOS/Android battery saver mode throttles background tasks.

**Solution: Adaptive Sync Frequency**
```typescript
// Check battery status
const battery = await navigator.getBattery?.();

if (battery) {
  battery.addEventListener('chargingchange', updateSyncStrategy);
  battery.addEventListener('levelchange', updateSyncStrategy);
}

function updateSyncStrategy() {
  const isLowBattery = battery.level < 0.2;
  const isCharging = battery.charging;

  if (isLowBattery && !isCharging) {
    // Battery saver mode: reduce sync frequency
    setAutoSaveInterval(30000); // 30 seconds
    disableBackgroundSync();
  } else {
    // Normal mode: default frequency
    setAutoSaveInterval(5000); // 5 seconds
    enableBackgroundSync();
  }
}
```

---

## 5. Progressive Web App vs Native Wrapper

### 🌐 **PWA (Browser-Based) - RECOMMENDED**

**Pros:**
- ✅ **Simplest deployment**: Single codebase, deploy to web
- ✅ **No app store review delays**: Instant updates
- ✅ **Smaller bundle size**: No native bindings overhead
- ✅ **Google Drive API fully supported**: Direct REST API access
- ✅ **OAuth works natively**: Safari redirect flow already implemented
- ✅ **Installable on home screen**: iOS/Android support
- ✅ **Offline support**: Service workers + IndexedDB
- ✅ **Push notifications**: Web Push API (limited on iOS)

**Cons:**
- ⚠️ **iOS Safari limitations**: No full background sync, limited notifications
- ⚠️ **No native file system access**: Can't access local filesystem directly
- ⚠️ **Performance slightly lower**: JavaScript runtime vs native
- ⚠️ **Offline mode limited**: Service workers restricted on iOS

**Best For:** RiteMark's current scope (cloud-first, minimal native features)

---

### 📱 **Capacitor/React Native (Native Wrapper) - NOT RECOMMENDED**

**Capacitor Pros:**
- ✅ **Better iOS integration**: Full background sync, native file access
- ✅ **Native feel**: Status bar control, splash screens, haptics
- ✅ **App store presence**: Discoverability in iOS/Android stores
- ✅ **Native plugins**: Access to device features (camera, contacts, etc.)

**Capacitor Cons:**
- ❌ **Increased complexity**: Maintain web + iOS + Android builds
- ❌ **App store friction**: Review delays, rejection risk, 30% Apple tax
- ❌ **Larger bundle size**: Native runtime + webview overhead
- ❌ **OAuth requires native library**: Google Sign-In SDK for iOS/Android
- ❌ **Deployment complexity**: Need Xcode, Android Studio, certificates
- ❌ **Version fragmentation**: Users on old app versions

**React Native Pros:**
- ✅ **Best performance**: Near-native rendering
- ✅ **Rich ecosystem**: Mature libraries, community support
- ✅ **Full native access**: Any iOS/Android API available

**React Native Cons:**
- ❌ **Complete rewrite**: Can't reuse TipTap React components
- ❌ **Learning curve**: Different paradigm from web React
- ❌ **Maintenance burden**: Two platforms to support (iOS + Android)
- ❌ **Google Drive API**: Requires native SDK integration
- ❌ **Build complexity**: Xcode, Android Studio, native dependencies

---

### 🎯 **Decision Matrix**

| Feature | PWA | Capacitor | React Native |
|---------|-----|-----------|--------------|
| **Development Speed** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Deployment Speed** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| **Maintenance Cost** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Drive API Integration** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **iOS Performance** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Offline Capabilities** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Background Sync** | ⭐⭐ (iOS) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Code Reuse** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐ |

**Recommendation:** **Start with PWA**, add Capacitor wrapper only if:
1. Background sync becomes critical user complaint
2. App store presence needed for discoverability
3. Native features required (camera, biometrics, etc.)

---

## 6. Mobile-First vs Desktop-First Strategy

### 📱 **Mobile-First Strategy (RECOMMENDED)**

**Implementation:**
```typescript
// 1. Design for mobile viewport first (375px - iPhone SE)
// 2. Progressive enhancement for tablets (768px+)
// 3. Desktop gets full-width editor (1024px+)

// Mobile-first CSS
.editor {
  font-size: 16px; /* Mobile base */
  padding: 16px;
  max-width: 100vw;
}

@media (min-width: 768px) {
  .editor {
    font-size: 18px; /* Tablet */
    padding: 24px;
    max-width: 720px;
    margin: 0 auto;
  }
}

@media (min-width: 1024px) {
  .editor {
    font-size: 18px; /* Desktop */
    padding: 48px;
    max-width: 800px;
  }
}
```

**Touch Optimization:**
```typescript
// All interactive elements: 48px minimum (iOS HIG guideline)
.button {
  min-height: 48px;
  min-width: 48px;
  padding: 12px 24px;
}

// Increase tap targets for links in editor
.editor a {
  padding: 4px 2px; /* Makes link easier to tap */
}

// Swipe gestures for file list
<Swipeable
  onSwipeLeft={() => deleteFile(id)}
  onSwipeRight={() => openFile(id)}
/>
```

**Performance Budget (Mobile):**
- **Initial Load**: < 3s on 4G (1.5MB bundle max)
- **Time to Interactive**: < 5s on 4G
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s

---

### 🖥️ **Desktop-First Strategy (NOT RECOMMENDED)**

**Why Avoid:**
- Most users discover via mobile (Google search on phone)
- Mobile traffic growing faster than desktop
- RiteMark's "Google Docs for Markdown" positioning = mobile expectations
- Desktop users can adapt to mobile-optimized UI, but mobile users struggle with desktop UI

---

## 7. Technical Implementation Recommendations

### 🏗️ **Architecture for Mobile Drive Integration**

```typescript
// src/services/drive/MobileDriveService.ts
export class MobileDriveService {
  private networkManager: NetworkManager;
  private syncQueue: SyncQueue;
  private offlineStore: OfflineStore;

  constructor() {
    this.networkManager = new NetworkManager();
    this.syncQueue = new SyncQueue();
    this.offlineStore = new OfflineStore();

    // Setup event listeners
    this.setupNetworkListeners();
    this.setupVisibilityListeners();
    this.setupStorageListeners();
  }

  async saveFile(fileId: string, content: string): Promise<void> {
    // 1. Save to IndexedDB first (instant feedback)
    await this.offlineStore.save(fileId, content);

    // 2. Add to sync queue
    this.syncQueue.enqueue({ fileId, content, timestamp: Date.now() });

    // 3. Attempt network sync (with retry)
    if (this.networkManager.isOnline()) {
      await this.syncQueue.processNext();
    }
  }

  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.syncQueue.resumeProcessing();
    });

    window.addEventListener('offline', () => {
      this.syncQueue.pauseProcessing();
    });

    // Network type change (3G → 4G, WiFi → Cellular)
    const connection = (navigator as any).connection;
    connection?.addEventListener('change', () => {
      this.adjustSyncStrategy(connection.effectiveType);
    });
  }

  private setupVisibilityListeners(): void {
    document.addEventListener('visibilitychange', async () => {
      if (document.hidden) {
        // App going to background, force sync
        await this.syncQueue.flushAll();
      } else {
        // App returning, resume sync
        await this.syncQueue.resumeProcessing();
      }
    });
  }
}
```

### 📦 **Key Libraries for Mobile**

```json
{
  "dependencies": {
    // PWA
    "workbox-webpack-plugin": "^7.0.0",      // Service worker tooling
    "idb": "^8.0.0",                         // IndexedDB wrapper

    // Mobile optimization
    "react-swipeable": "^7.0.0",             // Swipe gestures
    "react-virtual": "^2.10.0",              // Virtual scrolling (file lists)
    "react-intersection-observer": "^9.5.0", // Lazy loading

    // Network resilience
    "axios-retry": "^4.0.0",                 // Auto-retry with backoff
    "workbox-background-sync": "^7.0.0",     // Background sync queue

    // Compression
    "pako": "^2.1.0"                         // Gzip compression
  }
}
```

---

## 8. Mobile Testing Checklist

### 📱 **Device Testing Matrix**

| Device | OS | Browser | Priority |
|--------|-----|---------|----------|
| iPhone 14 | iOS 17 | Safari | 🔴 Critical |
| iPhone SE (2020) | iOS 16 | Safari | 🔴 Critical |
| Samsung Galaxy S23 | Android 14 | Chrome | 🟡 High |
| iPad Air | iPadOS 17 | Safari | 🟡 High |
| Pixel 7 | Android 13 | Chrome | 🟢 Medium |

### ✅ **Test Scenarios**

**OAuth Flow:**
- [ ] Login on iOS Safari redirects correctly
- [ ] Login on Android Chrome completes
- [ ] OAuth callback works in PWA standalone mode
- [ ] Token refresh works after 1 hour expiration
- [ ] Logout clears all tokens and state

**File Operations:**
- [ ] Create new file on mobile
- [ ] Open existing file from Drive
- [ ] Save file with slow 3G network
- [ ] Edit file while offline
- [ ] Delete file with swipe gesture
- [ ] Search for files with autocomplete

**Network Resilience:**
- [ ] Auto-save works on WiFi
- [ ] Auto-save works on cellular
- [ ] Graceful handling when network drops mid-save
- [ ] Sync resumes when network returns
- [ ] No data loss when switching WiFi → cellular
- [ ] Retry logic works for 429 rate limit errors

**Background Scenarios:**
- [ ] Save completes when app backgrounds (iOS)
- [ ] Pending changes sync when app returns
- [ ] No data loss when iOS kills app
- [ ] Battery saver mode reduces sync frequency

**Performance:**
- [ ] Editor loads in < 3s on 4G
- [ ] Smooth scrolling with 1000+ word document
- [ ] No lag when typing on mobile keyboard
- [ ] File list loads in < 2s with 100+ files
- [ ] Virtual scrolling works for 500+ files

---

## 9. Recommendations Summary

### ✅ **DO**

1. **Use PWA architecture** - Service workers + IndexedDB + web manifest
2. **Implement custom mobile file browser** - Google Picker won't work
3. **Build mobile-first responsive UI** - 375px viewport as base
4. **Add network-aware auto-save throttling** - Adjust to 3G/4G/5G
5. **Use Background Sync API** - With IndexedDB fallback for iOS
6. **Implement exponential backoff** - For API rate limits
7. **Add offline indicator** - Show sync status clearly
8. **Test on real iOS devices** - Safari has unique quirks
9. **Use touch-friendly UI** - 48px minimum tap targets
10. **Add swipe gestures** - For file operations (delete, open)

### ❌ **DON'T**

1. **Don't use Google Picker on mobile** - Build custom file list
2. **Don't use WKWebView for OAuth** - Google blocks it
3. **Don't assume Background Sync works on iOS** - It doesn't fully
4. **Don't ignore network type changes** - Cellular switching is common
5. **Don't skip IndexedDB** - Critical for offline resilience
6. **Don't use desktop-first CSS** - Mobile users will suffer
7. **Don't rely on cookies for state** - iOS ITP blocks third-party cookies
8. **Don't skip compression** - Mobile data is expensive
9. **Don't use Capacitor/React Native prematurely** - PWA is sufficient
10. **Don't assume fast networks** - Many users on 3G/4G

---

## 10. Next Steps (Implementation Roadmap)

### Phase 1: Foundation (Week 1-2)
- [ ] Add PWA manifest and service worker
- [ ] Implement IndexedDB storage layer
- [ ] Add network detection and status indicators
- [ ] Create mobile-responsive file list component

### Phase 2: Drive Integration (Week 3-4)
- [ ] Build custom mobile file browser (replace Picker)
- [ ] Implement network-aware auto-save
- [ ] Add background sync with retry logic
- [ ] Test OAuth flow on iOS Safari

### Phase 3: Optimization (Week 5-6)
- [ ] Add compression for uploads
- [ ] Implement diff-based patching
- [ ] Add swipe gestures for file operations
- [ ] Optimize for 3G networks

### Phase 4: Testing & Polish (Week 7-8)
- [ ] Test on 5+ real mobile devices
- [ ] Add Lighthouse mobile audit
- [ ] Implement battery-aware sync
- [ ] Add offline mode UI improvements

---

## 11. Key Files to Implement

```
src/
├── services/
│   ├── drive/
│   │   ├── MobileDriveService.ts        # Main mobile Drive service
│   │   ├── NetworkManager.ts            # Network detection & retry
│   │   ├── SyncQueue.ts                 # Background sync queue
│   │   ├── OfflineStore.ts              # IndexedDB wrapper
│   │   └── CompressionService.ts        # Gzip compression
│   └── auth/
│       └── MobileOAuthHandler.ts        # iOS Safari OAuth handling
├── components/
│   ├── files/
│   │   ├── MobileFileBrowser.tsx        # Custom mobile file picker
│   │   ├── FileCard.tsx                 # Swipeable file card
│   │   └── FileListVirtualized.tsx      # Virtual scrolling
│   └── network/
│       ├── NetworkStatus.tsx            # Online/offline indicator
│       └── SyncStatus.tsx               # Sync progress indicator
├── hooks/
│   ├── useNetworkStatus.ts              # Network detection hook
│   ├── useBackgroundSync.ts             # Background sync hook
│   └── useDriveFile.ts                  # Mobile Drive file operations
└── workers/
    └── service-worker.ts                # PWA service worker
```

---

**Research Completed:** October 2025
**Next Review:** After Phase 1 implementation (2 weeks)
**Owner:** RiteMark Development Team
