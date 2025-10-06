# Sprint 8: Google Drive API Integration

**Sprint Duration:** 14-15 days
**Sprint Goal:** Connect RiteMark to Google Drive for cloud file operations
**Sprint Output:** 1 PR with Drive API client and file operations (Picker API + custom mobile browser)
**Success Criteria:** Desktop users can open ANY Drive markdown file; Mobile users can work with app-created files
**GPT-5 Review:** Issues addressed - Picker API added, network detection descoped, re-auth prompt included

---

## 🎯 Sprint Vision & User Impact

### From Sprint 7 OAuth Foundation to Sprint 8 Drive Integration

**Sprint 7 Achievement:** Single-popup OAuth flow with `drive.file` scope ✅
- Combined `openid email profile https://www.googleapis.com/auth/drive.file` in one consent
- User authenticated with Drive access ready
- Bundle size: 741KB → 590KB (20% smaller)
- UX: 3 clicks → 2 clicks, 2 popups → 1 popup

**Sprint 8 Goal:** Transform OAuth foundation into working Drive file operations
- **Desktop users**: Open ANY markdown file via Google Picker API (solves `drive.file` scope limitation)
- **Mobile users**: Work with app-created files via custom mobile browser
- Users create new markdown files directly in Google Drive (implicit creation on first edit)
- Auto-save writes changes back to Drive seamlessly (fixed 3s debounce, no network detection)
- Token expiry handled gracefully with in-session re-auth prompt (no silent failures)
- Mobile-first PWA architecture for iOS Safari compatibility

### Invisible Interface Philosophy Alignment

**"Google Docs for Markdown"** - Sprint 8 delivers on this vision by making Drive integration feel native and invisible. Users never think about "API calls" or "authentication scopes" - they just save, load, and collaborate on markdown files like they would in Google Docs.

**Johnny Ive Design Principle:** Drive integration should be so seamless that users forget files are in the cloud. Auto-save happens invisibly. File browser appears only when needed. No technical jargon in UI.

---

## 📊 Research Findings Summary

**8-agent research swarm completed comprehensive analysis:**

### Technical Research (Drive API v3)
- **REST API approach recommended** over googleapis npm package (smaller bundle, browser-native)
- **Rate limit**: 1000 requests per 100 seconds per user (aggressive debouncing required)
- **Exponential backoff mandatory** for 403/429 errors (not optional)
- **`drive.file` scope sufficient** - Only access files created/opened by RiteMark
- **OAuth already complete** from Sprint 7 (access token ready in tokenManager.ts)

### UX Research (File Management for Non-Technical Users)
- **Google Picker API desktop-only** - Use Picker for desktop (≥768px), custom browser for mobile
- **Picker solves `drive.file` scope** - User explicitly selects file, grants access to that file
- **Implicit file creation preferred** - New document auto-creates on first edit
- **Fixed 3s auto-save debounce** - No network detection (descoped per user request)
- **Search-first pattern** - Search bar more important than folder navigation
- **No "Save As" complexity** - File rename instead of duplicate workflows

### Security Research (2025 Best Practices)
- **CSP headers mandatory** - `*.googleapis.com` must be in Content-Security-Policy
- **XSS prevention required** - Sanitize all filenames and metadata from Drive API
- **Token expiry handling required** - In-session re-auth prompt for 401 errors (no silent failures)
- **Token refresh deferred** - Full OAuth refresh implementation in Sprint 9
- **CORS handled by Drive API v3** - No proxy needed for browser apps
- **Rate limiting strategy** - Exponential backoff: 2^retries * 1000ms + jitter

### Mobile Research (iOS Safari + PWA)
- **PWA architecture recommended** over native wrapper (Capacitor/React Native)
- **iOS Safari OAuth restrictions** - Already solved in Sprint 7 with redirect flow ✅
- **Google Picker desktop-only** - Use Picker (≥768px), custom mobile browser (<768px)
- **Background sync limitations** - iOS Safari lacks full service worker support, use IndexedDB + visibilitychange
- **Network detection descoped** - iOS Safari lacks Network Information API, use fixed 3s debounce instead

### Key Architectural Decisions

1. **Use browser-native `fetch()` for Drive API** - No googleapis package overhead
2. **Responsive file browser strategy**:
   - Desktop (≥768px): Google Picker API (opens ANY Drive file)
   - Mobile (<768px): Custom browser (app-created files only)
3. **Implement IndexedDB offline cache** - Survive iOS Safari backgrounding
4. **Fixed 3s auto-save debounce** - No network detection (iOS Safari limitation)
5. **In-session re-auth prompt** - Handle 401 token expiry gracefully (no silent failures)
6. **Service layer architecture** - DriveClient, AutoSaveManager, FileCache, PickerManager separation

---

## 🏗️ Architecture Overview

### Current State (Sprint 7 Complete)

```typescript
// ✅ OAuth Complete - tokenManager.ts
async getAccessToken(): Promise<string | null> {
  const tokens = sessionStorage.getItem('ritemark_oauth_tokens')
  // Check expiry, return valid token or trigger refresh
}

// ⚠️ Token Refresh NOT Implemented
async refreshAccessToken(): Promise<TokenRefreshResult> {
  console.warn('Token refresh not yet implemented, user must re-authenticate')
  return { success: false, error: AUTH_ERRORS.REFRESH_FAILED }
}

// ✅ Drive Scope Included in OAuth
scope: 'openid email profile https://www.googleapis.com/auth/drive.file'
```

**Gap Analysis:**
- ❌ No Drive API service layer
- ❌ No auto-save mechanism
- ❌ No file browser UI (need both Picker API + custom mobile browser)
- ❌ No file metadata tracking (fileId, lastModified, syncStatus)
- ❌ No offline queue for failed saves
- ❌ No token expiry handling (401 errors cause silent save failures)

### Target State (Sprint 8 Complete)

```
src/
├── services/
│   └── drive/
│       ├── driveClient.ts          # NEW - REST API wrapper with re-auth handling
│       ├── autoSaveManager.ts      # NEW - Fixed 3s debounce (no network detection)
│       ├── fileCache.ts            # NEW - IndexedDB offline cache
│       └── pickerManager.ts        # NEW - Google Picker API wrapper (desktop)
├── hooks/
│   ├── useDriveSync.ts             # NEW - Auto-save hook
│   ├── useDriveFiles.ts            # NEW - File list management
│   └── usePicker.ts                # NEW - Google Picker hook (desktop)
├── components/
│   └── drive/
│       ├── DriveFileBrowser.tsx    # NEW - Custom mobile file list (<768px)
│       ├── DriveFilePicker.tsx     # NEW - Responsive wrapper (Picker vs custom)
│       ├── SaveStatus.tsx          # NEW - "Saving..." indicator
│       └── FileMetadata.tsx        # NEW - File info display
├── types/
│   └── drive.ts                    # NEW - Drive API types + Picker types
└── App.tsx                         # MODIFIED - Add Drive state + re-auth handling
```

---

## 🚀 Sprint 8 Implementation Phases

### Phase 1: Drive API Service Layer (Days 1-3)

**Goal:** Create REST API client for Drive operations with error handling

#### Day 1: Type Definitions & Core Client
**Files to Create:**
- `/src/types/drive.ts` - Drive API types

```typescript
export interface DriveFile {
  id: string
  name: string
  mimeType: string
  modifiedTime: string
  createdTime: string
  size?: string
  parents?: string[]
  webViewLink?: string
}

export interface DriveSyncStatus {
  status: 'synced' | 'saving' | 'offline' | 'error'
  lastSaved: Date | null
  error?: DriveError
}

export interface DriveError {
  code: string
  message: string
  status: number
  retryable: boolean
}

export const DRIVE_ERRORS = {
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  RATE_LIMIT: 'RATE_LIMIT',
  NETWORK_ERROR: 'NETWORK_ERROR',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const
```

- `/src/services/drive/driveClient.ts` - REST API wrapper

```typescript
import { tokenManager } from '../auth/tokenManager'
import type { DriveFile, DriveError } from '../../types/drive'

export class DriveClient {
  private readonly API_BASE = 'https://www.googleapis.com/drive/v3'
  private readonly UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3'

  // Core CRUD operations
  async createFile(name: string, content: string): Promise<DriveFile> {
    const token = await tokenManager.getAccessToken()
    if (!token) throw new Error('Not authenticated')

    // Multipart upload for file + metadata
    const metadata = { name, mimeType: 'text/markdown' }
    const boundary = '-------314159265358979323846'
    const body = [
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      JSON.stringify(metadata),
      `--${boundary}`,
      'Content-Type: text/markdown',
      '',
      content,
      `--${boundary}--`
    ].join('\r\n')

    const response = await this.retryWithBackoff(() =>
      fetch(`${this.UPLOAD_BASE}/files?uploadType=multipart`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body
      })
    )

    if (!response.ok) throw await this.handleApiError(response)
    return await response.json()
  }

  async updateFile(fileId: string, content: string): Promise<DriveFile> {
    const token = await tokenManager.getAccessToken()
    if (!token) throw new Error('Not authenticated')

    const response = await this.retryWithBackoff(() =>
      fetch(`${this.UPLOAD_BASE}/files/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'text/markdown'
        },
        body: content
      })
    )

    if (!response.ok) throw await this.handleApiError(response)
    return await response.json()
  }

  async getFile(fileId: string): Promise<{ metadata: DriveFile; content: string }> {
    const token = await tokenManager.getAccessToken()
    if (!token) throw new Error('Not authenticated')

    // Fetch metadata
    const metaResponse = await fetch(
      `${this.API_BASE}/files/${fileId}?fields=id,name,mimeType,modifiedTime,createdTime`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    )
    if (!metaResponse.ok) throw await this.handleApiError(metaResponse)
    const metadata = await metaResponse.json()

    // Fetch content
    const contentResponse = await fetch(
      `${this.API_BASE}/files/${fileId}?alt=media`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    )
    if (!contentResponse.ok) throw await this.handleApiError(contentResponse)
    const content = await contentResponse.text()

    return { metadata, content }
  }

  async listFiles(query?: string): Promise<DriveFile[]> {
    const token = await tokenManager.getAccessToken()
    if (!token) throw new Error('Not authenticated')

    const q = query || "mimeType='text/markdown' or mimeType='text/plain'"
    const params = new URLSearchParams({
      q,
      fields: 'files(id,name,mimeType,modifiedTime,createdTime)',
      orderBy: 'modifiedTime desc',
      pageSize: '100'
    })

    const response = await fetch(`${this.API_BASE}/files?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (!response.ok) throw await this.handleApiError(response)
    const data = await response.json()
    return data.files || []
  }

  async deleteFile(fileId: string): Promise<void> {
    const token = await tokenManager.getAccessToken()
    if (!token) throw new Error('Not authenticated')

    const response = await fetch(`${this.API_BASE}/files/${fileId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (!response.ok && response.status !== 404) {
      throw await this.handleApiError(response)
    }
  }

  // Error handling with exponential backoff
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries = 5
  ): Promise<T> {
    let retries = 0

    while (retries < maxRetries) {
      try {
        return await operation()
      } catch (error) {
        const status = (error as any).status
        if ((status === 403 || status === 429) && retries < maxRetries) {
          // Exponential backoff: 2^retries * 1000ms + jitter
          const delay = Math.pow(2, retries) * 1000 + Math.random() * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
          retries++
        } else {
          throw error
        }
      }
    }

    throw new Error('Max retries exceeded')
  }

  private async handleApiError(response: Response): Promise<DriveError> {
    const body = await response.json().catch(() => ({}))
    return {
      code: body.error?.code || 'UNKNOWN_ERROR',
      message: body.error?.message || 'Unknown error occurred',
      status: response.status,
      retryable: [403, 429, 500, 502, 503, 504].includes(response.status)
    }
  }
}

export const driveClient = new DriveClient()
```

#### Day 2-3: Auto-Save Manager & Offline Cache

**Files to Create:**
- `/src/services/drive/autoSaveManager.ts`

```typescript
export class AutoSaveManager {
  private saveTimer: NodeJS.Timeout | null = null
  private pendingContent: string | null = null
  private isSaving = false

  constructor(
    private fileId: string | null,
    private onSave: (content: string) => Promise<void>,
    private debounceMs = 3000
  ) {}

  scheduleSave(content: string): void {
    this.pendingContent = content

    if (this.saveTimer) {
      clearTimeout(this.saveTimer)
    }

    this.saveTimer = setTimeout(() => {
      this.executeSave()
    }, this.debounceMs)
  }

  async executeSave(): Promise<void> {
    if (this.isSaving || !this.pendingContent) return

    this.isSaving = true
    const contentToSave = this.pendingContent
    this.pendingContent = null

    try {
      await this.onSave(contentToSave)
    } finally {
      this.isSaving = false

      // If content changed during save, schedule another
      if (this.pendingContent) {
        this.scheduleSave(this.pendingContent)
      }
    }
  }

  async forceSave(): Promise<void> {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer)
      this.saveTimer = null
    }
    await this.executeSave()
  }

  destroy(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer)
    }
  }
}
```

- `/src/services/drive/fileCache.ts` - IndexedDB wrapper

```typescript
export class FileCache {
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('RiteMarkCache', 1)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files', { keyPath: 'fileId' })
        }
      }
    })
  }

  async cacheFile(fileId: string, content: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['files'], 'readwrite')
      const store = transaction.objectStore('files')
      const request = store.put({
        fileId,
        content,
        timestamp: Date.now(),
        synced: false
      })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getCachedFile(fileId: string): Promise<string | null> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['files'], 'readonly')
      const store = transaction.objectStore('files')
      const request = store.get(fileId)

      request.onsuccess = () => {
        const result = request.result
        resolve(result ? result.content : null)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async getPendingSyncs(): Promise<Array<{ fileId: string; content: string }>> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['files'], 'readonly')
      const store = transaction.objectStore('files')
      const request = store.getAll()

      request.onsuccess = () => {
        const pending = request.result.filter(item => !item.synced)
        resolve(pending.map(({ fileId, content }) => ({ fileId, content })))
      }
      request.onerror = () => reject(request.error)
    })
  }

  async markSynced(fileId: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['files'], 'readwrite')
      const store = transaction.objectStore('files')
      const request = store.get(fileId)

      request.onsuccess = () => {
        const data = request.result
        if (data) {
          data.synced = true
          store.put(data)
        }
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }
}

export const fileCache = new FileCache()
```

**Testing Requirements (Day 3):**
- Unit tests for DriveClient with mocked fetch
- Error handling tests (401, 403, 429, 500)
- Exponential backoff verification
- IndexedDB cache persistence tests

**Testing Requirements (Day 3):**
- Unit tests for DriveClient with mocked fetch
- Error handling tests (401, 403, 429, 500)
- Exponential backoff verification
- IndexedDB cache persistence tests
- **Re-auth prompt test** - Verify 401 shows user-friendly prompt

---

### Phase 2: React Hooks + Google Picker API (Days 4-7)

**Goal:** Create React hooks for Drive operations with auto-save + add Picker API for desktop

#### NEW: Day 4 - Google Picker API Integration

**Files to Create:**
- `/src/services/drive/pickerManager.ts` - Google Picker wrapper

```typescript
export class PickerManager {
  private pickerApiLoaded = false
  private oauthToken: string | null = null

  async initialize(clientId: string, oauthToken: string): Promise<void> {
    this.oauthToken = oauthToken

    // Load Google Picker API
    await new Promise((resolve) => {
      gapi.load('picker', { callback: resolve })
    })

    this.pickerApiLoaded = true
  }

  async showPicker(onFileSelect: (fileId: string) => void): Promise<void> {
    if (!this.pickerApiLoaded || !this.oauthToken) {
      throw new Error('Picker not initialized')
    }

    const picker = new google.picker.PickerBuilder()
      .addView(
        new google.picker.DocsView(google.picker.ViewId.DOCS)
          .setMimeTypes('text/markdown,text/plain')
          .setMode(google.picker.DocsViewMode.LIST)
      )
      .setOAuthToken(this.oauthToken)
      .setCallback((data) => {
        if (data.action === google.picker.Action.PICKED) {
          const fileId = data.docs[0].id
          onFileSelect(fileId)
        }
      })
      .build()

    picker.setVisible(true)
  }
}

export const pickerManager = new PickerManager()
```

- `/src/hooks/usePicker.ts` - React hook for Picker

```typescript
import { useState, useEffect } from 'react'
import { pickerManager } from '../services/drive/pickerManager'
import { tokenManager } from '../services/auth/tokenManager'

export function usePicker() {
  const [isPickerReady, setIsPickerReady] = useState(false)

  useEffect(() => {
    const initPicker = async () => {
      const token = await tokenManager.getAccessToken()
      if (!token) return

      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
      await pickerManager.initialize(clientId, token)
      setIsPickerReady(true)
    }

    initPicker()
  }, [])

  const showPicker = (onFileSelect: (fileId: string) => void) => {
    if (!isPickerReady) {
      console.warn('Picker not ready')
      return
    }
    pickerManager.showPicker(onFileSelect)
  }

  return { isPickerReady, showPicker }
}
```

---

### Phase 2 Continued: React Hooks Integration (Days 5-7)

**Goal:** Create React hooks for Drive operations with auto-save

#### Day 5: useDriveSync Hook

**Files to Create:**
- `/src/hooks/useDriveSync.ts`

```typescript
import { useState, useEffect, useCallback, useRef } from 'react'
import { driveClient } from '../services/drive/driveClient'
import { AutoSaveManager } from '../services/drive/autoSaveManager'
import { fileCache } from '../services/drive/fileCache'
import type { DriveSyncStatus } from '../types/drive'

export function useDriveSync(
  fileId: string | null,
  title: string,
  content: string
) {
  const [syncStatus, setSyncStatus] = useState<DriveSyncStatus>({
    status: 'synced',
    lastSaved: null
  })

  const autoSaveManager = useRef<AutoSaveManager | null>(null)

  // Initialize auto-save manager
  useEffect(() => {
    const saveFunction = async (content: string) => {
      setSyncStatus({ status: 'saving', lastSaved: null })

      try {
        // Cache locally first (instant)
        if (fileId) {
          await fileCache.cacheFile(fileId, content)
        }

        // Then sync to Drive
        if (fileId) {
          await driveClient.updateFile(fileId, content)
          await fileCache.markSynced(fileId)
        } else {
          // No fileId yet, create new file
          const newFile = await driveClient.createFile(title || 'Untitled', content)
          // Update parent component with new fileId (via callback)
          onFileCreated?.(newFile.id)
        }

        setSyncStatus({ status: 'synced', lastSaved: new Date() })
      } catch (error) {
        console.error('Save failed:', error)
        setSyncStatus({
          status: 'error',
          lastSaved: null,
          error: error as any
        })
      }
    }

    autoSaveManager.current = new AutoSaveManager(fileId, saveFunction, 3000)

    return () => {
      autoSaveManager.current?.destroy()
    }
  }, [fileId])

  // Trigger auto-save on content change
  useEffect(() => {
    if (content && autoSaveManager.current) {
      autoSaveManager.current.scheduleSave(content)
    }
  }, [content])

  // Force save on visibility change (app backgrounding)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && autoSaveManager.current) {
        autoSaveManager.current.forceSave()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const loadFile = useCallback(async (fileId: string) => {
    setSyncStatus({ status: 'saving', lastSaved: null }) // Reusing 'saving' for loading

    try {
      const { metadata, content } = await driveClient.getFile(fileId)
      return { metadata, content }
    } catch (error) {
      console.error('Load failed:', error)
      throw error
    }
  }, [])

  return {
    syncStatus,
    loadFile,
    forceSave: () => autoSaveManager.current?.forceSave()
  }
}
```

#### Day 6-7: useDriveFiles Hook & Responsive File Browser Component

**Files to Create:**
- `/src/hooks/useDriveFiles.ts`

```typescript
export function useDriveFiles() {
  const [files, setFiles] = useState<DriveFile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<DriveError | null>(null)

  const refreshFileList = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const fileList = await driveClient.listFiles()
      setFiles(fileList)
    } catch (err) {
      setError(err as DriveError)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshFileList()
  }, [refreshFileList])

  return { files, isLoading, error, refreshFileList }
}
```

- `/src/components/drive/DriveFileBrowser.tsx` - Custom mobile file list (app-created files only)

```typescript
interface DriveFileBrowserProps {
  onFileSelect: (fileId: string) => void
  onClose: () => void
}

export function DriveFileBrowser({ onFileSelect, onClose }: DriveFileBrowserProps) {
  const { files, isLoading, error, refreshFileList } = useDriveFiles()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="drive-file-browser">
      <div className="browser-header">
        <input
          type="search"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <button onClick={onClose}>Close</button>
      </div>

      {isLoading && <div className="loading">Loading files...</div>}
      {error && <div className="error">Error: {error.message}</div>}

      <div className="file-list">
        {filteredFiles.map(file => (
          <div
            key={file.id}
            className="file-card"
            onClick={() => onFileSelect(file.id)}
          >
            <div className="file-icon">📄</div>
            <div className="file-info">
              <div className="file-name">{file.name}</div>
              <div className="file-meta">
                Modified {new Date(file.modifiedTime).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={refreshFileList} className="refresh-btn">
        Refresh
      </button>
    </div>
  )
}
```

- `/src/components/drive/DriveFilePicker.tsx` - **NEW: Responsive wrapper**

```typescript
import { usePicker } from '../../hooks/usePicker'
import { DriveFileBrowser } from './DriveFileBrowser'

interface DriveFilePickerProps {
  onFileSelect: (fileId: string) => void
  onClose: () => void
}

export function DriveFilePicker({ onFileSelect, onClose }: DriveFilePickerProps) {
  const { isPickerReady, showPicker } = usePicker()
  const [showCustomBrowser, setShowCustomBrowser] = useState(false)

  // Detect viewport width
  const isDesktop = window.innerWidth >= 768

  const handleOpenFile = () => {
    if (isDesktop && isPickerReady) {
      // Desktop: Use Google Picker (opens ANY Drive file)
      showPicker(onFileSelect)
      onClose() // Close modal after picker shown
    } else {
      // Mobile: Use custom browser (app-created files only)
      setShowCustomBrowser(true)
    }
  }

  useEffect(() => {
    handleOpenFile()
  }, [])

  if (showCustomBrowser) {
    return (
      <DriveFileBrowser
        onFileSelect={(fileId) => {
          onFileSelect(fileId)
          setShowCustomBrowser(false)
          onClose()
        }}
        onClose={() => {
          setShowCustomBrowser(false)
          onClose()
        }}
      />
    )
  }

  return null // Picker or custom browser handles UI
}
```

---

### Phase 3: App Integration, UI & Re-Auth Handling (Days 8-10)

**Goal:** Integrate Drive sync into App.tsx with save status indicator + token expiry handling

#### Day 8: Re-Auth Prompt for Token Expiry (NEW - GPT-5 Issue #3 Fix)

**Problem:** Token expires after 1 hour, auto-save silently fails

**Solution:** Add in-session re-auth prompt in DriveClient error handling

**Files to Modify:**
- `/src/services/drive/driveClient.ts` - Add 401 handling

```typescript
// In DriveClient class, update handleApiError method:
private async handleApiError(response: Response): Promise<never> {
  const body = await response.json().catch(() => ({}))

  // Handle 401 token expiry with re-auth prompt
  if (response.status === 401) {
    const userWantsReAuth = confirm(
      'Your session expired. Click OK to sign in again and continue saving your work.'
    )

    if (userWantsReAuth) {
      // Save current URL to return after auth
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search)
      window.location.href = `/?reauth=true&return=${returnUrl}`
    } else {
      throw {
        code: 'TOKEN_EXPIRED',
        message: 'Session expired. Please sign in again to continue.',
        status: 401,
        retryable: false
      }
    }
  }

  // Handle other errors...
  throw {
    code: body.error?.code || 'UNKNOWN_ERROR',
    message: body.error?.message || 'Unknown error occurred',
    status: response.status,
    retryable: [403, 429, 500, 502, 503, 504].includes(response.status)
  }
}
```

**Testing Requirements:**
- Manually expire token (set expiresAt to past timestamp)
- Trigger auto-save
- Verify user sees re-auth prompt
- Verify re-auth flow preserves unsaved content

---

#### Day 9-10: App.tsx Integration

**Files to Modify:**
- `/src/App.tsx`

```typescript
import { useState } from 'react'
import { Editor } from './components/Editor'
import { TableOfContents } from './components/TableOfContents'
import { SettingsButton } from './components/SettingsButton'
import { AuthModal } from './components/auth/AuthModal'
import { SaveStatus } from './components/drive/SaveStatus'
import { DriveFileBrowser } from './components/drive/DriveFileBrowser'
import { useDriveSync } from './hooks/useDriveSync'

function AppContent() {
  // Existing state
  const [title, setTitle] = useState('Untitled Document')
  const [text, setText] = useState('')
  const [headings, setHeadings] = useState<Heading[]>([])

  // NEW: Drive state
  const [fileId, setFileId] = useState<string | null>(null)
  const [showFileBrowser, setShowFileBrowser] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)

  // NEW: Auto-save hook
  const { syncStatus, loadFile } = useDriveSync(fileId, title, text)

  // NEW: Handle file selection from browser
  const handleFileSelect = async (selectedFileId: string) => {
    try {
      const { metadata, content } = await loadFile(selectedFileId)
      setFileId(metadata.id)
      setTitle(metadata.name)
      setText(content)
      setShowFileBrowser(false)
    } catch (error) {
      console.error('Failed to load file:', error)
    }
  }

  return (
    <main className="app-container">
      {/* Header with save status and file actions */}
      <div className="app-header">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="document-title"
          placeholder="Untitled Document"
        />

        {/* NEW: Save status indicator */}
        <SaveStatus syncStatus={syncStatus} />

        {/* NEW: Open file button */}
        <button onClick={() => setShowFileBrowser(true)}>
          Open from Drive
        </button>

        <SettingsButton
          authState={/* determine from auth context */}
          onClick={() => setAuthModalOpen(true)}
        />
      </div>

      {/* Existing editor */}
      <div className="editor-container">
        <Editor value={text} onChange={setText} onHeadingsChange={setHeadings} />
        {headings.length > 0 && <TableOfContents headings={headings} />}
      </div>

      {/* NEW: File browser modal */}
      {showFileBrowser && (
        <DriveFileBrowser
          onFileSelect={handleFileSelect}
          onClose={() => setShowFileBrowser(false)}
        />
      )}

      {/* Existing auth modal */}
      {authModalOpen && (
        <AuthModal onClose={() => setAuthModalOpen(false)} />
      )}
    </main>
  )
}
```

#### Day 9: Save Status Component

**Files to Create:**
- `/src/components/drive/SaveStatus.tsx`

```typescript
interface SaveStatusProps {
  syncStatus: DriveSyncStatus
}

export function SaveStatus({ syncStatus }: SaveStatusProps) {
  const { status, lastSaved, error } = syncStatus

  if (status === 'saving') {
    return (
      <div className="save-status saving">
        <span className="spinner">⏳</span> Saving...
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="save-status error">
        <span className="icon">⚠️</span>
        Error: {error?.message || 'Failed to save'}
      </div>
    )
  }

  if (status === 'offline') {
    return (
      <div className="save-status offline">
        <span className="icon">📡</span> Offline - Changes saved locally
      </div>
    )
  }

  // status === 'synced'
  return (
    <div className="save-status synced">
      <span className="icon">✅</span>
      {lastSaved ? `Saved ${formatRelativeTime(lastSaved)}` : 'All changes saved'}
    </div>
  )
}

function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  return `${Math.floor(seconds / 3600)}h ago`
}
```

---

## ✅ Phase 3 COMPLETED - 2025-10-05

**Status:** All App.tsx integration completed successfully ✅

**Completed Implementation:**
1. ✅ **401 Re-Auth Prompt** - Implemented in `driveClient.ts:handleApiError()`
2. ✅ **App.tsx Integration** - Drive state management, file operations, UI components
3. ✅ **SaveStatus Component** - Real-time sync status indicator
4. ✅ **DriveFilePicker Component** - Responsive file selection (Picker for desktop, custom browser for mobile)
5. ✅ **TypeScript Compilation** - Zero errors with strict mode
6. ✅ **Development Server** - Running successfully on localhost:5173

**Files Created/Modified:**
- ✅ `/src/App.tsx` - Integrated Drive state, hooks, and UI components
- ✅ `/src/components/drive/DriveFilePicker.tsx` - Fixed hook import (`usePicker` not `useDrivePicker`)
- ✅ All Phase 1-2 files created by swarm agents (types, services, hooks, components)

**Testing Results:**
- ✅ TypeScript: `tsc --noEmit` passes with zero errors
- ✅ Dev server: Vite 7.1.5 running on port 5173
- ✅ HMR: Hot module replacement working correctly
- ⏳ Browser testing: Pending Phase 4 (manual testing in browser)

**Next Steps:** Phase 4 - Mobile optimization and comprehensive testing

---

### Phase 4: Mobile Optimization & Testing (Days 11-13)

**Goal:** Ensure mobile-first UX and comprehensive testing

#### Day 11: Mobile CSS & Touch Optimization

**Files to Modify:**
- `/src/index.css` - Add mobile styles for Drive components

```css
/* Drive File Browser - Mobile First */
.drive-file-browser {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: white;
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.browser-header {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  gap: 12px;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  font-size: 16px; /* Prevent iOS zoom */
  border: 1px solid #ccc;
  border-radius: 8px;
}

.file-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.file-card {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  min-height: 56px; /* Touch-friendly */
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s;
}

.file-card:active {
  background: #f5f5f5;
}

.file-icon {
  font-size: 32px;
  margin-right: 12px;
}

.file-info {
  flex: 1;
}

.file-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.file-meta {
  font-size: 14px;
  color: #666;
  margin-top: 2px;
}

/* Save Status Indicator */
.save-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
}

.save-status.saving {
  background: #fff3cd;
  color: #856404;
}

.save-status.synced {
  background: #d4edda;
  color: #155724;
}

.save-status.error {
  background: #f8d7da;
  color: #721c24;
}

.save-status.offline {
  background: #d1ecf1;
  color: #0c5460;
}

/* Tablet & Desktop */
@media (min-width: 768px) {
  .drive-file-browser {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 600px;
    height: 500px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
}
```

#### Day 12-13: Testing & Bug Fixes

**Testing Checklist:**
- [ ] OAuth flow still works after Drive integration ✅
- [ ] Create new file auto-saves on first edit
- [ ] **Desktop (≥768px): Google Picker opens ANY Drive markdown file** (NEW)
- [ ] **Mobile (<768px): Custom browser shows app-created files** (NEW)
- [ ] Auto-save triggers after **fixed 3s debounce** (no network detection)
- [ ] **Token expiry (401) shows re-auth prompt** (NEW - GPT-5 fix)
- [ ] **Re-auth preserves unsaved content** (NEW - GPT-5 fix)
- [ ] File browser displays all markdown files
- [ ] Search filters file list correctly
- [ ] Mobile UI works on iPhone SE (375px)
- [ ] Tablet UI works on iPad (768px)
- [ ] Desktop UI works at 1024px+ with Picker
- [ ] Offline mode caches to IndexedDB
- [ ] Network errors show user-friendly messages
- [ ] Rate limit (429) uses exponential backoff
- [ ] Background app sync works on iOS Safari
- [ ] TypeScript compiles with zero errors
- [ ] Linter passes with zero warnings

**Manual Testing Scenarios:**
1. **Happy Path**: Sign in → Create file → Edit → Auto-save → Close browser → Reopen → File loads
2. **Desktop Picker**: Sign in on desktop → Click "Open from Drive" → See Google Picker → Select ANY markdown file → File loads
3. **Mobile Custom Browser**: Sign in on mobile → Click "Open from Drive" → See custom list → Only app-created files shown
4. **Network Failure**: Disconnect WiFi → Edit → See offline status → Reconnect → Auto-sync
5. **Token Expiry (NEW)**: Wait 1 hour → Edit → See re-auth prompt → Click OK → Re-auth → Content preserved
6. **Rate Limiting**: Make 1000+ rapid edits → See graceful throttling
7. **Mobile Safari**: Test on iPhone → OAuth redirect → Custom file browser → Auto-save

---

### Phase 5: Documentation & Sprint Close (Days 14-15)

**Goal:** Document Sprint 8 achievements and prepare for Sprint 9

#### Day 14: Documentation

**Files to Create:**
- `/docs/drive-api-integration-guide.md` - Developer guide for Drive API usage
- `/docs/testing/drive-integration-tests.md` - Test plan and results
- Update `/docs/roadmap.md` - Mark Sprint 8 complete

**Documentation Requirements:**
- Drive API architecture diagram
- Auto-save flow diagram
- Error handling documentation
- Security best practices followed
- Mobile optimization notes

#### Day 15: Code Review & Merge

**Pre-Merge Checklist:**
- [ ] All tests passing (unit + integration)
- [ ] TypeScript compiles with zero errors
- [ ] Linter passes with zero warnings
- [ ] Mobile responsive on 375px, 768px, 1024px
- [ ] Drive API service layer complete
- [ ] Auto-save working with **fixed 3s debounce** (no network detection)
- [ ] **Google Picker API working on desktop** (≥768px)
- [ ] **Custom file browser working on mobile** (<768px)
- [ ] **Token expiry re-auth prompt implemented** (no silent failures)
- [ ] Offline mode working with IndexedDB
- [ ] Error handling comprehensive
- [ ] Documentation complete

**Git Commit:**
```bash
git add .
git commit -m "Sprint 8: Google Drive API Integration

MAJOR FEATURES:
✅ Drive API REST client with browser-native fetch
✅ Auto-save manager with fixed 3s debounce (no network detection)
✅ Google Picker API for desktop (opens ANY Drive file)
✅ Custom mobile browser for mobile (app-created files)
✅ Token expiry re-auth prompt (no silent save failures)
✅ IndexedDB offline cache
✅ Sync status indicator
✅ Exponential backoff for rate limiting

GPT-5 REVIEW FIXES:
✅ Issue #1: Added Google Picker API for desktop (drive.file scope works correctly)
✅ Issue #2: Descoped network-aware throttling (iOS Safari limitation)
✅ Issue #3: Added in-session re-auth prompt for token expiry (no silent failures)

FILES CREATED:
- src/types/drive.ts (Drive API types + Picker types)
- src/services/drive/driveClient.ts (REST API wrapper with 401 re-auth)
- src/services/drive/autoSaveManager.ts (Fixed 3s debounce)
- src/services/drive/fileCache.ts (IndexedDB cache)
- src/services/drive/pickerManager.ts (Google Picker API wrapper)
- src/hooks/useDriveSync.ts (Auto-save React hook)
- src/hooks/useDriveFiles.ts (File list hook)
- src/hooks/usePicker.ts (Google Picker hook)
- src/components/drive/DriveFileBrowser.tsx (Mobile file list)
- src/components/drive/DriveFilePicker.tsx (Responsive wrapper)
- src/components/drive/SaveStatus.tsx (Sync indicator)

FILES MODIFIED:
- src/App.tsx (Drive state integration)
- src/index.css (Mobile Drive UI styles)

TECHNICAL ACHIEVEMENTS:
- Browser-native fetch (no googleapis package)
- Fixed 3s auto-save debounce (no network detection)
- Responsive file browsing (Picker for desktop, custom for mobile)
- Exponential backoff for 403/429 errors
- IndexedDB offline queue
- Mobile-first responsive design
- PWA-ready architecture
- In-session re-auth for 401 token expiry

SECURITY:
- XSS prevention on filenames
- CSP headers configured
- Token expiry re-auth prompt (no silent failures)
- drive.file scope (minimal access, Picker grants file-specific access)

TESTING:
- Unit tests for DriveClient
- Integration tests for auto-save
- Mobile Safari tested on iPhone
- Offline mode verified

SPRINT 8 SUCCESS METRICS:
✅ Desktop users can open ANY Drive markdown file (Picker API)
✅ Mobile users can open app-created files (custom browser)
✅ Users can create new markdown files
✅ Auto-save writes changes to Drive (fixed 3s debounce)
✅ Token expiry handled gracefully (re-auth prompt, no silent failures)
✅ Mobile-first UX maintained (375px, 768px, 1024px)
✅ Zero TypeScript errors
✅ Zero linting warnings

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## 📊 Sprint Success Criteria (UPDATED - GPT-5 Review)

### Must-Have (Sprint 8 Completion)
- ✅ Users can authenticate via Sprint 7 OAuth
- ✅ **Desktop users (≥768px) can open ANY Drive markdown file via Google Picker**
- ✅ **Mobile users (<768px) can open app-created files via custom browser**
- ✅ Users can create new files (auto-created on first edit)
- ✅ **Auto-save with fixed 3s debounce (network detection descoped)**
- ✅ **Token expiry shows re-auth prompt (no silent save failures)**
- ✅ Sync status indicator shows "Saving..." / "Saved"
- ✅ Mobile-first responsive design (375px, 768px, 1024px)
- ✅ Offline mode caches to IndexedDB
- ✅ Error handling with user-friendly messages
- ✅ TypeScript 100% compliant, zero lint errors

### GPT-5 Review Fixes Included
- ✅ **Issue #1 (HIGH)**: Google Picker API added for desktop - `drive.file` scope now works correctly
- ✅ **Issue #2 (MEDIUM)**: Network-aware throttling descoped - iOS Safari lacks Network Information API
- ✅ **Issue #3 (MEDIUM)**: In-session re-auth prompt added - Prevents silent save failures after 1 hour

### Nice-to-Have (Future Sprints)
- ⏭️ File rename functionality (Sprint 9)
- ⏭️ File delete with confirmation (Sprint 9)
- ⏭️ Full OAuth token refresh implementation (Sprint 9)
- ⏭️ Network-aware throttling (if iOS Safari adds API support)
- ⏭️ Mobile Picker alternatives (Sprint 10)
- ⏭️ Conflict resolution for simultaneous edits (Sprint 10)
- ⏭️ Version history integration (Sprint 11)
- ⏭️ Real-time collaboration with Y.js (Sprint 12)

### Known Limitations (Documented)
- ⚠️ **Mobile users limited to app-created files** (Google Picker desktop-only)
  - **Workaround**: Desktop Picker grants access, then accessible on mobile
- ⚠️ **Token refresh flow incomplete** (in-session re-auth prompt used instead)
  - **Impact**: User sees prompt after 1 hour, must click OK to re-auth
  - **Mitigation**: Full refresh in Sprint 9
- ⚠️ **No network-aware throttling** (fixed 3s debounce for all connections)
  - **Reason**: iOS Safari lacks Network Information API
  - **Impact**: Minimal - exponential backoff handles slow networks
- ⚠️ No conflict resolution (last write wins)
- ⚠️ No version history yet
- ⚠️ iOS Safari background sync limited (IndexedDB + visibilitychange used)
- ⚠️ Rate limiting: 1000 requests/100s (exponential backoff mitigates)

---

## 🎯 Roadmap Alignment

**Milestone 2: Cloud Collaboration (Sprint 7-12)**
- ✅ Sprint 7: Google OAuth Setup (COMPLETED)
- 🟢 Sprint 8: Drive API Connection (CURRENT)
- ⏭️ Sprint 9: File Management UI Enhancement
- ⏭️ Sprint 10: Conflict Resolution
- ⏭️ Sprint 11: Version History
- ⏭️ Sprint 12: Real-time Collaboration (Y.js)

**Next Steps After Sprint 8:**
1. Sprint 9 will focus on file rename, delete, and token refresh
2. Sprint 10 will add conflict resolution for offline edits
3. Sprint 11 will integrate Drive version history
4. Sprint 12 will add Y.js for real-time collaboration

---

## 🔒 Security Audit Checklist

**OAuth Security (Inherited from Sprint 7):**
- ✅ PKCE flow implementation
- ✅ Secure token storage (sessionStorage)
- ✅ CSP headers configured
- ✅ drive.file scope (minimal access)
- ⚠️ Token refresh TODO (Sprint 9)

**Drive API Security (New in Sprint 8):**
- ✅ XSS prevention on filenames (DOMPurify recommended)
- ✅ Exponential backoff for rate limiting
- ✅ HTTPS-only API calls
- ✅ Error message sanitization
- ✅ CORS handled by Drive API v3

**Mobile Security:**
- ✅ iOS Safari OAuth redirect flow
- ✅ IndexedDB secure storage
- ✅ No localStorage for sensitive data
- ✅ visibilitychange event for background save

---

## 📈 Performance Budget

**Bundle Size:**
- Current (Sprint 7): 590KB
- Target (Sprint 8): < 650KB (60KB for Drive integration)
- Actual: TBD after implementation

**Load Time (4G Network):**
- Initial load: < 3s
- Time to Interactive: < 5s
- First Contentful Paint: < 1.5s

**Auto-Save Performance:**
- Debounce delay: **Fixed 3s for all networks** (network detection descoped)
- Offline queue: IndexedDB write < 50ms
- Rate limiting: Exponential backoff handles slow networks automatically

---

## 🎉 Sprint 8 Expected Achievements

**User-Facing:**
- ✅ Seamless auto-save to Google Drive
- ✅ Custom mobile-first file browser
- ✅ Clear sync status indicators
- ✅ Offline mode with local caching
- ✅ No data loss on network failures

**Technical:**
- ✅ Clean service layer architecture
- ✅ Browser-native REST API integration
- ✅ React hooks for Drive operations
- ✅ IndexedDB offline persistence
- ✅ Exponential backoff error handling
- ✅ Mobile PWA foundation

**Developer Experience:**
- ✅ Type-safe Drive API client
- ✅ Reusable React hooks
- ✅ Comprehensive error handling
- ✅ Testable service layer
- ✅ Clear documentation

---

**Last Updated:** October 5, 2025 (Sprint 8 research complete)
**Next Review:** After Phase 1 completion (Day 3)
**Owner:** RiteMark Development Team
