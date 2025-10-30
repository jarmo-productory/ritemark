# PKCE Flow Diagram - RiteMark Implementation

**Current Status**: ✅ Fully Implemented in Sprint 7

---

## 🔄 Complete OAuth 2.0 + PKCE Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     PHASE 1: LOGIN INITIATED                        │
│                   (googleAuth.ts - line 45)                         │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  1. Generate PKCE Challenge                                         │
│     - pkceGenerator.generateChallenge()                             │
│     - Code Verifier: 96 bytes random (128 chars Base64URL)         │
│     - Code Challenge: SHA256(verifier)                              │
│     - Method: S256                                                  │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  2. Generate State (CSRF Protection)                                │
│     - pkceGenerator.generateState()                                 │
│     - 32 bytes random string                                        │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  3. Store in sessionStorage (TEMPORARY)                             │
│     - state: "random-state-string"                                  │
│     - codeVerifier: "random-verifier-string"                        │
│     - timestamp: Date.now()                                         │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  4. Build Authorization URL                                         │
│     https://accounts.google.com/o/oauth2/v2/auth?                   │
│       client_id=YOUR_CLIENT_ID                                      │
│       redirect_uri=YOUR_REDIRECT_URI                                │
│       response_type=code                                            │
│       scope=drive.file                                              │
│       state=RANDOM_STATE              ← CSRF Protection             │
│       code_challenge=SHA256_HASH      ← PKCE Challenge              │
│       code_challenge_method=S256      ← PKCE Method                 │
│       access_type=offline                                           │
│       prompt=consent                                                │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  5. Redirect User to Google OAuth                                   │
│     - User sees consent screen                                      │
│     - User grants permissions                                       │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   PHASE 2: OAUTH CALLBACK                           │
│                (googleAuth.ts - line 93)                            │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  6. Google Redirects Back with Code                                 │
│     https://your-app.com/callback?                                  │
│       code=AUTHORIZATION_CODE                                       │
│       state=RANDOM_STATE                                            │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  7. Validate State (CSRF Check)                                     │
│     - Retrieve stored state from sessionStorage                     │
│     - Compare with received state                                   │
│     - Check timestamp (max 10 minutes old)                          │
│     ✅ If match → Continue                                          │
│     ❌ If mismatch → Abort (CSRF attack detected)                   │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  8. Exchange Code for Tokens (WITH PKCE VERIFIER)                   │
│     POST https://oauth2.googleapis.com/token                        │
│     {                                                               │
│       code: "AUTHORIZATION_CODE",                                   │
│       client_id: "YOUR_CLIENT_ID",                                  │
│       client_secret: "YOUR_CLIENT_SECRET",  ← SERVER-SIDE ONLY      │
│       redirect_uri: "YOUR_REDIRECT_URI",                            │
│       grant_type: "authorization_code",                             │
│       code_verifier: "STORED_VERIFIER"      ← PKCE VERIFIER         │
│     }                                                               │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  9. Google Validates PKCE                                           │
│     - Google calculates SHA256(code_verifier)                       │
│     - Compares with stored code_challenge                           │
│     - ✅ If match → Return tokens                                   │
│     - ❌ If mismatch → Return error                                 │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  10. Store Tokens & Clean Up                                        │
│      - Store access_token in sessionStorage                         │
│      - Store refresh_token in sessionStorage (TODO: encrypt)        │
│      - Clear OAuth state from sessionStorage  ✅                    │
│      - Clear code_verifier from sessionStorage ✅                   │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      USER AUTHENTICATED ✅                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔒 Security Features

### PKCE Protection
```
❌ WITHOUT PKCE (Vulnerable):
Attacker intercepts authorization code
→ Attacker can exchange code for tokens
→ Account compromised

✅ WITH PKCE (Secure):
Attacker intercepts authorization code
→ Attacker doesn't have code_verifier
→ Token exchange fails
→ Account safe
```

### CSRF Protection
```
❌ WITHOUT STATE (Vulnerable):
Attacker tricks user into visiting malicious OAuth URL
→ User unknowingly authorizes attacker's app
→ Tokens sent to attacker
→ Account compromised

✅ WITH STATE (Secure):
Attacker tricks user into visiting malicious OAuth URL
→ State parameter mismatch detected
→ Token exchange aborted
→ Account safe
```

---

## 📊 Implementation Quality

### Code Verifier Generation
```typescript
// pkceGenerator.ts - Line 55
const codeVerifier = this.generateSecureRandom(96);

// Results in:
// - 96 bytes of cryptographically secure random data
// - Base64URL encoded → 128 characters
// - Exceeds RFC 7636 minimum (43 chars)
// - Meets RFC 7636 maximum (128 chars)
```

### Code Challenge Generation
```typescript
// pkceGenerator.ts - Line 58
const digest = await this.sha256(codeVerifier);
const codeChallenge = this.base64URLEncode(digest);

// Results in:
// - SHA256 hash of verifier
// - Base64URL encoded → 43 characters
// - RFC 7636 compliant (S256 method)
```

### Authorization URL
```typescript
// googleAuth.ts - Line 196
const params = new URLSearchParams({
  // ... other params
  code_challenge: codeChallenge,        // ✅ Challenge sent
  code_challenge_method: 'S256',        // ✅ Method specified
});

// Verifier stays in browser (sessionStorage)
// Only challenge sent to Google
```

### Token Exchange
```typescript
// googleAuth.ts - Line 131
const tokens = await this.exchangeCodeForTokens(
  params.code,
  storedState.codeVerifier  // ✅ Verifier sent
);

// Google validates:
// SHA256(codeVerifier) === storedCodeChallenge
```

---

## 🎯 RFC 7636 Compliance Checklist

- ✅ Code verifier: 43-128 characters Base64URL (actual: 128)
- ✅ Code challenge: SHA256 hash of verifier
- ✅ Challenge method: S256 specified in URL
- ✅ Challenge sent in authorization request
- ✅ Verifier sent in token exchange request
- ✅ Verifier never sent in authorization request
- ✅ Cryptographically secure random generation
- ✅ Proper Base64URL encoding (no padding)

---

## 🔐 Storage Security

### During OAuth Flow
```javascript
sessionStorage {
  "ritemark_oauth_state": {
    "state": "random-csrf-token",
    "codeVerifier": "random-pkce-verifier",  // Temporary
    "timestamp": 1730304000000
  }
}
```

### After Token Exchange
```javascript
sessionStorage {
  "ritemark_oauth_tokens": {
    "accessToken": "ya29.xxx",
    "refreshToken": "1//xxx",  // TODO: Encrypt in Phase 2
    "expiresAt": 1730307600000
  }
}

// OAuth state cleared ✅
// Code verifier cleared ✅
```

---

## 🚀 What's Next (Phase 2)

### Current Limitation
```javascript
// tokenManager.ts - Line 39
sessionStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
// ⚠️ Refresh token stored in plaintext
// ⚠️ Vulnerable to XSS attacks
```

### Phase 2 Will Add
```javascript
// Future: crypto.ts
const encryptedToken = await encrypt(refreshToken);
await indexedDB.put('encrypted_refresh_token', encryptedToken);
// ✅ Refresh token encrypted with AES-256-GCM
// ✅ Stored in IndexedDB
// ✅ XSS protection via encryption
```

---

**Current Implementation**: ✅ Production-ready PKCE
**Next Priority**: 🔄 Phase 2 - Token Encryption
**Security Status**: ✅ RFC 7636 Compliant, ready for Phase 2 upgrade
