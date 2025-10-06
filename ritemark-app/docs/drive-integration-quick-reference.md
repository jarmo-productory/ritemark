# Drive API Integration - Quick Reference

## Current State Summary

### ✅ Ready to Use
- **OAuth2 Authentication:** Complete with Drive API scope
- **Access Token:** Available via `tokenManager.getAccessToken()`
- **Token Storage:** sessionStorage with expiry tracking
- **Editor State:** Title + Content managed in App.tsx

### ⚠️ Needs Implementation
- **Drive API Service:** CRUD operations for files
- **Auto-Save Hook:** Debounced sync to Drive
- **File Picker UI:** Browse and open Drive files
- **Save Status:** Visual feedback for sync state
- **Token Refresh:** Currently forces re-auth after 1 hour

---

## Key Files & Integration Points

### Authentication
```typescript
// Get access token for Drive API calls
import { tokenManager } from './services/auth/tokenManager'
const token = await tokenManager.getAccessToken()

// Token already includes Drive scope:
// 'https://www.googleapis.com/auth/drive.file'
```

### Editor State
```typescript
// App.tsx (lines 10-11)
const [title, setTitle] = useState('Untitled Document')  // File name
const [text, setText] = useState('')                      // HTML content

// Auto-save trigger: onChange in Editor component (line 67)
```

### Token Manager API
```typescript
// Located: /src/services/auth/tokenManager.ts
class TokenManager {
  async getAccessToken(): Promise<string | null>
  isTokenExpired(): boolean
  getTokenExpiry(): number | null
  clearTokens(): void
}
```

---

## Required New Files

### 1. Drive Types
**Path:** `/src/types/drive.ts`
```typescript
export interface DriveFile {
  id: string
  name: string
  mimeType: string
  createdTime: string
  modifiedTime: string
  content?: string
}

export interface DriveSyncResult {
  success: boolean
  fileId?: string
  error?: DriveError
}
```

### 2. Drive API Service
**Path:** `/src/services/drive/driveApi.ts`
```typescript
export class DriveApiService {
  async createFile(title: string, content: string): Promise<DriveFile>
  async updateFile(fileId: string, content: string): Promise<DriveFile>
  async getFile(fileId: string): Promise<DriveFile>
  async listFiles(): Promise<DriveFile[]>
}
```

### 3. Auto-Save Hook
**Path:** `/src/hooks/useDriveSync.ts`
```typescript
export function useDriveSync(
  fileId: string | null,
  title: string,
  content: string
) {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  return { isSaving, lastSaved, saveToGDrive, loadFromGDrive }
}
```

### 4. Save Status Component
**Path:** `/src/components/drive/SaveStatus.tsx`
```typescript
export function SaveStatus({
  isSaving,
  lastSaved,
  error
}: SaveStatusProps) {
  // Show: "Saving..." | "Saved 2 min ago" | "Error saving"
}
```

### 5. File Picker Component
**Path:** `/src/components/drive/DriveFilePicker.tsx`
```typescript
export function DriveFilePicker({
  onSelect,
  onClose
}: DriveFilePickerProps) {
  // Modal showing list of Drive files
  // Search, filter, create new
}
```

---

## Drive API Endpoints (Browser-Native Fetch)

### Create File
```typescript
const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'multipart/related; boundary=foo_bar_baz'
  },
  body: createMultipartBody(title, content)
})
```

### Update File
```typescript
const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'text/html'
  },
  body: content
})
```

### Get File
```typescript
// 1. Get metadata
const metadata = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
  headers: { 'Authorization': `Bearer ${accessToken}` }
})

// 2. Get content
const content = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
  headers: { 'Authorization': `Bearer ${accessToken}` }
})
```

### List Files
```typescript
const response = await fetch(
  `https://www.googleapis.com/drive/v3/files?q=mimeType='text/html'&orderBy=modifiedTime desc`,
  { headers: { 'Authorization': `Bearer ${accessToken}` } }
)
```

---

## App.tsx Integration Example

```typescript
function AppContent() {
  // Existing state
  const [title, setTitle] = useState('Untitled Document')
  const [text, setText] = useState('')

  // NEW: Drive state
  const [fileId, setFileId] = useState<string | null>(null)

  // NEW: Auto-save hook
  const { isSaving, lastSaved, error } = useDriveSync(fileId, title, text)

  return (
    <main className="app-container">
      {/* NEW: Save status */}
      <SaveStatus isSaving={isSaving} lastSaved={lastSaved} error={error} />

      {/* Existing components with Drive integration */}
      <input value={title} onChange={(e) => setTitle(e.target.value)} />
      <Editor value={text} onChange={setText} />
    </main>
  )
}
```

---

## Testing Checklist

### Manual Testing
- [ ] Create new file in Drive
- [ ] Open existing file from Drive
- [ ] Edit and auto-save
- [ ] Token expiry handling (wait 1 hour)
- [ ] Offline mode (disconnect network)
- [ ] File rename
- [ ] Multiple tabs (conflict detection)

### Unit Testing
- [ ] DriveApiService CRUD operations
- [ ] Token manager integration
- [ ] Error handling (network, auth, rate limit)
- [ ] Debounce logic in useDriveSync

### Integration Testing
- [ ] Full OAuth flow → Drive API call
- [ ] Auto-save with real Drive API
- [ ] File picker with real Drive files

---

## Dependencies

### Already Installed
```json
"googleapis": "^159.0.0"  // Currently in devDependencies
```

### Action Needed
```bash
# Move googleapis to production dependencies
npm install googleapis --save
npm uninstall googleapis --save-dev

# Or use browser-native fetch() (recommended)
# No additional dependencies needed
```

---

## Security Notes

### Token Security
- ✅ Tokens stored in sessionStorage (cleared on tab close)
- ⚠️ Production should use httpOnly cookies
- ✅ HTTPS required for OAuth redirect
- ✅ CSRF protection via state parameter

### Drive API Permissions
- ✅ Using minimal scope: `drive.file` (not `drive` full access)
- ✅ Only accesses files created by app
- ✅ No access to user's entire Drive

### CORS
- ✅ Drive API v3 supports browser CORS
- ✅ No proxy server needed
- ✅ Direct API calls from browser

---

## Common Issues & Solutions

### Issue: 401 Unauthorized
**Cause:** Token expired or invalid
**Solution:** Check `tokenManager.isTokenExpired()`, force re-auth

### Issue: 403 Forbidden
**Cause:** Missing Drive scope or insufficient permissions
**Solution:** Verify OAuth scope includes `drive.file`

### Issue: 429 Rate Limit
**Cause:** Too many API requests
**Solution:** Implement exponential backoff, increase debounce delay

### Issue: Network Error
**Cause:** Offline or CORS issue
**Solution:** Implement offline queue, retry logic

---

## Next Steps (Priority Order)

1. **Create Drive Types** (`/src/types/drive.ts`)
   - Define DriveFile, DriveError, DriveSyncResult

2. **Build Drive API Service** (`/src/services/drive/driveApi.ts`)
   - Implement CRUD operations with fetch()
   - Add error handling and retry logic

3. **Create Auto-Save Hook** (`/src/hooks/useDriveSync.ts`)
   - Debounced save (3-5 seconds)
   - Track isSaving, lastSaved, error states

4. **Integrate in App.tsx**
   - Add fileId state
   - Use useDriveSync hook
   - Add SaveStatus component

5. **Build File Picker UI** (`/src/components/drive/DriveFilePicker.tsx`)
   - List Drive files
   - Search and filter
   - Load selected file

---

## Useful Links

- [Google Drive API v3 Reference](https://developers.google.com/drive/api/v3/reference)
- [Drive API Browser Quickstart](https://developers.google.com/drive/api/quickstart/js)
- [OAuth 2.0 for Client-Side Apps](https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow)
- [Drive API File Management](https://developers.google.com/drive/api/guides/manage-uploads)
