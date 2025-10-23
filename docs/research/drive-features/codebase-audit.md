# Google Drive Integration Codebase Audit
**Sprint 15: Share, Version History & Offline Features**
**Date:** October 21, 2025
**Audited By:** Code Quality Analyzer Agent

---

## Executive Summary

**Current State:** RiteMark has a **comprehensive Google Drive integration** built in Sprint 8 with extensive file operations, auto-save, offline caching, and image uploads. The codebase is well-structured and ready for extension with sharing, version history, and offline features.

**Key Findings:**
- ✅ **OAuth Scope:** Already using `drive.file` scope (supports file-level permissions)
- ✅ **Network Error Handling:** Robust retry logic with exponential backoff
- ✅ **Offline Foundation:** IndexedDB caching implemented but not exposed to users
- ✅ **Auto-Save:** 3-second debounce with force-save on visibility change
- ✅ **Integration Points:** Clean hooks-based architecture ready for new features

**Recommendation:** **Extend existing services** rather than create new ones. All infrastructure is in place.

---

## 1. OAuth Scopes Analysis

### Current Configuration
**Location:** `ritemark-app/src/types/auth.ts`, `ritemark-app/src/components/WelcomeScreen.tsx`

```typescript
scope: 'openid email profile https://www.googleapis.com/auth/drive.file'
```

**Scope Details:**
- `drive.file` - **Per-file access only** (files created/opened by app)
- **Supports:** File metadata, content, permissions, revisions
- **Does NOT support:** Full Drive access, arbitrary file access

### Implications for Sprint 15 Features

| Feature | Supported? | Notes |
|---------|-----------|-------|
| **Share File** | ✅ Yes | Can modify permissions on app-created files |
| **Version History** | ✅ Yes | Can list/restore revisions via `revisions` API |
| **Offline Indicator** | ✅ Yes | Client-side feature, no API needed |
| **Export File** | ✅ Yes | Can export app-created files as markdown |

**Action Required:** ✅ **NO SCOPE CHANGES NEEDED** - Current `drive.file` scope supports all planned features.

---

## 2. Drive Service Methods Inventory

### `/src/services/drive/driveClient.ts`
**Purpose:** Core Drive API wrapper with authentication and retry logic

#### Existing Methods

| Method | Purpose | Status | Relevant to Sprint 15? |
|--------|---------|--------|------------------------|
| `createFile()` | Create markdown file | ✅ Working | No |
| `updateFile()` | Update file content | ✅ Working | No |
| `getFile()` | Get file metadata | ✅ Working | **Yes** - For current file info |
| `listFiles()` | List markdown files | ✅ Working | No |
| `deleteFile()` | Delete file | ✅ Working | No |
| `renameFile()` | Rename file | ✅ Working | No |

#### Private Methods (Extensible)
- `makeRequest()` - **Authenticated HTTP wrapper** (can be used for new endpoints)
- `executeWithRetry()` - **Exponential backoff logic** (reusable for revisions/permissions)
- `sanitizeFilename()` - XSS prevention
- `createError()` - Standardized error handling

**Gap Analysis:**
- ❌ Missing: `getRevisions()` - List file versions
- ❌ Missing: `restoreRevision()` - Restore previous version
- ❌ Missing: `shareFile()` - Modify file permissions
- ❌ Missing: `exportFile()` - Export as markdown/HTML

**Recommendation:** **Extend `driveClient.ts`** with 4 new public methods using existing `makeRequest()` infrastructure.

---

## 3. Network Error Handling Assessment

### Current Implementation
**Location:** `driveClient.ts` lines 214-354

#### Error Handling Strategy

```typescript
// HTTP Status Handling
- 401 Unauthorized → Prompt user for re-authentication (confirm dialog + redirect)
- 403 Forbidden → Check if rate limit or permission denied
- 429 Rate Limit → Exponential backoff retry (retryable: true)
- 404 Not Found → Non-retryable error
- 500+ Server Error → Retryable with backoff
```

#### Retry Logic
```typescript
const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,      // Start at 1 second
  maxDelay: 10000,      // Cap at 10 seconds
}

// Exponential backoff with jitter
delay = min(baseDelay * 2^attempt, maxDelay) + random(0-1000ms)
```

**Example Timeline:**
- Attempt 1: Immediate
- Attempt 2: ~2 seconds (2000ms + jitter)
- Attempt 3: ~5 seconds (4000ms + jitter)
- Attempt 4: ~10 seconds (maxDelay + jitter)

### Offline Detection
**Current Implementation:** ❌ **NOT IMPLEMENTED**

**Evidence:**
- `useDriveSync.ts` has `isOffline` field in `DriveSyncStatus` type
- Status is **never set to 'offline'** in existing code
- No `navigator.onLine` checks or network failure detection

**Gap:** Offline state exists in types but not used.

**Recommendation for Sprint 15:**
```typescript
// Add to useDriveSync.ts
useEffect(() => {
  const handleOnline = () => setSyncStatus(prev => ({ ...prev, isOffline: false }))
  const handleOffline = () => setSyncStatus(prev => ({ ...prev, isOffline: true, status: 'offline' }))

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}, [])
```

---

## 4. Offline Caching Analysis

### `/src/services/drive/fileCache.ts`
**Status:** ✅ **Fully Implemented** (Sprint 8) but **not exposed to UI**

#### Capabilities

| Feature | Implemented? | Exposed to User? |
|---------|-------------|------------------|
| IndexedDB storage | ✅ Yes | ❌ No |
| Cache file content | ✅ Yes (`cacheFile()`) | ❌ No |
| Retrieve cached files | ✅ Yes (`getCachedFile()`) | ❌ No |
| Sync queue | ✅ Yes (`getPendingSyncs()`) | ❌ No |
| Mark synced | ✅ Yes (`markSynced()`) | ❌ No |
| Clear cache | ✅ Yes (`clearAll()`) | ❌ No |

#### Database Schema
```typescript
Database: 'RiteMarkCache'
Store: 'files'
Primary Key: 'fileId'

interface CachedFile {
  fileId: string       // Google Drive file ID
  content: string      // Markdown content
  timestamp: number    // Cache time (Date.now())
  synced: boolean      // Drive sync status
}

Indexes:
- timestamp (for cleanup)
- synced (for pending sync queries)
```

#### Integration Points
**Current Usage:** ❌ **NONE** - Service exists but is never called

**Gap:** `useDriveSync.ts` does **NOT** use `fileCache` service
- No `cacheFile()` calls after successful saves
- No `getCachedFile()` fallback on network errors
- No `getPendingSyncs()` retry logic on reconnect

**Recommendation for Sprint 15:**
1. **Cache on save:** Call `fileCache.cacheFile(fileId, content, synced: true)` after Drive saves
2. **Fallback on load:** Try `fileCache.getCachedFile(fileId)` if Drive request fails
3. **Offline indicator:** Show "⚠️ Unsaved changes - will sync when online" for `synced: false` files
4. **Background sync:** On `window.addEventListener('online')`, call `getPendingSyncs()` and retry

---

## 5. Auto-Save Implementation

### `/src/services/drive/autoSaveManager.ts`
**Status:** ✅ **Production-ready** with smart debouncing

#### Key Features
- **Fixed 3-second debounce** (prevents API spam)
- **Queue management** (only saves latest content)
- **Concurrent edit handling** (re-schedules if content changes during save)
- **Force save capability** (for explicit user actions like "Share" button)
- **Visibility change listener** (saves when user switches tabs)

#### Save Flow
```
User types
  ↓
scheduleSave(content)  → pendingContent = content, clear timer, set 3s timer
  ↓
[User keeps typing within 3s]
  ↓
scheduleSave(newContent) → pendingContent = newContent, reset 3s timer
  ↓
[3 seconds elapse]
  ↓
executeSave() → isSaving = true, call onSave(pendingContent)
  ↓
[Save completes]
  ↓
lastSaveTime = Date.now(), isSaving = false
  ↓
[If new content arrived during save, re-schedule]
```

**Integration with Sprint 15:**
- **Share button:** Call `forceSave()` before showing share dialog (ensures latest version)
- **Version history:** Call `forceSave()` before navigating to revisions (prevent data loss)
- **Export:** Call `forceSave()` before export (ensure up-to-date content)

---

## 6. Component Integration Points

### UI Components Using Drive

#### `/src/components/layout/AppShell.tsx`
**Purpose:** Main app layout with header and sidebar

**Props Related to Drive:**
```typescript
interface AppShellProps {
  documentTitle: string
  syncStatus: DriveSyncStatus  // Current save status
  onNewDocument?: () => void   // Create new file
  onOpenFromDrive?: () => void // Open file picker
  onRenameDocument?: (newTitle: string) => void
}
```

**Integration Point for Sprint 15:**
- **Add prop:** `onShareDocument?: () => void`
- **Add prop:** `onViewHistory?: () => void`
- **Location:** Pass to `AppSidebar` component

---

#### `/src/components/app-sidebar.tsx`
**Purpose:** Left sidebar with document status and navigation

**Current Features:**
- Document title
- Sync status badge (Saving/Synced/Error/Offline)
- "New Document" and "Open from Drive" buttons (via `DocumentStatus`)

**Integration Point for Sprint 15:**
- **Add menu items to `DocumentStatus`:**
  - "Share Document" → Open share dialog
  - "Version History" → Open revisions drawer
  - "Export as Markdown" → Trigger download

**Recommended Location:**
```typescript
// In DocumentStatus.tsx SidebarMenuButton dropdown
<DropdownMenu>
  <DropdownMenuTrigger>...</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={onNewDocument}>New Document</DropdownMenuItem>
    <DropdownMenuItem onClick={onOpenFromDrive}>Open from Drive</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={onShareDocument}>Share...</DropdownMenuItem>
    <DropdownMenuItem onClick={onViewHistory}>Version History...</DropdownMenuItem>
    <DropdownMenuItem onClick={onExportMarkdown}>Export as Markdown</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

#### `/src/components/sidebar/DocumentStatus.tsx`
**Purpose:** Document title, sync status, and file operations

**Current Features:**
- Auto-hiding sync status (fades after 3 seconds)
- Hover state with file icon animation
- Click opens `WelcomeScreen` for file operations

**Integration Point for Sprint 15:**
- **Convert click behavior to dropdown menu** (see recommended structure above)
- **Add offline indicator:**
  ```typescript
  case 'offline':
    return {
      icon: <CloudOff />,
      text: 'Offline - 2 unsaved changes', // Show pending sync count
      textColor: 'text-orange-600',
    }
  ```

---

### Drive File Browser

#### `/src/components/drive/DriveFileBrowser.tsx`
**Purpose:** Mobile-optimized file picker (uses shadcn Dialog)

**Current Features:**
- Search markdown files
- Pull-to-refresh UX
- Grid layout (desktop) / List layout (mobile)
- Pagination ("Load More")
- Error handling

**Integration Point for Sprint 15:**
- **NOT RELEVANT** - Browser is for opening files, not sharing/versioning

---

### Hooks Inventory

| Hook | Purpose | Sprint 15 Usage |
|------|---------|------------------|
| `useAuth.ts` | OAuth context access | ✅ Will use for token in new API calls |
| `useDriveSync.ts` | Auto-save + file loading | ✅ Extend for offline sync queue |
| `useDriveFiles.ts` | File list management | ❌ Not needed |
| `usePicker.ts` | Google Picker (desktop) | ❌ Not needed |

---

## 7. Image Upload Service

### `/src/services/drive/DriveImageUpload.ts`
**Status:** ✅ Working (Sprint 11 - Table support)

**Key Features:**
- Upload images to Drive
- Auto-create "RiteMark Images" folder
- Set public permissions for embedding
- Image compression (browser-image-compression)
- Returns shareable thumbnail URL

**Relevance to Sprint 15:**
- **Demonstrates permissions API usage** (line 75-87)
- **Example of private `makeRequest()` usage** (can copy pattern for share/revisions)

**Code Snippet (Permissions Example):**
```typescript
// Set file permissions to allow public access
await driveClient['makeRequest'](
  `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      role: 'reader',
      type: 'anyone',
    }),
  }
);
```

**Recommendation:** Use this pattern for `shareFile()` implementation in Sprint 15.

---

## 8. Type Definitions Analysis

### `/src/types/drive.ts`
**Status:** ✅ Comprehensive but missing revisions/permissions types

#### Existing Types

| Type | Purpose | Sprint 15 Relevant? |
|------|---------|---------------------|
| `DriveFile` | File metadata | ✅ Yes - Check `capabilities.canShare` |
| `DriveSyncStatus` | Sync UI state | ✅ Yes - Has `isOffline` field |
| `DriveError` | Error handling | ✅ Yes - Will use for new API errors |
| `DriveFileList` | File list results | ❌ No |
| `PickerCallbackData` | Picker selection | ❌ No |

#### Missing Types for Sprint 15

**Need to Add:**
```typescript
// Revisions API
export interface DriveRevision {
  id: string
  modifiedTime: string
  lastModifyingUser?: {
    displayName: string
    emailAddress: string
    photoLink?: string
  }
  size?: string
  md5Checksum?: string
  keepForever?: boolean
  published?: boolean
}

export interface DriveRevisionList {
  revisions: DriveRevision[]
  nextPageToken?: string
}

// Permissions API
export interface DrivePermission {
  id: string
  type: 'user' | 'group' | 'domain' | 'anyone'
  role: 'owner' | 'organizer' | 'fileOrganizer' | 'writer' | 'commenter' | 'reader'
  emailAddress?: string
  displayName?: string
  photoLink?: string
  domain?: string
  allowFileDiscovery?: boolean
  expirationTime?: string
}

export interface DrivePermissionList {
  permissions: DrivePermission[]
  nextPageToken?: string
}

// UI Component Props
export interface ShareDialogProps {
  fileId: string
  onClose: () => void
}

export interface RevisionDrawerProps {
  fileId: string
  currentContent: string
  onRestore: (revisionId: string) => Promise<void>
  onClose: () => void
}
```

---

## 9. Integration Points for New Features

### Feature 1: Share File (Permissions API)

**Where to Add:**
- **Service:** `driveClient.ts` - New public method `shareFile(fileId, email, role)`
- **UI Component:** New `ShareDialog.tsx` (shadcn Dialog)
- **Trigger:** `DocumentStatus.tsx` dropdown menu item

**Existing Code to Leverage:**
- `DriveImageUpload.ts` lines 75-87 - Permissions API example
- `driveClient.makeRequest()` - HTTP wrapper with auth + retry
- `DriveFile.capabilities.canShare` - Check before showing share button

**API Endpoint:**
```
POST https://www.googleapis.com/drive/v3/files/{fileId}/permissions
Body: { "type": "user", "role": "writer", "emailAddress": "user@example.com" }
```

---

### Feature 2: Version History (Revisions API)

**Where to Add:**
- **Service:** `driveClient.ts` - New methods `getRevisions()`, `restoreRevision()`
- **UI Component:** New `RevisionDrawer.tsx` (shadcn Sheet/Drawer)
- **Trigger:** `DocumentStatus.tsx` dropdown menu item

**Existing Code to Leverage:**
- `driveClient.listFiles()` - Similar pagination pattern for revisions
- `driveClient.getFile()` - Similar metadata fetch logic
- `DriveFileBrowser.tsx` - Timeline UI pattern for revision list

**API Endpoints:**
```
GET https://www.googleapis.com/drive/v3/files/{fileId}/revisions
GET https://www.googleapis.com/drive/v3/files/{fileId}/revisions/{revisionId}
PATCH https://www.googleapis.com/drive/v3/files/{fileId}?addParents=&removeParents=&uploadType=media
```

---

### Feature 3: Offline Indicator

**Where to Add:**
- **Hook:** `useDriveSync.ts` - Add `navigator.onLine` listeners
- **UI Component:** `DocumentStatus.tsx` - New status case for 'offline'
- **Integration:** `fileCache.ts` - Expose pending sync count

**Existing Code to Leverage:**
- `DriveSyncStatus.isOffline` - Already in type definition
- `fileCache.getPendingSyncs()` - Already implemented
- `DocumentStatus.tsx` status switch - Add 'offline' case

**Implementation:**
```typescript
// useDriveSync.ts
const [isOnline, setIsOnline] = useState(navigator.onLine)

useEffect(() => {
  const handleOnline = () => setIsOnline(true)
  const handleOffline = () => setIsOnline(false)

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}, [])

// Update syncStatus when offline
useEffect(() => {
  if (!isOnline) {
    setSyncStatus(prev => ({ ...prev, status: 'offline', isOffline: true }))
  }
}, [isOnline])
```

---

### Feature 4: Export Markdown

**Where to Add:**
- **Service:** `driveClient.ts` - New method `exportFile(fileId)`
- **UI Component:** `DocumentStatus.tsx` - Menu item triggers browser download
- **Format:** UTF-8 text file with `.md` extension

**Existing Code to Leverage:**
- `driveClient.getFile()` - Fetch file content
- Browser `<a download>` trick for file download

**Implementation:**
```typescript
async function exportAsMarkdown(fileId: string, content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
```

---

## 10. Potential Conflicts & Refactoring Needs

### ✅ No Major Conflicts Detected

**Clean Architecture:**
- Services are well-separated
- Hooks don't overlap in responsibilities
- Components follow single-responsibility principle

### Minor Refactoring Recommendations

#### 1. `DocumentStatus.tsx` - Convert Click to Dropdown
**Current:** Clicking document title opens `WelcomeScreen`
**Issue:** No room for Share/History/Export menu items

**Recommendation:**
```typescript
// Replace single onClick with DropdownMenu
<SidebarMenuButton> → <DropdownMenuTrigger>
  Add <DropdownMenuContent> with file operations
  Move New/Open actions from WelcomeScreen to dropdown
```

**Effort:** ~30 minutes (use existing shadcn DropdownMenu component)

---

#### 2. `useDriveSync.ts` - Integrate FileCache
**Current:** `fileCache` service exists but is never used
**Issue:** Offline functionality not connected to UI

**Recommendation:**
```typescript
// After successful save
await driveClient.updateFile(...)
await fileCache.cacheFile(fileId, content, synced: true)

// On save failure
catch (error) {
  await fileCache.cacheFile(fileId, content, synced: false)
  setSyncStatus({ status: 'offline', pendingCount: await getPendingSyncs().length })
}

// On navigator.online event
const pendingSyncs = await fileCache.getPendingSyncs()
for (const file of pendingSyncs) {
  await driveClient.updateFile(file.fileId, file.content)
  await fileCache.markSynced(file.fileId)
}
```

**Effort:** ~1 hour (add 3 integration points)

---

#### 3. Type Safety for `driveClient['makeRequest']`
**Current:** `DriveImageUpload.ts` uses private method via bracket notation
**Issue:** TypeScript doesn't enforce type safety on private methods

**Recommendation:**
```typescript
// Option 1: Make makeRequest() protected instead of private
protected async makeRequest(...)

// Option 2: Add public wrapper for common operations
async makePermissionRequest(url: string, body: object): Promise<unknown> {
  return this.makeRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
```

**Effort:** ~15 minutes (one-line change or add wrapper method)

---

## 11. File Structure Recommendations

### New Files to Create (Sprint 15)

```
ritemark-app/src/
├── services/drive/
│   └── driveClient.ts              (EXTEND - Add 4 methods)
│       - shareFile(fileId, email, role)
│       - getRevisions(fileId)
│       - restoreRevision(fileId, revisionId)
│       - exportAsMarkdown(fileId, content, filename)
│
├── components/
│   ├── drive/
│   │   ├── ShareDialog.tsx         (NEW - Share permissions UI)
│   │   └── RevisionDrawer.tsx      (NEW - Version history timeline)
│   │
│   └── sidebar/
│       └── DocumentStatus.tsx      (MODIFY - Add dropdown menu)
│
├── hooks/
│   └── useDriveSync.ts             (EXTEND - Add offline detection + cache)
│
└── types/
    └── drive.ts                    (EXTEND - Add revision/permission types)
```

### Estimated Lines of Code (New/Modified)

| File | Change Type | Estimated LOC |
|------|------------|---------------|
| `driveClient.ts` | Add methods | +200 lines |
| `ShareDialog.tsx` | New component | +150 lines |
| `RevisionDrawer.tsx` | New component | +200 lines |
| `DocumentStatus.tsx` | Refactor to dropdown | +50 lines |
| `useDriveSync.ts` | Add offline logic | +80 lines |
| `drive.ts` | Add types | +100 lines |
| **Total** | | **~780 lines** |

**Comparison:** Sprint 8 Drive integration was ~1,500 lines. Sprint 15 is **half the size** (extending vs. building from scratch).

---

## 12. Summary & Recommendations

### ✅ What's Already Built (Reuse)

1. **OAuth Flow** - `drive.file` scope supports all features
2. **Network Layer** - Retry logic, error handling, token management
3. **Auto-Save** - Smart debouncing, force-save capability
4. **Offline Cache** - IndexedDB service ready (just needs UI integration)
5. **Image Permissions** - Example of permissions API usage

### ❌ What's Missing (Build in Sprint 15)

1. **Revisions API Methods** - `getRevisions()`, `restoreRevision()`
2. **Permissions API Methods** - `shareFile()`, `listPermissions()`
3. **Offline UI** - Indicator, pending count, retry logic
4. **Share Dialog** - Email input, role selector, permission list
5. **Revision Drawer** - Timeline, diff view, restore button
6. **Export Function** - Download as markdown

### 🎯 Recommended Approach

**Phase 1: Service Layer (1 day)**
- Extend `driveClient.ts` with 4 new methods
- Add types to `drive.ts`
- Write unit tests for API calls

**Phase 2: Offline Integration (0.5 days)**
- Connect `fileCache` to `useDriveSync`
- Add `navigator.onLine` listeners
- Update `DocumentStatus` offline indicator

**Phase 3: Share UI (1 day)**
- Build `ShareDialog.tsx` component
- Add dropdown menu to `DocumentStatus.tsx`
- Test permission creation/removal

**Phase 4: Version History UI (1.5 days)**
- Build `RevisionDrawer.tsx` component
- Add timeline visualization
- Test restore functionality

**Phase 5: Export + Polish (0.5 days)**
- Add export markdown function
- Final testing and error handling
- Documentation updates

**Total Effort:** ~4.5 days

### 🚨 Critical Decision Points

#### 1. Should we refactor `DocumentStatus` click behavior?
**Current:** Click opens WelcomeScreen
**Proposed:** Click opens dropdown menu (New, Open, Share, History, Export)

**Pros:**
- Centralized file operations
- Follows Google Docs pattern
- No need to search for features

**Cons:**
- Breaking change (users expect click = file browser)
- Slight UX friction (extra click)

**Recommendation:** ✅ **YES** - File operations should be grouped logically

---

#### 2. Should offline cache be opt-in or automatic?
**Option A:** Automatic caching (always cache on save)
**Option B:** User setting "Enable offline mode"

**Recommendation:** ✅ **Option A (Automatic)** - Users expect modern apps to work offline

---

#### 3. Should version history show diffs or just timestamps?
**Option A:** Simple list (timestamp, author, restore button)
**Option B:** Diff view (side-by-side markdown comparison)

**Recommendation:** ✅ **Option A for MVP** - Diffs can be Sprint 15b enhancement

---

## Appendix A: Drive API Endpoints Reference

### Revisions API
```
GET  /drive/v3/files/{fileId}/revisions
GET  /drive/v3/files/{fileId}/revisions/{revisionId}
DELETE /drive/v3/files/{fileId}/revisions/{revisionId}
```

### Permissions API
```
GET    /drive/v3/files/{fileId}/permissions
POST   /drive/v3/files/{fileId}/permissions
DELETE /drive/v3/files/{fileId}/permissions/{permissionId}
```

### Export API
```
GET /drive/v3/files/{fileId}/export?mimeType=text/markdown
```

---

## Appendix B: Testing Checklist

### Service Layer Tests
- [ ] `shareFile()` - Creates permission successfully
- [ ] `shareFile()` - Handles invalid email error
- [ ] `shareFile()` - Respects `canShare` capability
- [ ] `getRevisions()` - Returns sorted revision list
- [ ] `getRevisions()` - Handles empty revision list
- [ ] `restoreRevision()` - Restores content successfully
- [ ] `exportAsMarkdown()` - Downloads valid UTF-8 file

### Offline Integration Tests
- [ ] Cache saves content after successful Drive save
- [ ] Cache loads content when Drive is unreachable
- [ ] Pending syncs retry when `navigator.onLine` fires
- [ ] Offline indicator shows pending count
- [ ] Sync queue processes in order

### UI Component Tests
- [ ] ShareDialog renders permission list
- [ ] ShareDialog creates new permission on email submit
- [ ] RevisionDrawer renders timeline
- [ ] RevisionDrawer restores selected revision
- [ ] DocumentStatus dropdown shows all menu items
- [ ] Export button downloads file with correct name

---

**End of Audit**
**Next Step:** Review with team → Create Sprint 15 implementation plan
