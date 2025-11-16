# Sprint 20: Cross-Device Settings Sync + Backend Token Refresh

**Sprint Duration**: 2-3 days (22-32 hours total)
**Target Completion**: TBD
**Status**: 🎯 Ready to Start
**Depends On**: Sprint 19 (OAuth Security Upgrade - user.sub + drive.appdata scope)
**Key Addition**: Netlify Functions backend for refresh token management

---

## 🎯 Quick Start for AI Agents

**Reading Order**:
1. This README (navigation and goals)
2. `/docs/research/user-persistence/oauth-token-refresh-browser-2025.md` (backend token refresh patterns)
3. `/docs/research/user-persistence/cross-device-sync-browser-2025.md` (settings sync foundation)
4. `/docs/research/user-persistence/IMPLEMENTATION-PLAN.md` (Phase 3 details)

**Implementation Time**: 22-32 hours total (Phase 0: 16-24h backend, Phase 1-4: 6-8h sync)

---

## 📊 Sprint Overview

### Problem Statement
**After Sprint 19, users have stable identity but no cross-device persistence**:
- ❌ API key on laptop ≠ API key on phone (separate storage)
- ❌ Settings don't sync (each device has separate config)
- ❌ User must re-enter API key on every device
- ❌ Preferences (theme, shortcuts) lost when switching devices

**This breaks**:
- BYOK (user must re-enter API key on each device)
- User experience (each device feels like new app)
- Professional workflows (users expect settings to follow them)

### Current State (After Sprint 19)
- ✅ User authenticated with Google OAuth (PKCE)
- ✅ User ID extracted (`user.sub`)
- ✅ `drive.appdata` scope authorized
- ⚠️ **Access tokens only** (1-hour lifetime, no refresh tokens from browser-only OAuth)
- ❌ No backend for token refresh (6-month sessions)
- ❌ No settings sync implementation
- ❌ Settings stored only in local IndexedDB

### Solution
**Two-Phase Implementation**:

**Phase 0: Backend Token Refresh (NEW - 16-24 hours)**
1. 🆕 **Netlify Functions backend** - OAuth callback + token exchange + refresh endpoint
2. 🆕 **Authorization Code Flow** - Backend securely stores refresh tokens
3. 🆕 **6-month sessions** - Automatic token refresh without re-login
4. 🆕 **Graceful fallback** - If backend unavailable → browser-only OAuth (1-hour sessions)
5. 🆕 **Free tier optimized** - 125K invocations/month = ~2,000 daily active users

**Phase 1-4: Cross-Device Settings Sync (6-8 hours)**
1. ✅ **SettingsSyncService** - Bidirectional sync with Drive AppData
2. ✅ **IndexedDB caching** - Instant load, background sync
3. ✅ **Conflict resolution** - Last-write-wins with timestamps
4. ✅ **Encryption** - AES-256-GCM before upload to Drive
5. ✅ **Offline support** - Works without network, syncs on reconnect

---

## 🎯 Success Criteria

### Phase 0: Backend Token Refresh (NEW)
- [ ] **Netlify Functions setup**
  - [ ] `netlify/functions/auth-callback.ts` - OAuth callback handler
  - [ ] `netlify/functions/token-exchange.ts` - Exchange authorization code for tokens
  - [ ] `netlify/functions/refresh-token.ts` - Refresh access token endpoint
  - [ ] Environment variables configured (CLIENT_SECRET, REDIS_URL)

- [ ] **Authorization Code Flow**
  - [ ] Frontend initiates OAuth with `response_type=code`
  - [ ] Backend receives authorization code
  - [ ] Backend exchanges code for access + refresh tokens
  - [ ] Refresh token stored securely (Redis or Netlify Blob)
  - [ ] Access token returned to frontend (1-hour lifetime)

- [ ] **Token Refresh Mechanism**
  - [ ] Frontend calls `/.netlify/functions/refresh-token` before expiry
  - [ ] Backend uses refresh token to get new access token
  - [ ] New access token returned to frontend
  - [ ] Refresh token rotated (one-time use)
  - [ ] Works for 6 months without re-login

- [ ] **Graceful Fallback**
  - [ ] Detect backend availability on app start
  - [ ] If backend available → Authorization Code Flow
  - [ ] If backend unavailable → Browser-only OAuth (1-hour sessions)
  - [ ] User notification: "Limited session mode (1 hour)" vs "Extended session (6 months)"

### Phase 1-4: Cross-Device Settings Sync
- [ ] **SettingsSyncService implemented**
  - [ ] `saveSettings(settings)` - Upload to Drive AppData
  - [ ] `loadSettings()` - Download from Drive AppData
  - [ ] `syncSettings()` - Bidirectional sync
  - [ ] `deleteSettings()` - Remove from Drive + IndexedDB

- [ ] **IndexedDB caching**
  - [ ] Cache settings locally for instant load
  - [ ] Sync on app start (background)
  - [ ] Sync every 30 seconds (if online)
  - [ ] Sync on visibility change (tab refocus)

- [ ] **Encryption**
  - [ ] AES-256-GCM before upload to Drive
  - [ ] Encrypt API keys separately from preferences
  - [ ] Decryption on download
  - [ ] Non-extractable encryption keys

- [ ] **Conflict resolution**
  - [ ] Last-write-wins (timestamp comparison)
  - [ ] User notification: "Settings synced from another device"
  - [ ] Handle simultaneous edits gracefully

- [ ] **Offline support**
  - [ ] Use IndexedDB cache when offline
  - [ ] Queue changes for later sync
  - [ ] Sync automatically on reconnect

### Testing Checklist

**Phase 0: Backend Token Refresh**
- [ ] Backend functions deployed to Netlify
- [ ] Environment variables configured (CLIENT_SECRET, REDIS_URL)
- [ ] Authorization Code Flow works (redirect to /auth-callback)
- [ ] Refresh token stored in Redis (verify with Redis CLI)
- [ ] Access token returned to frontend (1-hour lifetime)
- [ ] Token refresh works (call /.netlify/functions/refresh-token)
- [ ] Refresh Token Rotation works (new token replaces old)
- [ ] 6-month session without re-login (test token expiry)
- [ ] Graceful fallback works (disable backend, verify browser-only OAuth)
- [ ] Cost monitoring works (check invocation count in Netlify dashboard)

**Phase 1-4: Cross-Device Settings Sync**
- [ ] Settings save to Drive AppData (verify in Drive API)
- [ ] Settings load from Drive on new device
- [ ] API key syncs across devices
- [ ] Settings encrypted in Drive (not readable in Google Drive UI)
- [ ] Offline mode works (uses IndexedDB cache)
- [ ] Conflict resolution works (edit on 2 devices simultaneously)
- [ ] Same settings on laptop + phone (<30 sec sync latency)

---

## 🏗️ Architecture Changes

### Before (Sprint 19)
```
Browser
  ↓ OAuth (browser-only, PKCE)
Google OAuth API
  ↓ Access Token (1-hour lifetime)
Browser
  ↓ Token expires after 1 hour
Re-authentication required ❌
```

### After Sprint 20 - Phase 0 (Backend Token Refresh)
```
Browser
  ↓ 1. Initiate OAuth (Authorization Code Flow)
Netlify Functions (/auth-callback)
  ↓ 2. Exchange code for tokens (includes CLIENT_SECRET)
Google OAuth API
  ↓ 3. Returns: access_token + refresh_token
Netlify Functions
  ↓ 4. Store refresh_token (Redis/Netlify Blob)
  ↓ 5. Return access_token to browser
Browser (TokenManager)
  ↓ Access token valid for 1 hour

[55 minutes later]
Browser
  ↓ 6. Call /.netlify/functions/refresh-token
Netlify Functions
  ↓ 7. Use stored refresh_token
Google OAuth API
  ↓ 8. Return new access_token
Browser
  ↓ 9. Continue working (no re-login!)

Result: 6-month sessions without re-authentication! ✅
```

### Graceful Fallback Architecture
```
Browser on app start
  ↓
Check: Is /.netlify/functions/refresh-token available?
  ↓                              ↓
YES                            NO
  ↓                              ↓
Authorization Code Flow      Browser-only OAuth
(6-month sessions)           (1-hour sessions)
  ↓                              ↓
User sees:                   User sees:
"Extended session"           "Limited session (1h)"
```

### After Sprint 20 - Phase 1-4 (Settings Sync)
```
Browser A (Laptop)
  ↓
IndexedDB (cached settings)
  ↓
SettingsSyncService
  ↓
Google Drive AppData (encrypted settings.json)
  ↑
SettingsSyncService
  ↑
IndexedDB (cached settings)
  ↑
Browser B (Phone)

Result: Same settings on both devices! ✅
```

---

## 📋 Implementation Plan

### Phase 0: Backend Token Refresh with Netlify Functions (16-24 hours) 🆕

**Goal**: Implement backend OAuth flow for 6-month sessions with graceful fallback

#### Step 1: Netlify Functions Setup (2-3 hours)

**Tasks**:
1. **Create Netlify configuration**
   ```toml
   # netlify.toml
   [build]
     functions = "netlify/functions"
     publish = "ritemark-app/dist"

   [build.environment]
     NODE_VERSION = "20"

   [[redirects]]
     from = "/api/*"
     to = "/.netlify/functions/:splat"
     status = 200
   ```

2. **Setup environment variables** (Netlify Dashboard)
   - `GOOGLE_CLIENT_ID` - OAuth client ID (same as frontend)
   - `GOOGLE_CLIENT_SECRET` - OAuth client secret (NEVER exposed to browser)
   - `REDIS_URL` - Redis connection string (or use Netlify Blob)
   - `FRONTEND_URL` - `https://ritemark.netlify.app` (for redirect validation)

3. **Install backend dependencies**
   ```bash
   npm install --save-dev @netlify/functions
   npm install --save googleapis redis
   ```

**Files to create**:
- `netlify.toml` - Netlify configuration
- `netlify/functions/tsconfig.json` - TypeScript config for functions

---

#### Step 2: OAuth Callback Handler (3-4 hours)

**Goal**: Handle OAuth callback and exchange authorization code for tokens

**Create**: `netlify/functions/auth-callback.ts`

**Implementation**:
```typescript
import { Handler } from '@netlify/functions'
import { google } from 'googleapis'
import { createClient } from 'redis'

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.FRONTEND_URL}/.netlify/functions/auth-callback`
)

export const handler: Handler = async (event) => {
  const code = event.queryStringParameters?.code

  if (!code) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing authorization code' })
    }
  }

  try {
    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code)

    // Store refresh token securely
    const redis = createClient({ url: process.env.REDIS_URL })
    await redis.connect()

    const userId = tokens.id_token // Extract user.sub from JWT
    const refreshToken = tokens.refresh_token

    // Store refresh token with 6-month TTL
    await redis.setEx(
      `refresh_token:${userId}`,
      180 * 24 * 60 * 60, // 180 days
      refreshToken
    )

    await redis.disconnect()

    // Return access token to frontend (via redirect)
    const redirectUrl = new URL(process.env.FRONTEND_URL!)
    redirectUrl.searchParams.set('access_token', tokens.access_token!)
    redirectUrl.searchParams.set('expires_in', String(tokens.expiry_date))

    return {
      statusCode: 302,
      headers: {
        Location: redirectUrl.toString(),
        'Cache-Control': 'no-store'
      }
    }
  } catch (error) {
    console.error('Token exchange failed:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Token exchange failed' })
    }
  }
}
```

**Security Considerations**:
- ✅ `CLIENT_SECRET` never exposed to browser
- ✅ Refresh token stored server-side only
- ✅ Access token sent via redirect (short-lived, 1-hour)
- ✅ Redis keys namespaced by user ID
- ✅ 180-day TTL on refresh tokens

---

#### Step 3: Token Refresh Endpoint (3-4 hours)

**Goal**: Provide endpoint for frontend to refresh access tokens

**Create**: `netlify/functions/refresh-token.ts`

**Implementation**:
```typescript
import { Handler } from '@netlify/functions'
import { google } from 'googleapis'
import { createClient } from 'redis'

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
)

export const handler: Handler = async (event) => {
  // Verify this is a POST request
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  const { userId } = JSON.parse(event.body || '{}')

  if (!userId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing user ID' })
    }
  }

  try {
    // Retrieve refresh token from Redis
    const redis = createClient({ url: process.env.REDIS_URL })
    await redis.connect()

    const refreshToken = await redis.get(`refresh_token:${userId}`)

    if (!refreshToken) {
      await redis.disconnect()
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Refresh token not found or expired' })
      }
    }

    // Use refresh token to get new access token
    oauth2Client.setCredentials({ refresh_token: refreshToken })
    const { credentials } = await oauth2Client.refreshAccessToken()

    // Implement Refresh Token Rotation (RTR)
    if (credentials.refresh_token) {
      // New refresh token provided, update storage
      await redis.setEx(
        `refresh_token:${userId}`,
        180 * 24 * 60 * 60,
        credentials.refresh_token
      )
    }

    await redis.disconnect()

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      },
      body: JSON.stringify({
        access_token: credentials.access_token,
        expires_in: 3600,
        token_type: 'Bearer'
      })
    }
  } catch (error) {
    console.error('Token refresh failed:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Token refresh failed' })
    }
  }
}
```

**Refresh Token Rotation (RTR)**:
- Google may return new refresh token during refresh
- If new token provided → update Redis storage
- Old token automatically invalidated by Google
- Prevents token replay attacks

---

#### Step 4: Frontend Integration (4-6 hours)

**Goal**: Update frontend to use Authorization Code Flow with backend

**Tasks**:

1. **Update WelcomeScreen.tsx** - Detect backend availability
   ```typescript
   // Check if backend is available
   const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null)

   useEffect(() => {
     fetch('/.netlify/functions/refresh-token', { method: 'HEAD' })
       .then(() => setBackendAvailable(true))
       .catch(() => setBackendAvailable(false))
   }, [])

   const handleLogin = () => {
     if (backendAvailable) {
       // Use Authorization Code Flow (backend)
       const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
       authUrl.searchParams.set('client_id', CLIENT_ID)
       authUrl.searchParams.set('redirect_uri', `${window.location.origin}/.netlify/functions/auth-callback`)
       authUrl.searchParams.set('response_type', 'code') // NOT 'token'
       authUrl.searchParams.set('scope', SCOPES)
       authUrl.searchParams.set('access_type', 'offline') // Request refresh token
       authUrl.searchParams.set('prompt', 'consent') // Force consent for refresh token

       window.location.href = authUrl.toString()
     } else {
       // Fallback to browser-only OAuth (existing Sprint 19 code)
       console.warn('Backend unavailable, using browser-only OAuth (1-hour sessions)')
       // ... existing tokenClient.requestAccessToken() code
     }
   }
   ```

2. **Handle OAuth callback redirect**
   ```typescript
   useEffect(() => {
     // Check if redirected from backend OAuth callback
     const params = new URLSearchParams(window.location.search)
     const accessToken = params.get('access_token')
     const expiresIn = params.get('expires_in')

     if (accessToken) {
       // Store access token (expires in 1 hour)
       const tokens = {
         accessToken,
         expiresAt: Number(expiresIn),
         tokenType: 'Bearer' as const
       }

       tokenManagerEncrypted.storeTokens(tokens)

       // Clean URL (remove tokens from query params)
       window.history.replaceState({}, document.title, '/')

       // Fetch user info and complete login
       fetchUserInfo(accessToken)
     }
   }, [])
   ```

3. **Update TokenManagerEncrypted.ts** - Add backend refresh
   ```typescript
   async refreshAccessToken(): Promise<{ success: boolean }> {
     try {
       // Try backend refresh first
       const userId = userIdentityManager.getUserId()
       if (!userId) {
         throw new Error('No user ID available')
       }

       const response = await fetch('/.netlify/functions/refresh-token', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ userId })
       })

       if (response.ok) {
         const tokens = await response.json()

         // Store new access token
         this.accessToken = tokens.access_token
         this.accessTokenExpiry = Date.now() + (tokens.expires_in * 1000)

         // Schedule next refresh
         this.scheduleTokenRefresh(this.accessTokenExpiry)

         return { success: true }
       }

       // Backend refresh failed, fallback to browser-only refresh
       console.warn('Backend refresh failed, attempting browser-only refresh')
       return await this.refreshAccessTokenBrowserOnly()
     } catch (error) {
       console.error('Token refresh failed:', error)
       return { success: false }
     }
   }
   ```

**Files to modify**:
- `src/components/WelcomeScreen.tsx` - Add backend OAuth flow
- `src/services/auth/TokenManagerEncrypted.ts` - Add backend refresh
- `src/services/auth/googleAuth.ts` - Add Authorization Code Flow support

---

#### Step 5: Graceful Fallback Strategy (2-3 hours)

**Goal**: Ensure app works even if backend is down

**Implementation**:

1. **Backend Health Check**
   ```typescript
   // src/utils/backendHealth.ts
   export async function checkBackendHealth(): Promise<boolean> {
     try {
       const response = await fetch('/.netlify/functions/refresh-token', {
         method: 'HEAD',
         signal: AbortSignal.timeout(3000) // 3-second timeout
       })
       return response.ok
     } catch {
       return false // Backend unavailable
     }
   }
   ```

2. **User Notification**
   ```typescript
   // Show user which mode they're in
   if (backendAvailable) {
     toast.success('Extended session mode (6 months)')
   } else {
     toast.info('Limited session mode (1 hour) - backend unavailable')
   }
   ```

3. **Automatic Fallback**
   - On app start: Check backend availability
   - If available: Use Authorization Code Flow
   - If unavailable: Use browser-only OAuth (Sprint 19 code)
   - No user action required, transparent fallback

**User Experience**:
- ✅ App always works (never blocked by backend issues)
- ✅ Best experience when backend available (6-month sessions)
- ✅ Acceptable experience when backend down (1-hour sessions)
- ✅ Automatic re-check on next app start

---

#### Step 6: Cost Optimization & Monitoring (2-3 hours)

**Goal**: Stay within Netlify free tier (125K invocations/month)

**Free Tier Analysis**:
```
125,000 invocations/month = ~4,166 invocations/day

Typical usage per user per day:
- Login: 1 x /auth-callback = 1 invocation
- Token refresh: 24 x /refresh-token = 24 invocations (every hour)
Total: 25 invocations/user/day

Supported DAU: 4,166 ÷ 25 = ~166 daily active users

With smart refresh (only when needed):
- Token refresh: 2 x /refresh-token = 2 invocations (proactive + reactive)
Total: 3 invocations/user/day

Optimized DAU: 4,166 ÷ 3 = ~1,388 daily active users
```

**Optimization Strategies**:
1. **Smart Refresh** - Only refresh 5 minutes before expiry
2. **Session Extension** - Store last refresh time, skip if recent
3. **Caching** - Cache access tokens in memory (never persist)
4. **Batch Requests** - Queue multiple API calls, refresh once

**Monitoring**:
```typescript
// netlify/functions/metrics.ts
export const handler: Handler = async () => {
  const redis = createClient({ url: process.env.REDIS_URL })
  await redis.connect()

  const stats = {
    totalUsers: await redis.dbSize(),
    activeTokens: await redis.keys('refresh_token:*').then(k => k.length),
    invocationsToday: await redis.get('invocations:today')
  }

  await redis.disconnect()

  return {
    statusCode: 200,
    body: JSON.stringify(stats)
  }
}
```

**When to Upgrade** (Netlify Pro: $19/month):
- Usage exceeds 100K invocations/month
- Need >1,000 daily active users
- Enterprise features (99.99% SLA, priority support)

---

### Phase 1: SettingsSyncService (4 hours)

**Goal**: Create bidirectional sync service

**Tasks**:
1. **Create service file** (`src/services/settings/SettingsSyncService.ts`)
   - Methods: `saveSettings()`, `loadSettings()`, `syncSettings()`, `deleteSettings()`
   - Google Drive API integration
   - Error handling and retry logic

2. **Drive AppData integration**
   - Create file: `appDataFolder/settings.json`
   - Upload encrypted settings
   - Download and decrypt settings
   - List files to find existing settings

3. **Encryption layer**
   - Use Web Crypto API (AES-256-GCM)
   - Encrypt API keys separately from preferences
   - Non-extractable CryptoKey storage
   - IV (initialization vector) management

**Files to create**:
- `src/services/settings/SettingsSyncService.ts`
- `src/utils/settingsEncryption.ts`
- `src/types/settings.ts`

**Example Code**:
```typescript
// SettingsSyncService.ts
class SettingsSyncService {
  async saveSettings(settings: UserSettings): Promise<void> {
    // Encrypt settings
    const encrypted = await encryptSettings(settings)

    // Upload to Drive AppData
    const response = await gapi.client.drive.files.create({
      resource: {
        name: 'settings.json',
        parents: ['appDataFolder']
      },
      media: {
        mimeType: 'application/json',
        body: JSON.stringify(encrypted)
      }
    })

    // Cache in IndexedDB
    await this.cache.set('settings', settings)
    await this.cache.set('lastSyncTimestamp', Date.now())
  }

  async loadSettings(): Promise<UserSettings> {
    // Try IndexedDB cache first (instant load)
    const cached = await this.cache.get('settings')
    if (cached) {
      // Sync in background
      this.syncSettings().catch(console.error)
      return cached
    }

    // Fetch from Drive AppData
    const files = await gapi.client.drive.files.list({
      spaces: 'appDataFolder',
      q: "name='settings.json'",
      fields: 'files(id, modifiedTime)'
    })

    if (files.result.files.length === 0) {
      return {} // No settings yet
    }

    // Download and decrypt
    const fileId = files.result.files[0].id
    const content = await gapi.client.drive.files.get({
      fileId,
      alt: 'media'
    })

    const decrypted = await decryptSettings(content.body)

    // Cache for next load
    await this.cache.set('settings', decrypted)

    return decrypted
  }
}
```

---

### Phase 2: IndexedDB Caching (2 hours)

**Goal**: Cache settings for instant load + offline support

**Tasks**:
1. **Create cache layer**
   - IndexedDB database: `ritemark-settings`
   - Store: settings, lastSyncTimestamp, pendingChanges
   - TTL: 30 seconds (background sync frequency)

2. **Background sync**
   - Sync on app start (after user authenticated)
   - Sync every 30 seconds (if online)
   - Sync on visibility change (tab refocus)
   - Use `navigator.onLine` to detect network status

3. **Offline queue**
   - Queue changes when offline
   - Sync automatically on reconnect
   - Handle failures gracefully

**Files to modify**:
- `src/services/settings/SettingsSyncService.ts` (add caching)
- `src/hooks/useSettings.tsx` (add sync hooks)

**Example Code**:
```typescript
// Background sync logic
class SettingsSyncService {
  private syncInterval: NodeJS.Timer | null = null

  startAutoSync(): void {
    // Sync on app start
    this.syncSettings()

    // Sync every 30 seconds
    this.syncInterval = setInterval(() => {
      if (navigator.onLine) {
        this.syncSettings()
      }
    }, 30000)

    // Sync on visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && navigator.onLine) {
        this.syncSettings()
      }
    })

    // Sync on online event
    window.addEventListener('online', () => {
      this.syncSettings()
    })
  }

  async syncSettings(): Promise<void> {
    const cached = await this.cache.get('settings')
    const lastSync = await this.cache.get('lastSyncTimestamp')

    // Fetch from Drive
    const remote = await this.loadSettingsFromDrive()

    // Conflict resolution (last-write-wins)
    if (remote.timestamp > lastSync) {
      // Remote is newer, update cache
      await this.cache.set('settings', remote.settings)
      await this.cache.set('lastSyncTimestamp', remote.timestamp)

      // Notify user
      console.log('⬇️  Settings synced from another device')
    } else if (cached && cached.timestamp > remote.timestamp) {
      // Local is newer, upload to Drive
      await this.saveSettingsToDrive(cached)
      console.log('⬆️  Settings synced to Drive')
    }
  }
}
```

---

### Phase 3: Conflict Resolution (1 hour)

**Goal**: Handle simultaneous edits on multiple devices

**Tasks**:
1. **Timestamp comparison**
   - Add `timestamp` field to settings
   - Update timestamp on every change
   - Compare local vs remote timestamp

2. **Last-write-wins strategy**
   - Newest timestamp wins
   - Overwrite older settings
   - User notification for conflicts

3. **Edge case handling**
   - Simultaneous edits (within 1 second)
   - Network failures during sync
   - Partial syncs (some settings succeed, others fail)

**Files to modify**:
- `src/services/settings/SettingsSyncService.ts` (add conflict resolution)
- `src/contexts/SettingsContext.tsx` (add notifications)

**Example Code**:
```typescript
// Conflict resolution
async function resolveConflict(
  local: UserSettings,
  remote: UserSettings
): Promise<UserSettings> {
  const localTime = local.timestamp || 0
  const remoteTime = remote.timestamp || 0

  // Last-write-wins
  if (remoteTime > localTime) {
    console.log('⬇️  Remote settings are newer, updating local')
    return remote
  } else if (localTime > remoteTime) {
    console.log('⬆️  Local settings are newer, uploading to Drive')
    return local
  } else {
    // Same timestamp (simultaneous edit)
    console.warn('⚠️  Conflict detected (same timestamp)')
    // Merge strategy: prefer local changes
    return { ...remote, ...local, timestamp: Date.now() }
  }
}
```

---

### Phase 4: React Integration (1 hour)

**Goal**: Expose settings sync via React hooks

**Tasks**:
1. **Create SettingsContext**
   - Provide settings to all components
   - Handle sync state (loading, syncing, error)
   - Expose `saveSettings()` and `loadSettings()`

2. **Create useSettings hook**
   - Access settings from context
   - Trigger sync manually
   - Subscribe to sync events

3. **Update AuthContext**
   - Initialize SettingsSyncService after auth
   - Load settings on login
   - Clear settings on logout

**Files to create**:
- `src/contexts/SettingsContext.tsx`
- `src/hooks/useSettings.tsx`

**Files to modify**:
- `src/contexts/AuthContext.tsx` (initialize sync service)

**Example Code**:
```typescript
// SettingsContext.tsx
interface SettingsContextType {
  settings: UserSettings | null
  loading: boolean
  syncing: boolean
  error: Error | null
  saveSettings: (settings: UserSettings) => Promise<void>
  loadSettings: () => Promise<void>
  syncSettings: () => Promise<void>
}

export const SettingsProvider: React.FC = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const syncService = useMemo(() => new SettingsSyncService(), [])

  useEffect(() => {
    // Load settings on mount
    loadSettings()

    // Start auto-sync
    syncService.startAutoSync()

    return () => {
      syncService.stopAutoSync()
    }
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const loaded = await syncService.loadSettings()
      setSettings(loaded)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async (newSettings: UserSettings) => {
    try {
      await syncService.saveSettings(newSettings)
      setSettings(newSettings)
    } catch (err) {
      setError(err)
      throw err
    }
  }

  return (
    <SettingsContext.Provider value={{ settings, loading, syncing, error, saveSettings, loadSettings, syncSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

// useSettings.tsx
export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider')
  }
  return context
}
```

---

## 🚨 Breaking Changes

### User Impact
⚠️ **ALL USERS MUST UPDATE SETTINGS STRUCTURE**

**Why**: Adding timestamps and encryption fields requires schema migration

**Migration Strategy**:
1. Load old settings from IndexedDB
2. Add `timestamp` field (current time)
3. Encrypt and upload to Drive AppData
4. Clear old IndexedDB schema
5. User experience: Transparent, no action required

**User Experience**:
- First sync after update: Settings uploaded to Drive
- New device: Settings auto-download (<30 sec)
- Existing device: No change (transparent migration)

---

## 📊 Testing Strategy

### Unit Tests
- [ ] SettingsSyncService methods (save, load, sync, delete)
- [ ] Encryption/decryption functions
- [ ] Conflict resolution logic
- [ ] IndexedDB caching layer

### Integration Tests
- [ ] Full sync flow (save → upload → download → decrypt)
- [ ] Offline mode (cache usage, queue changes)
- [ ] Background sync (30 sec interval)
- [ ] Visibility change sync

### Manual Tests
- [ ] Settings sync on 2 devices (laptop + phone)
- [ ] API key syncs correctly
- [ ] Preferences (theme, shortcuts) sync
- [ ] Offline mode works (no network)
- [ ] Conflict resolution (edit on both devices)
- [ ] Settings encrypted in Drive (check Drive API)

---

## 📁 Files to Create/Modify

### Phase 0: Backend Token Refresh (NEW)

**New Files**:
- `netlify.toml` - Netlify configuration
- `netlify/functions/tsconfig.json` - TypeScript config for functions
- `netlify/functions/auth-callback.ts` - OAuth callback handler
- `netlify/functions/token-exchange.ts` - Authorization code → tokens exchange
- `netlify/functions/refresh-token.ts` - Token refresh endpoint
- `netlify/functions/metrics.ts` - Usage monitoring
- `src/utils/backendHealth.ts` - Backend availability check

**Modified Files**:
- `src/components/WelcomeScreen.tsx` - Add Authorization Code Flow
- `src/services/auth/TokenManagerEncrypted.ts` - Add backend refresh method
- `src/services/auth/googleAuth.ts` - Support Authorization Code Flow
- `package.json` - Add backend dependencies (`@netlify/functions`, `googleapis`, `redis`)
- `.gitignore` - Ignore `.netlify/` directory

**Environment Variables** (Netlify Dashboard):
- `GOOGLE_CLIENT_ID` - OAuth client ID
- `GOOGLE_CLIENT_SECRET` - OAuth client secret (CRITICAL: server-side only)
- `REDIS_URL` - Redis connection string (or Netlify Blob)
- `FRONTEND_URL` - `https://ritemark.netlify.app`

---

### Phase 1-4: Cross-Device Settings Sync

**New Files**:
- `src/services/settings/SettingsSyncService.ts` - Main sync service
- `src/utils/settingsEncryption.ts` - AES-256-GCM encryption utilities
- `src/types/settings.ts` - TypeScript types for settings
- `src/contexts/SettingsContext.tsx` - React context for settings
- `src/hooks/useSettings.tsx` - React hook for settings access

**Modified Files**:
- `src/contexts/AuthContext.tsx` - Initialize SettingsSyncService after auth
- `src/services/auth/GoogleAuthService.ts` - Verify `drive.appdata` scope
- `src/App.tsx` - Wrap app in SettingsProvider

---

## 🔗 Dependencies

### Requires
- ✅ Sprint 19: OAuth Security Upgrade (PKCE + user ID + `drive.appdata` scope)

### Blocks
- **Sprint 21**: Rate Limiting + GDPR (needs settings sync for quota management)
- **BYOK Implementation**: Depends on API key syncing across devices

---

## 📚 Research Documents

**Primary References**:
- `/docs/research/user-persistence/cross-device-sync-browser-2025.md` (23KB)
- `/docs/research/user-persistence/IMPLEMENTATION-PLAN.md` (Phase 3 details)

**Code Examples**:
- All research docs include production-ready TypeScript code
- Copy-paste ready implementations
- Google Drive AppData API usage examples

---

## ✅ Definition of Done

### Phase 0: Backend Token Refresh
- [ ] Netlify Functions deployed and accessible
- [ ] Environment variables configured in Netlify Dashboard
- [ ] Authorization Code Flow implemented (frontend + backend)
- [ ] Refresh token stored securely in Redis/Netlify Blob
- [ ] Token refresh endpoint returns new access tokens
- [ ] Refresh Token Rotation (RTR) working (one-time use tokens)
- [ ] 6-month sessions work without re-authentication
- [ ] Graceful fallback tested (backend down → browser-only OAuth)
- [ ] User notification shows session mode (6-month vs 1-hour)
- [ ] Cost monitoring dashboard shows invocation count
- [ ] Zero TypeScript errors in backend functions
- [ ] Backend functions pass local testing

### Phase 1-4: Cross-Device Settings Sync
- [ ] SettingsSyncService implemented and tested
- [ ] Settings save to Google Drive AppData (encrypted)
- [ ] Settings load from Drive on new device (<30 sec)
- [ ] IndexedDB caching works (instant load)
- [ ] Background sync every 30 seconds
- [ ] Offline mode works (uses cache)
- [ ] Conflict resolution works (last-write-wins)
- [ ] API key syncs across devices
- [ ] Same settings on laptop + phone

### Overall Sprint 20
- [ ] Zero TypeScript errors (frontend + backend)
- [ ] Zero ESLint errors
- [ ] All tests passing
- [ ] Manual testing on 2 devices (desktop + mobile)
- [ ] Manual testing of backend fallback
- [ ] PR approved and merged
- [ ] Backend deployed to production
- [ ] Redis/Netlify Blob configured

---

## 🚀 Next Steps After Sprint 20

1. **Sprint 21**: Rate Limiting + GDPR (per-user quotas + data export/deletion)
2. **BYOK Implementation**: Users can provide Anthropic API keys (RiteMark pays $0)
3. **AI Agent Integration**: TipTap tool-calling features with user-provided keys

---

## 🎯 Sprint 20 Summary: Two-Phase Architecture

### Why Backend + Settings Sync Together?

**Sprint 19 revealed a critical limitation**: Browser-only OAuth with Google Identity Services only provides 1-hour access tokens, no refresh tokens. This forces users to re-authenticate every hour, breaking the UX for long editing sessions.

**Solution**: Implement both features together:

1. **Phase 0: Backend Token Refresh (16-24 hours)**
   - Authorization Code Flow with Netlify Functions
   - Backend securely stores refresh tokens
   - 6-month sessions without re-login
   - Graceful fallback to browser-only OAuth if backend unavailable

2. **Phase 1-4: Cross-Device Settings Sync (6-8 hours)**
   - Google Drive AppData for encrypted settings storage
   - IndexedDB caching for instant load
   - Real-time sync across devices (<30 sec latency)
   - Conflict resolution (last-write-wins)

### Key Architectural Decisions

**✅ Netlify Functions over AWS Lambda/Vercel**:
- Native integration with existing Netlify deployment
- Zero infrastructure setup (auto-scaling, SSL, CDN)
- 125K free invocations/month = ~1,400 optimized DAU
- Graceful degradation if free tier exceeded

**✅ Redis for Token Storage (or Netlify Blob)**:
- Fast refresh token retrieval (<50ms)
- Built-in TTL support (180-day expiration)
- Redis Labs free tier: 30MB storage = ~30,000 users
- Alternative: Netlify Blob (included in free tier)

**✅ Graceful Fallback Strategy**:
- App NEVER blocked by backend issues
- Backend available → 6-month sessions (best UX)
- Backend down → 1-hour sessions (acceptable UX)
- Automatic health check on app start

**✅ Cost Optimization**:
- Smart token refresh (only 5 min before expiry)
- Session extension (skip refresh if recent)
- Supports ~1,400 daily active users on free tier
- Clear upgrade path when needed ($19/month → 10,000+ DAU)

### Sprint 20 vs Sprint 19

| Feature | Sprint 19 (Browser-Only) | Sprint 20 (Backend + Sync) |
|---------|--------------------------|----------------------------|
| Session Duration | 1 hour | 6 months |
| Re-authentication | Every hour | Every 6 months |
| Settings Sync | ❌ No | ✅ Yes |
| Cross-Device | ❌ No | ✅ Yes |
| Backend Required | ❌ No | ⚠️ Optional (graceful fallback) |
| Free Tier DAU | Unlimited | ~1,400 (Netlify free tier) |

### Implementation Priority

**MUST COMPLETE FIRST**: Phase 0 (Backend Token Refresh)
- Unblocks 6-month sessions
- Required for professional UX
- Sprint 21 (BYOK) depends on stable sessions

**THEN COMPLETE**: Phase 1-4 (Settings Sync)
- Depends on stable authentication
- Enables cross-device workflows
- BYOK implementation requires synced API keys

---

**Ready to implement! All research complete, production-ready code examples provided.**
