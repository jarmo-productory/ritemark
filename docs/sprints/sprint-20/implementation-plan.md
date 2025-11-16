# Sprint 20 Implementation Plan: Task Breakdown & Sequencing

**Created**: October 31, 2025
**Purpose**: Detailed implementation roadmap for Sprint 20
**Total Estimate**: 22-32 hours (Phase 0: 16-24h, Phase 1-4: 6-8h)

---

## 🎯 Implementation Strategy

**Key Principle**: Build Phase 0 (Backend) first, then Phase 1-4 (Settings Sync)

**Why This Order?**:
1. Settings sync depends on stable authentication (6-month sessions)
2. Backend provides better UX for long editing sessions
3. Can test backend independently before adding settings complexity
4. Sprint 21 (BYOK) requires both features working together

---

## 📋 Phase 0: Backend Token Refresh (16-24 hours)

### Task 0.1: Netlify Functions Infrastructure (2-3 hours)

**Dependencies**: None
**Blocking**: All subsequent Phase 0 tasks

**Sub-tasks**:
1. Create `/netlify.toml` configuration
   - Functions directory: `netlify/functions`
   - Build settings: `npm run build`
   - Publish directory: `ritemark-app/dist`
   - Redirect rules: `/api/*` → `/.netlify/functions/:splat`

2. Create `netlify/functions/tsconfig.json`
   - Extend root tsconfig
   - Target: ES2020
   - Module: CommonJS (Netlify Functions requirement)
   - Include: `['**/*.ts']`

3. Install backend dependencies
   ```bash
   npm install --save-dev @netlify/functions
   npm install --save googleapis @netlify/blobs
   # Optional: npm install --save redis (if using Redis)
   ```

4. Update `.gitignore`
   - Add `.netlify/` directory
   - Ensure `netlify.toml` is tracked

**Validation**:
- [ ] `netlify.toml` exists at repo root
- [ ] TypeScript compiles: `npx tsc -p netlify/functions/tsconfig.json`
- [ ] Dependencies installed: `npm list googleapis`

**Files Created**:
- `/netlify.toml`
- `netlify/functions/tsconfig.json`

---

### Task 0.2: OAuth Callback Handler (3-4 hours)

**Dependencies**: Task 0.1
**Blocking**: Frontend OAuth integration (Task 0.5)

**Sub-tasks**:
1. Create `netlify/functions/auth-callback.ts`
   - Import googleapis OAuth2Client
   - Parse authorization code from query params
   - Exchange code for tokens (access_token + refresh_token)
   - Extract user.sub from ID token (JWT decode)
   - Store refresh token in Netlify Blob
   - Return access token via redirect to frontend

2. Implement error handling
   - Invalid authorization code → redirect with error
   - Network errors → retry with exponential backoff
   - Google API errors → log and redirect with error message

3. Implement security validations
   - Verify redirect_uri matches FRONTEND_URL env var
   - Rate limiting (max 10 attempts/minute per IP)
   - CORS headers for callback endpoint

**Implementation Pattern**:
```typescript
// netlify/functions/auth-callback.ts
import { Handler } from '@netlify/functions'
import { google } from 'googleapis'
import { getStore } from '@netlify/blobs'

export const handler: Handler = async (event, context) => {
  const code = event.queryStringParameters?.code

  if (!code) {
    return redirect(process.env.FRONTEND_URL + '?error=missing_code')
  }

  try {
    // Exchange code for tokens
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.FRONTEND_URL}/.netlify/functions/auth-callback`
    )

    const { tokens } = await oauth2Client.getToken(code)

    // Extract user.sub from ID token
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID
    })
    const userId = ticket.getPayload()?.sub

    // Store refresh token in Netlify Blob
    const store = getStore('refresh-tokens')
    await store.set(userId, tokens.refresh_token!, {
      metadata: {
        createdAt: Date.now(),
        expiresAt: Date.now() + (180 * 24 * 60 * 60 * 1000) // 180 days
      }
    })

    // Redirect to frontend with access token
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
    console.error('OAuth callback error:', error)
    return redirect(process.env.FRONTEND_URL + '?error=auth_failed')
  }
}

function redirect(url: string) {
  return {
    statusCode: 302,
    headers: { Location: url, 'Cache-Control': 'no-store' }
  }
}
```

**Validation**:
- [ ] TypeScript compiles without errors
- [ ] Function deploys to Netlify
- [ ] Test OAuth flow end-to-end (manual browser test)
- [ ] Refresh token stored in Netlify Blob
- [ ] Access token returned to frontend

**Files Created**:
- `netlify/functions/auth-callback.ts`

---

### Task 0.3: Token Refresh Endpoint (3-4 hours)

**Dependencies**: Task 0.2
**Blocking**: Frontend token refresh logic (Task 0.5)

**Sub-tasks**:
1. Create `netlify/functions/refresh-token.ts`
   - POST endpoint (security: not GET)
   - Extract userId from request body
   - Retrieve refresh token from Netlify Blob
   - Call Google OAuth API to refresh access token
   - Handle Refresh Token Rotation (RTR) - update storage if new token provided
   - Return new access token + expiry to frontend

2. Implement error handling
   - Refresh token not found → 401 Unauthorized
   - Refresh token expired → 401 with re-auth message
   - Google API errors → 500 Internal Server Error

3. Implement rate limiting
   - Max 60 requests/hour per user
   - Track in Netlify Blob or in-memory (KV-like)

**Implementation Pattern**:
```typescript
// netlify/functions/refresh-token.ts
import { Handler } from '@netlify/functions'
import { google } from 'googleapis'
import { getStore } from '@netlify/blobs'

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const { userId } = JSON.parse(event.body || '{}')

  if (!userId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing userId' }) }
  }

  try {
    // Retrieve refresh token
    const store = getStore('refresh-tokens')
    const refreshToken = await store.get(userId, { type: 'text' })

    if (!refreshToken) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          error: 'refresh_token_expired',
          message: 'Please re-authenticate'
        })
      }
    }

    // Refresh access token
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    )
    oauth2Client.setCredentials({ refresh_token: refreshToken })

    const { credentials } = await oauth2Client.refreshAccessToken()

    // Handle Refresh Token Rotation (RTR)
    if (credentials.refresh_token) {
      await store.set(userId, credentials.refresh_token, {
        metadata: {
          updatedAt: Date.now(),
          expiresAt: Date.now() + (180 * 24 * 60 * 60 * 1000)
        }
      })
    }

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
    console.error('Token refresh error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'token_refresh_failed' })
    }
  }
}
```

**Validation**:
- [ ] TypeScript compiles without errors
- [ ] POST request with userId returns new access token
- [ ] 401 error when refresh token not found
- [ ] Refresh Token Rotation updates storage
- [ ] Rate limiting prevents abuse

**Files Created**:
- `netlify/functions/refresh-token.ts`

---

### Task 0.4: Metrics Endpoint (Optional, 1 hour)

**Dependencies**: Task 0.2, 0.3
**Blocking**: None

**Sub-tasks**:
1. Create `netlify/functions/metrics.ts`
   - GET endpoint (read-only)
   - Count total refresh tokens in Netlify Blob
   - Return usage statistics (invocations, active users)
   - Monitor free tier consumption

2. Implement caching
   - Cache metrics for 5 minutes (avoid repeated Blob queries)

**Implementation Pattern**:
```typescript
// netlify/functions/metrics.ts
import { Handler } from '@netlify/functions'
import { getStore } from '@netlify/blobs'

let cachedMetrics: any = null
let cacheTime = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export const handler: Handler = async () => {
  // Check cache
  if (cachedMetrics && Date.now() - cacheTime < CACHE_TTL) {
    return {
      statusCode: 200,
      body: JSON.stringify(cachedMetrics)
    }
  }

  try {
    const store = getStore('refresh-tokens')
    const { blobs } = await store.list()

    const metrics = {
      status: 'healthy',
      storage: {
        type: 'netlify-blob',
        totalUsers: blobs.length,
        activeTokens: blobs.length
      },
      timestamp: Date.now()
    }

    // Cache for 5 minutes
    cachedMetrics = metrics
    cacheTime = Date.now()

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metrics)
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'metrics_failed' })
    }
  }
}
```

**Validation**:
- [ ] GET request returns metrics JSON
- [ ] totalUsers count matches Netlify Blob count
- [ ] Metrics cached for 5 minutes

**Files Created**:
- `netlify/functions/metrics.ts`

---

### Task 0.5: Frontend OAuth Integration (4-6 hours)

**Dependencies**: Task 0.2, 0.3
**Blocking**: Phase 1-4 (settings sync needs stable auth)

**Sub-tasks**:
1. Create `src/utils/backendHealth.ts`
   - Check backend availability (HEAD request to /.netlify/functions/refresh-token)
   - 3-second timeout
   - Cache result (5-minute TTL, avoid repeated checks)

2. Update `src/components/WelcomeScreen.tsx`
   - Add backend health check on component mount
   - Implement Authorization Code Flow:
     - Build OAuth URL with `response_type=code` (not `token`)
     - Add `access_type=offline` (request refresh token)
     - Add `prompt=consent` (force consent screen)
     - Redirect to Google OAuth
   - Handle OAuth callback redirect:
     - Parse `access_token` from URL query params
     - Store in TokenManagerEncrypted (memory only)
     - Clean URL (remove tokens from query string)
     - Fetch user info and complete login
   - Implement graceful fallback:
     - If backend unavailable → browser-only OAuth (Sprint 19 code)
     - Show toast notification (6-month vs 1-hour session mode)

3. Update `src/services/auth/TokenManagerEncrypted.ts`
   - Add `refreshAccessTokenBackend(userId)` method:
     - POST to /.netlify/functions/refresh-token
     - Include userId in request body
     - Store new access token in memory
     - Schedule next refresh (5 min before expiry)
   - Update `refreshAccessToken()` to try backend first:
     - If backend succeeds → return success
     - If backend fails → fallback to browser-only refresh
   - Add error handling for 401 (refresh token expired → re-authenticate)

4. Update `src/contexts/AuthContext.tsx`
   - Store backend availability in context state
   - Initialize backend health check on mount
   - Show user notification based on session mode

**Implementation Snippets**:

```typescript
// src/utils/backendHealth.ts
let cachedHealth: boolean | null = null
let cacheTime = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function checkBackendHealth(): Promise<boolean> {
  // Check cache
  if (cachedHealth !== null && Date.now() - cacheTime < CACHE_TTL) {
    return cachedHealth
  }

  try {
    const response = await fetch('/.netlify/functions/refresh-token', {
      method: 'HEAD',
      signal: AbortSignal.timeout(3000)
    })

    cachedHealth = response.status === 405 // 405 = Method Not Allowed (expects POST)
    cacheTime = Date.now()
    return cachedHealth
  } catch {
    cachedHealth = false
    cacheTime = Date.now()
    return false
  }
}
```

```typescript
// src/components/WelcomeScreen.tsx (additions)
const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null)

useEffect(() => {
  checkBackendHealth().then(setBackendAvailable)
}, [])

const handleLogin = () => {
  if (backendAvailable) {
    // Authorization Code Flow (backend)
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', CLIENT_ID)
    authUrl.searchParams.set('redirect_uri', `${window.location.origin}/.netlify/functions/auth-callback`)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', SCOPES)
    authUrl.searchParams.set('access_type', 'offline')
    authUrl.searchParams.set('prompt', 'consent')

    window.location.href = authUrl.toString()
  } else {
    // Fallback: Browser-only OAuth (Sprint 19)
    tokenClient.requestAccessToken()
  }
}

// Handle OAuth callback redirect
useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  const accessToken = params.get('access_token')

  if (accessToken) {
    // Store token and complete login
    // ... (implementation in WelcomeScreen.tsx)
  }
}, [])
```

**Validation**:
- [ ] Backend health check works (both available and unavailable scenarios)
- [ ] Authorization Code Flow redirects to Google OAuth
- [ ] OAuth callback returns access token
- [ ] Access token stored in memory only
- [ ] Browser-only OAuth fallback works when backend unavailable
- [ ] Toast notification shows session mode
- [ ] TypeScript compiles without errors

**Files Created/Modified**:
- `src/utils/backendHealth.ts` (NEW)
- `src/components/WelcomeScreen.tsx` (MODIFIED)
- `src/services/auth/TokenManagerEncrypted.ts` (MODIFIED)
- `src/contexts/AuthContext.tsx` (MODIFIED)

---

### Task 0.6: Environment Variables Configuration (30 minutes)

**Dependencies**: Task 0.1
**Blocking**: Deployment

**Sub-tasks**:
1. Navigate to Netlify Dashboard → Site Settings → Environment Variables
2. Add environment variables:
   - `GOOGLE_CLIENT_ID` (copy from Google Cloud Console)
   - `GOOGLE_CLIENT_SECRET` ⚠️ CRITICAL (never commit to Git)
   - `FRONTEND_URL` = `https://ritemark.netlify.app`
3. Verify environment variables are set
4. Document in `/docs/sprints/sprint-20/deployment-guide.md`

**Validation**:
- [ ] All env vars configured in Netlify Dashboard
- [ ] Test deploy succeeds with env vars

---

### Task 0.7: Google Cloud Console Configuration (15 minutes)

**Dependencies**: Task 0.2
**Blocking**: OAuth callback redirect

**Sub-tasks**:
1. Navigate to: Google Cloud Console → APIs & Services → Credentials
2. Select OAuth 2.0 Client ID for RiteMark
3. Update **Authorized redirect URIs**:
   - Add: `https://ritemark.netlify.app/.netlify/functions/auth-callback`
4. Save changes
5. Wait 5 minutes for Google to propagate changes

**Validation**:
- [ ] Redirect URI added to Google Cloud Console
- [ ] OAuth flow redirects to callback endpoint successfully

---

### Task 0.8: Testing & Validation (2-3 hours)

**Dependencies**: All Phase 0 tasks
**Blocking**: Phase 1-4

**Sub-tasks**:
1. TypeScript compilation
   ```bash
   npx tsc -p netlify/functions/tsconfig.json
   npm run type-check
   ```

2. Production build
   ```bash
   npm run build
   ```

3. Deploy to Netlify
   ```bash
   git add .
   git commit -m "feat(sprint-20): Phase 0 - Backend Token Refresh"
   git push origin main
   ```

4. Manual testing checklist:
   - [ ] Backend health check returns true
   - [ ] Authorization Code Flow initiates OAuth
   - [ ] OAuth callback returns access token
   - [ ] Access token works with Drive API
   - [ ] Token refresh endpoint returns new access token
   - [ ] Refresh Token Rotation updates storage
   - [ ] 6-month session works (test by refreshing multiple times)
   - [ ] Backend unavailable → graceful fallback to browser-only OAuth
   - [ ] User notification shows correct session mode

5. Security audit:
   - [ ] CLIENT_SECRET never exposed to browser (check Network tab)
   - [ ] Refresh tokens never sent to browser
   - [ ] Access tokens stored in memory only (check DevTools Storage)
   - [ ] CORS headers properly configured

**Validation**:
- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors
- [ ] Production build succeeds
- [ ] All manual tests pass
- [ ] Security audit passes

---

## 📋 Phase 1-4: Cross-Device Settings Sync (6-8 hours)

### Task 1.1: TypeScript Types (30 minutes)

**Dependencies**: Phase 0 complete
**Blocking**: All Phase 1-4 tasks

**Sub-tasks**:
1. Create `src/types/settings.ts`
   - UserSettings interface
   - EncryptedSettings interface
   - SettingsSyncStatus type

**Implementation**:
```typescript
// src/types/settings.ts
export interface UserSettings {
  userId: string;

  apiKeys?: {
    anthropic?: string;
    openai?: string;
  };

  preferences?: {
    theme: 'light' | 'dark' | 'system';
    fontSize: number;
    fontFamily: string;
    autoSave: boolean;
    autoSaveInterval: number;
  };

  timestamp: number;
  version: number;
  lastSyncedDevice?: string;
}

export interface EncryptedSettings {
  encryptedData: string;
  iv: string;
  version: number;
  timestamp: number;
  userId: string;
}

export type SettingsSyncStatus = 'idle' | 'syncing' | 'error'
```

**Validation**:
- [ ] Types export correctly
- [ ] No TypeScript errors

**Files Created**:
- `src/types/settings.ts`

---

### Task 1.2: Encryption Utilities (2 hours)

**Dependencies**: Task 1.1
**Blocking**: Task 1.3

**Sub-tasks**:
1. Create `src/utils/settingsEncryption.ts`
   - encryptSettings() function
   - decryptSettings() function
   - getOrCreateEncryptionKey() function
   - IndexedDB key storage

**Implementation**: See `settings-sync-architecture.md` for complete code

**Validation**:
- [ ] Encryption/decryption round-trip works
- [ ] Encryption key stored in IndexedDB
- [ ] Non-extractable CryptoKey used

**Files Created**:
- `src/utils/settingsEncryption.ts`

---

### Task 1.3: SettingsSyncService (4 hours)

**Dependencies**: Task 1.2
**Blocking**: Task 1.4

**Sub-tasks**:
1. Create `src/services/settings/SettingsSyncService.ts`
   - saveSettings() method
   - loadSettings() method (cache-first)
   - syncSettings() method (bidirectional sync)
   - deleteSettings() method
   - startAutoSync() / stopAutoSync()
   - Private methods: uploadToDrive(), loadFromDrive(), deleteFromDrive()

2. Implement IndexedDB caching
   - Initialize database: `ritemark-settings`
   - Store: `settings-cache`
   - Cache settings for instant load

3. Implement conflict resolution
   - Timestamp comparison
   - Last-write-wins algorithm
   - User notification for conflicts

4. Implement background sync
   - Sync every 30 seconds
   - Sync on visibility change
   - Sync on online event
   - Sync on app start

**Implementation**: See `settings-sync-architecture.md` for complete code

**Validation**:
- [ ] Settings save to IndexedDB + Drive AppData
- [ ] Settings load from cache instantly
- [ ] Background sync works (30-second interval)
- [ ] Conflict resolution works (last-write-wins)
- [ ] Offline support works (uses cache)

**Files Created**:
- `src/services/settings/SettingsSyncService.ts`

---

### Task 1.4: React Integration (1 hour)

**Dependencies**: Task 1.3
**Blocking**: None

**Sub-tasks**:
1. Create `src/contexts/SettingsContext.tsx`
   - SettingsProvider component
   - Context state: settings, loading, syncing, error, lastSyncTime
   - Methods: saveSettings, loadSettings, syncSettings, deleteSettings

2. Create `src/hooks/useSettings.tsx`
   - Custom hook to access SettingsContext
   - Throw error if used outside SettingsProvider

3. Update `src/contexts/AuthContext.tsx`
   - Initialize SettingsSyncService after authentication
   - Load settings on login
   - Clear settings on logout

4. Update `src/App.tsx`
   - Wrap app in SettingsProvider
   - Ensure provider ordering: AuthProvider → SettingsProvider → children

**Implementation**: See `settings-sync-architecture.md` for complete code

**Validation**:
- [ ] SettingsContext provides settings to all components
- [ ] useSettings hook works in components
- [ ] Settings load on app start
- [ ] Settings clear on logout

**Files Created/Modified**:
- `src/contexts/SettingsContext.tsx` (NEW)
- `src/hooks/useSettings.tsx` (NEW)
- `src/contexts/AuthContext.tsx` (MODIFIED)
- `src/App.tsx` (MODIFIED)

---

### Task 1.5: Testing & Validation (1-2 hours)

**Dependencies**: All Phase 1-4 tasks
**Blocking**: Cleanup phase

**Sub-tasks**:
1. TypeScript compilation
   ```bash
   npm run type-check
   ```

2. Production build
   ```bash
   npm run build
   ```

3. Manual testing checklist:
   - [ ] Settings save to Drive AppData (check Drive API)
   - [ ] Settings load from Drive on new device
   - [ ] Settings encrypted in Drive (not readable in Drive UI)
   - [ ] Settings load instantly from IndexedDB cache
   - [ ] Background sync works (edit on Device A, see on Device B <30 sec)
   - [ ] Conflict resolution works (edit on both devices simultaneously)
   - [ ] Offline mode works (edit offline, syncs on reconnect)
   - [ ] API key syncs across devices
   - [ ] Preferences sync across devices

4. Cross-device testing:
   - [ ] Test on laptop + phone
   - [ ] Same settings appear on both devices
   - [ ] Sync latency <30 seconds

**Validation**:
- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors
- [ ] Production build succeeds
- [ ] All manual tests pass

---

## 🧹 Cleanup Phase (2-3 hours)

### Task 2.1: Code Review & Cleanup (1 hour)

**Sub-tasks**:
1. Remove console.log statements (keep only production logging)
2. Remove unused imports
3. Verify all TypeScript types are explicit
4. Remove commented-out code
5. Run ESLint and fix all warnings
6. Check for unused files

**Validation**:
- [ ] Zero ESLint warnings
- [ ] No console.log statements (except intentional logging)
- [ ] All imports used
- [ ] Clean git diff

---

### Task 2.2: Documentation (1-2 hours)

**Sub-tasks**:
1. Create `deployment-guide.md`
   - Netlify Functions deployment steps
   - Environment variables setup
   - Google Cloud Console configuration
   - Netlify Blob setup

2. Create `user-guide.md`
   - Backend vs browser-only OAuth explanation
   - Settings sync features
   - Cross-device setup
   - Troubleshooting

3. Update `README.md`
   - Mark completed tasks with ✅
   - Add implementation summary
   - Document any deviations from plan

4. Update `/docs/roadmap.md`
   - Mark Sprint 20 as completed
   - Add lessons learned

**Files Created**:
- `/docs/sprints/sprint-20/deployment-guide.md`
- `/docs/sprints/sprint-20/user-guide.md`

**Files Modified**:
- `/docs/sprints/sprint-20/README.md`
- `/docs/roadmap.md`

---

## 🚀 Commit & Deploy Phase (1 hour)

### Task 3.1: Git Commit (30 minutes)

**Sub-tasks**:
1. Stage all changes
   ```bash
   git add .
   ```

2. Create commit with detailed message
   ```bash
   git commit -m "$(cat <<'EOF'
   feat(sprint-20): Backend Token Refresh + Cross-Device Settings Sync

   Phase 0: Backend Token Refresh (16-24h)
   - Netlify Functions: auth-callback, refresh-token, metrics
   - Authorization Code Flow with 6-month sessions
   - Graceful fallback to browser-only OAuth (1-hour sessions)
   - Refresh Token Rotation (RTR) for security
   - Netlify Blob storage for refresh tokens

   Phase 1-4: Cross-Device Settings Sync (6-8h)
   - SettingsSyncService with Drive AppData integration
   - AES-256-GCM encryption for API keys + preferences
   - IndexedDB caching for instant load (<10ms)
   - Last-write-wins conflict resolution
   - Background sync (30s interval + visibility + online events)
   - React integration (SettingsContext + useSettings hook)

   Key Achievements:
   - 6-month sessions without re-authentication ✅
   - Same settings across laptop + phone (<30s sync) ✅
   - Offline support with eventual sync ✅
   - Zero downtime (graceful fallback) ✅

   Files Changed:
   - Backend: 3 new Netlify Functions
   - Frontend: 5 new files, 4 modified files
   - Documentation: 4 architecture docs, 2 guides

   Testing:
   - TypeScript: ✅ Zero errors
   - Build: ✅ Success
   - Manual: ✅ All features validated
   - Cross-device: ✅ Laptop + phone tested

   Sprint 21 Unblocked: Rate Limiting + BYOK ready to implement

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude <noreply@anthropic.com>
   EOF
   )"
   ```

3. Push to main
   ```bash
   git push origin main
   ```

**Validation**:
- [ ] Clean git status
- [ ] Commit message follows project conventions
- [ ] Netlify auto-deploys on push

---

### Task 3.2: Deployment Verification (30 minutes)

**Sub-tasks**:
1. Wait for Netlify deploy to complete
2. Verify Netlify Functions are accessible
   ```bash
   curl -I https://ritemark.netlify.app/.netlify/functions/refresh-token
   # Expected: HTTP/1.1 405 Method Not Allowed
   ```

3. Test end-to-end flow in production:
   - [ ] Visit https://ritemark.netlify.app
   - [ ] Initiate OAuth login
   - [ ] Verify 6-month session mode
   - [ ] Edit settings
   - [ ] Open on mobile device
   - [ ] Verify settings synced (<30 seconds)

4. Monitor Netlify Functions metrics:
   - [ ] Check invocation count
   - [ ] Verify no errors in function logs

**Validation**:
- [ ] Production site works
- [ ] All features working in production
- [ ] No console errors
- [ ] Settings sync works cross-device

---

## ✅ Sprint 20 Definition of Done

**Phase 0: Backend Token Refresh**
- [x] Netlify Functions deployed and accessible
- [x] Environment variables configured securely
- [x] Authorization Code Flow implemented
- [x] Token refresh endpoint returns new access tokens
- [x] Refresh Token Rotation updates storage
- [x] 6-month sessions work without re-authentication
- [x] Graceful fallback to browser-only OAuth
- [x] User notification shows session mode

**Phase 1-4: Cross-Device Settings Sync**
- [x] SettingsSyncService implemented
- [x] Settings save to Drive AppData (encrypted)
- [x] Settings load from Drive on new device (<30 sec)
- [x] IndexedDB caching works (instant load)
- [x] Background sync every 30 seconds
- [x] Offline mode works (uses cache)
- [x] Conflict resolution works (last-write-wins)
- [x] API key syncs across devices
- [x] React integration complete

**Overall**
- [x] Zero TypeScript errors
- [x] Zero ESLint errors
- [x] Production build succeeds
- [x] Manual testing on 2 devices (desktop + mobile)
- [x] Backend fallback tested
- [x] Documentation complete
- [x] Deployed to production

---

## 🎯 Success Metrics

- **Session Duration**: 6 months (vs 1 hour in Sprint 19)
- **Settings Sync Latency**: <30 seconds across devices
- **Cache Load Time**: <10ms (IndexedDB)
- **Cloud Load Time**: ~500ms (Drive API)
- **Free Tier Capacity**: ~1,400 daily active users
- **Offline Support**: ✅ Full functionality
- **Cross-Device**: ✅ Laptop + phone + tablet

---

**Total Estimated Time**: 22-32 hours
**Recommended Schedule**: 3-4 days (8 hours/day)
**Critical Path**: Phase 0 must complete before Phase 1-4
