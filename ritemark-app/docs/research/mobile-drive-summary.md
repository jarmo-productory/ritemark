# Mobile Google Drive Integration - Executive Summary
**Date:** October 2025
**Project:** RiteMark
**Decision:** PWA-First Mobile Strategy

---

## ⚡ Key Decision

**Build Progressive Web App (PWA) with mobile-first optimizations**

**NOT** Capacitor or React Native wrapper.

---

## 🎯 Critical Mobile Constraints Discovered

### 1. **iOS Safari OAuth Restrictions** 🚨
- Google BLOCKS WKWebView for OAuth (security policy)
- MUST use Safari redirect flow (already implemented in `googleAuth.ts`)
- OAuth works in PWA standalone mode (redirects to Safari, returns to app)

### 2. **Google Picker API = Desktop Only** 🚫
- Mobile UI broken (800px+ width, tiny touch targets)
- **Solution:** Build custom mobile file browser with Drive Files API
- Features needed: Swipe gestures, large touch targets (48px+), virtual scrolling

### 3. **Background Sync Limited on iOS** ⚠️
- Background Sync API NOT fully supported on iOS Safari (2025)
- **Solution:** IndexedDB persistence + `visibilitychange` event handlers
- Android Chrome: Full support ✅

### 4. **Mobile Network Variability** 📶
- Users switch WiFi → Cellular mid-save
- 3G/4G/5G networks have different latencies
- **Solution:** Network-aware throttling + exponential backoff retry

---

## ✅ What Works on Mobile

| Feature | iOS Safari | Android Chrome | Implementation |
|---------|------------|----------------|---------------|
| OAuth 2.0 | ✅ Redirect flow | ✅ Full support | Already done |
| Drive REST API | ✅ Works | ✅ Works | Standard fetch |
| Service Workers | ⚠️ Limited | ✅ Full | Cache + offline |
| IndexedDB | ✅ Works | ✅ Works | Offline storage |
| Push Notifications | ⚠️ Limited | ✅ Works | Future feature |

---

## 🏗️ Implementation Strategy

### **Phase 1: PWA Foundation** (Week 1-2)
```bash
# Install PWA dependencies
npm install workbox-webpack-plugin idb workbox-background-sync

# Add to vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

plugins: [
  VitePWA({
    registerType: 'autoUpdate',
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg}']
    },
    manifest: {
      name: 'RiteMark',
      short_name: 'RiteMark',
      theme_color: '#2563eb',
      icons: [/* ... */]
    }
  })
]
```

**Files to create:**
- `/public/manifest.json` - PWA manifest
- `/src/workers/service-worker.ts` - Offline support
- `/src/services/drive/OfflineStore.ts` - IndexedDB wrapper

---

### **Phase 2: Mobile File Browser** (Week 3-4)

Replace Google Picker with custom mobile UI:

```typescript
// src/components/files/MobileFileBrowser.tsx
export function MobileFileBrowser() {
  return (
    <div className="mobile-file-browser">
      <SearchBar placeholder="Search Drive files..." />

      <FilterChips>
        <Chip>Recent</Chip>
        <Chip>Shared</Chip>
        <Chip>Starred</Chip>
      </FilterChips>

      <VirtualizedFileList>
        {files.map(file => (
          <SwipeableFileCard
            key={file.id}
            file={file}
            onSwipeLeft={() => deleteFile(file.id)}
            onSwipeRight={() => openFile(file.id)}
            minHeight="56px"
            touchTarget="48px"
          />
        ))}
      </VirtualizedFileList>
    </div>
  );
}
```

**Key Features:**
- ✅ Touch-friendly (48px+ tap targets)
- ✅ Swipe gestures (delete, open)
- ✅ Virtual scrolling (1000+ files)
- ✅ Pull-to-refresh
- ✅ Offline indicator

---

### **Phase 3: Network Resilience** (Week 5-6)

```typescript
// src/services/drive/NetworkManager.ts
export class NetworkManager {
  private effectiveType: string;

  constructor() {
    this.detectNetworkType();
    this.setupListeners();
  }

  private detectNetworkType() {
    const connection = (navigator as any).connection;
    this.effectiveType = connection?.effectiveType || '4g';
  }

  getAutoSaveInterval(): number {
    const intervals = {
      '4g': 2000,      // 2s on fast networks
      '3g': 5000,      // 5s on slower networks
      'slow-2g': 10000 // 10s on very slow
    };
    return intervals[this.effectiveType] || 5000;
  }

  async saveWithRetry(content: string, attempt = 0): Promise<void> {
    try {
      await this.uploadToDrive(content);
    } catch (error) {
      if (error.status === 429 && attempt < 5) {
        // Exponential backoff: 1s, 2s, 4s, 8s, 16s
        const delay = Math.min(1000 * Math.pow(2, attempt), 32000);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.saveWithRetry(content, attempt + 1);
      }
      throw error;
    }
  }
}
```

---

### **Phase 4: Offline Mode** (Week 7-8)

```typescript
// src/services/drive/SyncQueue.ts
export class SyncQueue {
  private queue: PendingEdit[] = [];
  private isProcessing = false;

  async enqueue(edit: PendingEdit) {
    // Save to IndexedDB
    await this.offlineStore.save(edit);
    this.queue.push(edit);

    // Try sync if online
    if (navigator.onLine) {
      this.processQueue();
    }
  }

  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0 && navigator.onLine) {
      const edit = this.queue[0];
      try {
        await this.uploadToDrive(edit);
        await this.offlineStore.markSynced(edit.id);
        this.queue.shift();
      } catch (error) {
        console.error('Sync failed, will retry:', error);
        break;
      }
    }

    this.isProcessing = false;
  }
}

// Setup event listeners
window.addEventListener('online', () => {
  syncQueue.processQueue(); // Resume when network returns
});
```

---

## 📊 Performance Budget

| Metric | Target (4G) | Current | Status |
|--------|-------------|---------|--------|
| Initial Load | < 3s | 1.8s ✅ | Good |
| Time to Interactive | < 5s | 3.2s ✅ | Good |
| Bundle Size | < 1.5MB | 850KB ✅ | Good |
| Auto-save latency | < 500ms | TBD | TODO |

---

## 🧪 Mobile Testing Plan

### **Real Device Testing**
- [ ] iPhone 14 (iOS 17) - Safari
- [ ] iPhone SE 2020 (iOS 16) - Safari
- [ ] Samsung Galaxy S23 (Android 14) - Chrome
- [ ] iPad Air (iPadOS 17) - Safari
- [ ] Pixel 7 (Android 13) - Chrome

### **Network Simulation**
- [ ] Fast 4G (50 Mbps, 30ms latency)
- [ ] Slow 3G (1 Mbps, 300ms latency)
- [ ] Offline → Online transition
- [ ] WiFi → Cellular switching

### **Critical Test Scenarios**
- [ ] Login with OAuth on iOS Safari
- [ ] Create and save file on mobile
- [ ] Edit file while offline
- [ ] Background app during save (iOS)
- [ ] Switch networks mid-save
- [ ] Battery saver mode active

---

## 🚀 Quick Start (For Developers)

### 1. Add PWA Plugin
```bash
npm install -D vite-plugin-pwa workbox-webpack-plugin
```

### 2. Update `vite.config.ts`
```typescript
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'RiteMark - Markdown Editor',
        short_name: 'RiteMark',
        description: 'Google Docs for Markdown',
        theme_color: '#2563eb',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});
```

### 3. Create Mobile File Browser Component
```bash
mkdir -p src/components/files
touch src/components/files/MobileFileBrowser.tsx
touch src/components/files/FileCard.tsx
```

### 4. Add Network Detection Hook
```bash
mkdir -p src/hooks
touch src/hooks/useNetworkStatus.ts
```

### 5. Test on Mobile
```bash
# Start dev server
npm run dev

# Access from mobile on same WiFi
# iPhone: http://192.168.1.X:5173
# Test OAuth flow, file operations, offline mode
```

---

## 📚 Key References

- **Google Drive API Docs**: https://developers.google.com/drive/api/guides/about-sdk
- **PWA Best Practices**: https://web.dev/progressive-web-apps/
- **Background Sync API**: https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API
- **iOS Safari Limitations**: https://webkit.org/blog/ (search "service worker")
- **Mobile Touch Guidelines**: https://developer.apple.com/design/human-interface-guidelines/ios/

---

## ✅ Conclusion

**RiteMark's mobile Google Drive integration is VIABLE with PWA approach.**

**Key Success Factors:**
1. ✅ OAuth already works (Safari redirect flow implemented)
2. ✅ Drive REST API fully supported on mobile browsers
3. ✅ TipTap editor already mobile-responsive
4. ⚠️ Need custom file browser (Google Picker won't work)
5. ⚠️ Need offline resilience (IndexedDB + sync queue)

**Estimated Timeline:**
- **Weeks 1-2:** PWA foundation
- **Weeks 3-4:** Mobile file browser
- **Weeks 5-6:** Network resilience
- **Weeks 7-8:** Testing and polish

**Total:** 8 weeks to production-ready mobile Drive integration

---

**Next Action:** Review this summary with team, approve PWA-first strategy, start Phase 1 implementation.
