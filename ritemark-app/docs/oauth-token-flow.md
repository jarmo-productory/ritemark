# OAuth Token Flow - ID Token vs Access Token

## Problem Solved
Previously, the app was storing Google's **ID token** as an `access_token`, which caused API calls to fail with 401 errors. ID tokens are for **identity verification only** and cannot be used to access Google APIs.

## Solution: Hybrid Token Flow

We now use **two separate OAuth flows**:

### 1. **GoogleLogin** (ID Token) - User Identity
- **Library**: `@react-oauth/google`
- **Purpose**: User authentication and identity verification
- **Token Type**: ID Token (JWT)
- **Stored As**: `id_token` in sessionStorage
- **Use Case**: Get user profile (name, email, picture)
- **⚠️ Cannot be used for**: API calls to Drive, Calendar, etc.

### 2. **tokenClient** (Access Token) - API Access
- **Library**: `google.accounts.oauth2.initTokenClient()`
- **Purpose**: Google Drive API access
- **Token Type**: OAuth2 Access Token
- **Stored As**: `access_token` in sessionStorage
- **Use Case**: Make authenticated API calls to Google Drive
- **Scope**: `https://www.googleapis.com/auth/drive.file`

## Flow Diagram

```
User Clicks "Sign In with Google"
           ↓
[GoogleLogin Component]
           ↓
   ✅ Returns ID Token (JWT)
           ↓
   Parse user info (name, email, picture)
           ↓
   Store: id_token, user data
           ↓
[tokenClient.requestAccessToken()]
           ↓
   User grants Drive API permission
           ↓
   ✅ Returns Real Access Token
           ↓
   Store: access_token (overwrites id_token field)
           ↓
   Now ready for Drive API calls! 🚀
```

## Implementation Details

### index.html
```html
<!-- Load Google Identity Services library -->
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

### AuthModal.tsx
```typescript
// Initialize tokenClient for Drive API
useEffect(() => {
  const client = window.google.accounts.oauth2.initTokenClient({
    client_id: VITE_GOOGLE_CLIENT_ID,
    scope: 'https://www.googleapis.com/auth/drive.file',
    callback: (tokenResponse) => {
      // Store REAL access token
      sessionStorage.setItem('ritemark_oauth_tokens', JSON.stringify({
        ...existingTokens,
        access_token: tokenResponse.access_token, // ✅ Real token for API
        expires_in: tokenResponse.expires_in,
        scope: tokenResponse.scope,
        token_type: tokenResponse.token_type,
      }))
    },
  })
  setTokenClient(client)
}, [])

// After GoogleLogin success, request Drive access
const handleGoogleSuccess = (credentialResponse) => {
  // 1. Store user data from ID token
  sessionStorage.setItem('ritemark_user', JSON.stringify(userData))

  // 2. Store ID token (identity only)
  sessionStorage.setItem('ritemark_oauth_tokens', JSON.stringify({
    id_token: credential,
    token_type: 'Bearer',
    expires_in: payload.exp - Date.now(),
  }))

  // 3. Request real access token for Drive API
  if (tokenClient) {
    tokenClient.requestAccessToken() // ✅ Gets real access token
  }
}
```

## Token Storage Format

**After full login flow:**
```json
{
  "id_token": "eyJhbGc...", // For identity verification
  "access_token": "ya29.a0A...", // For Drive API calls
  "token_type": "Bearer",
  "expires_in": 3599,
  "scope": "https://www.googleapis.com/auth/drive.file",
  "expiresAt": 1704845999000
}
```

## Using Tokens in API Calls

### ❌ Wrong (Using ID Token)
```typescript
// This will return 401 Unauthorized!
fetch('https://www.googleapis.com/drive/v3/files', {
  headers: {
    Authorization: `Bearer ${id_token}` // ❌ Won't work
  }
})
```

### ✅ Correct (Using Access Token)
```typescript
const tokens = JSON.parse(sessionStorage.getItem('ritemark_oauth_tokens'))
fetch('https://www.googleapis.com/drive/v3/files', {
  headers: {
    Authorization: `Bearer ${tokens.access_token}` // ✅ Works!
  }
})
```

## Security Notes

1. **ID Token**: Contains user identity info (email, name) - verify but don't use for API calls
2. **Access Token**: Opaque string that grants API access - use for all Drive API requests
3. **Token Expiry**: Access tokens typically expire in 1 hour - implement refresh logic
4. **Scope**: Only request minimum required scope (`drive.file` for file-level access)

## Future Enhancements

- [ ] Implement token refresh when access token expires
- [ ] Add refresh_token support (requires backend)
- [ ] Implement automatic token renewal
- [ ] Add token revocation on logout
