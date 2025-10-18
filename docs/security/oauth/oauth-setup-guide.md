# OAuth 2.0 Setup & Implementation Guide

**Comprehensive guide for Google OAuth 2.0 implementation in RiteMark**

**Merged from:**
- `/docs/research/google-oauth-setup-2025.md`
- `/docs/oauth2-security-research.md`
- `/docs/research/oauth-component-integration.md`

**Last Updated:** October 18, 2025 (Consolidation)
**Implementation Status:** Sprint 7 Complete ✅

---

## Table of Contents

1. [Google Cloud Console Setup](#google-cloud-console-setup)
2. [OAuth 2.0 Security Best Practices (2025)](#oauth-20-security-best-practices-2025)
3. [React Component Integration](#react-component-integration)
4. [Environment Configuration](#environment-configuration)
5. [Testing & Validation](#testing--validation)

---

## Google Cloud Console Setup

### Step-by-Step OAuth 2.0 Client Creation

#### Step 1: Access Google Cloud Console
1. Navigate to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project or create a new one
3. Go to **APIs & Services > Credentials**

#### Step 2: Create OAuth Client ID
1. Click **"+ Create Credentials"**
2. Select **"OAuth client ID"**
3. Choose **"Web application"** as the application type
4. Enter a descriptive name for your OAuth client

#### Step 3: Configure Client Settings
- **Client Type**: Web application (for JavaScript apps)
- **Security**: JavaScript applications are considered "public clients"
- **Client Secret Handling**: For clients created after June 2025, client secrets are only visible once during creation

> **⚠️ Critical 2025 Update**: Client secrets are only visible and downloadable at creation time. Download and store them securely immediately.

### Required APIs to Enable

#### Enable Google Drive API
1. Go to **APIs & Services > Library**
2. Search for **"Google Drive API"**
3. Click **Enable**

#### API Scope Configuration
Navigate to **APIs & Services > OAuth consent screen** to configure scopes:

```javascript
// Recommended scopes for Drive integration
const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',  // Recommended: Per-file access
  'https://www.googleapis.com/auth/drive.appfolder'  // App-specific folder access
];

// Full access scope (use sparingly)
// 'https://www.googleapis.com/auth/drive'  // Full Drive access - requires verification
```

### Authorized JavaScript Origins Configuration

#### Development Configuration
```
http://localhost:3000
http://localhost:5173
http://127.0.0.1:3000
http://127.0.0.1:5173
```

#### Production Configuration
```
https://yourdomain.com
https://www.yourdomain.com
https://app.yourdomain.com
```

#### Key Requirements
- **HTTPS Required**: All production origins must use HTTPS
- **Localhost Exception**: HTTP allowed for localhost during development
- **Exact Matching**: Origins must match exactly (including ports)
- **Multiple Environments**: Add all necessary development and staging environments

### Redirect URI Best Practices

#### Development Redirect URIs
```
http://localhost:3000/auth/callback
http://localhost:5173/auth/callback
http://127.0.0.1:3000/auth/google/callback
```

#### Production Redirect URIs
```
https://yourdomain.com/auth/callback
https://app.yourdomain.com/auth/google/callback
https://www.yourdomain.com/oauth/callback
```

#### Configuration Best Practices
1. **Exact Match Required**: URLs must match exactly in your application code
2. **Trailing Slash Sensitivity**: `http://localhost:3000` vs `http://localhost:3000/` are different
3. **Separate Clients**: Use different OAuth client IDs for development and production
4. **Path Specificity**: Include the full callback path, not just the domain

### OAuth Consent Screen Configuration

#### Basic Information
- **App Name**: Clear, descriptive application name
- **User Support Email**: Valid support email address
- **Developer Contact Information**: Required email for Google notifications

#### Required Links for Production Apps
- **App Domain**: Primary domain of your application
- **Home Page**: Publicly accessible page describing your app
- **Privacy Policy**: Must be hosted on same domain as home page
- **Terms of Service**: Optional but recommended

#### User Type Configuration
- **Internal**: For Google Workspace organizations only
- **External**: For public applications (requires verification for production)

### Domain Verification Requirements

#### Google Search Console Verification
1. Access [Google Search Console](https://search.google.com/search-console)
2. Add your domain property
3. Verify ownership using one of these methods:
   - HTML file upload
   - HTML tag in head section
   - DNS record
   - Google Analytics
   - Google Tag Manager

#### Verification Requirements
- **All Associated Domains**: Verify domains used in:
  - Home page URL
  - Privacy policy URL
  - Terms of service URL
  - Authorized redirect URIs
  - Authorized JavaScript origins

---

## OAuth 2.0 Security Best Practices (2025)

### Critical Security Requirements

#### 1. Authorization Code + PKCE Flow (MANDATORY)

**PKCE Implementation:**
```javascript
class PKCEAuthFlow {
  async generateCodeChallenge(verifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  generateCodeVerifier() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
}
```

**Why PKCE is Mandatory:**
- Prevents authorization code interception attacks
- Required for all public clients (browser-based apps)
- OAuth 2.1 standard (future-proof)
- No client secret needed for public clients

#### 2. Secure Token Storage Strategy

| Storage Method | Security Level | Recommendation |
|---------------|----------------|----------------|
| **httpOnly Cookies** | 🟢 HIGHEST | ✅ Preferred for production |
| **Encrypted Memory** | 🟢 HIGH | ✅ Ideal for SPAs |
| **sessionStorage** | 🟡 MEDIUM | ⚠️ Short-term only |
| **localStorage** | 🔴 LOW | ❌ Never for tokens |

**RiteMark Implementation (Sprint 7):**
```javascript
// Current: sessionStorage with planned migration to httpOnly cookies
sessionStorage.setItem('ritemark_oauth_tokens', JSON.stringify({
  access_token: accessToken,
  accessToken: accessToken,  // Alias for compatibility
  expires_in: tokenResponse.expires_in,
  scope: tokenResponse.scope,
  token_type: 'Bearer',
  expiresAt: Date.now() + (tokenResponse.expires_in * 1000)
}));
```

#### 3. Required Security Headers

```javascript
// Content Security Policy for OAuth
'Content-Security-Policy': [
  "default-src 'self'",
  "script-src 'self' https://accounts.google.com https://apis.google.com",
  "connect-src 'self' https://oauth2.googleapis.com https://www.googleapis.com",
  "frame-src https://accounts.google.com",  // Required for OAuth popup
  "style-src 'self' 'unsafe-inline'",
  "style-src-elem https://accounts.google.com",  // Google OAuth styles
  "upgrade-insecure-requests"
].join('; ')

// Additional OAuth security headers
'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
'X-Frame-Options': 'DENY'
'X-Content-Type-Options': 'nosniff'
'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'
```

### OAuth Scopes and Scope Minimization

#### Minimal Required Scopes (RiteMark Sprint 7)
```javascript
const OAUTH_SCOPES = [
  'openid',                                              // User identification
  'email',                                               // Email access
  'profile',                                             // Basic profile
  'https://www.googleapis.com/auth/drive.file'          // Per-file access only
];
```

**Scope Justification:**
- `openid` - Required for user identity
- `email` - User identification and account linking
- `profile` - Display name and avatar
- `drive.file` - **Most restrictive** - only files created/opened by RiteMark

**Why `drive.file` instead of `drive`:**
- No Google verification required
- Users grant minimal permissions
- More privacy-friendly
- Faster OAuth approval process

### State Parameter (CSRF Protection)

```javascript
// Generate secure state parameter
function generateState() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode.apply(null, array));
}

// Validate state parameter in callback
function validateState(receivedState) {
  const storedState = sessionStorage.getItem('oauth_state');
  const stateTimestamp = sessionStorage.getItem('oauth_state_timestamp');

  // Check state matches
  if (receivedState !== storedState) {
    throw new Error('Invalid state parameter - possible CSRF attack');
  }

  // Check state not expired (10 minutes max)
  if (Date.now() - parseInt(stateTimestamp) > 10 * 60 * 1000) {
    throw new Error('OAuth state expired');
  }

  // Clear state after validation
  sessionStorage.removeItem('oauth_state');
  sessionStorage.removeItem('oauth_state_timestamp');

  return true;
}
```

### Common OAuth Vulnerabilities to Avoid

#### Authorization Code Injection Prevention
```javascript
// PKCE prevents code injection attacks
class CodeInjectionPrevention {
  static validateAuthorizationResponse(code, state, storedState, codeVerifier) {
    // 1. Validate state parameter (CSRF protection)
    if (state !== storedState) {
      throw new Error('State validation failed - possible CSRF attack');
    }

    // 2. Use PKCE code verifier (prevents code injection)
    const tokenRequest = {
      grant_type: 'authorization_code',
      code: code,
      client_id: 'your-client-id',
      code_verifier: codeVerifier,  // Critical for preventing injection
      redirect_uri: 'https://yourapp.com/callback'
    };

    return this.exchangeCodeForTokens(tokenRequest);
  }
}
```

#### Token Leakage Prevention
```javascript
// Prevent token exposure in URLs and logs
class TokenLeakagePrevention {
  static handleAuthorizationResponse() {
    // ❌ AVOID: Reading tokens from URL fragments
    // const token = new URLSearchParams(window.location.hash.substring(1)).get('access_token');

    // ✅ CORRECT: Use authorization code flow with backend exchange
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code) {
      // Clear URL parameters immediately
      window.history.replaceState({}, document.title, window.location.pathname);

      // Exchange code for tokens
      this.exchangeCodeOnBackend(code, state);
    }
  }
}
```

---

## React Component Integration

### RiteMark OAuth Architecture (Sprint 7 Implementation)

#### Current Implementation: Single-Popup Flow

**Design Philosophy:** Johnny Ive "Invisible Interface"

```typescript
// AuthModal.tsx - Single-popup OAuth implementation
import { useEffect, useState } from 'react';

export function AuthModal() {
  const [tokenClient, setTokenClient] = useState(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    // Initialize OAuth client (runs once on mount)
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile https://www.googleapis.com/auth/drive.file',
      callback: async (tokenResponse) => {
        // 1. Get access token from Google
        const accessToken = tokenResponse.access_token;

        // 2. Fetch user profile using access token
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const userInfo = await response.json();

        // 3. Store user data
        sessionStorage.setItem('ritemark_user', JSON.stringify({
          id: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          verified_email: userInfo.verified_email
        }));

        // 4. Store OAuth tokens
        sessionStorage.setItem('ritemark_oauth_tokens', JSON.stringify({
          access_token: accessToken,
          accessToken: accessToken,  // Alias for TokenManager
          expires_in: tokenResponse.expires_in,
          scope: tokenResponse.scope,
          token_type: 'Bearer',
          expiresAt: Date.now() + (tokenResponse.expires_in * 1000)
        }));

        // 5. Reload page with authentication complete
        window.location.reload();
      }
    });

    setTokenClient(client);
  }, []);

  // Sign in button handler
  const handleSignIn = () => {
    tokenClient.requestAccessToken();  // Single popup
  };

  return (
    <button onClick={handleSignIn}>
      Sign in with Google
    </button>
  );
}
```

#### Component Integration Flow

```
User clicks SettingsButton
    ↓
SettingsButton checks isAuthenticated (via useAuth)
    ↓
If not authenticated:
    → Opens AuthModal
    ↓
AuthModal displays Google sign-in button
    ↓
User clicks Google login
    → tokenClient.requestAccessToken() fires
    → Google shows consent screen (single popup)
    ↓
User approves scopes
    → Google returns access_token
    ↓
App fetches user profile (https://www.googleapis.com/oauth2/v2/userinfo)
    ↓
Store user data + access token in sessionStorage
    ↓
Page reloads
    ↓
User is authenticated ✅
```

### React Context Architecture (Planned for Sprint 8+)

```typescript
// AuthContext.tsx (Future enhancement)
interface AuthContextType {
  user: GoogleUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### Component Integration with Existing App

```typescript
// App.tsx Enhancement (Sprint 7 Complete)
function App() {
  // Existing state unchanged
  const [title, setTitle] = useState('Untitled Document');
  const [text, setText] = useState('');

  return (
    <div className="app">
      <SettingsButton
        onClick={() => {/* Open auth modal or Drive operations */}}
      />
      <Editor title={title} text={text} onChange={setText} />
    </div>
  );
}
```

---

## Environment Configuration

### Development Environment

```bash
# .env.local (development)
VITE_GOOGLE_CLIENT_ID=730176557860-qpl0a6va0jcpi6s351hgv3afqqt01psv.apps.googleusercontent.com
VITE_OAUTH_REDIRECT_URI=http://localhost:5173
VITE_USE_MOCK_OAUTH=false
```

### Production Environment

```bash
# Netlify environment variables (production)
VITE_GOOGLE_CLIENT_ID=730176557860-qpl0a6va0jcpi6s351hgv3afqqt01psv.apps.googleusercontent.com
VITE_OAUTH_REDIRECT_URI=https://ritemark.netlify.app
VITE_USE_MOCK_OAUTH=false
```

### Environment-Specific Configuration Management

```javascript
// config/oauth.js
const getOAuthConfig = () => {
  const config = {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    redirectUri: import.meta.env.VITE_OAUTH_REDIRECT_URI,
    scopes: [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/drive.file'
    ]
  };

  // Validation
  if (!config.clientId) {
    throw new Error('VITE_GOOGLE_CLIENT_ID is required');
  }
  if (!config.redirectUri) {
    throw new Error('VITE_OAUTH_REDIRECT_URI is required');
  }

  return config;
};

export default getOAuthConfig;
```

### Netlify Configuration

```toml
# netlify.toml
[build]
  base = "ritemark-app"
  publish = "dist"
  command = "npm ci && npm run build"

[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self' https://accounts.google.com https://apis.google.com; connect-src 'self' https://oauth2.googleapis.com https://www.googleapis.com; frame-src https://accounts.google.com; style-src 'self' 'unsafe-inline'; style-src-elem https://accounts.google.com; img-src 'self' data: https:; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

---

## Testing & Validation

### Manual Testing Checklist

#### Local Development Testing
- [ ] Run `npm run dev`
- [ ] Click "Sign in with Google"
- [ ] Verify single popup appears
- [ ] Grant all permissions
- [ ] Verify page reloads
- [ ] Check user profile appears
- [ ] Verify sessionStorage has tokens

#### Production Testing
- [ ] Deploy to Netlify
- [ ] Test authentication flow
- [ ] Verify CSP headers don't block OAuth
- [ ] Check console for errors
- [ ] Test logout functionality
- [ ] Verify tokens persist across page refreshes

### Expected Console Logs

```
✅ OAuth client initialized
🔑 Starting authentication...
✅ Authentication complete (user + Drive access)
🔄 Reloading with authentication complete
```

### Security Validation Commands

```bash
# TypeScript compilation (zero errors required)
npm run type-check

# Development server loads without errors
curl -s localhost:5173 | grep -q "RiteMark" && echo "✅ Server OK" || echo "❌ Server FAILED"

# Check browser console for runtime errors (manual step)
# Open localhost:5173 in browser, check DevTools Console
```

### Token Validation

```javascript
// In browser console, verify tokens
JSON.parse(sessionStorage.getItem('ritemark_oauth_tokens'))

// Should show:
{
  access_token: "ya29...",
  accessToken: "ya29...",  // Alias
  expires_in: 3599,
  scope: "openid email profile https://www.googleapis.com/auth/drive.file",
  token_type: "Bearer",
  expiresAt: 1759658543628
}
```

### Common Issues and Troubleshooting

#### Redirect URI Mismatch
- **Error**: `redirect_uri_mismatch`
- **Solution**: Ensure exact match between app code and Google Cloud Console

#### Origin Mismatch
- **Error**: `origin_mismatch`
- **Solution**: Add exact origin (including port) to Authorized JavaScript Origins

#### Client ID Not Found
- **Error**: `invalid_client`
- **Solution**: Verify client ID is correct and environment variables are set

#### CSP Blocking OAuth Popup
- **Error**: Console errors about blocked resources
- **Solution**: Add Google OAuth domains to CSP headers

---

## 2025 Updates Summary

1. **Client Secret Visibility**: Only visible once during creation (June 2025+)
2. **Enhanced Security**: Stricter domain verification requirements
3. **Scope Policies**: Preference for minimal scopes like `drive.file`
4. **PKCE Mandatory**: Required for all public clients
5. **Single-Popup Flow**: Improved UX with combined scopes

---

## References

**Google Documentation:**
- [Google OAuth 2.0 for Web Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google Identity Services](https://developers.google.com/identity/gsi/web)
- [Google Drive API v3 Reference](https://developers.google.com/drive/api/v3/reference)

**Security Standards:**
- [OAuth 2.0 Security Best Current Practice (RFC 8252)](https://tools.ietf.org/html/rfc8252)
- [PKCE by OAuth Public Clients (RFC 7636)](https://tools.ietf.org/html/rfc7636)
- [OAuth 2.0 for Browser-Based Apps](https://datatracker.ietf.org/doc/draft-ietf-oauth-browser-based-apps/)

**React Resources:**
- [@react-oauth/google Documentation](https://github.com/MomenSherif/react-oauth)
- [React Authentication Patterns](https://kentcdodds.com/blog/authentication-in-react-applications)

---

**Document Status:** ✅ Complete
**Implementation Status:** Sprint 7 Complete
**Next Review:** When implementing OAuth changes or security updates
