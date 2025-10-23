# Google Drive API v3 Capabilities for Sprint 15

**Research Date:** 2025-10-21
**Focus:** File Sharing and Revisions API for RiteMark Editor

## Executive Summary

This document outlines Google Drive API v3 capabilities for implementing file sharing and version history features in RiteMark. Key findings:

- ✅ **Sharing Dialog**: Available via `gapi.drive.share.ShareClient` (JavaScript SDK)
- ✅ **Revisions API**: Full programmatic access via REST endpoints
- ✅ **OAuth Scopes**: `drive.file` scope sufficient for both features
- ⚠️ **Mobile Browsers**: Limited documentation; requires testing
- ⚠️ **Pop-up Blocking**: Sharing dialog may require user gesture
- ⚠️ **2025 Changes**: New restrictions on sharing permissions (Sept 22, 2025)

---

## 1. File Sharing API

### 1.1 Opening Drive Sharing Dialog from Web App

**Official Method: Google Drive Share Client (Recommended for Sprint 15)**

```javascript
// 1. Load the Google API library
<script type="text/javascript" src="https://apis.google.com/js/api.js"></script>

// 2. Initialize ShareClient
<script type="text/javascript">
  let shareClient;

  const initShareClient = () => {
    shareClient = new gapi.drive.share.ShareClient();
    shareClient.setOAuthToken(accessToken); // OAuth2 access token
    shareClient.setItemIds([fileId]); // Google Drive file ID
  };

  window.onload = () => {
    gapi.load('drive-share', initShareClient);
  };
</script>

// 3. Launch sharing dialog
<button onclick="shareClient.showSettingsDialog()">Share File</button>
```

**Implementation Requirements:**
- ✅ Third-party cookies must be enabled in browser
- ✅ User must be signed into Google account matching OAuth token
- ✅ Valid OAuth2 access token with appropriate scope
- ✅ File ID must be accessible by authenticated user

**Alternative: Direct URL Navigation (Fallback)**

```javascript
// Open Drive sharing dialog in new window/tab
const openDriveShareDialog = (fileId) => {
  const shareUrl = `https://drive.google.com/file/${fileId}/share`;
  window.open(shareUrl, '_blank', 'width=600,height=400');
};
```

### 1.2 Permissions API (Programmatic Sharing)

**REST Endpoint: `POST /drive/v3/files/{fileId}/permissions`**

```bash
# Create permission (share with specific user)
curl -X POST \
  'https://www.googleapis.com/drive/v3/files/FILE_ID/permissions' \
  -H 'Authorization: Bearer ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "user",
    "role": "writer",
    "emailAddress": "user@example.com"
  }'
```

```javascript
// JavaScript fetch example
const shareFile = async (fileId, email, role = 'writer') => {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'user',
        role: role, // owner, organizer, fileOrganizer, writer, commenter, reader
        emailAddress: email
      })
    }
  );
  return response.json();
};
```

**Create "Anyone with Link" Permission:**

```javascript
const sharePublicLink = async (fileId) => {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'anyone',
        role: 'reader'
      })
    }
  );
  return response.json();
};
```

### 1.3 List File Permissions

**REST Endpoint: `GET /drive/v3/files/{fileId}/permissions`**

```bash
# List all permissions for a file
curl -X GET \
  'https://www.googleapis.com/drive/v3/files/FILE_ID/permissions' \
  -H 'Authorization: Bearer ACCESS_TOKEN'
```

```javascript
// JavaScript fetch example
const listPermissions = async (fileId) => {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/permissions?fields=permissions(id,type,role,emailAddress)`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );
  return response.json();
};
```

### 1.4 Drive Sharing URL Patterns

```javascript
// Direct sharing dialog (opens in Drive UI)
const shareDialogUrl = `https://drive.google.com/file/${fileId}/share`;

// File view URL (user can click "Share" button)
const fileViewUrl = `https://drive.google.com/file/${fileId}/view`;

// File edit URL (for Google Docs/Sheets/Slides)
const editUrl = `https://docs.google.com/document/d/${fileId}/edit`;
```

### 1.5 Permission Roles & Types

**Available Roles:**
- `owner` - Full ownership (cannot be set via API on non-owned files)
- `organizer` - Full control within shared drives
- `fileOrganizer` - Can organize files within shared drives
- `writer` - Can edit and comment
- `commenter` - Can comment only
- `reader` - View-only access

**Permission Types:**
- `user` - Specific user by email
- `group` - Google Group by email
- `domain` - Anyone in Google Workspace domain
- `anyone` - Anyone with the link (public)

---

## 2. Revisions API

### 2.1 List All Revisions

**REST Endpoint: `GET /drive/v3/files/{fileId}/revisions`**

```bash
# List all revisions for a file
curl -X GET \
  'https://www.googleapis.com/drive/v3/files/FILE_ID/revisions?fields=revisions(id,modifiedTime,lastModifyingUser,size,keepForever)' \
  -H 'Authorization: Bearer ACCESS_TOKEN'
```

```javascript
// JavaScript fetch example
const listRevisions = async (fileId) => {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/revisions?` +
    `fields=revisions(id,modifiedTime,lastModifyingUser,size,keepForever,mimeType)`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );
  const data = await response.json();
  return data.revisions;
};

// Example response:
// {
//   "revisions": [
//     {
//       "id": "1",
//       "modifiedTime": "2025-10-20T10:30:00.000Z",
//       "lastModifyingUser": {
//         "displayName": "John Doe",
//         "emailAddress": "john@example.com",
//         "photoLink": "https://..."
//       },
//       "size": "12345",
//       "keepForever": false,
//       "mimeType": "text/plain"
//     }
//   ]
// }
```

### 2.2 Get Specific Revision

**REST Endpoint: `GET /drive/v3/files/{fileId}/revisions/{revisionId}`**

```javascript
const getRevision = async (fileId, revisionId) => {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/revisions/${revisionId}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );
  return response.json();
};
```

### 2.3 Download Revision Content

**REST Endpoint: `GET /drive/v3/files/{fileId}/revisions/{revisionId}?alt=media`**

```javascript
const downloadRevision = async (fileId, revisionId) => {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/revisions/${revisionId}?alt=media`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );
  const content = await response.text();
  return content;
};
```

### 2.4 Mark Revision "Keep Forever"

**REST Endpoint: `PATCH /drive/v3/files/{fileId}/revisions/{revisionId}`**

```javascript
const keepRevisionForever = async (fileId, revisionId, keep = true) => {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/revisions/${revisionId}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        keepForever: keep
      })
    }
  );
  return response.json();
};
```

### 2.5 Delete Revision

**REST Endpoint: `DELETE /drive/v3/files/{fileId}/revisions/{revisionId}`**

```javascript
const deleteRevision = async (fileId, revisionId) => {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/revisions/${revisionId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );
  return response.ok;
};
```

**⚠️ Deletion Limitations:**
- Only blob files (images, PDFs, videos) support revision deletion
- Google Docs/Sheets/Slides do NOT support revision deletion
- Cannot delete the most recent revision
- User must have owner/writer role

### 2.6 Access Version History UI from Web App

**Direct URL Navigation to Drive Version History:**

```javascript
// Open Google Drive version history in new window
const openVersionHistory = (fileId) => {
  const versionHistoryUrl = `https://drive.google.com/file/${fileId}/revisions`;
  window.open(versionHistoryUrl, '_blank');
};
```

**For Google Docs (with specific revision):**

```javascript
// Show specific revision in Google Docs
const viewDocRevision = (fileId, revisionId) => {
  const revisionUrl = `https://docs.google.com/document/d/${fileId}/revisions?start=${revisionId}&end=${revisionId}`;
  window.open(revisionUrl, '_blank');
};
```

### 2.7 Revision Metadata

**Available Fields:**
- `id` - Revision identifier
- `modifiedTime` - ISO 8601 timestamp
- `lastModifyingUser` - User object (displayName, emailAddress, photoLink)
- `size` - File size in bytes (blob files only)
- `keepForever` - Boolean flag for retention
- `mimeType` - Content type
- `md5Checksum` - File hash (blob files only)
- `published` - Published status (Google Workspace docs only)
- `publishAuto` - Auto-publish on update

### 2.8 Revision Diff (In RiteMark vs Drive UI)

**❌ Drive API Does NOT Provide Diff Functionality**

The Google Drive API does **not** provide built-in diff/comparison between revisions. Options:

1. **Use Drive UI** (Recommended for Sprint 15)
   - Open version history in Drive (`drive.google.com/file/{id}/revisions`)
   - Google Drive automatically shows visual diff for Google Docs
   - For blob files, users can download and compare manually

2. **Build Custom Diff in RiteMark** (Future Sprint)
   - Download two revision contents via API
   - Use JavaScript diff library (e.g., `diff`, `jsdiff`, `monaco-diff-editor`)
   - Display side-by-side or unified diff
   - **Limitation:** Only works for text-based files (markdown, plain text)

**Recommendation for Sprint 15:**
- Provide "View in Drive" button that opens Drive version history UI
- Do NOT attempt to build custom diff viewer (complex, out of scope)

---

## 3. OAuth Scopes & Security

### 3.1 Required OAuth Scopes

**Recommended Scope for RiteMark (Non-sensitive):**

```javascript
const OAUTH_SCOPE = 'https://www.googleapis.com/auth/drive.file';
```

**Scope Capabilities:**
- ✅ Read/write files created by RiteMark
- ✅ Read/write files opened via Google Picker API
- ✅ Manage permissions for these files
- ✅ Access revision history for these files
- ❌ Cannot access other Drive files not explicitly shared with app

**Alternative Scopes (Restricted - require Google verification):**

| Scope | Description | Use Case |
|-------|-------------|----------|
| `drive` | Full access to all Drive files | NOT recommended (overly broad) |
| `drive.readonly` | Read-only access to all files | NOT needed for RiteMark |
| `drive.metadata.readonly` | Read-only file metadata | NOT sufficient (need write access) |

**Best Practice for 2025:**
- Use **`drive.file`** scope (non-sensitive, no verification needed)
- Combine with **Google Picker API** to let users choose files
- This approach passes Google OAuth verification without review

### 3.2 OAuth Token Management

```javascript
// Store access token securely (in-memory or sessionStorage)
let accessToken = null;

// Refresh token before expiration
const refreshTokenIfNeeded = async () => {
  const tokenExpiry = localStorage.getItem('token_expiry');
  const now = Date.now();

  if (!tokenExpiry || now >= tokenExpiry - 300000) { // 5 min buffer
    // Trigger OAuth refresh flow
    await googleAuth.currentUser.get().reloadAuthResponse();
  }
};

// Set token expiry timestamp
const storeToken = (token, expiresIn) => {
  accessToken = token;
  const expiryTime = Date.now() + (expiresIn * 1000);
  localStorage.setItem('token_expiry', expiryTime);
};
```

### 3.3 Security Considerations

**Token Storage:**
- ❌ **Never store tokens in localStorage** (XSS vulnerable)
- ✅ Use in-memory storage (lost on page refresh, requires re-auth)
- ✅ Use sessionStorage (cleared on browser close)
- ✅ Use HTTP-only cookies (if using server-side proxy)

**CSP Headers for RiteMark:**

```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self' https://apis.google.com;
               connect-src 'self' https://www.googleapis.com https://accounts.google.com;
               frame-src https://accounts.google.com https://drive.google.com;">
```

**CORS Handling:**
- Google Drive API supports CORS by default
- No server-side proxy needed for REST API calls
- OAuth flow requires pop-up or redirect (cannot be iframed)

---

## 4. Rate Limiting & Best Practices

### 4.1 API Rate Limits (2025)

**Google Drive API Quotas:**
- **Read requests:** 1,000 queries per 100 seconds per user
- **Write requests:** 1,000 queries per 100 seconds per user
- **Permission operations:** 1,000 requests per 100 seconds per user
- **Revisions operations:** 1,000 requests per 100 seconds per user

**Recommendations for RiteMark:**
- Implement exponential backoff for `429 Too Many Requests` errors
- Cache revision list (refresh only when user clicks "View History")
- Batch permission changes if sharing with multiple users
- Use `fields` parameter to request only needed data

### 4.2 Exponential Backoff Implementation

```javascript
const fetchWithRetry = async (url, options, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options);

    if (response.ok) {
      return response;
    }

    if (response.status === 429) {
      // Rate limited - exponential backoff
      const waitTime = Math.pow(2, i) * 1000; // 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, waitTime));
      continue;
    }

    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  throw new Error('Max retries exceeded');
};
```

### 4.3 Caching Strategy

```javascript
// Cache revision list to avoid repeated API calls
const revisionCache = new Map();

const getCachedRevisions = async (fileId, maxAge = 60000) => {
  const cached = revisionCache.get(fileId);

  if (cached && Date.now() - cached.timestamp < maxAge) {
    return cached.data;
  }

  const revisions = await listRevisions(fileId);
  revisionCache.set(fileId, {
    data: revisions,
    timestamp: Date.now()
  });

  return revisions;
};
```

### 4.4 Concurrent Request Handling

**⚠️ Important Limitation:**
> Concurrent permissions operations on the same file are not supported; only the last update is applied.

**Recommendation:**
- Serialize permission changes for the same file
- Use a queue for multiple share operations

```javascript
const permissionQueue = new Map();

const queuePermissionChange = async (fileId, operation) => {
  if (!permissionQueue.has(fileId)) {
    permissionQueue.set(fileId, Promise.resolve());
  }

  const previousOperation = permissionQueue.get(fileId);
  const newOperation = previousOperation.then(() => operation());
  permissionQueue.set(fileId, newOperation);

  return newOperation;
};

// Usage
await queuePermissionChange(fileId, () => shareFile(fileId, 'user@example.com', 'writer'));
await queuePermissionChange(fileId, () => shareFile(fileId, 'another@example.com', 'reader'));
```

---

## 5. Mobile Browser Compatibility

### 5.1 Known Issues (2025)

**Google Drive Sharing Dialog:**
- ✅ Desktop browsers: Full support (Chrome, Firefox, Safari, Edge)
- ⚠️ Mobile browsers: Limited official documentation
- ⚠️ iOS Safari: May block pop-ups by default (requires user gesture)
- ⚠️ Android Chrome: Generally works, but third-party cookies must be enabled

**Recommendations for RiteMark:**
1. **Desktop-first approach** for sharing dialog (gapi.drive.share.ShareClient)
2. **Mobile fallback** to direct Drive URL (`drive.google.com/file/{id}/share`)
3. **Test thoroughly** on iOS Safari, Android Chrome, and mobile Firefox

### 5.2 Pop-up Blocking Detection

```javascript
const openSharingDialog = (fileId) => {
  if (isMobileDevice()) {
    // Mobile: Direct navigation to avoid pop-up blockers
    window.location.href = `https://drive.google.com/file/${fileId}/share`;
  } else {
    // Desktop: Use ShareClient modal
    shareClient.setItemIds([fileId]);
    shareClient.showSettingsDialog();
  }
};

const isMobileDevice = () => {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
};
```

### 5.3 Third-Party Cookie Requirements

**ShareClient Dependency:**
> Third-party cookies must be enabled for `gapi.drive.share.ShareClient` to work.

**Browser Compatibility (2025):**
- Chrome: Third-party cookies being phased out (2024-2025 Privacy Sandbox)
- Safari: Blocks third-party cookies by default (ITP 2.0+)
- Firefox: Enhanced Tracking Protection blocks third-party cookies

**Fallback Strategy:**

```javascript
const testThirdPartyCookies = async () => {
  try {
    // Attempt to load Google API
    await new Promise((resolve, reject) => {
      gapi.load('drive-share', {
        callback: resolve,
        onerror: reject,
        timeout: 5000
      });
    });
    return true;
  } catch (error) {
    return false;
  }
};

const initSharing = async (fileId) => {
  const cookiesEnabled = await testThirdPartyCookies();

  if (cookiesEnabled) {
    // Use ShareClient modal
    shareClient.showSettingsDialog();
  } else {
    // Fallback to Drive URL
    window.open(`https://drive.google.com/file/${fileId}/share`, '_blank');
  }
};
```

---

## 6. Important 2025 Changes

### 6.1 Sharing Permission Updates (September 2025)

**Effective Dates:**
- **September 22, 2025:** Restricted access on specific files/folders within shared folders will be discontinued
- **October 8, 2025:** "Editors can change permissions and share" setting changes take effect

**Impact on RiteMark:**
- Users may see different sharing behavior for files in shared folders
- Ensure UI clearly indicates when sharing restrictions apply
- Test with shared folders to verify expected behavior

### 6.2 OAuth Scope Verification (2025)

**New Requirements:**
- Google now requires verification for apps using restricted scopes (`drive`, `drive.readonly`)
- Verification process takes 4-6 weeks
- **Recommendation:** Use `drive.file` scope to avoid verification delay

**Scope Review Process:**
- Reviewers may determine requested scopes are too broad
- May require downscoping to more restrictive permissions
- RiteMark's `drive.file` scope should pass without review

---

## 7. Implementation Recommendations for Sprint 15

### 7.1 File Sharing Feature

**Recommended Approach:**

1. **Primary Method: ShareClient Modal (Desktop)**
   - Use `gapi.drive.share.ShareClient` for desktop browsers
   - Provides native Google Drive sharing experience
   - Handles all permission types (user, group, domain, anyone)

2. **Fallback Method: Direct Drive URL (Mobile/Blocked Cookies)**
   - Detect mobile devices or blocked third-party cookies
   - Open `https://drive.google.com/file/{fileId}/share` in new tab
   - User completes sharing in Drive UI

3. **Advanced Option: Programmatic Permissions API (Future)**
   - Build custom sharing UI in RiteMark
   - Use REST API to create/modify permissions
   - More control, but more complexity (defer to Sprint 16)

**Code Example:**

```javascript
const shareFile = async (fileId) => {
  // Check if third-party cookies enabled
  const canUseShareClient = await testThirdPartyCookies();
  const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);

  if (canUseShareClient && !isMobile) {
    // Desktop with cookies: Use ShareClient modal
    shareClient.setItemIds([fileId]);
    shareClient.showSettingsDialog();
  } else {
    // Mobile or blocked cookies: Open Drive URL
    window.open(`https://drive.google.com/file/${fileId}/share`, '_blank');
  }
};
```

### 7.2 Version History Feature

**Recommended Approach:**

1. **Primary Method: Drive Version History UI**
   - Add "View Version History" button in RiteMark
   - Opens `https://drive.google.com/file/{fileId}/revisions` in new tab
   - Leverages Google's built-in diff viewer (works for Google Docs)

2. **Optional: Revision List in RiteMark**
   - Fetch revisions via API and display in sidebar
   - Show metadata: timestamp, user, file size
   - "View in Drive" button for each revision

3. **Future: Custom Diff Viewer (Sprint 16+)**
   - Download revision content via API
   - Use JavaScript diff library for visual comparison
   - Only feasible for markdown/text files

**Code Example:**

```javascript
const viewVersionHistory = (fileId) => {
  const versionHistoryUrl = `https://drive.google.com/file/${fileId}/revisions`;
  window.open(versionHistoryUrl, '_blank');
};

// Optional: Show revision list in RiteMark UI
const showRevisionList = async (fileId) => {
  const revisions = await listRevisions(fileId);

  const revisionItems = revisions.map(rev => ({
    id: rev.id,
    timestamp: new Date(rev.modifiedTime).toLocaleString(),
    user: rev.lastModifyingUser?.displayName || 'Unknown',
    size: formatBytes(rev.size),
    keepForever: rev.keepForever
  }));

  // Render in sidebar UI
  renderRevisionSidebar(revisionItems);
};
```

### 7.3 OAuth Scope Configuration

**Update OAuth initialization to include `drive.file` scope:**

```javascript
// src/services/googleAuth.ts
export const initGoogleAuth = () => {
  gapi.load('client:auth2', () => {
    gapi.client.init({
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/drive.file', // Sufficient for sharing + revisions
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
    });
  });
};
```

**No additional scopes needed** - `drive.file` provides:
- ✅ File read/write access
- ✅ Permission management (sharing)
- ✅ Revision history access
- ✅ File metadata access

---

## 8. Testing Checklist

### 8.1 Sharing Feature Tests

- [ ] **Desktop Chrome:** ShareClient modal opens correctly
- [ ] **Desktop Firefox:** ShareClient modal opens correctly
- [ ] **Desktop Safari:** ShareClient modal opens correctly
- [ ] **iOS Safari:** Fallback to Drive URL works (pop-up blocker)
- [ ] **Android Chrome:** ShareClient modal works (third-party cookies enabled)
- [ ] **Mobile Firefox:** Fallback to Drive URL works
- [ ] **Share with specific user:** Email input works, permission role selection
- [ ] **Share "Anyone with link":** Public link creation works
- [ ] **List existing permissions:** Displays current collaborators
- [ ] **Remove permission:** Unshare functionality works
- [ ] **Edit permission role:** Change reader → writer, etc.

### 8.2 Version History Tests

- [ ] **Open Drive version history:** URL navigation works
- [ ] **Fetch revision list:** API call returns expected data
- [ ] **Display revision metadata:** Timestamp, user, size shown correctly
- [ ] **Download specific revision:** Content matches expected version
- [ ] **Mark revision "Keep Forever":** API call succeeds, UI updates
- [ ] **Delete revision (blob files only):** Works for images/PDFs, blocked for Google Docs
- [ ] **View revision in Drive:** Opens correct revision in Drive UI
- [ ] **Revision diff (Drive UI):** Google Docs diff viewer works

### 8.3 OAuth & Security Tests

- [ ] **Token refresh:** Automatic refresh before expiration
- [ ] **Token expiry handling:** Re-authentication flow triggers
- [ ] **Scope validation:** Only `drive.file` scope requested
- [ ] **CORS handling:** API calls succeed without CORS errors
- [ ] **CSP compliance:** No violations in browser console
- [ ] **Rate limit handling:** Exponential backoff on 429 errors
- [ ] **Error handling:** Graceful degradation for API failures

---

## 9. Code Examples Summary

### Complete Implementation Template

```javascript
// src/services/driveSharing.ts
import { getAccessToken } from './googleAuth';

let shareClient: any = null;

// Initialize ShareClient (desktop browsers)
export const initShareClient = () => {
  return new Promise((resolve, reject) => {
    gapi.load('drive-share', {
      callback: () => {
        shareClient = new gapi.drive.share.ShareClient();
        const token = getAccessToken();
        shareClient.setOAuthToken(token);
        resolve(shareClient);
      },
      onerror: reject,
      timeout: 5000
    });
  });
};

// Share file (auto-detect best method)
export const shareFile = async (fileId: string) => {
  const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);

  if (!isMobile && shareClient) {
    // Desktop: Use ShareClient modal
    shareClient.setItemIds([fileId]);
    shareClient.showSettingsDialog();
  } else {
    // Mobile: Open Drive URL
    window.open(`https://drive.google.com/file/${fileId}/share`, '_blank');
  }
};

// View version history
export const viewVersionHistory = (fileId: string) => {
  window.open(`https://drive.google.com/file/${fileId}/revisions`, '_blank');
};

// Fetch revision list
export const listRevisions = async (fileId: string) => {
  const token = getAccessToken();
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/revisions?` +
    `fields=revisions(id,modifiedTime,lastModifyingUser,size,keepForever)`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch revisions: ${response.statusText}`);
  }

  const data = await response.json();
  return data.revisions;
};

// Programmatic permission creation
export const createPermission = async (
  fileId: string,
  email: string,
  role: 'reader' | 'writer' | 'commenter' = 'writer'
) => {
  const token = getAccessToken();
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'user',
        role: role,
        emailAddress: email
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to create permission: ${response.statusText}`);
  }

  return response.json();
};
```

---

## 10. References

### Official Documentation
- **Drive API Sharing Dialog:** https://developers.google.com/drive/api/guides/share-button
- **Drive API Revisions:** https://developers.google.com/workspace/drive/api/guides/manage-revisions
- **Drive API Permissions:** https://developers.google.com/workspace/drive/api/reference/rest/v3/permissions
- **OAuth Scopes:** https://developers.google.com/drive/api/guides/api-specific-auth
- **Rate Limits:** https://developers.google.com/drive/api/guides/limits

### REST Endpoints
- **Create Permission:** `POST /drive/v3/files/{fileId}/permissions`
- **List Permissions:** `GET /drive/v3/files/{fileId}/permissions`
- **List Revisions:** `GET /drive/v3/files/{fileId}/revisions`
- **Get Revision:** `GET /drive/v3/files/{fileId}/revisions/{revisionId}`
- **Update Revision:** `PATCH /drive/v3/files/{fileId}/revisions/{revisionId}`

### JavaScript SDK
- **Google API Client:** `https://apis.google.com/js/api.js`
- **ShareClient:** `gapi.drive.share.ShareClient`
- **Drive v3 Discovery:** `https://www.googleapis.com/discovery/v1/apis/drive/v3/rest`

---

## 11. Next Steps for Sprint 15

1. ✅ **Add Share Button to RiteMark Toolbar**
   - Desktop: Use ShareClient modal
   - Mobile: Fallback to Drive URL

2. ✅ **Add Version History Button**
   - Opens Drive version history in new tab
   - Optional: Display revision list in sidebar

3. ✅ **Update OAuth Scope**
   - Ensure `drive.file` scope is included in auth flow

4. ⚠️ **Test Across Browsers**
   - Validate desktop browsers (Chrome, Firefox, Safari)
   - Test mobile browsers (iOS Safari, Android Chrome)
   - Handle third-party cookie blocking

5. 📝 **Update Documentation**
   - Add sharing/version history to user guide
   - Document browser compatibility notes

6. 🔄 **Future Enhancements (Sprint 16+)**
   - Custom revision list UI in RiteMark sidebar
   - Diff viewer for markdown revisions
   - Advanced permission management (custom roles, expiration dates)
