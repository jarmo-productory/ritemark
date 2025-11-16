# Sprint 27: Systematic Debugging Plan

## 🎯 The Problem

We're debugging in the dark:
- ❌ Can't see if token refresh is being called
- ❌ Can't see if it's succeeding or failing
- ❌ Can't see what the backend returns
- ❌ Takes 1 hour to test each change
- ❌ Production logs are scattered

## 🔦 Solution: Comprehensive Observability

### 1. Console Logging Strategy

**Add structured logging at EVERY critical point:**

```typescript
// Log format: [Component] 🔍/🔄/✅/❌ Message + Data Object

// Examples:
console.log('[AuthContext] 🔍 Session restore started', {
  timestamp: Date.now(),
  hasStoredUser: !!storedUser,
  hasStoredTokens: !!storedTokens,
  tokenExpiresAt: tokenData.expiresAt,
  currentTime: Date.now(),
  isExpired: isExpired,
  minutesUntilExpiry: (expiresAt - Date.now()) / 60000
})

console.log('[AuthContext] 🔄 Token refresh started', {
  userId: userInfo?.userId,
  backendAvailable: backendHealth,
  refreshTokenExists: !!refreshToken
})

console.log('[AuthContext] ✅ Token refresh succeeded', {
  newExpiresAt: result.expiresAt,
  newExpiresIn: (result.expiresAt - Date.now()) / 60000 + ' minutes'
})

console.log('[AuthContext] ❌ Token refresh failed', {
  error: result.error,
  errorMessage: result.error?.message,
  willLogout: true
})
```

**Emoji Key:**
- 🔍 = Inspection/Reading state
- 🔄 = Action/Mutation starting
- ✅ = Success
- ❌ = Failure/Error
- ⚠️ = Warning/Fallback

### 2. Fast Expiry Testing

**Problem:** Waiting 1 hour to test token expiry is insane.

**Solution:** URL parameter override

```typescript
// In AuthContext.tsx
const getTokenExpiry = (tokenData: any): number => {
  // Check for debug override
  const urlParams = new URLSearchParams(window.location.search)
  const debugExpiry = urlParams.get('debug_token_expiry')

  if (debugExpiry) {
    const expirySeconds = parseInt(debugExpiry)
    const debugExpiresAt = Date.now() + (expirySeconds * 1000)
    console.warn('[AuthContext] ⚠️ DEBUG MODE: Token expiry overridden', {
      originalExpiry: tokenData.expiresAt,
      debugExpiry: debugExpiresAt,
      expiresInSeconds: expirySeconds
    })
    return debugExpiresAt
  }

  return tokenData.expiresAt
}

// Usage:
const expiresAt = getTokenExpiry(tokenData)
const isExpired = !expiresAt || expiresAt <= Date.now()
```

**Test URLs:**
- `https://ritemark.netlify.app/app?debug_token_expiry=60` - Expires in 1 minute
- `https://ritemark.netlify.app/app?debug_token_expiry=10` - Expires in 10 seconds
- `https://ritemark.netlify.app/app?debug_token_expiry=5` - Expires in 5 seconds

### 3. Visual Debug Panel

**Problem:** Console logs get lost in noise, hard to see state.

**Solution:** In-app debug panel (only visible with `?debug=true`)

```typescript
// components/AuthDebugPanel.tsx
export function AuthDebugPanel() {
  const { user, isAuthenticated } = useAuth()
  const [tokenState, setTokenState] = useState<TokenState | null>(null)

  // Only show if ?debug=true
  const urlParams = new URLSearchParams(window.location.search)
  if (!urlParams.get('debug')) return null

  useEffect(() => {
    const interval = setInterval(async () => {
      const token = await tokenManagerEncrypted.getAccessToken()
      const expiry = tokenManagerEncrypted.accessTokenExpiry

      setTokenState({
        hasToken: !!token,
        expiresAt: expiry,
        isExpired: expiry ? expiry <= Date.now() : true,
        timeRemaining: expiry ? expiry - Date.now() : 0
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      right: 0,
      background: '#000',
      color: '#0f0',
      padding: '10px',
      fontFamily: 'monospace',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '400px'
    }}>
      <div>🔐 Auth Debug Panel</div>
      <div>User: {isAuthenticated ? '✅ Logged In' : '❌ Logged Out'}</div>
      <div>Token: {tokenState?.hasToken ? '✅ Present' : '❌ Missing'}</div>
      <div>Expired: {tokenState?.isExpired ? '❌ YES' : '✅ NO'}</div>
      <div>Time Left: {Math.floor((tokenState?.timeRemaining || 0) / 1000)}s</div>
      <div>User ID: {user?.sub || 'N/A'}</div>
    </div>
  )
}
```

### 4. Testing Procedure

**Step-by-Step Production Testing:**

1. **Sign In**
   ```
   https://ritemark.netlify.app/app
   → Click "Sign in with Google"
   → Complete OAuth
   ```

2. **Enable Debug Mode**
   ```
   https://ritemark.netlify.app/app?debug=true&debug_token_expiry=60
   → Debug panel appears bottom-right
   → Token set to expire in 60 seconds
   ```

3. **Watch the Countdown**
   ```
   Debug panel shows: Time Left: 60s... 59s... 58s...
   Console logs show token state every check
   ```

4. **Wait for Expiry**
   ```
   Time Left: 5s... 4s... 3s... 2s... 1s... 0s
   Token status changes to "Expired: ❌ YES"
   ```

5. **Trigger Page Reload**
   ```
   Press F5 or Cmd+R
   Watch console logs CLOSELY:
   ```

6. **Expected Console Output (Success Case)**
   ```
   [AuthContext] 🔍 Session restore started {hasStoredUser: true, isExpired: true}
   [AuthContext] 🔄 Token refresh started {userId: "107...", backendAvailable: true}
   [TokenManager] 🔄 Calling backend refresh endpoint...
   [TokenManager] ✅ Backend returned new token {expiresIn: 3600}
   [AuthContext] ✅ Token refresh succeeded {newExpiresAt: 1736...}
   [AuthContext] ✅ User session restored
   ```

7. **Expected Console Output (Failure Case)**
   ```
   [AuthContext] 🔍 Session restore started {hasStoredUser: true, isExpired: true}
   [AuthContext] 🔄 Token refresh started {userId: "107...", backendAvailable: true}
   [TokenManager] 🔄 Calling backend refresh endpoint...
   [TokenManager] ❌ Backend returned error {status: 401, error: "refresh_token_not_found"}
   [AuthContext] ❌ Token refresh failed {error: "..."}
   [AuthContext] 🚪 Logging out user
   ```

**The first ❌ in the logs = root cause**

### 5. Network Tab Inspection

**Also check browser DevTools Network tab:**

```
Filter: "refresh-token"

Expected successful request:
POST /.netlify/functions/refresh-token
Status: 200
Response: { access_token: "...", expires_in: 3600 }

Expected failure cases:
Status: 401 → Refresh token not found/expired
Status: 405 → Wrong HTTP method (bug in our code)
Status: 500 → Backend error
```

## 🔄 Debugging Flow Chart

```
Page Reload
    ↓
AuthContext useEffect triggered
    ↓
Check sessionStorage for tokens
    ↓
[LOG: Has tokens? Expired?]
    ↓
Is token expired?
    ├─ NO → Restore session ✅
    └─ YES → Continue to refresh ↓
         ↓
    Restore tokens to memory
         ↓
    [LOG: Tokens restored to memory]
         ↓
    Get userId from localStorage
         ↓
    [LOG: User ID found?]
         ↓
    Call refreshAccessToken()
         ↓
    Check backend health
         ↓
    [LOG: Backend available?]
         ├─ NO → Logout ❌
         └─ YES → Continue ↓
              ↓
         POST to /refresh-token
              ↓
         [LOG: Backend response?]
              ├─ 200 → Success ✅
              ├─ 401 → Refresh token invalid ❌
              ├─ 405 → Method error ❌
              └─ 500 → Server error ❌
```

**Every arrow should have a log statement!**

## 📝 Implementation Checklist

Phase 1: Logging
- [ ] Add log to AuthContext session restore start
- [ ] Add log to token expiry check
- [ ] Add log before refresh attempt
- [ ] Add log to storeTokens result
- [ ] Add log to userId restore
- [ ] Add log to refreshAccessToken call
- [ ] Add log to backend health check
- [ ] Add log to backend response
- [ ] Add log to final success/failure

Phase 2: Debug Override
- [ ] Add getTokenExpiry() helper
- [ ] Add URL param parsing
- [ ] Add debug expiry override
- [ ] Add warning log when debug mode active

Phase 3: Debug Panel
- [ ] Create AuthDebugPanel component
- [ ] Add real-time token state polling
- [ ] Add ?debug=true visibility check
- [ ] Import in App.tsx

Phase 4: Testing
- [ ] Sign in to production
- [ ] Test with 60-second expiry
- [ ] Reload page after expiry
- [ ] Analyze console logs
- [ ] Identify failure point
- [ ] Fix root cause
- [ ] Verify fix works

## 🎯 Success Metrics

We'll know this sprint succeeded when:
1. ✅ We can see the EXACT line where token refresh fails
2. ✅ We can test token expiry in under 2 minutes
3. ✅ Console logs tell us the complete story
4. ✅ Debug panel shows live token state
5. ✅ We fix the real root cause with confidence
