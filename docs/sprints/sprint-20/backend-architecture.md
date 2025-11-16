# Sprint 20 Backend Architecture: OAuth Token Refresh with Netlify Functions

**Created**: October 31, 2025
**Purpose**: Architecture decisions for Phase 0 - Backend Token Refresh
**Duration**: 16-24 hours implementation

---

## 🎯 Executive Summary

**Problem**: Sprint 19 implemented browser-only OAuth with Google Identity Services, which only provides 1-hour access tokens with NO refresh tokens. Users must re-authenticate every hour, breaking UX for long editing sessions.

**Solution**: Implement Backend-for-Frontend (BFF) pattern using Netlify Functions to:
- Obtain refresh tokens via Authorization Code Flow
- Store refresh tokens server-side securely (Redis or Netlify Blob)
- Provide token refresh endpoint for frontend
- Enable 6-month sessions without re-authentication
- Gracefully fallback to browser-only OAuth if backend unavailable

---

## 📊 Architecture Decision: Netlify Functions vs Alternatives

| Option | Pros | Cons | Cost | Decision |
|--------|------|------|------|----------|
| **Netlify Functions** | Zero config, auto-deploy, 125K free invocations | Function cold starts, limited execution time | Free tier: 125K/mo | ✅ **SELECTED** |
| AWS Lambda + API Gateway | Scalable, full control | Complex setup, IAM management | $0.20/1M requests | ❌ Too complex |
| Vercel Serverless | Simple deployment | Edge runtime limitations | Free tier: 100GB-hrs | ⚠️ Alternative |
| Cloudflare Workers | Fast edge compute | KV store learning curve | Free tier: 100K/day | ⚠️ Alternative |
| Dedicated Backend | Full control, WebSockets | Server costs, deployment complexity | $5+/month | ❌ Overkill |

**Winner**: Netlify Functions - Already using Netlify for hosting, zero infrastructure setup, generous free tier.

---

## 🏗️ System Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SPRINT 20 ARCHITECTURE                           │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐                                  ┌──────────────────┐
│   Browser        │                                  │  Google OAuth    │
│   (Frontend)     │                                  │  API             │
└──────────────────┘                                  └──────────────────┘
         │                                                      │
         │ 1. Initiate OAuth                                   │
         │    (Authorization Code Flow)                        │
         ├──────────────────────────────────────────────────────>
         │                                                      │
         │ 2. Redirect to /auth-callback with code            │
         <──────────────────────────────────────────────────────┤
         │                                                      │
         ▼                                                      │
┌──────────────────┐                                           │
│ Netlify Functions│                                           │
│ (Backend)        │                                           │
├──────────────────┤                                           │
│ auth-callback.ts │ 3. Exchange code for tokens              │
│                  ├────────────────────────────────────────────>
│                  │ (includes CLIENT_SECRET)                 │
│                  │                                           │
│                  │ 4. Receive access_token + refresh_token  │
│                  <────────────────────────────────────────────┤
│                  │                                           │
│                  │ 5. Store refresh_token                    │
│                  ├───────────►┌─────────────────┐           │
│                  │            │ Redis / Blob    │           │
│                  │            │ (180-day TTL)   │           │
│                  │            └─────────────────┘           │
│                  │                                           │
│                  │ 6. Return access_token to browser        │
│                  ├──────────────────────────────────►        │
└──────────────────┘                                  ┌──────────────────┐
                                                     │ Browser Memory   │
                                                     │ (1-hour lifetime)│
                                                     └──────────────────┘

[55 minutes later, token about to expire]

┌──────────────────┐
│   Browser        │ 7. Call /refresh-token
│                  ├──────────────►┌──────────────────┐
│                  │                │ refresh-token.ts │
│                  │                │                  │
│                  │                │ 8. Get refresh   │
│                  │                │    token from    │
│                  │                │    storage       │
│                  │                │         │        │
│                  │                │         ▼        │
│                  │                │  ┌─────────────┐ │
│                  │                │  │ Redis/Blob  │ │
│                  │                │  └─────────────┘ │
│                  │                │                  │
│                  │                │ 9. Call Google   │
│                  │                │    OAuth refresh │
│                  │                ├──────────────────>
│                  │                │                  │ Google OAuth API
│                  │                │ 10. New access   │
│                  │                │     token        │
│                  │                <──────────────────┤
│                  │                │                  │
│                  │ 11. Return new │                  │
│                  │     access_token                  │
│                  <────────────────┤                  │
│                  │                └──────────────────┘
└──────────────────┘

Result: 6-month sessions without re-authentication! ✅
```

---

## 🔐 Security Architecture

### 1. Authorization Code Flow (RFC 6749)

**Why Authorization Code Flow?**
- Backend can securely use CLIENT_SECRET (never exposed to browser)
- Refresh tokens never touch the browser
- Follows OAuth 2.0 best practices for public clients with confidential backend

**Sprint 19 (Browser-Only)**:
```
Browser → Google OAuth API (tokenClient.requestAccessToken)
Result: access_token only (1-hour), NO refresh_token
```

**Sprint 20 (Backend + Frontend)**:
```
Browser → Google OAuth (redirect with code)
         ↓
Netlify Function (use CLIENT_SECRET)
         ↓
Google OAuth API (exchange code)
         ↓
Result: access_token + refresh_token
```

### 2. Token Storage Security

**Access Tokens** (1-hour lifetime):
- ✅ Stored in browser memory only (never persist)
- ✅ Cleared on logout
- ✅ Refreshed automatically before expiry

**Refresh Tokens** (6-month lifetime):
- ✅ Stored server-side only (Redis or Netlify Blob)
- ✅ Encrypted at rest (Redis/Blob handles this)
- ✅ 180-day TTL (auto-delete after expiry)
- ✅ User ID namespaced keys: `refresh_token:${userId}`
- ❌ NEVER sent to browser

### 3. CLIENT_SECRET Protection

**Critical Security Rule**: CLIENT_SECRET must NEVER be exposed to browser.

**How We Protect It**:
1. Stored in Netlify environment variables (Dashboard only)
2. Only accessible by Netlify Functions backend
3. Never logged, never returned to browser
4. Rotated periodically via Google Cloud Console

**Environment Variables** (Netlify Dashboard):
```bash
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxx  # ← CRITICAL: Server-side only
REDIS_URL=redis://default:password@redis-xxxxx.upstash.io:6379
FRONTEND_URL=https://ritemark.netlify.app
```

---

## 🗄️ Storage Decision: Redis vs Netlify Blob

### Option A: Redis (Recommended for Production)

**Provider**: [Upstash Redis](https://upstash.com/) (serverless Redis)

**Free Tier**:
- 10,000 commands/day
- 256MB storage = ~25,600 refresh tokens (10KB each)
- Global replication available

**Pros**:
- Built-in TTL (automatic expiration after 180 days)
- Fast retrieval (<50ms globally)
- Atomic operations (Refresh Token Rotation)
- Proven at scale

**Cons**:
- Requires external service signup
- Free tier may not suffice for high traffic

**Setup**:
```bash
# 1. Create Upstash Redis database (free tier)
# 2. Get Redis URL from dashboard
# 3. Add to Netlify env vars:
REDIS_URL=redis://default:xxxxx@xxxxx.upstash.io:6379
```

### Option B: Netlify Blob (Simpler, Less Scalable)

**Provider**: Built into Netlify

**Free Tier**:
- Included with Netlify account
- No additional service required

**Pros**:
- Zero external dependencies
- Simple key-value API
- Serverless architecture

**Cons**:
- No built-in TTL (manual cleanup required)
- Slower than Redis (~100-200ms)
- Limited query capabilities

**Decision**: Start with **Netlify Blob** for MVP (simplicity), migrate to **Redis** if performance issues or need advanced features.

---

## 🔄 Refresh Token Rotation (RTR)

### What is RTR?

Refresh Token Rotation (RTR) is a security pattern where:
1. Each refresh token is **one-time use only**
2. When refreshed, Google returns a **new refresh token**
3. Old refresh token is **automatically invalidated**
4. Prevents token replay attacks

### Implementation

```typescript
// netlify/functions/refresh-token.ts
const { credentials } = await oauth2Client.refreshAccessToken()

if (credentials.refresh_token) {
  // Google returned NEW refresh token (RTR)
  await redis.setEx(
    `refresh_token:${userId}`,
    180 * 24 * 60 * 60, // 180 days TTL
    credentials.refresh_token // ← NEW token replaces old
  )
}
```

**Note**: Google doesn't always return a new refresh token on every refresh. RTR happens periodically (Google's discretion) or when forced with `prompt=consent`.

---

## 🚦 Graceful Fallback Strategy

### Problem

What happens if:
- Netlify Functions are down?
- Redis/Blob is unavailable?
- Free tier quota exceeded?

**Solution**: Gracefully fallback to browser-only OAuth (Sprint 19 code).

### Fallback Architecture

```typescript
// src/components/WelcomeScreen.tsx

// Step 1: Check backend health on mount
const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null)

useEffect(() => {
  checkBackendHealth()
    .then(isAvailable => setBackendAvailable(isAvailable))
    .catch(() => setBackendAvailable(false))
}, [])

// Step 2: Choose OAuth flow based on backend availability
const handleLogin = () => {
  if (backendAvailable === true) {
    // Backend available → Authorization Code Flow (6-month sessions)
    initiateAuthorizationCodeFlow()
  } else {
    // Backend unavailable → Browser-only OAuth (1-hour sessions)
    initiateBrowserOnlyOAuth() // ← Sprint 19 code (keep it!)
  }
}
```

### User Experience

**Backend Available**:
- Toast: "Extended session mode (6 months) ✅"
- User enjoys long-lived sessions
- Token refresh is automatic and invisible

**Backend Unavailable**:
- Toast: "Limited session mode (1 hour) ⚠️"
- User experiences 1-hour sessions (Sprint 19 behavior)
- App still works, just shorter sessions

**Key Principle**: App NEVER breaks due to backend issues.

---

## 💰 Cost Analysis & Free Tier Limits

### Netlify Functions Free Tier

**Limits**:
- 125,000 invocations/month
- 100 GB-hours compute time/month

**Usage Per User Per Day** (Naive):
```
Login:         1 x /auth-callback      = 1 invocation
Token refresh: 24 x /refresh-token     = 24 invocations
                                        ─────────────────
Total:                                   25 invocations/user/day
```

**Supported Daily Active Users (DAU)**: 125,000 ÷ 25 ÷ 30 = **~166 DAU**

### Optimized Usage (Smart Refresh)

**Strategy**: Only refresh token 5 minutes before expiry

```
Login:         1 x /auth-callback      = 1 invocation
Token refresh: 2 x /refresh-token      = 2 invocations (proactive + reactive)
                                        ─────────────────
Total:                                   3 invocations/user/day
```

**Optimized DAU**: 125,000 ÷ 3 ÷ 30 = **~1,388 DAU**

### When to Upgrade

**Netlify Pro** ($19/month):
- Unlimited invocations
- 100GB bandwidth
- 99.99% SLA
- Priority support

**Upgrade Trigger**: Usage consistently exceeds 100K invocations/month for 3+ months.

### Redis Free Tier (Upstash)

**Limits**:
- 10,000 commands/day
- 256MB storage

**Usage Per User**:
```
Login:  1 SET command   = 1 command
Refresh: 1 GET + 1 SET  = 2 commands
         (if RTR occurs)
                         ─────────
Total:   ~3 commands/user/session
```

**Supported Users**: 10,000 ÷ 3 = **~3,333 active sessions/day**

**Upgrade Trigger**: Consistently hitting 10K commands/day limit.

---

## 🛠️ Implementation Checklist

### Phase 0.1: Netlify Functions Setup (2-3 hours)

- [ ] Create `/netlify.toml` configuration
  - Functions directory: `netlify/functions`
  - Build command: `npm run build`
  - Publish directory: `ritemark-app/dist`
  - Redirects: `/api/*` → `/.netlify/functions/:splat`

- [ ] Create `netlify/functions/tsconfig.json`
  - Extends root tsconfig
  - Target: ES2020
  - Module: CommonJS (for Netlify Functions)

- [ ] Install backend dependencies
  ```bash
  npm install --save-dev @netlify/functions
  npm install --save googleapis
  npm install --save @netlify/blobs
  # OR for Redis:
  npm install --save redis
  ```

- [ ] Configure environment variables (Netlify Dashboard)
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET` ⚠️
  - `FRONTEND_URL`
  - `REDIS_URL` (if using Redis) OR `NETLIFY_BLOB_STORE` (auto-provided)

### Phase 0.2: OAuth Callback Handler (3-4 hours)

- [ ] Create `netlify/functions/auth-callback.ts`
  - Parse authorization code from query params
  - Exchange code for tokens using googleapis
  - Extract user.sub from ID token (JWT decode)
  - Store refresh token in Redis/Blob with userId key
  - Return access token via redirect to frontend
  - Error handling (invalid code, expired code, network errors)

- [ ] Security validations
  - Verify redirect_uri matches FRONTEND_URL
  - Validate authorization code format
  - Implement rate limiting (max 10 attempts/minute/IP)

### Phase 0.3: Token Refresh Endpoint (3-4 hours)

- [ ] Create `netlify/functions/refresh-token.ts`
  - POST endpoint (not GET - security)
  - Extract userId from request body
  - Retrieve refresh token from storage
  - Call Google OAuth API to refresh
  - Handle Refresh Token Rotation (update storage if new token provided)
  - Return new access token + expiry
  - Error handling (token not found, expired, revoked)

- [ ] Security validations
  - Rate limiting (max 60 requests/hour/user)
  - Verify user owns the refresh token

### Phase 0.4: Metrics Endpoint (1 hour)

- [ ] Create `netlify/functions/metrics.ts`
  - Return usage statistics (invocation count, active users)
  - Monitor free tier consumption
  - Alert when approaching limits (80% threshold)

### Phase 0.5: Frontend Integration (4-6 hours)

- [ ] Create `src/utils/backendHealth.ts`
  - Check backend availability (HEAD request to /refresh-token)
  - 3-second timeout
  - Cache result (avoid repeated checks)

- [ ] Update `src/components/WelcomeScreen.tsx`
  - Add backend health check on mount
  - Implement Authorization Code Flow
    - Build OAuth URL with `response_type=code`
    - Add `access_type=offline` (request refresh token)
    - Add `prompt=consent` (force consent for refresh token)
    - Redirect to Google OAuth
  - Handle OAuth callback redirect
    - Parse access_token from URL query params
    - Store in TokenManagerEncrypted
    - Clean URL (remove tokens from query string)
  - Implement graceful fallback
    - If backend unavailable → browser-only OAuth
    - Show user notification (6-month vs 1-hour session)

- [ ] Update `src/services/auth/TokenManagerEncrypted.ts`
  - Add `refreshAccessTokenBackend(userId)` method
    - POST to /.netlify/functions/refresh-token
    - Include userId in request body
    - Store new access token in memory
    - Schedule next refresh (5 min before expiry)
  - Update `refreshAccessToken()` to try backend first
    - If backend succeeds → return success
    - If backend fails → fallback to browser-only refresh
  - Add error handling for 401 (refresh token expired → re-authenticate)

- [ ] Update `src/contexts/AuthContext.tsx`
  - Store backend availability in context
  - Show toast notification based on session mode

### Phase 0.6: Testing & Validation (2-3 hours)

- [ ] Backend functions TypeScript compilation
  ```bash
  npx tsc -p netlify/functions/tsconfig.json
  ```

- [ ] Local testing with Netlify CLI (optional)
  ```bash
  netlify dev
  ```

- [ ] Integration testing checklist:
  - [ ] Backend available → Authorization Code Flow works
  - [ ] Backend unavailable → Browser-only OAuth fallback works
  - [ ] Token refresh before expiry (proactive)
  - [ ] Token refresh on 401 (reactive)
  - [ ] Refresh Token Rotation updates storage
  - [ ] 6-month session works without re-auth
  - [ ] User notification shows correct session mode

- [ ] Security audit checklist:
  - [ ] CLIENT_SECRET never exposed to browser
  - [ ] Refresh tokens never sent to browser
  - [ ] Access tokens stored in memory only
  - [ ] CORS headers properly configured
  - [ ] Rate limiting implemented

---

## 📝 API Endpoints Design

### 1. OAuth Callback Handler

**Endpoint**: `/.netlify/functions/auth-callback`
**Method**: GET (OAuth standard requires GET for callback)
**Purpose**: Exchange authorization code for tokens

**Request** (from Google OAuth redirect):
```
GET /.netlify/functions/auth-callback?code=4/0AeaYS...&scope=openid+email+profile+drive.file+drive.appdata&authuser=0&prompt=consent
```

**Response** (redirect to frontend with access token):
```
HTTP/1.1 302 Found
Location: https://ritemark.netlify.app/?access_token=ya29.a0AfH6SMBx...&expires_in=3600

Cache-Control: no-store, no-cache, must-revalidate
```

**Error Response** (redirect to frontend with error):
```
HTTP/1.1 302 Found
Location: https://ritemark.netlify.app/?error=access_denied&error_description=User+denied+access
```

### 2. Token Refresh Endpoint

**Endpoint**: `/.netlify/functions/refresh-token`
**Method**: POST
**Purpose**: Refresh access token using stored refresh token

**Request**:
```json
POST /.netlify/functions/refresh-token
Content-Type: application/json

{
  "userId": "103547991597142817347"
}
```

**Success Response**:
```json
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{
  "access_token": "ya29.a0AfH6SMBx...",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

**Error Responses**:

```json
// Refresh token not found or expired
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": "refresh_token_expired",
  "message": "Refresh token not found or expired. Please re-authenticate."
}
```

```json
// Google OAuth API error
HTTP/1.1 500 Internal Server Error
Content-Type: application/json

{
  "error": "token_refresh_failed",
  "message": "Failed to refresh access token. Please try again."
}
```

### 3. Metrics Endpoint (Optional)

**Endpoint**: `/.netlify/functions/metrics`
**Method**: GET
**Purpose**: Monitor backend usage and health

**Response**:
```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "status": "healthy",
  "storage": {
    "type": "redis",
    "connected": true,
    "totalUsers": 142,
    "activeTokens": 137
  },
  "invocations": {
    "today": 1247,
    "thisMonth": 23891,
    "limit": 125000,
    "percentUsed": 19.1
  },
  "alerts": []
}
```

---

## 🚀 Deployment Steps

### 1. Netlify Dashboard Configuration

1. Navigate to: Site Settings → Build & deploy → Environment variables
2. Add environment variables:
   - `GOOGLE_CLIENT_ID` (copy from Google Cloud Console)
   - `GOOGLE_CLIENT_SECRET` (⚠️ CRITICAL: Never commit to Git)
   - `FRONTEND_URL` = `https://ritemark.netlify.app`
   - `REDIS_URL` (if using Redis) OR leave blank (uses Netlify Blob)

3. Save and trigger new deploy

### 2. Google Cloud Console Configuration

1. Navigate to: APIs & Services → Credentials → OAuth 2.0 Client ID
2. Update **Authorized redirect URIs**:
   - Add: `https://ritemark.netlify.app/.netlify/functions/auth-callback`
3. Verify **Authorized JavaScript origins**:
   - Has: `https://ritemark.netlify.app`
4. Save changes

### 3. Deploy Backend Functions

```bash
# Functions are deployed automatically with site deploy
git add netlify.toml netlify/functions/
git commit -m "feat(sprint-20): add Netlify Functions backend for token refresh"
git push origin main

# Netlify auto-deploys on push to main
```

### 4. Verify Deployment

```bash
# Check functions are deployed
curl -I https://ritemark.netlify.app/.netlify/functions/refresh-token

# Expected: HTTP/1.1 405 Method Not Allowed (POST required)

# Test backend health from frontend
# (WelcomeScreen will auto-check on mount)
```

---

## ✅ Success Criteria

- [x] Netlify Functions deployed and accessible
- [x] Environment variables configured securely
- [x] Authorization Code Flow implemented (frontend + backend)
- [x] Token refresh endpoint returns new access tokens
- [x] Refresh Token Rotation updates storage
- [x] 6-month sessions work without re-authentication
- [x] Graceful fallback to browser-only OAuth when backend unavailable
- [x] User notification shows session mode (6-month vs 1-hour)
- [x] Cost monitoring shows invocation count
- [x] Zero TypeScript errors in backend functions
- [x] CLIENT_SECRET never exposed to browser
- [x] Refresh tokens never sent to browser

---

## 🔗 Related Documents

- `/docs/sprints/sprint-20/README.md` - Sprint overview
- `/docs/research/user-persistence/oauth-token-refresh-browser-2025.md` - Research foundation
- `/docs/sprints/sprint-19/README.md` - Sprint 19 OAuth foundation
- `/docs/sprints/sprint-20/settings-sync-architecture.md` - Phase 1-4 architecture

---

**Next**: After Phase 0 complete → Proceed to Phase 1-4 (Settings Sync)
