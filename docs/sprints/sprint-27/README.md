# Sprint 27: Systematic Auth Debugging & Production Testing

## 🎯 Goal
Fix persistent logout issue with systematic debugging, comprehensive logging, and fast testing capabilities.

## 📋 Quick Start (Reading Order for AI Agents)
1. **README.md** (this file) - Sprint overview and execution plan
2. **debugging-plan.md** - Systematic debugging approach
3. **implementation-tasks.md** - Specific code changes needed

## 📚 Document Organization

| File | Purpose | Status | Size |
|------|---------|--------|------|
| README.md | Sprint navigation and overview | ✅ Complete | Current |
| debugging-plan.md | Testing strategy and tools | 📝 In Progress | TBD |
| implementation-tasks.md | Code changes and tasks | 📝 Pending | TBD |

## 🔴 Problem Statement

**Issue:** Users still being logged out despite token refresh fix in AuthContext.

**Unknown Factors:**
- Is token refresh actually being called?
- Is backend refresh succeeding or failing?
- What's the exact sequence of events during page reload?
- Why can't we see what's happening in production?

## 🎯 Sprint Objectives

### 1. **Observability** (Make the Invisible Visible)
- Add comprehensive console logging for entire auth flow
- Create visual debug panel showing token state
- Log every step: session restore → token check → refresh attempt → success/failure

### 2. **Fast Testing** (1-Minute Expiry Override)
- Add URL parameter to override token expiry (e.g., `?debug_token_expiry=60`)
- Allow forcing token expiry for immediate testing
- Make it testable in production without waiting 1 hour

### 3. **Systematic Debugging** (Follow the Data)
- Trace exact execution path during page reload
- Verify each assumption with logs
- Identify exact point of failure

### 4. **Production-Safe Testing**
- All debug features behind feature flags
- No impact on normal users
- Easy to enable/disable via URL params

## 🛠️ Implementation Plan

### Phase 1: Enhanced Logging (30 min)
```typescript
// Add detailed logging at every critical point:
console.log('[AuthContext] 🔍 Session restore started', {
  hasStoredUser: !!storedUser,
  hasStoredTokens: !!storedTokens,
  expiresAt: tokenData.expiresAt,
  now: Date.now(),
  isExpired: isExpired,
  timeUntilExpiry: expiresAt - Date.now()
})

console.log('[AuthContext] 🔄 Attempting token refresh...', {
  userId: userInfo?.userId,
  hasRefreshToken: !!refreshToken,
  backendAvailable: backendAvailable
})

console.log('[AuthContext] ✅ Token refresh result:', {
  success: result.success,
  error: result.error,
  newExpiresAt: result.expiresAt
})
```

### Phase 2: Debug Token Expiry Override (20 min)
```typescript
// In AuthContext.tsx - allow fast expiry testing
const debugExpirySeconds = new URLSearchParams(window.location.search).get('debug_token_expiry')
const debugExpiry = debugExpirySeconds
  ? Date.now() + parseInt(debugExpirySeconds) * 1000
  : tokenData.expiresAt

// Use debugExpiry instead of tokenData.expiresAt for testing
```

### Phase 3: Visual Debug Panel (40 min)
```typescript
// Add debug panel component (only visible with ?debug=true)
<AuthDebugPanel
  tokenExpiry={expiresAt}
  isExpired={isExpired}
  lastRefreshAttempt={lastRefreshTime}
  lastRefreshResult={lastRefreshResult}
  backendAvailable={backendAvailable}
  userId={userId}
/>
```

### Phase 4: Systematic Testing (20 min)
1. Sign in to production
2. Add `?debug_token_expiry=60` to URL (1-minute expiry)
3. Wait 1 minute
4. Reload page
5. Watch console logs for exact failure point
6. Check debug panel for state

## 🔍 Debug Checklist

When testing, verify each step:

- [ ] AuthContext session restore triggered
- [ ] Token detected as expired
- [ ] `storeTokens()` called successfully
- [ ] `userId` restored from localStorage
- [ ] `refreshAccessToken()` called
- [ ] Backend health check returns true
- [ ] Backend refresh POST request sent
- [ ] Backend returns 200 with new token
- [ ] New token stored in memory
- [ ] User remains logged in

**First failure point = root cause location**

## 📊 Expected Outcomes

After this sprint:
1. ✅ We know EXACTLY where the token refresh fails
2. ✅ We can test token expiry in 1 minute instead of 1 hour
3. ✅ We can see the entire auth flow in browser console
4. ✅ We have visual confirmation of token state
5. ✅ We can fix the actual root cause with confidence

## 🚀 Success Criteria

- [ ] Can sign in and stay logged in after token expiry + reload
- [ ] Console shows clear logs of successful token refresh
- [ ] Debug panel shows token state accurately
- [ ] Can reproduce and test fix in under 2 minutes
- [ ] No more guessing - we see exactly what's happening

## 📝 Sprint Status

**Current Phase:** ✅ COMPLETED
**Started:** 2025-01-10
**Completed:** 2025-01-11
**Duration:** 1 day

### ✅ Completed Work

**Phase 1: Enhanced Logging** ✅
- Added comprehensive debug logging to `AuthContext.tsx`
- Added debug logging to `TokenManagerEncrypted.ts`
- Implemented emoji-based log markers (🔍🔄✅❌⚠️)

**Phase 2: Debug Token Expiry Override** ✅
- Implemented `?debug_token_expiry=60` URL parameter
- Allows testing token expiry in 60 seconds vs 1 hour
- Verified working in production

**Phase 3: Root Cause Fix** ✅
- Identified: Backend health check rejected 405 status
- Fixed: Modified `checkBackendAvailable()` to accept 405 as valid
- Result: Token refresh now works perfectly

**Phase 4: Log Cleanup** ✅
- Removed noisy logs from `getAccessToken()` during normal operation
- Kept actionable logs for token expiry/refresh events

**Phase 5: Google Picker Fix** ✅
- Identified: Stale closure capturing OAuth token in React state
- Fixed: Removed state, fetch fresh token on every picker open
- Made `showPicker()` async to support just-in-time token fetch
- Updated `DriveFilePicker.tsx` to handle async picker

### 🎯 Issues Resolved

1. **Persistent Logout Bug** - Users no longer logged out after token expiry
2. **Slow Testing** - Can now test in 1 minute with debug parameter
3. **Lack of Observability** - Clear console logs show auth flow
4. **Google Picker Token Expiry** - Picker now uses fresh tokens

### 📊 Production Verification

All fixes deployed and verified working:
- Token refresh returns 200 OK
- Users stay logged in after expiry
- Google Picker works after token refresh
- Clean console output during normal operation

## 🏗️ Architecture Notes

**Key Insight:** We've been fixing blindly without observability. This sprint adds the instrumentation needed to see what's actually happening in production.

**Philosophy:** "If you can't see it, you can't fix it."
