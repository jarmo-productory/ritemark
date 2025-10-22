# Offline Detection Patterns for React Apps (2025)

**Research Date:** October 21, 2025
**Purpose:** Implement reliable offline detection for RiteMark's Google Drive integration
**Target:** Replace unreliable `navigator.onLine` with production-ready patterns

---

## Executive Summary

Modern web applications require robust offline detection that goes beyond browser APIs. Research reveals:

1. **`navigator.onLine` is unreliable** - Produces false positives (LAN connected but no internet)
2. **Actual API connectivity checks** via fetch() are more reliable than browser APIs
3. **Service Worker patterns** + exponential backoff provide best offline experience
4. **Toast notifications** should use persistent UI for offline, auto-dismiss for online
5. **Network Information API** provides connection quality but limited browser support

---

## 1. Browser APIs: Capabilities & Limitations

### 1.1 `navigator.onLine` - Use with Extreme Caution

#### What It Actually Detects:
```typescript
// ❌ WRONG ASSUMPTION: "User has internet access"
const isOnline = navigator.onLine;

// ✅ CORRECT INTERPRETATION: "Browser is connected to a network (maybe)"
const hasNetworkAdapter = navigator.onLine;
```

#### Critical Limitations:

| Scenario | `navigator.onLine` | Reality |
|----------|-------------------|---------|
| Connected to LAN without internet | `true` ✅ | **No internet** ❌ |
| Connected to router with no WAN | `true` ✅ | **No internet** ❌ |
| VPN blocking Microsoft servers (Windows) | `false` ❌ | **Has internet** ✅ |
| Virtual ethernet adapters | `true` ✅ | **Variable** ⚠️ |
| Firewall blocking connectivity checks | `false` ❌ | **Has internet** ✅ |

#### Browser-Specific Behavior:

**Chrome/Edge/Opera (Blink):**
- Returns `false` only when unable to connect to LAN/router
- All other conditions return `true`
- Most reliable among browsers

**Firefox (Gecko):**
- Desktop Firefox always returns `true` unless "Work Offline" manually selected ([Bug 654579](https://bugzilla.mozilla.org/show_bug.cgi?id=654579))
- Mobile Firefox works correctly

**Safari (WebKit):**
- May return `true` even when WiFi is disabled
- Unreliable for offline detection

#### When to Use (Sparingly):

```typescript
// ✅ ACCEPTABLE: Quick check before attempting fetch
if (!navigator.onLine) {
  // Definitely offline - skip fetch attempt
  showOfflineUI();
  return;
}

// ⚠️ STILL ATTEMPT FETCH - might have false positive
try {
  await fetch('/api/endpoint');
} catch (error) {
  // Actual offline detection happens here
  handleOffline(error);
}
```

---

### 1.2 `online` / `offline` Window Events

#### Implementation Pattern:

```typescript
useEffect(() => {
  const handleOnline = () => {
    console.log('Browser thinks it is online');
    // ⚠️ Still verify with actual fetch
    verifyConnectivity();
  };

  const handleOffline = () => {
    console.log('Browser detected offline');
    // ✅ This is reliable - definitely offline
    setIsOnline(false);
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}, []);
```

#### Key Characteristics:
- Events fire when `navigator.onLine` changes
- Inherit same limitations as `navigator.onLine`
- Useful for detecting network adapter state changes
- Should trigger connectivity verification, not be trusted alone

---

### 1.3 Network Information API (`navigator.connection`)

#### Browser Support (2025):

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome/Edge/Opera | ✅ Full | All properties supported |
| Firefox | ❌ None | No support planned |
| Safari | ❌ None | No support |

#### TypeScript Integration:

```bash
npm install --save-dev network-information-types
```

```typescript
// types/navigator.d.ts
import 'network-information-types';

// Now TypeScript recognizes navigator.connection
interface NetworkInformation extends EventTarget {
  readonly effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
  readonly downlink: number; // Mbps
  readonly rtt: number; // Round-trip time (ms)
  readonly saveData: boolean;
  onchange: ((this: NetworkInformation, ev: Event) => any) | null;
}
```

#### Practical Usage:

```typescript
function useNetworkQuality() {
  const [quality, setQuality] = useState<'slow' | 'medium' | 'fast'>('fast');

  useEffect(() => {
    // ⚠️ Only works in Chromium browsers
    const connection = (navigator as any).connection;

    if (!connection) {
      console.log('Network Information API not supported');
      return;
    }

    const updateQuality = () => {
      const effectiveType = connection.effectiveType;

      if (effectiveType === 'slow-2g' || effectiveType === '2g') {
        setQuality('slow');
      } else if (effectiveType === '3g') {
        setQuality('medium');
      } else {
        setQuality('fast');
      }
    };

    updateQuality();
    connection.addEventListener('change', updateQuality);

    return () => connection.removeEventListener('change', updateQuality);
  }, []);

  return quality;
}
```

#### Use Cases:
- Adaptive image loading (serve lower resolution on slow connections)
- Defer non-critical API calls on slow networks
- Show "slow connection" warnings
- Optimize bundle loading strategies

**Recommendation for RiteMark:** Use as progressive enhancement only (Chromium-only support).

---

### 1.4 Service Worker Network Detection

#### Best Practice Pattern:

```typescript
// service-worker.ts
self.addEventListener('fetch', (event: FetchEvent) => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // ✅ Successfully fetched - we're online
        return response;
      })
      .catch(error => {
        // ✅ Fetch failed - this is ACTUAL offline detection
        console.log('Offline detected via fetch failure');

        // Return cached response if available
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }

            // Return offline page
            return caches.match('/offline.html');
          });
      })
  );
});
```

#### Why Service Workers Are More Reliable:

1. **Actual network attempts** - Tests real connectivity, not browser state
2. **No false positives** - Fetch only fails when genuinely unable to connect
3. **Works across all browsers** - Standard API support
4. **Handles lie-fi** - Detects slow/broken connections that `navigator.onLine` misses

**Lie-Fi:** Connection that appears online but is too slow/broken to be usable.

---

## 2. React Patterns & Custom Hooks

### 2.1 Recommended `useNetworkStatus` Hook (2025)

```typescript
import { useState, useEffect } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  isVerified: boolean; // Actual connectivity verified via fetch
  lastChecked: Date | null;
  effectiveType?: '2g' | '3g' | '4g' | 'slow-2g';
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isVerified: false,
    lastChecked: null,
  });

  // Verify actual connectivity by pinging a reliable endpoint
  const verifyConnectivity = async () => {
    try {
      // Use HEAD request to minimize bandwidth
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors', // Avoid CORS issues
        cache: 'no-cache',
      });

      setStatus(prev => ({
        ...prev,
        isOnline: true,
        isVerified: true,
        lastChecked: new Date(),
      }));
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        isOnline: false,
        isVerified: true,
        lastChecked: new Date(),
      }));
    }
  };

  useEffect(() => {
    // Initial verification
    verifyConnectivity();

    // Listen to browser events (quick detection)
    const handleOnline = () => {
      // Browser says online - verify with actual fetch
      verifyConnectivity();
    };

    const handleOffline = () => {
      // Browser says offline - trust this immediately
      setStatus(prev => ({
        ...prev,
        isOnline: false,
        isVerified: true,
        lastChecked: new Date(),
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic verification (every 30 seconds when online)
    const interval = setInterval(() => {
      if (navigator.onLine) {
        verifyConnectivity();
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  // Optional: Network Information API integration (Chromium only)
  useEffect(() => {
    const connection = (navigator as any).connection;
    if (!connection) return;

    const updateEffectiveType = () => {
      setStatus(prev => ({
        ...prev,
        effectiveType: connection.effectiveType,
      }));
    };

    updateEffectiveType();
    connection.addEventListener('change', updateEffectiveType);

    return () => connection.removeEventListener('change', updateEffectiveType);
  }, []);

  return status;
}
```

### 2.2 Usage Example:

```typescript
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

function DriveEditor() {
  const { isOnline, isVerified, effectiveType } = useNetworkStatus();

  return (
    <div>
      {!isOnline && isVerified && (
        <OfflineBanner message="You're working offline. Changes will sync when you reconnect." />
      )}

      {isOnline && effectiveType === 'slow-2g' && (
        <SlowConnectionWarning message="Slow connection detected. Some features may be limited." />
      )}

      {/* Editor component */}
    </div>
  );
}
```

---

### 2.3 Popular React Libraries (2025)

#### Option 1: `react-use` (Recommended)

```bash
npm install react-use
```

```typescript
import { useNetworkState } from 'react-use';

function Component() {
  const state = useNetworkState();

  console.log({
    online: state.online,
    downlink: state.downlink, // Mbps
    effectiveType: state.effectiveType,
    rtt: state.rtt, // Round-trip time
    saveData: state.saveData,
  });

  return <div>{state.online ? 'Online' : 'Offline'}</div>;
}
```

**Pros:**
- Well-maintained (100k+ weekly downloads)
- Comprehensive hook library
- TypeScript support
- Network Information API integration

**Cons:**
- Still relies on `navigator.onLine` internally
- Doesn't do actual connectivity verification

---

#### Option 2: Custom Implementation (Recommended for RiteMark)

**Why build custom:**
1. Control over verification strategy (Drive API ping vs generic endpoint)
2. No dependency on unreliable browser APIs
3. Integration with Drive SDK error handling
4. Exponential backoff retry logic specific to our needs

---

## 3. Real-World Implementation Examples

### 3.1 Google Docs Offline Pattern

**UX Characteristics:**
1. **Opt-in offline mode** - Users must enable offline access in settings
2. **Chrome extension required** - Google Docs Offline extension
3. **Visual indicators:**
   - ✅ Checkmark in bottom-left when file available offline
   - ☁️ Cloud icon when syncing
   - ⚠️ Warning icon when sync fails
4. **Automatic sync** - Changes queue locally and sync when back online
5. **No Firefox/Safari support** - Chrome/Edge only

**Technical Implementation:**
- Service Worker for offline caching
- IndexedDB for local document storage
- WebSocket for real-time collaboration (falls back to polling)
- Differential sync (only changed data sent to server)

**Key Takeaway for RiteMark:**
Google Docs doesn't use `navigator.onLine` - they detect offline state by attempting actual API calls and handling failures.

---

### 3.2 Notion Offline Pattern

**UX Characteristics:**
1. **Automatic offline support** - No opt-in required
2. **Sync status indicator:**
   - "Synced" when up to date
   - "Syncing..." during upload
   - "Offline" when disconnected
   - Timestamp of last successful sync
3. **Toast notifications:**
   - Brief toast when going offline
   - Brief toast when back online and syncing
4. **Graceful degradation:**
   - View/edit/create pages offline
   - Images may not load
   - Database queries limited to cached data

**Technical Implementation:**
- Desktop/mobile apps download frequently accessed pages
- Local SQLite database for offline storage
- Conflict resolution with CRDTs (similar to Y.js)
- Exponential backoff retry for failed syncs

**Key Takeaway for RiteMark:**
Notion shows sync status constantly (not just offline warnings), giving users confidence about data safety.

---

### 3.3 Figma Offline Pattern

**UX Characteristics:**
1. **Limited offline support** - Primarily online-first
2. **Connection indicator:**
   - Small dot next to file name
   - Green = connected
   - Red = disconnected
3. **Browser caching:**
   - Recent changes saved in browser storage
   - Auto-syncs when reconnected
4. **No offline editing promises** - Focus on graceful reconnection

**Technical Implementation:**
- WebSocket for real-time collaboration
- Browser IndexedDB for temporary storage
- Automatic retry with exponential backoff
- Optimistic UI updates (show changes immediately, sync later)

**Key Takeaway for RiteMark:**
Even heavily collaborative tools accept limited offline support - focus on reliable sync when back online.

---

## 4. Toast Notification Patterns

### 4.1 UX Best Practices (2025)

#### Offline Toast:
- **Persistent** - Doesn't auto-dismiss
- **Low priority visual** - Info icon, not error
- **Actionable** - May include "View cached files" or "Retry"
- **Position** - Top-center or bottom-center (highly visible)
- **Message tone** - Reassuring, not alarming

```typescript
// ❌ BAD: Alarming error message
toast.error('Connection lost! You are offline!', { duration: 3000 });

// ✅ GOOD: Reassuring informational message
toast.info('Working offline. Your changes will sync when you reconnect.', {
  duration: Infinity, // Persistent
  icon: '📡',
  action: {
    label: 'Dismiss',
    onClick: () => toast.dismiss(),
  },
});
```

#### Online Toast:
- **Auto-dismiss** - 2-3 seconds
- **Success style** - Green/checkmark
- **Brief message** - "Back online" or "Syncing changes..."
- **Optional action** - "View sync status"

```typescript
// ✅ GOOD: Brief success notification
toast.success('Back online. Syncing changes...', {
  duration: 3000,
  icon: '✅',
});
```

---

### 4.2 Recommended Libraries (2025)

#### Option 1: React Hot Toast (Recommended)

```bash
npm install react-hot-toast
```

**Pros:**
- Lightweight (< 5KB gzipped)
- Excellent TypeScript support
- Flexible positioning
- Accessible (keyboard navigation, ARIA labels)
- Promise-based API

```typescript
import toast, { Toaster } from 'react-hot-toast';

function App() {
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    if (!isOnline) {
      toast('Working offline. Changes will sync when you reconnect.', {
        id: 'offline-toast', // Prevent duplicates
        icon: '📡',
        duration: Infinity,
        position: 'top-center',
      });
    } else {
      toast.dismiss('offline-toast');
      toast.success('Back online!', {
        duration: 3000,
      });
    }
  }, [isOnline]);

  return (
    <>
      <Toaster />
      {/* Your app */}
    </>
  );
}
```

---

#### Option 2: React-Toastify

```bash
npm install react-toastify
```

**Pros:**
- Battle-tested (5M+ weekly downloads)
- Rich customization options
- Built-in accessibility (v11+ with `ariaLabel` props)
- Keyboard navigation (Alt+T focuses first toast)

```typescript
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    if (!isOnline) {
      toast.info('Working offline', {
        toastId: 'offline',
        autoClose: false,
        closeButton: true,
      });
    } else {
      toast.dismiss('offline');
      toast.success('Back online!', { autoClose: 3000 });
    }
  }, [isOnline]);

  return (
    <>
      <ToastContainer position="top-center" />
      {/* Your app */}
    </>
  );
}
```

---

#### Option 3: Sonner (Modern Alternative)

```bash
npm install sonner
```

**Pros:**
- Beautiful default styling
- Minimal setup
- Promise-based API
- Built-in loading states

```typescript
import { Toaster, toast } from 'sonner';

function App() {
  return (
    <>
      <Toaster position="top-center" />
      {/* Your app */}
    </>
  );
}

// Usage
toast.info('Working offline', { duration: Infinity });
toast.success('Back online!');
```

---

### 4.3 Recommended Pattern for RiteMark

```typescript
import { toast } from 'react-hot-toast';

export class NetworkToastManager {
  private static offlineToastId: string | null = null;

  static showOffline() {
    if (this.offlineToastId) return; // Already showing

    this.offlineToastId = toast(
      'Working offline. Your changes are saved locally and will sync when you reconnect.',
      {
        id: 'network-offline',
        icon: '📡',
        duration: Infinity,
        position: 'top-center',
        style: {
          background: '#FEF3C7', // Warm yellow
          color: '#92400E',
          border: '1px solid #FCD34D',
        },
      }
    );
  }

  static showOnline() {
    if (this.offlineToastId) {
      toast.dismiss(this.offlineToastId);
      this.offlineToastId = null;
    }

    toast.success('Back online. Syncing your changes...', {
      duration: 3000,
      position: 'top-center',
    });
  }

  static showSyncError(error: Error) {
    toast.error(`Sync failed: ${error.message}. Will retry automatically.`, {
      duration: 5000,
      action: {
        label: 'Retry now',
        onClick: () => {
          // Trigger manual sync
        },
      },
    });
  }

  static showSyncSuccess() {
    toast.success('All changes synced', {
      duration: 2000,
    });
  }
}
```

---

## 5. False Positive Handling Strategies

### 5.1 Two-Tier Detection System

```typescript
interface ConnectivityState {
  browserOnline: boolean; // navigator.onLine
  apiOnline: boolean;     // Verified via fetch
  lastVerified: Date;
}

function useTwoTierDetection() {
  const [state, setState] = useState<ConnectivityState>({
    browserOnline: navigator.onLine,
    apiOnline: false,
    lastVerified: new Date(0),
  });

  const verifyApiConnectivity = async () => {
    try {
      // ✅ BEST: Ping your own backend's health endpoint
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000), // 5s timeout
      });

      return response.ok;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const checkConnectivity = async () => {
      const apiOnline = await verifyApiConnectivity();

      setState({
        browserOnline: navigator.onLine,
        apiOnline,
        lastVerified: new Date(),
      });
    };

    // Initial check
    checkConnectivity();

    // Browser events (fast detection)
    const handleOnline = () => checkConnectivity();
    const handleOffline = () => {
      setState(prev => ({
        ...prev,
        browserOnline: false,
        apiOnline: false,
        lastVerified: new Date(),
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic verification (every 30s)
    const interval = setInterval(checkConnectivity, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return {
    // ✅ Only trust apiOnline for critical decisions
    isOnline: state.apiOnline,
    // Expose browser state for debugging
    debug: state,
  };
}
```

---

### 5.2 Drive API-Specific Detection

**Best Practice:** Detect offline state from actual Drive API failures, not generic connectivity checks.

```typescript
export class DriveConnectivityManager {
  private isOnline: boolean = true;
  private consecutiveFailures: number = 0;
  private readonly FAILURE_THRESHOLD = 3;

  async executeRequest<T>(request: () => Promise<T>): Promise<T> {
    try {
      const result = await request();

      // ✅ Success - reset failure counter
      this.consecutiveFailures = 0;

      if (!this.isOnline) {
        this.isOnline = true;
        NetworkToastManager.showOnline();
      }

      return result;
    } catch (error) {
      // Analyze error to determine if it's network-related
      if (this.isNetworkError(error)) {
        this.consecutiveFailures++;

        if (this.consecutiveFailures >= this.FAILURE_THRESHOLD) {
          if (this.isOnline) {
            this.isOnline = false;
            NetworkToastManager.showOffline();
          }
        }
      }

      throw error;
    }
  }

  private isNetworkError(error: any): boolean {
    // Drive API network error patterns
    return (
      error.message?.includes('Failed to fetch') ||
      error.message?.includes('Network request failed') ||
      error.code === 'NETWORK_ERROR' ||
      error.status === 0 || // CORS/network failure
      error.name === 'AbortError' // Timeout
    );
  }

  getStatus() {
    return {
      isOnline: this.isOnline,
      consecutiveFailures: this.consecutiveFailures,
    };
  }
}
```

**Usage:**

```typescript
const driveManager = new DriveConnectivityManager();

// All Drive API calls go through this wrapper
async function saveFile(file: File) {
  return driveManager.executeRequest(async () => {
    return await gapi.client.drive.files.create({
      resource: { name: file.name },
      media: { body: file },
    });
  });
}
```

**Why This Works:**
1. **Real connectivity** - Tests actual Drive API, not generic endpoints
2. **No false positives** - If Drive fails, you're offline for Drive (even if browser says online)
3. **Handles lie-fi** - Slow/broken connections that timeout are detected
4. **Adaptive** - Multiple failures required to avoid flapping on transient errors

---

### 5.3 Exponential Backoff Retry Pattern

```typescript
export class ExponentialBackoff {
  private attempt: number = 0;
  private readonly maxAttempts: number;
  private readonly baseDelay: number;
  private readonly maxDelay: number;

  constructor(options: {
    maxAttempts?: number;
    baseDelay?: number; // milliseconds
    maxDelay?: number;
  } = {}) {
    this.maxAttempts = options.maxAttempts ?? 5;
    this.baseDelay = options.baseDelay ?? 1000; // 1 second
    this.maxDelay = options.maxDelay ?? 60000; // 1 minute
  }

  async execute<T>(
    operation: () => Promise<T>,
    onRetry?: (attempt: number, delay: number) => void
  ): Promise<T> {
    while (this.attempt < this.maxAttempts) {
      try {
        const result = await operation();
        this.attempt = 0; // Reset on success
        return result;
      } catch (error) {
        this.attempt++;

        if (this.attempt >= this.maxAttempts) {
          throw new Error(`Failed after ${this.maxAttempts} attempts: ${error}`);
        }

        // Calculate delay with exponential backoff + jitter
        const exponentialDelay = Math.min(
          this.baseDelay * Math.pow(2, this.attempt - 1),
          this.maxDelay
        );

        // Add jitter (randomness) to prevent thundering herd
        const jitter = Math.random() * 0.3 * exponentialDelay;
        const delay = exponentialDelay + jitter;

        onRetry?.(this.attempt, delay);

        await this.sleep(delay);
      }
    }

    throw new Error('Retry exhausted');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  reset() {
    this.attempt = 0;
  }
}
```

**Usage with Drive API:**

```typescript
const backoff = new ExponentialBackoff({
  maxAttempts: 5,
  baseDelay: 1000,
  maxDelay: 30000,
});

async function saveToDrive(content: string) {
  return backoff.execute(
    async () => {
      return await gapi.client.drive.files.update({
        fileId: 'abc123',
        resource: { name: 'document.md' },
        media: { body: content },
      });
    },
    (attempt, delay) => {
      console.log(`Retry attempt ${attempt}, waiting ${delay}ms`);
      toast.info(`Retrying in ${Math.round(delay / 1000)}s...`, {
        duration: delay,
      });
    }
  );
}
```

**Retry Schedule Example:**
1. Attempt 1: Immediate
2. Attempt 2: ~1s delay
3. Attempt 3: ~2s delay
4. Attempt 4: ~4s delay
5. Attempt 5: ~8s delay

Total time before giving up: ~15 seconds

---

## 6. Browser Compatibility Matrix

| Feature | Chrome/Edge | Firefox | Safari | Mobile |
|---------|-------------|---------|--------|--------|
| `navigator.onLine` | ⚠️ Unreliable | ⚠️ Desktop broken | ⚠️ Unreliable | ✅ Works |
| `online`/`offline` events | ✅ Works | ⚠️ Desktop broken | ✅ Works | ✅ Works |
| Network Information API | ✅ Full support | ❌ No support | ❌ No support | ⚠️ Chromium only |
| Service Worker | ✅ Full support | ✅ Full support | ✅ Full support | ✅ Full support |
| `fetch()` with timeout | ✅ Full support | ✅ Full support | ✅ Full support | ✅ Full support |

### Recommended Cross-Browser Strategy:

```typescript
export function useReliableNetworkStatus() {
  // 1. Use fetch() for actual connectivity testing (works everywhere)
  // 2. Listen to browser events as a hint, but verify with fetch
  // 3. Ignore Network Information API (Chromium-only)
  // 4. Use Service Worker for offline caching (universal support)

  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const verify = async () => {
      try {
        await fetch('/api/health', {
          method: 'HEAD',
          cache: 'no-cache',
          signal: AbortSignal.timeout(5000),
        });
        setIsOnline(true);
      } catch {
        setIsOnline(false);
      }
    };

    // Initial check
    verify();

    // Browser events as hints (fast detection)
    window.addEventListener('online', verify);
    window.addEventListener('offline', () => setIsOnline(false));

    // Periodic verification
    const interval = setInterval(verify, 30000);

    return () => {
      window.removeEventListener('online', verify);
      window.removeEventListener('offline', () => setIsOnline(false));
      clearInterval(interval);
    };
  }, []);

  return isOnline;
}
```

---

## 7. Recommended Implementation for RiteMark

### 7.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     React Components                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ DriveEditor  │  │ FileMenu     │  │ StatusBar    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                  ┌─────────▼──────────┐                     │
│                  │ useNetworkStatus() │                     │
│                  │   Custom Hook      │                     │
│                  └─────────┬──────────┘                     │
│                            │                                 │
│         ┌──────────────────┼──────────────────┐             │
│         │                  │                  │             │
│  ┌──────▼─────────┐ ┌──────▼────────┐ ┌──────▼────────┐   │
│  │ Browser Events │ │ Fetch Verify  │ │ Drive API     │   │
│  │ (online/off)   │ │ (/api/health) │ │ Error Handler │   │
│  └────────────────┘ └───────────────┘ └───────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────▼───────────┐
                │  NetworkToastManager  │
                │  - showOffline()      │
                │  - showOnline()       │
                │  - showSyncError()    │
                └───────────────────────┘
```

---

### 7.2 Core Hook Implementation

**File:** `/src/hooks/useNetworkStatus.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  isVerified: boolean;
  lastChecked: Date | null;
  consecutiveFailures: number;
}

const HEALTH_ENDPOINT = '/api/health';
const VERIFICATION_INTERVAL = 30000; // 30 seconds
const FAILURE_THRESHOLD = 3;

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isVerified: false,
    lastChecked: null,
    consecutiveFailures: 0,
  });

  const verifyConnectivity = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(HEALTH_ENDPOINT, {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        setStatus({
          isOnline: true,
          isVerified: true,
          lastChecked: new Date(),
          consecutiveFailures: 0,
        });
        return true;
      }

      throw new Error('Health check failed');
    } catch (error) {
      setStatus(prev => ({
        isOnline: false,
        isVerified: true,
        lastChecked: new Date(),
        consecutiveFailures: prev.consecutiveFailures + 1,
      }));
      return false;
    }
  }, []);

  useEffect(() => {
    // Initial verification
    verifyConnectivity();

    // Browser event listeners
    const handleOnline = () => {
      console.log('Browser detected online');
      verifyConnectivity();
    };

    const handleOffline = () => {
      console.log('Browser detected offline');
      setStatus(prev => ({
        ...prev,
        isOnline: false,
        isVerified: true,
        lastChecked: new Date(),
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic verification
    const interval = setInterval(verifyConnectivity, VERIFICATION_INTERVAL);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [verifyConnectivity]);

  return status;
}
```

---

### 7.3 Toast Manager

**File:** `/src/services/NetworkToastManager.ts`

```typescript
import { toast } from 'react-hot-toast';

export class NetworkToastManager {
  private static offlineToastId: string | null = null;
  private static lastState: 'online' | 'offline' | null = null;

  static showOffline() {
    if (this.lastState === 'offline') return;

    if (this.offlineToastId) {
      toast.dismiss(this.offlineToastId);
    }

    this.offlineToastId = toast(
      'Working offline. Your changes are saved locally and will sync when you reconnect.',
      {
        id: 'network-offline',
        icon: '📡',
        duration: Infinity,
        position: 'top-center',
        style: {
          background: '#FEF3C7',
          color: '#92400E',
          border: '1px solid #FCD34D',
          borderRadius: '8px',
          padding: '12px 16px',
        },
      }
    );

    this.lastState = 'offline';
  }

  static showOnline() {
    if (this.offlineToastId) {
      toast.dismiss(this.offlineToastId);
      this.offlineToastId = null;
    }

    if (this.lastState === 'online') return;

    toast.success('Back online. Syncing your changes...', {
      duration: 3000,
      position: 'top-center',
    });

    this.lastState = 'online';
  }

  static showSyncError(errorMessage: string) {
    toast.error(`Sync failed: ${errorMessage}. Will retry automatically.`, {
      duration: 5000,
      position: 'top-center',
    });
  }

  static showSyncSuccess() {
    toast.success('All changes synced successfully', {
      duration: 2000,
      position: 'top-center',
    });
  }

  static reset() {
    if (this.offlineToastId) {
      toast.dismiss(this.offlineToastId);
      this.offlineToastId = null;
    }
    this.lastState = null;
  }
}
```

---

### 7.4 Integration with Drive API

**File:** `/src/services/DriveConnectivityWrapper.ts`

```typescript
import { NetworkToastManager } from './NetworkToastManager';
import { ExponentialBackoff } from './ExponentialBackoff';

export class DriveConnectivityWrapper {
  private isOnline: boolean = true;
  private consecutiveFailures: number = 0;
  private readonly FAILURE_THRESHOLD = 3;
  private backoff: ExponentialBackoff;

  constructor() {
    this.backoff = new ExponentialBackoff({
      maxAttempts: 5,
      baseDelay: 1000,
      maxDelay: 30000,
    });
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string = 'Drive API operation'
  ): Promise<T> {
    return this.backoff.execute(
      async () => {
        try {
          const result = await operation();

          // Success - reset failure counter
          this.consecutiveFailures = 0;

          if (!this.isOnline) {
            this.isOnline = true;
            NetworkToastManager.showOnline();
          }

          return result;
        } catch (error) {
          if (this.isNetworkError(error)) {
            this.consecutiveFailures++;

            if (this.consecutiveFailures >= this.FAILURE_THRESHOLD) {
              if (this.isOnline) {
                this.isOnline = false;
                NetworkToastManager.showOffline();
              }
            }
          }

          throw error;
        }
      },
      (attempt, delay) => {
        console.log(`[${operationName}] Retry attempt ${attempt}, waiting ${delay}ms`);
      }
    );
  }

  private isNetworkError(error: any): boolean {
    const networkErrorPatterns = [
      'Failed to fetch',
      'Network request failed',
      'NetworkError',
      'net::ERR_',
    ];

    const errorMessage = error?.message?.toLowerCase() || '';
    const isPatternMatch = networkErrorPatterns.some(pattern =>
      errorMessage.includes(pattern.toLowerCase())
    );

    return (
      isPatternMatch ||
      error?.status === 0 ||
      error?.name === 'AbortError' ||
      error?.code === 'NETWORK_ERROR'
    );
  }

  getStatus() {
    return {
      isOnline: this.isOnline,
      consecutiveFailures: this.consecutiveFailures,
    };
  }

  reset() {
    this.consecutiveFailures = 0;
    this.isOnline = true;
    this.backoff.reset();
  }
}
```

---

### 7.5 Usage in Components

**File:** `/src/components/DriveEditor.tsx`

```typescript
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { NetworkToastManager } from '@/services/NetworkToastManager';
import { useEffect } from 'react';

export function DriveEditor() {
  const { isOnline, isVerified } = useNetworkStatus();

  useEffect(() => {
    if (!isVerified) return;

    if (isOnline) {
      NetworkToastManager.showOnline();
    } else {
      NetworkToastManager.showOffline();
    }
  }, [isOnline, isVerified]);

  return (
    <div className="editor-container">
      {/* Status indicator in toolbar/statusbar */}
      <div className="status-bar">
        {isOnline ? (
          <span className="status-online">
            ✅ Connected
          </span>
        ) : (
          <span className="status-offline">
            📡 Offline
          </span>
        )}
      </div>

      {/* Editor component */}
      <EditorContent />
    </div>
  );
}
```

---

## 8. Summary & Recommendations

### ✅ DO:

1. **Use `fetch()` for actual connectivity verification** - Only real network attempts are reliable
2. **Implement exponential backoff with jitter** - Google Cloud's recommended retry strategy
3. **Detect offline from Drive API failures** - App-specific detection is more accurate than generic checks
4. **Show persistent toast when offline** - Reassure users their data is safe locally
5. **Auto-dismiss online toast** - Brief confirmation when reconnected
6. **Use Service Workers for offline caching** - Universal browser support, best offline experience

### ❌ DON'T:

1. **Trust `navigator.onLine` alone** - Too many false positives (LAN without internet)
2. **Use Network Information API as requirement** - Chromium-only, no Firefox/Safari support
3. **Ignore browser events entirely** - Useful as hints for fast offline detection
4. **Show alarming error messages for offline** - Use reassuring "working offline" language
5. **Poll too frequently** - 30-second intervals are sufficient, avoid battery drain
6. **Forget exponential backoff** - Prevents overwhelming server during reconnection

### 🎯 Recommended Stack for RiteMark:

- **Hook:** Custom `useNetworkStatus()` with fetch verification
- **Toast Library:** React Hot Toast (lightweight, accessible)
- **Retry Strategy:** Exponential backoff with 5 attempts, 1s-30s delays
- **Detection Method:** Drive API error monitoring + periodic health checks
- **Offline Caching:** Service Worker (future enhancement)

---

## 9. Next Steps

1. **Implement `useNetworkStatus` hook** with fetch verification
2. **Install React Hot Toast** and create `NetworkToastManager`
3. **Wrap Drive API calls** with `DriveConnectivityWrapper`
4. **Add health endpoint** (`/api/health`) to backend
5. **Test edge cases:**
   - Airplane mode
   - Slow/broken connections (lie-fi)
   - VPN interference
   - Browser-specific quirks
6. **Monitor metrics:**
   - False positive rate
   - Time to detect offline
   - Retry success rate
7. **Future enhancement:** Service Worker for true offline editing

---

## 10. References

- [MDN: Navigator.onLine](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine)
- [MDN: Network Information API](https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API)
- [MDN: Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Google Cloud: Retry Strategy](https://cloud.google.com/storage/docs/retry-strategy)
- [React Hot Toast Documentation](https://react-hot-toast.com/)
- [React-Toastify v11 Release](https://github.com/fkhadra/react-toastify/releases)
- [Google Design: Offline UX Patterns](https://design.google/library/offline-design)

---

**Research Completed:** October 21, 2025
**Researcher:** Research Agent (Claude Flow)
**Next Action:** Implement recommended patterns in Sprint 15
