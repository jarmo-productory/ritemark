# OAuth Token Refresh Implementation Plan

**Priority**: Sprint 18+ (Post-Version History Feature)
**Effort Estimate**: 2-3 days
**Complexity**: HIGH
**Status**: 📋 PLANNED

---

## 🎯 Problem Statement

**Current Issue**: When Google OAuth access tokens expire (1-hour lifetime), RiteMark has no automatic detection or renewal mechanism. Users experience:
- Silent API failures when token expires mid-session
- No automatic redirect to sign-in dialog
- Broken UI requiring manual page refresh

**User Report**: "When login token is expired, our app has no knowledge about it, but actually it should check this over some reasonable times of inactivity and if token expired route to sign-in dialog."

---

## 📊 Google OAuth Token Lifecycles

### Access Tokens
- **Default lifetime**: 1 hour (3,600 seconds)
- **Maximum lifetime**: 12 hours (43,200 seconds) - requires special configuration
- **Best practice**: 30 minutes or less

### Refresh Tokens
- **Testing apps** (OAuth consent screen = "Testing"): 7 days
- **Production apps**: Long-lived until:
  - User revokes access
  - 6 months of inactivity
  - Password change
  - Limit exceeded (100 refresh tokens per Google Account per OAuth client)

### Token Refresh Buffer
- **Current implementation**: 5 minutes before expiry (`TOKEN_REFRESH_BUFFER = 5 * 60 * 1000`)
- **Best practice**: Refresh 5-10 minutes before expiry to avoid edge cases

---

## 🏗️ Current Implementation Status

### ✅ Already Implemented

**File**: `src/services/auth/tokenManager.ts`

1. **Token Expiry Detection** (lines 92-109)
   ```typescript
   isTokenExpired(): boolean {
     const tokens = JSON.parse(sessionStorage.getItem('ritemark_oauth_tokens'))
     return tokens.expiresAt <= Date.now() + TOKEN_REFRESH_BUFFER
   }
   ```

2. **Token Refresh Scheduler** (lines 146-156)
   ```typescript
   scheduleTokenRefresh(expiresAt: number): void {
     const refreshTime = expiresAt - Date.now() - TOKEN_REFRESH_BUFFER
     setTimeout(() => this.refreshAccessToken(), refreshTime)
   }
   ```

3. **Token Retrieval with Expiry Check** (lines 56-78)
   ```typescript
   async getAccessToken(): Promise<string | null> {
     if (tokens.expiresAt && tokens.expiresAt <= Date.now()) {
       const refreshResult = await this.refreshAccessToken()
       return refreshResult.success ? refreshResult.tokens?.accessToken : null
     }
     return tokens.accessToken
   }
   ```

### ❌ Missing Implementation

**File**: `src/services/auth/tokenManager.ts` (lines 116-140)

```typescript
async refreshAccessToken(): Promise<TokenRefreshResult> {
  // TODO: Implement actual token refresh with Google OAuth
  // For now, return failure to trigger re-authentication
  console.warn('Token refresh not yet implemented, user must re-authenticate')
  return {
    success: false,
    error: this.createAuthError(
      AUTH_ERRORS.REFRESH_FAILED,
      'Token refresh requires re-authentication',
      true
    ),
  }
}
```

**Current behavior**: Stubbed - always returns failure, forcing re-authentication.

---

## 🔧 Implementation Plan (Complete Solution)

### Phase 1: Periodic Token Validation (2-3 hours)

**What**: Add interval-based token checks during active sessions

**Files to modify**:
1. `src/hooks/useTokenValidator.ts` - **NEW** hook for periodic validation
2. `src/contexts/AuthContext.tsx` - Integrate periodic checks
3. `src/App.tsx` - Show AuthModal when token expires

**Implementation**:
```typescript
// src/hooks/useTokenValidator.ts
export function useTokenValidator() {
  const { logout } = useAuth()
  const [showAuthDialog, setShowAuthDialog] = useState(false)

  useEffect(() => {
    const checkToken = () => {
      if (tokenManager.isTokenExpired()) {
        console.warn('[TokenValidator] Token expired, logging out')
        logout()
        setShowAuthDialog(true)
      }
    }

    // Check every 5 minutes
    const interval = setInterval(checkToken, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [logout])

  return { showAuthDialog }
}
```

**Validation**:
- ✅ Detects expired tokens automatically
- ✅ Shows sign-in dialog instead of broken UI
- ✅ Zero breaking changes to existing flow

---

### Phase 2: Google OAuth Token Refresh Endpoint (1 day)

**What**: Implement actual token refresh using Google OAuth 2.0 token endpoint

**Files to modify**:
1. `src/services/auth/tokenManager.ts` - Replace stub with real implementation
2. `src/services/auth/oauthClient.ts` - **NEW** Google OAuth API client
3. `src/types/auth.ts` - Update types for refresh response

**Google OAuth Token Endpoint**:
```
POST https://oauth2.googleapis.com/token
Content-Type: application/x-www-form-urlencoded

client_id=YOUR_CLIENT_ID
client_secret=YOUR_CLIENT_SECRET (⚠️ REQUIRES BACKEND)
refresh_token=STORED_REFRESH_TOKEN
grant_type=refresh_token
```

**Response**:
```json
{
  "access_token": "new_access_token",
  "expires_in": 3600,
  "scope": "https://www.googleapis.com/auth/drive.file",
  "token_type": "Bearer"
}
```

**Security Note**: `client_secret` CANNOT be stored in browser - requires backend proxy or PKCE flow.

**Implementation Options**:

**Option A: Backend Proxy (Recommended for Production)**
```typescript
async refreshAccessToken(): Promise<TokenRefreshResult> {
  const refreshToken = this.getRefreshToken()
  if (!refreshToken) {
    return { success: false, error: 'No refresh token' }
  }

  try {
    // Call your backend endpoint (NOT Google directly)
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    })

    const data = await response.json()
    await this.storeTokens(data.tokens)

    return { success: true, tokens: data.tokens }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
```

**Option B: PKCE Flow (Serverless Alternative)**
- Use Proof Key for Code Exchange (PKCE) extension
- No `client_secret` required in browser
- Requires reconfiguring Google OAuth consent screen
- More complex but fully browser-based

**Recommended**: **Option A** - Backend proxy is simpler and more secure.

---

### Phase 3: Retry Logic & Error Recovery (4 hours)

**What**: Handle refresh failures gracefully with exponential backoff

**Files to modify**:
1. `src/services/auth/tokenManager.ts` - Add retry logic
2. `src/hooks/useTokenValidator.ts` - Handle refresh errors

**Implementation**:
```typescript
async refreshAccessToken(retryCount = 0): Promise<TokenRefreshResult> {
  const MAX_RETRIES = 3
  const RETRY_DELAYS = [1000, 2000, 4000] // Exponential backoff

  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: this.getRefreshToken() })
    })

    if (response.status === 401) {
      // Refresh token invalid - force re-authentication
      this.clearTokens()
      return { success: false, error: 'Refresh token expired' }
    }

    if (!response.ok && retryCount < MAX_RETRIES) {
      // Retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[retryCount]))
      return this.refreshAccessToken(retryCount + 1)
    }

    const data = await response.json()
    await this.storeTokens(data.tokens)

    return { success: true, tokens: data.tokens }
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[retryCount]))
      return this.refreshAccessToken(retryCount + 1)
    }
    return { success: false, error: error.message }
  }
}
```

**Error Scenarios**:
1. **Network failure** → Retry with backoff
2. **Refresh token expired** → Clear session, show sign-in
3. **Rate limit (429)** → Exponential backoff
4. **Server error (5xx)** → Retry, then fallback to re-auth

---

### Phase 4: Idle Timeout Detection (4 hours)

**What**: Auto-logout after period of inactivity + warning dialog

**Files to create**:
1. `src/hooks/useIdleTimer.ts` - **NEW** activity tracking hook
2. `src/components/IdleWarningDialog.tsx` - **NEW** warning component

**Implementation**:
```typescript
// src/hooks/useIdleTimer.ts
export function useIdleTimer(timeoutMs = 30 * 60 * 1000) { // 30 min default
  const { logout } = useAuth()
  const [showWarning, setShowWarning] = useState(false)
  const [countdown, setCountdown] = useState(60) // 60 sec warning

  useEffect(() => {
    let idleTimer: NodeJS.Timeout
    let warningTimer: NodeJS.Timeout

    const resetTimer = () => {
      clearTimeout(idleTimer)
      clearTimeout(warningTimer)
      setShowWarning(false)

      // Show warning 1 minute before timeout
      warningTimer = setTimeout(() => {
        setShowWarning(true)
        setCountdown(60)
      }, timeoutMs - 60000)

      // Auto-logout after timeout
      idleTimer = setTimeout(() => {
        logout()
      }, timeoutMs)
    }

    // Track user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach(event => window.addEventListener(event, resetTimer))

    resetTimer() // Start timer

    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer))
      clearTimeout(idleTimer)
      clearTimeout(warningTimer)
    }
  }, [logout, timeoutMs])

  return { showWarning, countdown }
}
```

**Warning Dialog**:
```tsx
// src/components/IdleWarningDialog.tsx
export function IdleWarningDialog({ countdown, onContinue }: Props) {
  return (
    <AlertDialog open={countdown > 0}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Session Expiring Soon</AlertDialogTitle>
          <AlertDialogDescription>
            You'll be logged out in {countdown} seconds due to inactivity.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onContinue}>
            Continue Working
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

---

## 📋 Implementation Checklist

### Sprint 18: Foundation (2-3 hours)
- [ ] Create `useTokenValidator` hook with periodic checks
- [ ] Integrate with AuthContext
- [ ] Show AuthModal on token expiry
- [ ] Test with expired tokens (manually set `expiresAt`)

### Sprint 19: Backend Setup (1 day)
- [ ] Create backend endpoint `/api/auth/refresh`
- [ ] Secure `client_secret` in backend environment variables
- [ ] Test refresh token flow end-to-end
- [ ] Handle 401 (invalid refresh token) gracefully

### Sprint 20: Production Hardening (1 day)
- [ ] Implement retry logic with exponential backoff
- [ ] Add idle timeout detection
- [ ] Create idle warning dialog
- [ ] Add telemetry for refresh failures
- [ ] Document user-facing behavior changes

---

## 🧪 Testing Strategy

### Manual Testing Scenarios
1. **Token expires during editing**
   - Set short token lifetime (1 minute)
   - Edit document for 2 minutes
   - Verify auto-refresh or sign-in dialog

2. **Network failure during refresh**
   - Disconnect network
   - Trigger token refresh
   - Verify retry logic + fallback to re-auth

3. **Idle timeout**
   - Set idle timeout to 1 minute
   - Wait 1 minute without interaction
   - Verify warning dialog appears
   - Verify auto-logout after warning timeout

4. **Refresh token expired**
   - Clear refresh token from sessionStorage
   - Trigger token refresh
   - Verify graceful fallback to sign-in dialog

### Automated Testing
```typescript
// src/services/auth/tokenManager.test.ts
describe('TokenManager', () => {
  test('refreshes token before expiry', async () => {
    // Mock timer and token expiry
    jest.useFakeTimers()
    const tokenManager = new TokenManager()

    // Set token expiring in 6 minutes
    const expiresAt = Date.now() + 6 * 60 * 1000

    // Schedule refresh (should trigger in 1 minute)
    tokenManager.scheduleTokenRefresh(expiresAt)

    // Fast-forward 1 minute
    jest.advanceTimersByTime(60 * 1000)

    // Verify refresh was called
    expect(mockRefreshEndpoint).toHaveBeenCalled()
  })
})
```

---

## 🔐 Security Considerations

### Token Storage
- **Current**: sessionStorage (cleared on tab close)
- **Risk**: XSS attacks can steal tokens
- **Mitigation**:
  - Keep short token lifetimes (30 min access, 7 day refresh)
  - Implement Content Security Policy (CSP)
  - Use `httpOnly` cookies for refresh tokens (requires backend)

### Refresh Token Rotation
- **Best practice**: Issue new refresh token with each access token refresh
- **Prevents**: Refresh token replay attacks
- **Implementation**: Backend must handle refresh token rotation

### Rate Limiting
- **Google limit**: 100 refresh tokens per account per client
- **Mitigation**:
  - Monitor refresh token usage
  - Warn users before hitting limit
  - Implement refresh token cleanup strategy

---

## 📊 Success Metrics

### User Experience
- **Before**: Users see broken UI when token expires
- **After**: Seamless token refresh OR clear sign-in prompt

### Technical Metrics
- **Token refresh success rate**: Target 95%+
- **Average session duration**: Track increase (fewer forced re-auths)
- **Re-authentication frequency**: Target 1/week or less per user

---

## 🚀 Migration Path

### Phase 1: Quick Fix (Sprint 18)
- Add periodic token validation
- Show sign-in dialog on expiry
- **No breaking changes**

### Phase 2: Backend Integration (Sprint 19)
- Deploy backend refresh endpoint
- Feature flag: `ENABLE_AUTO_REFRESH=true`
- Gradual rollout (10% → 50% → 100%)

### Phase 3: Idle Timeout (Sprint 20)
- Add idle detection for security
- Configurable timeout (default 30 min)
- User setting: "Keep me signed in"

---

## 📚 References

### Google OAuth Documentation
- [Using OAuth 2.0 to Access Google APIs](https://developers.google.com/identity/protocols/oauth2)
- [OAuth 2.0 Best Practices](https://developers.google.com/identity/protocols/oauth2/resources/best-practices)
- [Token Expiration Antipatterns](https://cloud.google.com/apigee/docs/api-platform/antipatterns/oauth-long-expiration)

### Implementation Examples
- [Stack Overflow: Google Refresh Tokens](https://stackoverflow.com/questions/8953983/do-google-refresh-tokens-expire)
- [Google Developers Blog: OAuth 2.0 Tokens](https://developers.googleblog.com/2022/04/use-oauth-20-tokens-on-your-website-app.html)

---

**Last Updated**: October 26, 2025
**Next Review**: Sprint 18 Planning
**Owner**: RiteMark Team
