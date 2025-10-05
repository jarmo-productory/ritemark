# Drive API Integration - Architecture Analysis

## Executive Summary

This document analyzes the RiteMark codebase to identify Google Drive API integration points. The analysis reveals a well-structured OAuth foundation with clear integration opportunities for Drive file operations.

**Key Findings:**
- OAuth2 authentication is complete with Drive API scope already configured
- Token management system ready for Drive API consumption
- Editor state management needs Drive sync hooks
- New service layer required for Drive file operations
- Type definitions need extension for Drive-specific models

---

## 1. Authentication & Token Management

### Current State: OAuth2 Complete ✅

**File:** `/src/components/auth/AuthModal.tsx`

**OAuth Scope Configuration (Line 60):**
```typescript
scope: 'openid email profile https://www.googleapis.com/auth/drive.file'
```

**Token Storage (Lines 88-96):**
```typescript
sessionStorage.setItem('ritemark_oauth_tokens', JSON.stringify({
  access_token: tokenResponse.access_token,
  accessToken: tokenResponse.access_token,
  expires_in: tokenResponse.expires_in,
  scope: tokenResponse.scope,
  token_type: tokenResponse.token_type,
  tokenType: 'Bearer',
  expiresAt: Date.now() + ((tokenResponse.expires_in || 3600) * 1000),
}))
```

**Authentication Flow:**
1. User clicks "Sign in with Google" → `handleSignIn()` (line 133)
2. Google popup shows combined consent (identity + Drive access)
3. Access token received → User info fetched (line 66)
4. Tokens stored in sessionStorage (line 88)
5. Page reloads with authenticated state (line 150)

**Integration Points:**
- ✅ Drive API scope already included
- ✅ Access token available for API calls
- ✅ Token expiry handling implemented
- ⚠️ No token refresh implementation yet (see tokenManager)

---

### Token Manager: Ready for Drive API ✅

**File:** `/src/services/auth/tokenManager.ts`

**Access Token Retrieval (Lines 56-78):**
```typescript
async getAccessToken(): Promise<string | null> {
  const tokenData = sessionStorage.getItem(STORAGE_KEYS.TOKENS);
  const tokens: Partial<OAuthTokens> = JSON.parse(tokenData);

  // Check if token is expired
  if (tokens.expiresAt && tokens.expiresAt <= Date.now()) {
    const refreshResult = await this.refreshAccessToken();
    return refreshResult.success ? refreshResult.tokens?.accessToken || null : null;
  }

  return tokens.accessToken || tokens.access_token || null;
}
```

**Token Expiry Detection (Lines 92-109):**
- 5-minute buffer before actual expiry (line 15)
- Automatic refresh scheduled (line 146)
- Graceful degradation on refresh failure

**Critical Issue - Token Refresh (Lines 116-140):**
```typescript
async refreshAccessToken(): Promise<TokenRefreshResult> {
  // TODO: Implement actual token refresh with Google OAuth
  // For now, return failure to trigger re-authentication
  console.warn('Token refresh not yet implemented, user must re-authenticate');
  return {
    success: false,
    error: this.createAuthError(AUTH_ERRORS.REFRESH_FAILED, ...)
  };
}
```

**Drive API Integration Plan:**
1. Use `tokenManager.getAccessToken()` to get valid token
2. Include token in Drive API Authorization header
3. Handle token expiry gracefully (currently requires re-auth)
4. Future: Implement refresh token flow

---

## 2. Editor State Management

### Current State: Local State Only ⚠️

**File:** `/src/App.tsx`

**Document State (Lines 10-11):**
```typescript
const [title, setTitle] = useState('Untitled Document')
const [text, setText] = useState('')
```

**State Flow:**
```
User Input → setState → Component Re-render
   ↓
No persistence layer
No cloud sync
No file metadata
```

**Missing Drive Integration:**
- ❌ No file ID tracking (which Drive file is this?)
- ❌ No save/load operations
- ❌ No auto-save mechanism
- ❌ No file metadata (created date, modified date, owner)
- ❌ No sync status indicator

**Required Changes:**
```typescript
// NEW STATE NEEDED:
const [fileId, setFileId] = useState<string | null>(null)
const [isSaving, setIsSaving] = useState(false)
const [lastSaved, setLastSaved] = useState<Date | null>(null)
const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'offline'>('synced')

// NEW HOOKS NEEDED:
const { saveToGDrive, loadFromGDrive } = useDriveSync(fileId, title, text)
```

**Auto-Save Trigger Points:**
- Title change (line 58)
- Content change via `setText` (line 67)
- Debounced auto-save (3-5 seconds after last edit)

---

### Editor Component: Content Change Hook

**File:** `/src/components/Editor.tsx`

**Content Update Handler (Lines 71-75):**
```typescript
onUpdate: ({ editor }) => {
  const content = editor.getHTML()
  onChange(content)
  onEditorReady?.(editor)
}
```

**Integration Point:**
- When `onChange(content)` is called → App.tsx `setText()` updates
- This is the perfect place to trigger debounced auto-save
- Add save indicator in editor UI (e.g., "Saving..." / "Saved")

---

## 3. Type Definitions Analysis

### Current OAuth Types: Solid Foundation ✅

**File:** `/src/types/auth.ts`

**Existing Types (Lines 1-200):**
- `OAuthTokens` - Complete token structure
- `GoogleUser` - User identity
- `AuthError` - Standardized error handling
- `AuthContextType` - Authentication context

**Missing Drive Types:** ⚠️

```typescript
// NEEDED: Drive API type definitions
export interface DriveFile {
  id: string
  name: string
  mimeType: string
  createdTime: string
  modifiedTime: string
  owners?: Array<{ displayName: string; emailAddress: string }>
  webViewLink?: string
  iconLink?: string
  size?: string
}

export interface DriveFileMetadata {
  fileId: string
  title: string
  content: string
  lastModified: Date
  syncStatus: 'synced' | 'saving' | 'conflict' | 'offline'
}

export interface DriveSyncResult {
  success: boolean
  fileId?: string
  error?: DriveError
}

export interface DriveError {
  code: string
  message: string
  status?: number
  retryable: boolean
}

// Error codes for Drive operations
export const DRIVE_ERRORS = {
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  RATE_LIMIT: 'RATE_LIMIT',
  NETWORK_ERROR: 'NETWORK_ERROR',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  CONFLICT: 'CONFLICT',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const
```

**Recommendation:**
- Create `/src/types/drive.ts` for Drive-specific types
- Keep separation of concerns (auth types vs drive types)

---

## 4. Project Dependencies Analysis

### Current Dependencies ✅

**File:** `package.json`

**Drive API Library (Line 67):**
```json
"googleapis": "^159.0.0"  // ✅ Already installed (devDependencies)
```

**Issue:** `googleapis` is in `devDependencies` but should be in `dependencies`

**Required Changes:**
```bash
# Move googleapis to production dependencies
npm install googleapis --save
npm uninstall googleapis --save-dev
```

**Alternative Approach - Browser-Native:**
Since this is a browser-only app (no backend), we can use Google Drive REST API directly:

```typescript
// Option 1: Use googleapis (Node.js style, needs bundler polyfills)
import { google } from 'googleapis'

// Option 2: Use fetch() directly (browser-native, recommended for web apps)
const response = await fetch('https://www.googleapis.com/drive/v3/files', {
  headers: { Authorization: `Bearer ${accessToken}` }
})
```

**Recommendation:** Use browser-native `fetch()` for Drive API calls
- ✅ No additional dependencies
- ✅ Smaller bundle size
- ✅ Native browser security model
- ✅ Better error handling with Response API

---

## 5. Required New Files & Components

### Service Layer: Drive API Service

**New File:** `/src/services/drive/driveApi.ts`

**Purpose:** Encapsulate all Google Drive API operations

**Required Methods:**
```typescript
export class DriveApiService {
  // File operations
  async createFile(title: string, content: string): Promise<DriveFile>
  async updateFile(fileId: string, content: string): Promise<DriveFile>
  async getFile(fileId: string): Promise<DriveFile>
  async deleteFile(fileId: string): Promise<void>

  // List operations
  async listFiles(query?: string): Promise<DriveFile[]>
  async searchFiles(searchTerm: string): Promise<DriveFile[]>

  // Metadata operations
  async getFileMetadata(fileId: string): Promise<DriveFileMetadata>
  async updateFileMetadata(fileId: string, metadata: Partial<DriveFileMetadata>): Promise<void>

  // Error handling
  private handleApiError(error: unknown): DriveError
  private async retryWithBackoff<T>(operation: () => Promise<T>): Promise<T>
}
```

**Integration with TokenManager:**
```typescript
import { tokenManager } from '../auth/tokenManager'

async createFile(title: string, content: string): Promise<DriveFile> {
  const accessToken = await tokenManager.getAccessToken()
  if (!accessToken) throw new Error('Not authenticated')

  const response = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: title,
      mimeType: 'text/markdown',
    }),
  })

  return await response.json()
}
```

---

### React Hook: useDriveSync

**New File:** `/src/hooks/useDriveSync.ts`

**Purpose:** React hook for automatic Drive sync with debouncing

**Interface:**
```typescript
export function useDriveSync(
  fileId: string | null,
  title: string,
  content: string,
  autoSaveDelay = 3000
) {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<DriveError | null>(null)

  // Debounced auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      saveToGDrive()
    }, autoSaveDelay)

    return () => clearTimeout(timer)
  }, [title, content])

  const saveToGDrive = async () => {
    setIsSaving(true)
    try {
      if (fileId) {
        await driveService.updateFile(fileId, content)
      } else {
        const file = await driveService.createFile(title, content)
        // Update fileId in parent component
      }
      setLastSaved(new Date())
    } catch (err) {
      setError(err as DriveError)
    } finally {
      setIsSaving(false)
    }
  }

  const loadFromGDrive = async (fileId: string) => {
    const file = await driveService.getFile(fileId)
    return file
  }

  return { isSaving, lastSaved, error, saveToGDrive, loadFromGDrive }
}
```

---

### UI Component: Drive File Picker

**New File:** `/src/components/drive/DriveFilePicker.tsx`

**Purpose:** Modal to browse and select Drive files

**Features:**
- List user's markdown files from Drive
- Search functionality
- "New Document" button
- File metadata display (modified date, size)
- Loading states

**Integration Point:**
- Add "Open" button in app header
- Show picker modal
- Load selected file into editor

---

### UI Component: Save Status Indicator

**New File:** `/src/components/drive/SaveStatus.tsx`

**Purpose:** Show sync status to user

**States:**
- ✅ "Saved to Drive" (green checkmark)
- ⏳ "Saving..." (animated spinner)
- ⚠️ "Offline - Changes not saved" (yellow warning)
- ❌ "Error saving" (red error with retry button)

**Placement:** Near document title or in app header

---

## 6. Integration Roadmap

### Phase 1: Core Drive Service (Week 1)
1. Create `/src/types/drive.ts` with Drive type definitions
2. Create `/src/services/drive/driveApi.ts` with basic CRUD operations
3. Write unit tests for Drive service
4. Test with real Drive API using existing OAuth tokens

### Phase 2: Editor Integration (Week 2)
1. Create `/src/hooks/useDriveSync.ts` for auto-save
2. Add Drive state to `App.tsx` (fileId, syncStatus)
3. Implement debounced auto-save on content change
4. Add `SaveStatus` component to UI

### Phase 3: File Management (Week 3)
1. Create `DriveFilePicker` component
2. Implement "Open" functionality
3. Implement "New Document" functionality
4. Add file rename capability

### Phase 4: Advanced Features (Week 4)
1. Implement conflict resolution (offline editing)
2. Add version history integration
3. Implement file sharing UI
4. Add collaborative editing indicators

---

## 7. Critical Dependencies & Risks

### Token Refresh Implementation ⚠️
**Risk:** Users will be forced to re-authenticate after 1 hour
**Impact:** Poor UX, data loss risk
**Solution:** Implement refresh token flow in `tokenManager.ts`

### Offline Editing
**Risk:** Users lose work if internet drops during editing
**Impact:** Data loss, user frustration
**Solution:**
- Implement localStorage backup
- Show clear offline indicator
- Queue saves for retry when online

### Rate Limiting
**Risk:** Google Drive API has rate limits (1000 requests/100 seconds)
**Impact:** Failed saves during heavy editing
**Solution:**
- Implement exponential backoff
- Debounce auto-save aggressively
- Show rate limit errors clearly

### CORS Issues
**Risk:** Browser CORS restrictions on Drive API calls
**Impact:** API calls fail in browser
**Solution:**
- Drive API v3 supports CORS for browser apps ✅
- Ensure correct Origin headers
- Test thoroughly in production domain

---

## 8. Recommended File Structure

```
src/
├── types/
│   ├── auth.ts           # ✅ Existing
│   └── drive.ts          # ⚠️ NEW - Drive type definitions
├── services/
│   ├── auth/
│   │   ├── tokenManager.ts     # ✅ Existing
│   │   └── googleAuth.ts       # ✅ Existing
│   └── drive/
│       ├── driveApi.ts         # ⚠️ NEW - Drive API service
│       ├── driveSync.ts        # ⚠️ NEW - Sync coordination
│       └── driveCache.ts       # ⚠️ NEW - Offline cache
├── hooks/
│   ├── useAuth.ts        # ✅ Existing
│   ├── useDriveSync.ts   # ⚠️ NEW - Auto-save hook
│   └── useDriveFiles.ts  # ⚠️ NEW - File list management
├── components/
│   ├── auth/
│   │   ├── AuthModal.tsx       # ✅ Existing
│   │   └── AuthStatus.tsx      # ✅ Existing
│   ├── drive/
│   │   ├── DriveFilePicker.tsx # ⚠️ NEW - File browser
│   │   ├── SaveStatus.tsx      # ⚠️ NEW - Sync indicator
│   │   └── FileMetadata.tsx    # ⚠️ NEW - File info display
│   └── Editor.tsx        # ✅ Existing - needs auto-save integration
└── App.tsx               # ✅ Existing - needs Drive state
```

---

## 9. Next Steps & Action Items

### Immediate Actions (Sprint 8)
1. ✅ Create Drive type definitions in `/src/types/drive.ts`
2. ✅ Create Drive API service in `/src/services/drive/driveApi.ts`
3. ✅ Test Drive API calls with existing OAuth tokens
4. ✅ Create `useDriveSync` hook for auto-save

### Testing Requirements
- Unit tests for Drive API service (mocked responses)
- Integration tests with real Drive API (using test account)
- Browser compatibility testing (Chrome, Safari, Firefox)
- Token expiry and refresh testing
- Offline mode testing

### Documentation Needs
- API usage guide for developers
- User guide for Drive integration
- Troubleshooting guide for common errors
- Security best practices document

---

## 10. Example Integration Code

### App.tsx with Drive Integration

```typescript
import { useState, useEffect } from 'react'
import { Editor } from './components/Editor'
import { SaveStatus } from './components/drive/SaveStatus'
import { DriveFilePicker } from './components/drive/DriveFilePicker'
import { useDriveSync } from './hooks/useDriveSync'

function AppContent() {
  // Existing state
  const [title, setTitle] = useState('Untitled Document')
  const [text, setText] = useState('')

  // NEW: Drive state
  const [fileId, setFileId] = useState<string | null>(null)
  const [showFilePicker, setShowFilePicker] = useState(false)

  // NEW: Auto-save hook
  const { isSaving, lastSaved, error, loadFromGDrive } = useDriveSync(
    fileId,
    title,
    text
  )

  // NEW: Load file on mount if fileId in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlFileId = params.get('fileId')
    if (urlFileId) {
      loadFromGDrive(urlFileId).then(file => {
        setFileId(file.id)
        setTitle(file.name)
        setText(file.content)
      })
    }
  }, [])

  return (
    <main className="app-container">
      {/* NEW: Save status indicator */}
      <SaveStatus
        isSaving={isSaving}
        lastSaved={lastSaved}
        error={error}
      />

      {/* NEW: File picker button */}
      <button onClick={() => setShowFilePicker(true)}>
        Open from Drive
      </button>

      {/* Existing components */}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Document Title"
      />

      <Editor
        value={text}
        onChange={setText}
      />

      {/* NEW: File picker modal */}
      {showFilePicker && (
        <DriveFilePicker
          onSelect={async (file) => {
            const loaded = await loadFromGDrive(file.id)
            setFileId(loaded.id)
            setTitle(loaded.name)
            setText(loaded.content)
            setShowFilePicker(false)
          }}
          onClose={() => setShowFilePicker(false)}
        />
      )}
    </main>
  )
}
```

---

## Conclusion

**RiteMark is well-positioned for Drive API integration:**

✅ **Strengths:**
- OAuth2 with Drive scope already configured
- Token management infrastructure complete
- Clean component architecture ready for extension
- TypeScript types provide safety

⚠️ **Gaps to Fill:**
- Drive API service layer needed
- Auto-save mechanism needed
- File picker UI needed
- Token refresh implementation needed

**Estimated Implementation Time:** 3-4 weeks
- Week 1: Core Drive service + types
- Week 2: Auto-save integration
- Week 3: File management UI
- Week 4: Advanced features + polish

**Risk Level:** Low-Medium
- OAuth foundation is solid
- Main risk is token refresh complexity
- Drive API v3 is well-documented and stable
- Browser CORS support is good

**Recommendation:** Proceed with Drive API integration following the phased roadmap outlined in Section 6.
