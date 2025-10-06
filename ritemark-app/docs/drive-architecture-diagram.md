# Drive API Integration - Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        RiteMark App                              │
│                    (Browser - React + TypeScript)                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Component Layer                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   App.tsx    │  │ AuthModal    │  │ DriveFile    │          │
│  │              │  │              │  │   Picker     │ (NEW)     │
│  │ • title      │  │ • OAuth Flow │  │              │          │
│  │ • content    │  │ • Token Mgmt │  │ • List Files │          │
│  │ • fileId     │◄─┤ • User Auth  │  │ • Search     │          │
│  └──────┬───────┘  └──────────────┘  └──────────────┘          │
│         │                                                         │
│         ▼                                                         │
│  ┌──────────────┐  ┌──────────────┐                             │
│  │  Editor.tsx  │  │ SaveStatus   │ (NEW)                       │
│  │              │  │              │                              │
│  │ • TipTap     │  │ • isSaving   │                             │
│  │ • onChange   │  │ • lastSaved  │                             │
│  └──────────────┘  └──────────────┘                             │
│                                                                   │
└───────────────────────────┬───────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Hooks Layer                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐              ┌──────────────┐                 │
│  │  useAuth()   │              │ useDriveSync │ (NEW)           │
│  │              │              │              │                  │
│  │ • user       │              │ • Auto-save  │                 │
│  │ • login()    │              │ • Debounce   │                 │
│  │ • logout()   │              │ • isSaving   │                 │
│  │ • error      │              │ • lastSaved  │                 │
│  └──────┬───────┘              └──────┬───────┘                 │
│         │                             │                          │
│         └─────────────┬───────────────┘                          │
│                       │                                          │
└───────────────────────┼──────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Service Layer                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────┐      ┌────────────────────────┐       │
│  │   TokenManager       │      │   DriveApiService      │ (NEW) │
│  │                      │      │                        │       │
│  │ • getAccessToken()   │◄─────┤ • createFile()         │       │
│  │ • isTokenExpired()   │      │ • updateFile()         │       │
│  │ • refreshToken()     │      │ • getFile()            │       │
│  │ • clearTokens()      │      │ • listFiles()          │       │
│  │                      │      │ • deleteFile()         │       │
│  │ Storage:             │      │                        │       │
│  │ sessionStorage       │      │ Error Handling:        │       │
│  │ • ritemark_oauth_    │      │ • Retry logic          │       │
│  │   tokens             │      │ • Rate limiting        │       │
│  │ • expiresAt          │      │ • Network errors       │       │
│  └──────────────────────┘      └────────┬───────────────┘       │
│                                          │                        │
└──────────────────────────────────────────┼────────────────────────┘
                                           │
                                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Google Drive API (v3)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Base URL: https://www.googleapis.com/drive/v3                  │
│                                                                   │
│  Endpoints:                                                      │
│  • POST   /files           (Create file)                         │
│  • PATCH  /files/{id}      (Update file)                        │
│  • GET    /files/{id}      (Get metadata)                       │
│  • GET    /files?q=...     (List files)                         │
│  • DELETE /files/{id}      (Delete file)                        │
│                                                                   │
│  Authentication:                                                 │
│  • Header: Authorization: Bearer {access_token}                 │
│  • Scope: https://www.googleapis.com/auth/drive.file           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. User Authentication Flow

```
User                 AuthModal           TokenManager       Google OAuth
  │                     │                     │                  │
  │ Click "Sign in"     │                     │                  │
  ├────────────────────►│                     │                  │
  │                     │ initTokenClient()   │                  │
  │                     ├────────────────────►│                  │
  │                     │                     │ OAuth Popup      │
  │                     │                     ├─────────────────►│
  │                     │                     │                  │
  │  [OAuth Consent]    │                     │                  │
  │◄────────────────────┼─────────────────────┼──────────────────┤
  │                     │                     │                  │
  │  Grant Access       │                     │                  │
  ├────────────────────►│                     │                  │
  │                     │                     │ Access Token     │
  │                     │◄────────────────────┼──────────────────┤
  │                     │                     │                  │
  │                     │ storeTokens()       │                  │
  │                     ├────────────────────►│                  │
  │                     │                     │ Store in         │
  │                     │                     │ sessionStorage   │
  │                     │                     ├──────────┐       │
  │                     │                     │          │       │
  │                     │                     │◄─────────┘       │
  │                     │ Reload Page         │                  │
  │◄────────────────────┤                     │                  │
  │                     │                     │                  │
```

---

### 2. Document Auto-Save Flow

```
User Types          Editor.tsx       useDriveSync      DriveApiService    Google Drive
   │                   │                  │                  │                │
   │ Edit content      │                  │                  │                │
   ├──────────────────►│                  │                  │                │
   │                   │ onChange(text)   │                  │                │
   │                   ├─────────────────►│                  │                │
   │                   │                  │ Start timer      │                │
   │                   │                  │ (3s debounce)    │                │
   │                   │                  ├────────┐         │                │
   │                   │                  │        │         │                │
   │ [User stops       │                  │◄───────┘         │                │
   │  typing]          │                  │                  │                │
   │                   │                  │ setIsSaving(true)│                │
   │                   │                  ├──────────┐       │                │
   │                   │                  │          │       │                │
   │                   │ Show "Saving..." │◄─────────┘       │                │
   │◄──────────────────┼──────────────────┤                  │                │
   │                   │                  │ updateFile()     │                │
   │                   │                  ├─────────────────►│                │
   │                   │                  │                  │ PATCH /files/  │
   │                   │                  │                  ├───────────────►│
   │                   │                  │                  │                │
   │                   │                  │                  │ 200 OK         │
   │                   │                  │                  │◄───────────────┤
   │                   │                  │ Success          │                │
   │                   │                  │◄─────────────────┤                │
   │                   │                  │ setLastSaved()   │                │
   │                   │                  │ setIsSaving(false)                │
   │                   │ Show "Saved ✓"  │                  │                │
   │◄──────────────────┼──────────────────┤                  │                │
   │                   │                  │                  │                │
```

---

### 3. File Loading Flow

```
User               DriveFilePicker  DriveApiService   Google Drive    App.tsx
 │                       │                │               │             │
 │ Click "Open"          │                │               │             │
 ├──────────────────────►│                │               │             │
 │                       │ listFiles()    │               │             │
 │                       ├───────────────►│               │             │
 │                       │                │ GET /files?q= │             │
 │                       │                ├──────────────►│             │
 │                       │                │               │             │
 │                       │                │ File list     │             │
 │                       │ Show files     │◄──────────────┤             │
 │                       │◄───────────────┤               │             │
 │ [Select file]         │                │               │             │
 │◄──────────────────────┤                │               │             │
 │                       │                │               │             │
 │ Click file            │                │               │             │
 ├──────────────────────►│                │               │             │
 │                       │ getFile(id)    │               │             │
 │                       ├───────────────►│               │             │
 │                       │                │ GET /files/id │             │
 │                       │                ├──────────────►│             │
 │                       │                │               │             │
 │                       │                │ File data     │             │
 │                       │ File loaded    │◄──────────────┤             │
 │                       │◄───────────────┤               │             │
 │                       │ onSelect(file) │               │             │
 │                       ├────────────────┼───────────────┼────────────►│
 │                       │                │               │ setFileId() │
 │                       │                │               │ setTitle()  │
 │                       │                │               │ setText()   │
 │                       │                │               │             │
 │ [Editor shows content]│                │               │             │
 │◄──────────────────────┼────────────────┼───────────────┼─────────────┤
 │                       │                │               │             │
```

---

## State Management Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        App.tsx                               │
│                     (Component State)                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Local State:                                                │
│  ┌──────────────────────────────────────────────────┐       │
│  │ title: string            (Document title)        │       │
│  │ text: string             (HTML content)          │       │
│  │ fileId: string | null    (Drive file ID)  (NEW)  │       │
│  │ hasHeadings: boolean     (TOC visibility)        │       │
│  └──────────────────────────────────────────────────┘       │
│                                                               │
│  Context (via AuthProvider):                                │
│  ┌──────────────────────────────────────────────────┐       │
│  │ user: GoogleUser | null                          │       │
│  │ isAuthenticated: boolean                         │       │
│  │ isLoading: boolean                               │       │
│  │ error: string | null                             │       │
│  └──────────────────────────────────────────────────┘       │
│                                                               │
│  Drive Sync Hook (useDriveSync):                            │
│  ┌──────────────────────────────────────────────────┐       │
│  │ isSaving: boolean                         (NEW)  │       │
│  │ lastSaved: Date | null                    (NEW)  │       │
│  │ error: DriveError | null                  (NEW)  │       │
│  │ saveToGDrive: () => Promise<void>         (NEW)  │       │
│  │ loadFromGDrive: (id) => Promise<DriveFile>(NEW)  │       │
│  └──────────────────────────────────────────────────┘       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Token Flow & Security

```
┌─────────────────────────────────────────────────────────────┐
│                    Token Lifecycle                           │
└─────────────────────────────────────────────────────────────┘

1. Authentication:
   Google OAuth → Access Token (expires in 3600s = 1 hour)

2. Storage:
   sessionStorage.setItem('ritemark_oauth_tokens', {
     access_token: "ya29.a0...",
     expires_in: 3600,
     expiresAt: 1699999999999,  // Current time + 3600s
     scope: "openid email profile https://www.googleapis.com/auth/drive.file"
   })

3. Token Retrieval (before each API call):
   ┌─────────────────────────────────────────┐
   │ tokenManager.getAccessToken()           │
   ├─────────────────────────────────────────┤
   │ 1. Read from sessionStorage             │
   │ 2. Check if expiresAt > Date.now()      │
   │    ├─ YES: Return token                 │
   │    └─ NO:  Attempt refresh (TODO)       │
   │           └─ Currently: Force re-auth   │
   └─────────────────────────────────────────┘

4. Token Refresh (⚠️ NOT IMPLEMENTED):
   Current: User must re-authenticate after 1 hour
   Future: Use refresh_token to get new access_token

5. Token Expiry Buffer:
   Refresh 5 minutes BEFORE expiry (line 15 in tokenManager.ts)
   Buffer = 5 * 60 * 1000 = 300,000ms

6. Security:
   ✅ sessionStorage (cleared on tab close)
   ✅ HTTPS required for OAuth redirect
   ✅ State parameter for CSRF protection
   ✅ Minimal scope (drive.file, not full drive)
   ⚠️ Production: Should use httpOnly cookies
```

---

## Error Handling Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Error Flow                                │
└─────────────────────────────────────────────────────────────┘

Drive API Call
      │
      ▼
  Try/Catch
      │
      ├──► Success
      │    └─► Return result
      │
      └──► Error
           │
           ▼
    Classify Error
           │
           ├──► 401 Unauthorized
           │    ├─► Clear tokens
           │    ├─► Trigger re-auth
           │    └─► Show: "Session expired, please sign in"
           │
           ├──► 403 Forbidden
           │    └─► Show: "Permission denied"
           │
           ├──► 404 Not Found
           │    └─► Show: "File not found"
           │
           ├──► 429 Rate Limit
           │    ├─► Wait (exponential backoff)
           │    └─► Retry request
           │
           ├──► Network Error
           │    ├─► Queue for retry
           │    └─► Show: "Offline - changes will sync when online"
           │
           └──► Unknown Error
                └─► Log error
                └─► Show: "Error saving, please try again"

Component Display:
      │
      ▼
  SaveStatus Component
      │
      ├──► isSaving=true  → "Saving..."
      ├──► success       → "Saved ✓"
      └──► error         → "Error saving [Retry]"
```

---

## File Structure Impact

```
src/
├── components/
│   ├── auth/
│   │   ├── AuthModal.tsx       ✅ Existing - OAuth + Drive scope
│   │   └── AuthStatus.tsx      ✅ Existing - User profile
│   │
│   ├── drive/                  ⚠️ NEW DIRECTORY
│   │   ├── DriveFilePicker.tsx   🆕 Browse Drive files
│   │   ├── SaveStatus.tsx        🆕 Show sync status
│   │   └── FileMetadata.tsx      🆕 Display file info
│   │
│   └── Editor.tsx              ✅ Existing - Add auto-save trigger
│
├── hooks/
│   ├── useAuth.ts              ✅ Existing
│   ├── useDriveSync.ts         🆕 Auto-save hook
│   └── useDriveFiles.ts        🆕 File list management
│
├── services/
│   ├── auth/
│   │   ├── tokenManager.ts     ✅ Existing - Token CRUD
│   │   └── googleAuth.ts       ✅ Existing - OAuth flow
│   │
│   └── drive/                  ⚠️ NEW DIRECTORY
│       ├── driveApi.ts           🆕 Drive API service
│       ├── driveSync.ts          🆕 Sync coordination
│       └── driveCache.ts         🆕 Offline cache
│
├── types/
│   ├── auth.ts                 ✅ Existing - OAuth types
│   └── drive.ts                🆕 Drive type definitions
│
└── App.tsx                     ✅ Existing - Add Drive state

Legend:
  ✅ Existing file (no changes)
  ✅ Existing file (needs updates)
  ⚠️ New directory needed
  🆕 New file needed
```

---

## Integration Checklist

### Phase 1: Foundation
- [ ] Create `/src/types/drive.ts` with type definitions
- [ ] Create `/src/services/drive/driveApi.ts` service class
- [ ] Test Drive API calls with existing OAuth token
- [ ] Implement error handling and retry logic

### Phase 2: Auto-Save
- [ ] Create `/src/hooks/useDriveSync.ts` hook
- [ ] Add fileId state to `App.tsx`
- [ ] Implement debounced auto-save (3-5 seconds)
- [ ] Create `SaveStatus.tsx` component
- [ ] Show sync status in UI

### Phase 3: File Management
- [ ] Create `DriveFilePicker.tsx` component
- [ ] Implement file list with search
- [ ] Add "Open" button to app header
- [ ] Load selected file into editor
- [ ] Handle file not found errors

### Phase 4: Polish
- [ ] Implement token refresh flow
- [ ] Add offline mode support
- [ ] Implement conflict resolution
- [ ] Add keyboard shortcuts (Cmd+S to save)
- [ ] Write comprehensive tests

---

## Performance Considerations

```
┌─────────────────────────────────────────────────────────────┐
│                Performance Optimizations                     │
└─────────────────────────────────────────────────────────────┘

1. Auto-Save Debouncing:
   User types → Wait 3 seconds → Save
   ├─► Reduces API calls (saves quota)
   ├─► Improves typing performance
   └─► Prevents "too many requests" errors

2. File List Caching:
   First load → Fetch from Drive → Cache in memory
   Subsequent loads → Use cached data → Refresh in background

3. Token Caching:
   Store in sessionStorage (not localStorage)
   └─► Faster access than repeated OAuth flows
   └─► Cleared automatically on tab close (security)

4. Lazy Loading:
   ├─► DriveFilePicker: Load only when opened
   ├─► File content: Stream large files
   └─► Thumbnails: Load on scroll (virtual list)

5. Request Batching:
   Multiple file operations → Batch into single request
   └─► Drive API supports batch requests

6. Error Recovery:
   Network error → Queue request → Retry when online
   └─► Prevents data loss during connectivity issues
```

---

## Monitoring & Observability

```
┌─────────────────────────────────────────────────────────────┐
│                  Logging & Metrics                           │
└─────────────────────────────────────────────────────────────┘

Development:
  ✅ Console logs for Drive API calls
  ✅ Token expiry warnings
  ✅ Error stack traces

Production (Future):
  📊 Track Drive API response times
  📊 Monitor token refresh failures
  📊 Count auto-save successes/failures
  📊 Track user engagement (files created, edited)

Error Tracking:
  🔴 401 Unauthorized (token expired)
  🔴 403 Forbidden (permission denied)
  🔴 429 Rate limit exceeded
  🔴 Network errors
  🔴 File conflicts

User Feedback:
  💬 "Saving..." → In progress
  ✅ "Saved 2 minutes ago" → Success
  ⚠️ "Offline - changes not saved" → Warning
  ❌ "Error saving" [Retry] → Error with action
```
