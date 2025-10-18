# OAuth 2.0 Service Architecture for RiteMark
## System Architecture Design Document

**Document Version:** 1.0
**Author:** System Architecture Designer
**Date:** 2025-10-04
**Sprint:** Sprint 7 - Google OAuth Setup
**Status:** DESIGN PHASE

---

## Executive Summary

This document defines the OAuth 2.0 service architecture for RiteMark, a WYSIWYG markdown editor targeting AI-native non-technical users. The architecture implements browser-based Google OAuth with PKCE security, React Context state management, and mobile-first design principles while maintaining RiteMark's "invisible interface" philosophy.

**Key Architecture Decisions:**
1. **Browser-only OAuth flow** - No backend server complexity
2. **PKCE with S256** - Industry-standard security for public clients
3. **React Context for global state** - Unified auth state management
4. **Mock OAuth service** - Development workflow without Google Cloud dependency
5. **Mobile-first security** - Touch-optimized with WebView detection

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Principles](#architecture-principles)
3. [Service Layer Architecture](#service-layer-architecture)
4. [Data Flow Architecture](#data-flow-architecture)
5. [Component Integration Architecture](#component-integration-architecture)
6. [Security Architecture](#security-architecture)
7. [TypeScript Type System](#typescript-type-system)
8. [Error Handling Architecture](#error-handling-architecture)
9. [Testing Strategy](#testing-strategy)
10. [Deployment Architecture](#deployment-architecture)
11. [Architecture Decision Records](#architecture-decision-records)

---

## 1. System Overview

### 1.1 Context Diagram (C4 Model - Level 1)

```
┌─────────────────────────────────────────────────────────────┐
│                    RiteMark Ecosystem                        │
│                                                              │
│  ┌──────────────┐                    ┌──────────────────┐  │
│  │   Browser    │◄──────────────────►│   Google OAuth   │  │
│  │   (User)     │   OAuth 2.0 Flow   │   Identity       │  │
│  └──────────────┘                    └──────────────────┘  │
│         │                                      │            │
│         │                                      │            │
│         ▼                                      ▼            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          RiteMark Web Application                     │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │  React UI Layer                                  │ │  │
│  │  │  - Editor Component                              │ │  │
│  │  │  - SettingsButton                                │ │  │
│  │  │  - AuthModal                                     │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │  Auth Context & State Management                │ │  │
│  │  │  - useAuth Hook                                  │ │  │
│  │  │  - AuthProvider                                  │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │  OAuth Service Layer                            │ │  │
│  │  │  - GoogleAuth Service                           │ │  │
│  │  │  - TokenManager                                  │ │  │
│  │  │  - PKCE Generator                                │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘

Future Integration (Sprint 8+):
  │
  ▼
┌────────────────────┐
│ Google Drive API   │
│ - File Operations  │
│ - Real-time Sync   │
└────────────────────┘
```

### 1.2 System Constraints

**Technical Constraints:**
- Browser-only environment (no backend server)
- HTTPS required for production OAuth
- Mobile browser compatibility (iOS Safari, Chrome)
- sessionStorage limitations (5-10MB)
- CORS restrictions with Google OAuth servers

**Security Constraints:**
- OAuth 2.0 for public clients (PKCE required)
- No client secrets in browser code
- Token storage security limitations
- CSP header restrictions

**Business Constraints:**
- Invisible interface philosophy (no technical complexity exposed)
- Mobile-first user experience
- Zero regression in existing editor features
- Development workflow without Google Cloud dependency

---

## 2. Architecture Principles

### 2.1 Design Principles

**1. Security by Design**
- PKCE mandatory for all OAuth flows
- State parameter for CSRF protection
- Secure token storage with encryption
- Content Security Policy enforcement
- Minimal scope requests (drive.file only)

**2. Progressive Enhancement**
- Editor functions without authentication
- OAuth adds cloud capabilities incrementally
- Graceful degradation on OAuth failures
- Anonymous mode always available

**3. Mobile-First Architecture**
- Touch-optimized OAuth interface
- WebView detection and external browser redirect
- Mobile browser compatibility validation
- Responsive loading and error states

**4. Developer Experience**
- Mock OAuth service for local development
- TypeScript strict mode compliance
- Comprehensive error boundaries
- Hot reload compatible state management

**5. Testability**
- Service layer fully unit testable
- Mock OAuth for integration tests
- Security validation test suite
- Mobile compatibility testing

### 2.2 Quality Attributes

| Quality Attribute | Requirement | Implementation Strategy |
|-------------------|-------------|------------------------|
| **Security** | OAuth 2.0 2025 standards | PKCE, state parameter, CSP headers |
| **Performance** | < 100ms overhead | Lazy loading, token caching |
| **Availability** | 99.9% uptime | Offline-capable, error recovery |
| **Usability** | < 30s auth flow | One-Tap OAuth, clear feedback |
| **Maintainability** | High cohesion | Service layer separation, hooks |
| **Testability** | > 90% coverage | Mock services, dependency injection |
| **Scalability** | Handle 10k+ users | Stateless auth, token refresh |
| **Compatibility** | All modern browsers | WebView detection, polyfills |

---

## 3. Service Layer Architecture

### 3.1 Service Architecture Diagram (C4 - Level 3)

```
┌─────────────────────────────────────────────────────────────────┐
│                   OAuth Service Layer                            │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              GoogleAuth Service                           │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  Public API:                                        │  │  │
│  │  │  + login(): Promise<GoogleUser>                     │  │  │
│  │  │  + logout(): Promise<void>                          │  │  │
│  │  │  + handleCallback(): Promise<AuthResult>            │  │  │
│  │  │  + refreshToken(): Promise<string>                  │  │  │
│  │  │  + isAuthenticated(): boolean                       │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  Private Methods:                                   │  │  │
│  │  │  - buildAuthUrl(): string                           │  │  │
│  │  │  - exchangeCodeForToken(): Promise<OAuthTokens>     │  │  │
│  │  │  - validateState(): boolean                         │  │  │
│  │  │  - getUserProfile(): Promise<GoogleUser>            │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          │ depends on                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              TokenManager Service                         │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  Public API:                                        │  │  │
│  │  │  + storeTokens(tokens: OAuthTokens): Promise<void>  │  │  │
│  │  │  + getAccessToken(): Promise<string | null>         │  │  │
│  │  │  + getRefreshToken(): Promise<string | null>        │  │  │
│  │  │  + clearTokens(): Promise<void>                     │  │  │
│  │  │  + isTokenValid(): boolean                          │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  Private Methods:                                   │  │  │
│  │  │  - encryptToken(token: string): string              │  │  │
│  │  │  - decryptToken(encrypted: string): string          │  │  │
│  │  │  - checkExpiry(token: string): boolean              │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          │ depends on                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              PKCEGenerator Service                        │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  Public API:                                        │  │  │
│  │  │  + generateChallenge(): Promise<PKCEChallenge>      │  │  │
│  │  │  + verifyChallenge(): boolean                       │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  Private Methods:                                   │  │  │
│  │  │  - generateSecureRandom(length: number): string     │  │  │
│  │  │  - sha256Hash(input: string): Promise<ArrayBuffer>  │  │  │
│  │  │  - base64URLEncode(buffer: ArrayBuffer): string     │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              MockOAuth Service (Dev Only)                 │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  Implements GoogleAuth Interface:                   │  │  │
│  │  │  + login(): Promise<GoogleUser>                     │  │  │
│  │  │  + logout(): Promise<void>                          │  │  │
│  │  │  + handleCallback(): Promise<AuthResult>            │  │  │
│  │  │  + getAccessToken(): Promise<string>                │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Service Responsibilities

#### GoogleAuth Service
**Responsibility:** OAuth 2.0 flow orchestration

**Key Operations:**
1. **Initiate OAuth Flow**
   - Generate PKCE challenge
   - Create state parameter for CSRF protection
   - Build authorization URL with scopes
   - Redirect user to Google OAuth consent screen

2. **Handle OAuth Callback**
   - Validate state parameter (CSRF protection)
   - Extract authorization code from URL
   - Exchange code for access/refresh tokens
   - Retrieve user profile information
   - Store tokens securely

3. **Token Lifecycle Management**
   - Monitor token expiry
   - Automatic token refresh
   - Logout and token revocation

4. **Error Handling**
   - Network failure recovery
   - Invalid OAuth configuration detection
   - User cancellation handling
   - Google service unavailability

**Dependencies:**
- `TokenManager` for secure token storage
- `PKCEGenerator` for PKCE challenge generation
- Browser Crypto API for security operations

#### TokenManager Service
**Responsibility:** Secure token storage and retrieval

**Key Operations:**
1. **Token Storage**
   - Encrypt access/refresh tokens
   - Store in sessionStorage (development)
   - Prepare for httpOnly cookie migration (production)
   - Set automatic expiry and cleanup

2. **Token Retrieval**
   - Decrypt stored tokens
   - Validate token expiry
   - Return valid access tokens
   - Trigger refresh if expired

3. **Security Operations**
   - Token encryption at rest
   - Secure random key generation
   - Automatic token cleanup on logout
   - Storage quota management

**Dependencies:**
- Browser Crypto API for encryption
- sessionStorage API for development
- Cookie API for production migration

#### PKCEGenerator Service
**Responsibility:** PKCE security implementation

**Key Operations:**
1. **Challenge Generation**
   - Generate cryptographically secure code verifier (128 chars)
   - Create SHA256 hash of verifier
   - Base64-URL encode the hash
   - Return challenge pair for OAuth flow

2. **Security Validation**
   - Verify code verifier format
   - Validate challenge method (S256)
   - Ensure cryptographic strength

**Dependencies:**
- Browser Crypto API (crypto.subtle.digest)
- TextEncoder for string encoding
- Base64 encoding utilities

#### MockOAuth Service (Development)
**Responsibility:** OAuth simulation for development

**Key Operations:**
1. **Mock Authentication**
   - Simulate successful login flow
   - Return fake user credentials
   - Generate mock access tokens
   - Delay to simulate network latency

2. **Development Workflow**
   - Enable testing without Google Cloud setup
   - Consistent test data generation
   - Error scenario simulation
   - Hot reload compatibility

**Dependencies:**
- None (standalone mock implementation)

### 3.3 Service Factory Pattern

```typescript
// Service factory for environment-based instantiation
export class AuthServiceFactory {
  static createAuthService(): IAuthService {
    const useMockOAuth = import.meta.env.VITE_USE_MOCK_OAUTH === 'true'

    if (useMockOAuth) {
      return new MockOAuthService()
    }

    const tokenManager = new TokenManager()
    const pkceGenerator = new PKCEGenerator()
    return new GoogleAuthService(tokenManager, pkceGenerator)
  }
}

// Usage in application
const authService = AuthServiceFactory.createAuthService()
```

**Benefits:**
- Environment-specific service selection
- Dependency injection for testability
- Easy mocking for unit tests
- Production/development separation

---

## 4. Data Flow Architecture

### 4.1 OAuth Login Flow Sequence Diagram

```
┌─────┐          ┌──────────┐       ┌────────────┐      ┌─────────┐      ┌────────┐
│User │          │ Settings │       │   Auth     │      │ Google  │      │ Token  │
│     │          │  Button  │       │  Context   │      │  Auth   │      │Manager │
└──┬──┘          └────┬─────┘       └─────┬──────┘      └────┬────┘      └────┬───┘
   │                  │                    │                   │                │
   │ Click Settings   │                    │                   │                │
   ├─────────────────►│                    │                   │                │
   │                  │                    │                   │                │
   │                  │ Open Auth Modal    │                   │                │
   │                  ├───────────────────►│                   │                │
   │                  │                    │                   │                │
   │ Click "Sign In"  │                    │                   │                │
   ├──────────────────┼───────────────────►│                   │                │
   │                  │                    │                   │                │
   │                  │                    │ login()           │                │
   │                  │                    ├──────────────────►│                │
   │                  │                    │                   │                │
   │                  │                    │       Generate PKCE Challenge      │
   │                  │                    │◄──────────────────┤                │
   │                  │                    │                   │                │
   │                  │                    │  Build Auth URL   │                │
   │                  │                    │◄──────────────────┤                │
   │                  │                    │                   │                │
   │                  │      Redirect to Google OAuth          │                │
   │◄─────────────────┴────────────────────┴───────────────────┤                │
   │                                                            │                │
   │                    Google Consent Screen                  │                │
   │                                                            │                │
   │ Grant Permissions                                          │                │
   ├───────────────────────────────────────────────────────────►│                │
   │                                                            │                │
   │              OAuth Callback Redirect                       │                │
   │◄───────────────────────────────────────────────────────────┤                │
   │                  │                    │                   │                │
   │                  │                    │ handleCallback()  │                │
   │                  │                    ├──────────────────►│                │
   │                  │                    │                   │                │
   │                  │                    │ Validate State    │                │
   │                  │                    │◄──────────────────┤                │
   │                  │                    │                   │                │
   │                  │                    │ Exchange Code     │                │
   │                  │                    │ for Tokens        │                │
   │                  │                    │◄──────────────────┤                │
   │                  │                    │                   │                │
   │                  │                    │ Get User Profile  │                │
   │                  │                    │◄──────────────────┤                │
   │                  │                    │                   │                │
   │                  │                    │          Store Tokens              │
   │                  │                    ├───────────────────┼───────────────►│
   │                  │                    │                   │                │
   │                  │                    │          Encrypt & Store           │
   │                  │                    │◄──────────────────┼────────────────┤
   │                  │                    │                   │                │
   │                  │  Update Auth State │                   │                │
   │                  │  (authenticated)   │                   │                │
   │◄─────────────────┴────────────────────┤                   │                │
   │                  │                    │                   │                │
   │  Display User Info                    │                   │                │
   │◄──────────────────────────────────────┤                   │                │
   │                  │                    │                   │                │
```

### 4.2 Token Refresh Flow

```
┌────────────┐              ┌────────────┐              ┌─────────┐
│   React    │              │   Token    │              │ Google  │
│ Component  │              │  Manager   │              │  OAuth  │
└─────┬──────┘              └─────┬──────┘              └────┬────┘
      │                           │                          │
      │  Request Action           │                          │
      │  (requires auth)          │                          │
      ├──────────────────────────►│                          │
      │                           │                          │
      │                           │ getAccessToken()         │
      │                           ├──────────┐               │
      │                           │          │               │
      │                           │ Check Expiry             │
      │                           │◄─────────┘               │
      │                           │                          │
      │                           │ Token Expired!           │
      │                           │                          │
      │                           │ Automatic Refresh        │
      │                           ├─────────────────────────►│
      │                           │                          │
      │                           │ New Access Token         │
      │                           │◄─────────────────────────┤
      │                           │                          │
      │                           │ Store New Token          │
      │                           ├──────────┐               │
      │                           │          │               │
      │                           │◄─────────┘               │
      │                           │                          │
      │  Fresh Access Token       │                          │
      │◄──────────────────────────┤                          │
      │                           │                          │
      │  Proceed with Action      │                          │
      │                           │                          │
```

**Key Features:**
- Transparent token refresh (no user interaction)
- Exponential backoff on refresh failures
- Automatic re-authentication prompt if refresh fails
- Background refresh before expiry (proactive)

### 4.3 State Management Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  AuthContext State Flow                      │
│                                                              │
│  ┌────────────┐                                             │
│  │  Initial   │  App Loads                                  │
│  │   State    ├──────────────┐                              │
│  └────────────┘              │                              │
│       │                      ▼                              │
│       │              ┌───────────────┐                      │
│       │              │   Loading     │                      │
│       │              │ isLoading=true│                      │
│       │              └───────┬───────┘                      │
│       │                      │                              │
│       │                      │ Check Storage                │
│       │                      │                              │
│       │              ┌───────▼───────────┐                  │
│       │              │  Has Valid Token? │                  │
│       │              └───────┬───────────┘                  │
│       │                      │                              │
│       │          ┌───────────┴─────────────┐                │
│       │          │                         │                │
│       │         Yes                       No                │
│       │          │                         │                │
│       │   ┌──────▼─────────┐     ┌────────▼─────────┐      │
│       │   │ Authenticated  │     │   Anonymous      │      │
│       │   │ isAuth=true    │     │ isAuth=false     │      │
│       │   │ user={...}     │     │ user=null        │      │
│       │   └────────────────┘     └──────────────────┘      │
│       │          │                         │                │
│       │          │                         │                │
│       │   ┌──────▼─────────┐               │                │
│       │   │ Token Refresh  │               │                │
│       │   │  Background    │               │                │
│       │   └────────────────┘               │                │
│       │                                    │                │
│       └────────── User Logout ─────────────┘                │
│                        │                                    │
│                        ▼                                    │
│                 ┌──────────────┐                            │
│                 │   Cleanup    │                            │
│                 │ Clear Tokens │                            │
│                 └──────────────┘                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**State Transitions:**
1. **Initial → Loading** - App initializes, check for stored tokens
2. **Loading → Authenticated** - Valid token found in storage
3. **Loading → Anonymous** - No valid token, default state
4. **Anonymous → Authenticated** - User completes OAuth login
5. **Authenticated → Anonymous** - User logs out or token invalid
6. **Authenticated → Authenticated** - Background token refresh

---

## 5. Component Integration Architecture

### 5.1 Component Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                         App.tsx                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              AuthProvider (Context)                    │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  ┌──────────────┐    ┌──────────────────────┐  │  │  │
│  │  │  │ Settings     │    │    AuthModal         │  │  │  │
│  │  │  │   Button     │    │  ┌────────────────┐  │  │  │  │
│  │  │  │              │    │  │ Google Login   │  │  │  │  │
│  │  │  │ Uses:        │    │  │    Button      │  │  │  │  │
│  │  │  │ - authState  │    │  └────────────────┘  │  │  │  │
│  │  │  │ - useAuth()  │    │  ┌────────────────┐  │  │  │  │
│  │  │  └──────────────┘    │  │  AuthStatus    │  │  │  │  │
│  │  │                      │  │  Component     │  │  │  │  │
│  │  │                      │  └────────────────┘  │  │  │  │
│  │  │                      └──────────────────────┘  │  │  │
│  │  │  ┌─────────────────────────────────────────┐  │  │  │
│  │  │  │           Editor Component               │  │  │  │
│  │  │  │  (Unchanged by OAuth integration)        │  │  │  │
│  │  │  └─────────────────────────────────────────┘  │  │  │
│  │  │  ┌─────────────────────────────────────────┐  │  │  │
│  │  │  │      TableOfContents Component           │  │  │  │
│  │  │  │  (Unchanged by OAuth integration)        │  │  │  │
│  │  │  └─────────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

Context Data Flow:
  AuthProvider → useAuth() → Components
      │
      └─► { user, isAuthenticated, login, logout, error }
```

### 5.2 SettingsButton Integration

**Current Implementation:**
```typescript
// components/SettingsButton.tsx (existing)
interface SettingsButtonProps {
  authState?: 'anonymous' | 'authenticated' | 'needs-auth'
  onClick?: () => void
}
```

**Enhanced Integration:**
```typescript
// components/SettingsButton.tsx (enhanced)
export function SettingsButton({
  authState = 'anonymous',
  onClick
}: SettingsButtonProps) {
  const { isAuthenticated } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  const handleClick = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true)  // Trigger OAuth modal
    } else {
      onClick?.()  // Future: settings or profile
    }
  }

  return (
    <>
      <button
        className="settings-button"
        onClick={handleClick}
        style={{ opacity: getOpacity() }}
      >
        <Settings size={20} />
      </button>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        mode="login"
      />
    </>
  )
}
```

**Integration Benefits:**
- Minimal changes to existing component
- Progressive enhancement (OAuth adds functionality)
- Existing API preserved (authState prop)
- Visual opacity already supports auth states

### 5.3 App Component Integration

```typescript
// App.tsx (enhanced with OAuth)
function App() {
  // Existing state (unchanged)
  const [title, setTitle] = useState('Untitled Document')
  const [text, setText] = useState('')
  const [hasHeadings, setHasHeadings] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  const [editor, setEditor] = useState<TipTapEditor | null>(null)

  // New: Auth integration
  const { user, isAuthenticated } = useAuth()
  const authState = isAuthenticated ? 'authenticated' : 'anonymous'

  return (
    <AuthProvider>  {/* Wrap entire app */}
      <main className="app-container">
        <SettingsButton
          authState={authState}  // Dynamic state from auth context
          onClick={() => {/* Future: open settings */}}
        />

        {/* Existing components unchanged */}
        <aside className={`toc-sidebar ${hasHeadings ? 'has-headings' : ''}`}>
          <TableOfContents editor={editor} />
        </aside>

        <div className={`document-area ${hasHeadings ? 'toc-visible' : ''}`}>
          <Editor
            value={text}
            onChange={setText}
            placeholder="Start writing..."
            onEditorReady={setEditor}
          />
        </div>
      </main>
    </AuthProvider>
  )
}
```

**Integration Strategy:**
1. **Wrap with AuthProvider** - Single context at app root
2. **Pass auth state to SettingsButton** - Existing prop interface
3. **No changes to Editor** - OAuth transparent to editing
4. **Future-ready** - User context available for Drive integration

---

## 6. Security Architecture

### 6.1 OAuth 2.0 Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│              OAuth Security Architecture                     │
│                                                              │
│  Layer 1: Transport Security                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ • HTTPS Enforcement (production)                        │ │
│  │ • TLS 1.3 for all OAuth communications                  │ │
│  │ • HSTS Headers (max-age=31536000)                       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Layer 2: PKCE Security                                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ • Code Verifier: 128 chars, cryptographically random    │ │
│  │ • Code Challenge: SHA256(verifier), base64-URL encoded  │ │
│  │ • Challenge Method: S256 (required, not plain)          │ │
│  │ • Storage: sessionStorage (ephemeral)                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Layer 3: CSRF Protection                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ • State Parameter: Cryptographically random UUID         │ │
│  │ • Server Validation: Callback must match initiated state │ │
│  │ • Session Binding: State tied to browser session         │ │
│  │ • Expiry: State valid for 10 minutes only               │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Layer 4: Token Security                                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ • Encryption at Rest: AES-256-GCM                        │ │
│  │ • Storage: sessionStorage (dev), httpOnly cookie (prod)  │ │
│  │ • Automatic Expiry: Token TTL enforcement                │ │
│  │ • Refresh Strategy: Proactive refresh before expiry      │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Layer 5: Content Security Policy                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ • script-src: 'self' https://accounts.google.com         │ │
│  │ • connect-src: 'self' https://oauth2.googleapis.com      │ │
│  │ • frame-ancestors: 'none'                                │ │
│  │ • upgrade-insecure-requests                              │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Layer 6: Input Validation                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ • URL Parameter Sanitization                             │ │
│  │ • OAuth Response Validation (TypeScript strict mode)     │ │
│  │ • Token Format Validation (JWT structure)                │ │
│  │ • Scope Verification (requested vs granted)              │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 PKCE Flow Security

```typescript
// Security implementation details

// Step 1: Generate PKCE Challenge (Client)
class PKCEGenerator {
  async generateChallenge(): Promise<PKCEChallenge> {
    // Code Verifier: 128 random characters
    const codeVerifier = this.generateSecureRandom(128)

    // Code Challenge: SHA256 hash of verifier
    const encoder = new TextEncoder()
    const data = encoder.encode(codeVerifier)
    const digest = await crypto.subtle.digest('SHA-256', data)

    // Base64-URL encode the hash
    const codeChallenge = this.base64URLEncode(digest)

    return {
      codeVerifier,
      codeChallenge,
      method: 'S256'  // Required method
    }
  }

  private generateSecureRandom(length: number): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
    const randomValues = new Uint8Array(length)
    crypto.getRandomValues(randomValues)

    return Array.from(randomValues)
      .map(v => charset[v % charset.length])
      .join('')
  }

  private base64URLEncode(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    const binary = String.fromCharCode(...bytes)
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }
}

// Step 2: Authorization Request (Client → Google)
const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
  `client_id=${clientId}` +
  `&redirect_uri=${redirectUri}` +
  `&response_type=code` +
  `&scope=${scopes.join(' ')}` +
  `&state=${stateParameter}` +
  `&code_challenge=${codeChallenge}` +
  `&code_challenge_method=S256`  // Critical: S256 method

// Step 3: Token Exchange (Client → Google)
const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    code: authorizationCode,
    client_id: clientId,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
    code_verifier: codeVerifier  // Google validates: SHA256(verifier) === challenge
  })
})
```

**PKCE Security Benefits:**
1. **Authorization Code Interception Protection** - Code useless without verifier
2. **No Client Secret Required** - Safe for public clients (browsers)
3. **Mitigates CSRF** - Combined with state parameter
4. **Cryptographic Proof** - Google validates SHA256(verifier) = challenge

### 6.3 Token Storage Security

```typescript
// Development: Encrypted sessionStorage
class TokenManager {
  private readonly STORAGE_KEY = 'ritemark_auth_tokens'
  private readonly ENCRYPTION_KEY = 'ritemark_enc_key'

  async storeTokens(tokens: OAuthTokens): Promise<void> {
    // Encrypt tokens before storage
    const encrypted = await this.encryptTokens(tokens)

    // Store in sessionStorage (cleared on tab close)
    sessionStorage.setItem(this.STORAGE_KEY, encrypted)

    // Set expiry metadata
    const expiryTime = Date.now() + (tokens.expires_in * 1000)
    sessionStorage.setItem(`${this.STORAGE_KEY}_expiry`, expiryTime.toString())
  }

  async getAccessToken(): Promise<string | null> {
    const encrypted = sessionStorage.getItem(this.STORAGE_KEY)
    if (!encrypted) return null

    // Check expiry
    const expiryTime = parseInt(
      sessionStorage.getItem(`${this.STORAGE_KEY}_expiry`) || '0'
    )
    if (Date.now() >= expiryTime) {
      await this.clearTokens()
      return null  // Trigger refresh or re-auth
    }

    // Decrypt and return
    const tokens = await this.decryptTokens(encrypted)
    return tokens.access_token
  }

  private async encryptTokens(tokens: OAuthTokens): Promise<string> {
    // AES-256-GCM encryption
    const key = await this.getEncryptionKey()
    const iv = crypto.getRandomValues(new Uint8Array(12))

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(JSON.stringify(tokens))
    )

    // Combine IV + encrypted data for storage
    return this.base64Encode(iv) + '.' + this.base64Encode(encrypted)
  }
}

// Production: httpOnly cookie (server-side implementation needed)
// Future Sprint: Migrate to httpOnly cookies for enhanced security
```

**Storage Security Trade-offs:**

| Storage Method | Security | Accessibility | XSS Risk | CSRF Risk |
|----------------|----------|---------------|----------|-----------|
| **sessionStorage** | Medium | Easy | High | Low |
| **localStorage** | Low | Easy | High | Low |
| **httpOnly Cookie** | High | Server-only | None | Medium |
| **Memory Only** | High | Limited | None | N/A |

**Sprint 7 Decision:** sessionStorage with encryption
**Future Migration:** httpOnly cookies when backend added

### 6.4 Content Security Policy

```typescript
// vite.config.ts - CSP Headers
const cspHeader = [
  // Default: Only load from same origin
  "default-src 'self'",

  // Scripts: Allow self + Google OAuth
  "script-src 'self' 'nonce-${nonce}' https://accounts.google.com",

  // API Connections: Self + Google OAuth endpoints
  "connect-src 'self' https://oauth2.googleapis.com https://www.googleapis.com",

  // Styles: Allow self + inline styles (for TipTap editor)
  "style-src 'self' 'unsafe-inline'",

  // Images: Allow self + data URIs + Google profile pictures
  "img-src 'self' data: https://lh3.googleusercontent.com",

  // Fonts: Self only
  "font-src 'self'",

  // No frames allowed (prevent clickjacking)
  "frame-ancestors 'none'",

  // Upgrade insecure requests to HTTPS
  "upgrade-insecure-requests"
].join('; ')

// Apply CSP in production
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'csp-headers',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          res.setHeader('Content-Security-Policy', cspHeader)
          res.setHeader('X-Frame-Options', 'DENY')
          res.setHeader('X-Content-Type-Options', 'nosniff')
          res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
          next()
        })
      }
    }
  ]
})
```

**CSP Violations Handling:**
```typescript
// Monitor CSP violations
window.addEventListener('securitypolicyviolation', (e) => {
  console.error('CSP Violation:', {
    blockedURI: e.blockedURI,
    violatedDirective: e.violatedDirective,
    originalPolicy: e.originalPolicy
  })

  // Report to monitoring service (future)
  // analytics.track('csp_violation', { ... })
})
```

### 6.5 Mobile Browser Security

```typescript
// WebView detection and security
class MobileSecurity {
  detectWebView(): boolean {
    const ua = navigator.userAgent.toLowerCase()

    // Detect common WebViews
    const webViewPatterns = [
      /wv\)/,                    // Android WebView
      /iphone.*applewebkit(?!.*safari)/i,  // iOS WebView
      /fbav|fban/,               // Facebook WebView
      /instagram/,               // Instagram WebView
      /twitter/,                 // Twitter WebView
    ]

    return webViewPatterns.some(pattern => pattern.test(ua))
  }

  async handleOAuthInWebView(): Promise<void> {
    if (this.detectWebView()) {
      // Redirect to external browser for OAuth
      const authUrl = this.buildAuthUrl()

      // iOS: Use custom URL scheme
      if (this.isIOS()) {
        window.location.href = `x-safari-${authUrl}`
      } else {
        // Android: Use Intent
        window.location.href = `intent://${authUrl}#Intent;scheme=https;end`
      }

      throw new Error('WEBVIEW_REDIRECT')
    }
  }

  isIOS(): boolean {
    return /iphone|ipad|ipod/i.test(navigator.userAgent)
  }
}
```

**Mobile Security Considerations:**
1. **WebView Detection** - Redirect to external browser for OAuth
2. **Touch Hijacking Prevention** - Adequate touch target sizes
3. **Screen Reader Support** - ARIA labels for auth UI
4. **Biometric Integration** - Future: Use device biometrics

---

## 7. TypeScript Type System

### 7.1 Core Type Definitions

```typescript
// types/auth.ts - Complete type system for OAuth

/**
 * OAuth 2.0 Token Response
 * Returned by Google OAuth token endpoint
 */
export interface OAuthTokens {
  access_token: string
  refresh_token?: string
  expires_in: number  // Seconds until expiry
  token_type: 'Bearer'
  scope: string
  id_token?: string  // JWT containing user info
}

/**
 * PKCE Challenge Pair
 * Used for OAuth authorization flow security
 */
export interface PKCEChallenge {
  codeVerifier: string  // 128-char random string
  codeChallenge: string  // SHA256 hash of verifier
  method: 'S256'  // Required challenge method
}

/**
 * OAuth State Parameter
 * CSRF protection and session tracking
 */
export interface OAuthState {
  state: string  // Random UUID
  timestamp: number  // Creation time
  redirectUrl?: string  // Post-auth redirect
}

/**
 * Google User Profile
 * User information from OAuth response
 */
export interface GoogleUser {
  id: string
  email: string
  verified_email: boolean
  name: string
  given_name?: string
  family_name?: string
  picture?: string  // Profile picture URL
  locale?: string
}

/**
 * Authentication Result
 * Returned after successful OAuth flow
 */
export interface AuthResult {
  user: GoogleUser
  tokens: OAuthTokens
  expiresAt: number  // Unix timestamp
}

/**
 * Authentication Error
 * Structured error responses
 */
export interface AuthError {
  code: AuthErrorCode
  message: string
  details?: unknown
  retryable: boolean
}

/**
 * Authentication Error Codes
 * Categorized error types
 */
export enum AuthErrorCode {
  // User actions
  USER_CANCELLED = 'USER_CANCELLED',

  // Network issues
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',

  // OAuth errors
  INVALID_GRANT = 'INVALID_GRANT',
  INVALID_STATE = 'INVALID_STATE',
  INVALID_CODE = 'INVALID_CODE',

  // Configuration errors
  INVALID_CONFIG = 'INVALID_CONFIG',
  MISSING_CLIENT_ID = 'MISSING_CLIENT_ID',

  // Token errors
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  REFRESH_FAILED = 'REFRESH_FAILED',

  // Security errors
  CSRF_DETECTED = 'CSRF_DETECTED',
  PKCE_VALIDATION_FAILED = 'PKCE_VALIDATION_FAILED',

  // Generic
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * OAuth Configuration
 * Environment-specific settings
 */
export interface OAuthConfig {
  clientId: string
  redirectUri: string
  scopes: string[]
  useMockOAuth: boolean
  enableDevTools: boolean
}

/**
 * Auth Service Interface
 * Contract for all auth implementations
 */
export interface IAuthService {
  login(): Promise<GoogleUser>
  logout(): Promise<void>
  handleCallback(params: URLSearchParams): Promise<AuthResult>
  refreshToken(): Promise<string>
  isAuthenticated(): boolean
  getAccessToken(): Promise<string | null>
}

/**
 * Token Manager Interface
 * Contract for token storage implementations
 */
export interface ITokenManager {
  storeTokens(tokens: OAuthTokens): Promise<void>
  getAccessToken(): Promise<string | null>
  getRefreshToken(): Promise<string | null>
  clearTokens(): Promise<void>
  isTokenValid(): boolean
}

/**
 * PKCE Generator Interface
 * Contract for PKCE implementations
 */
export interface IPKCEGenerator {
  generateChallenge(): Promise<PKCEChallenge>
  verifyChallenge(verifier: string, challenge: string): Promise<boolean>
}
```

### 7.2 React Context Types

```typescript
// contexts/AuthContext.tsx - Context type definitions

/**
 * Authentication Context State
 * Global auth state available to all components
 */
export interface AuthContextType {
  // User state
  user: GoogleUser | null
  isAuthenticated: boolean
  isLoading: boolean

  // Actions
  login: () => Promise<void>
  logout: () => Promise<void>

  // Error state
  error: AuthError | null
  clearError: () => void

  // Token management
  getAccessToken: () => Promise<string | null>
  refreshToken: () => Promise<void>
}

/**
 * Auth Provider Props
 * Configuration for AuthProvider component
 */
export interface AuthProviderProps {
  children: React.ReactNode
  config?: Partial<OAuthConfig>
  onAuthChange?: (user: GoogleUser | null) => void
}

/**
 * useAuth Hook Return Type
 * Type-safe hook for consuming auth context
 */
export type UseAuthReturn = AuthContextType
```

### 7.3 Component Props Types

```typescript
// components/auth/AuthModal.tsx - Component prop types

/**
 * Authentication Modal Props
 */
export interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'login' | 'logout' | 'profile'
  onSuccess?: (user: GoogleUser) => void
  onError?: (error: AuthError) => void
}

/**
 * Google Login Button Props
 */
export interface GoogleLoginButtonProps {
  onSuccess: (user: GoogleUser) => void
  onError: (error: AuthError) => void
  disabled?: boolean
  text?: string
  className?: string
}

/**
 * Auth Status Component Props
 */
export interface AuthStatusProps {
  user: GoogleUser
  onLogout?: () => void
  showAvatar?: boolean
  className?: string
}

/**
 * Settings Button Props (enhanced)
 */
export interface SettingsButtonProps {
  authState?: 'anonymous' | 'authenticated' | 'needs-auth'
  onClick?: () => void
  showAuthModal?: boolean
  onAuthComplete?: (user: GoogleUser) => void
}
```

### 7.4 Service Layer Types

```typescript
// services/auth/googleAuth.ts - Service implementation types

/**
 * Google Auth Service Configuration
 */
interface GoogleAuthConfig {
  clientId: string
  redirectUri: string
  scopes: string[]
  tokenManager: ITokenManager
  pkceGenerator: IPKCEGenerator
}

/**
 * OAuth Authorization URL Parameters
 */
interface AuthUrlParams {
  client_id: string
  redirect_uri: string
  response_type: 'code'
  scope: string
  state: string
  code_challenge: string
  code_challenge_method: 'S256'
  access_type?: 'offline'
  prompt?: 'consent' | 'select_account'
}

/**
 * Token Exchange Request
 */
interface TokenExchangeRequest {
  code: string
  client_id: string
  redirect_uri: string
  grant_type: 'authorization_code'
  code_verifier: string
}

/**
 * Token Refresh Request
 */
interface TokenRefreshRequest {
  refresh_token: string
  client_id: string
  grant_type: 'refresh_token'
}
```

### 7.5 Type Guards and Validators

```typescript
// utils/typeGuards.ts - Runtime type validation

/**
 * Type guard for OAuthTokens
 */
export function isOAuthTokens(value: unknown): value is OAuthTokens {
  return (
    typeof value === 'object' &&
    value !== null &&
    'access_token' in value &&
    typeof (value as OAuthTokens).access_token === 'string' &&
    'expires_in' in value &&
    typeof (value as OAuthTokens).expires_in === 'number' &&
    'token_type' in value &&
    (value as OAuthTokens).token_type === 'Bearer'
  )
}

/**
 * Type guard for GoogleUser
 */
export function isGoogleUser(value: unknown): value is GoogleUser {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof (value as GoogleUser).id === 'string' &&
    'email' in value &&
    typeof (value as GoogleUser).email === 'string' &&
    'name' in value &&
    typeof (value as GoogleUser).name === 'string'
  )
}

/**
 * Validate OAuth configuration
 */
export function validateOAuthConfig(config: unknown): config is OAuthConfig {
  if (typeof config !== 'object' || config === null) {
    return false
  }

  const c = config as OAuthConfig

  return (
    typeof c.clientId === 'string' &&
    c.clientId.length > 0 &&
    typeof c.redirectUri === 'string' &&
    c.redirectUri.startsWith('http') &&
    Array.isArray(c.scopes) &&
    c.scopes.length > 0
  )
}
```

---

## 8. Error Handling Architecture

### 8.1 Error Classification Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                   Error Classification                       │
│                                                              │
│  AuthError (Base Class)                                     │
│    │                                                         │
│    ├─► UserActionError                                      │
│    │     ├─► UserCancelledError                             │
│    │     └─► PermissionDeniedError                          │
│    │                                                         │
│    ├─► NetworkError                                         │
│    │     ├─► TimeoutError                                   │
│    │     ├─► ConnectionError                                │
│    │     └─► RateLimitError                                 │
│    │                                                         │
│    ├─► OAuthError                                           │
│    │     ├─► InvalidGrantError                              │
│    │     ├─► InvalidStateError                              │
│    │     └─► InvalidCodeError                               │
│    │                                                         │
│    ├─► ConfigurationError                                   │
│    │     ├─► MissingClientIdError                           │
│    │     └─► InvalidRedirectUriError                        │
│    │                                                         │
│    ├─► TokenError                                           │
│    │     ├─► TokenExpiredError                              │
│    │     ├─► InvalidTokenError                              │
│    │     └─► RefreshFailedError                             │
│    │                                                         │
│    └─► SecurityError                                        │
│          ├─► CSRFDetectedError                              │
│          └─► PKCEValidationError                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Error Handling Strategies

```typescript
// errors/authErrors.ts - Error class hierarchy

/**
 * Base authentication error
 */
export class AuthError extends Error {
  constructor(
    public code: AuthErrorCode,
    message: string,
    public retryable: boolean = false,
    public details?: unknown
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

/**
 * User cancelled OAuth flow
 */
export class UserCancelledError extends AuthError {
  constructor() {
    super(
      AuthErrorCode.USER_CANCELLED,
      'Authentication was cancelled by user',
      false  // Not retryable (user decision)
    )
    this.name = 'UserCancelledError'
  }
}

/**
 * Network-related error
 */
export class NetworkError extends AuthError {
  constructor(message: string, details?: unknown) {
    super(
      AuthErrorCode.NETWORK_ERROR,
      message,
      true,  // Retryable
      details
    )
    this.name = 'NetworkError'
  }
}

/**
 * CSRF attack detected
 */
export class CSRFDetectedError extends AuthError {
  constructor() {
    super(
      AuthErrorCode.CSRF_DETECTED,
      'Potential CSRF attack detected - state parameter mismatch',
      false,  // Not retryable (security issue)
    )
    this.name = 'CSRFDetectedError'
  }
}

/**
 * Error handler with recovery strategies
 */
export class AuthErrorHandler {
  handle(error: AuthError): ErrorHandlingStrategy {
    switch (error.code) {
      case AuthErrorCode.USER_CANCELLED:
        return {
          action: 'dismiss',
          message: 'Sign in cancelled',
          showRetry: false
        }

      case AuthErrorCode.NETWORK_ERROR:
      case AuthErrorCode.TIMEOUT:
        return {
          action: 'retry',
          message: 'Connection issue. Please try again.',
          showRetry: true,
          retryDelay: 1000
        }

      case AuthErrorCode.TOKEN_EXPIRED:
        return {
          action: 'refresh',
          message: 'Session expired. Refreshing...',
          showRetry: false,
          autoRecover: true
        }

      case AuthErrorCode.INVALID_GRANT:
      case AuthErrorCode.INVALID_CODE:
        return {
          action: 'reauth',
          message: 'Authentication failed. Please sign in again.',
          showRetry: true
        }

      case AuthErrorCode.CSRF_DETECTED:
      case AuthErrorCode.PKCE_VALIDATION_FAILED:
        return {
          action: 'alert',
          message: 'Security validation failed. Please contact support.',
          showRetry: false,
          severity: 'critical'
        }

      default:
        return {
          action: 'display',
          message: 'An unexpected error occurred.',
          showRetry: true
        }
    }
  }
}

interface ErrorHandlingStrategy {
  action: 'dismiss' | 'retry' | 'refresh' | 'reauth' | 'alert' | 'display'
  message: string
  showRetry: boolean
  retryDelay?: number
  autoRecover?: boolean
  severity?: 'info' | 'warning' | 'error' | 'critical'
}
```

### 8.3 Error Recovery Flow

```typescript
// Error recovery with exponential backoff

class ErrorRecovery {
  private retryAttempts = 0
  private maxRetries = 3
  private baseDelay = 1000  // 1 second

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    errorHandler: (error: AuthError) => boolean  // Return true to retry
  ): Promise<T> {
    while (this.retryAttempts < this.maxRetries) {
      try {
        const result = await operation()
        this.retryAttempts = 0  // Reset on success
        return result

      } catch (error) {
        const authError = this.normalizeError(error)
        const shouldRetry = errorHandler(authError)

        if (!shouldRetry || !authError.retryable) {
          throw authError
        }

        this.retryAttempts++

        if (this.retryAttempts >= this.maxRetries) {
          throw new AuthError(
            AuthErrorCode.UNKNOWN_ERROR,
            `Operation failed after ${this.maxRetries} attempts`,
            false,
            authError
          )
        }

        // Exponential backoff: 1s, 2s, 4s
        const delay = this.baseDelay * Math.pow(2, this.retryAttempts - 1)
        await this.sleep(delay)
      }
    }

    throw new AuthError(
      AuthErrorCode.UNKNOWN_ERROR,
      'Max retries exceeded',
      false
    )
  }

  private normalizeError(error: unknown): AuthError {
    if (error instanceof AuthError) {
      return error
    }

    if (error instanceof Error) {
      return new AuthError(
        AuthErrorCode.UNKNOWN_ERROR,
        error.message,
        false,
        error
      )
    }

    return new AuthError(
      AuthErrorCode.UNKNOWN_ERROR,
      'An unknown error occurred',
      false,
      error
    )
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Usage in AuthContext
const recovery = new ErrorRecovery()

async function loginWithRecovery() {
  try {
    await recovery.executeWithRetry(
      () => authService.login(),
      (error) => {
        // Show error to user
        setError(error)

        // Return true to retry for network errors
        return error.code === AuthErrorCode.NETWORK_ERROR
      }
    )
  } catch (error) {
    // Final error after all retries
    setError(error as AuthError)
  }
}
```

### 8.4 Error Boundary Integration

```typescript
// components/ErrorBoundary.tsx - React error boundary for auth errors

interface AuthErrorBoundaryProps {
  children: React.ReactNode
  fallback?: (error: AuthError) => React.ReactNode
  onError?: (error: AuthError) => void
}

interface AuthErrorBoundaryState {
  error: AuthError | null
  hasError: boolean
}

export class AuthErrorBoundary extends React.Component<
  AuthErrorBoundaryProps,
  AuthErrorBoundaryState
> {
  constructor(props: AuthErrorBoundaryProps) {
    super(props)
    this.state = { error: null, hasError: false }
  }

  static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    const authError = error instanceof AuthError
      ? error
      : new AuthError(AuthErrorCode.UNKNOWN_ERROR, error.message, false)

    return {
      error: authError,
      hasError: true
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const authError = error instanceof AuthError
      ? error
      : new AuthError(AuthErrorCode.UNKNOWN_ERROR, error.message, false, errorInfo)

    this.props.onError?.(authError)

    // Log to monitoring service
    console.error('Auth error caught:', authError)
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback ? (
        this.props.fallback(this.state.error)
      ) : (
        <DefaultAuthErrorFallback error={this.state.error} />
      )
    }

    return this.props.children
  }
}

// Default error fallback component
function DefaultAuthErrorFallback({ error }: { error: AuthError }) {
  return (
    <div className="auth-error-fallback">
      <h2>Authentication Error</h2>
      <p>{error.message}</p>
      {error.retryable && (
        <button onClick={() => window.location.reload()}>
          Try Again
        </button>
      )}
    </div>
  )
}
```

---

## 9. Testing Strategy

### 9.1 Testing Pyramid

```
┌─────────────────────────────────────────────────────────────┐
│                     Testing Architecture                     │
│                                                              │
│                         ┌─────┐                             │
│                         │ E2E │  < 5% (Manual)              │
│                         └─────┘                             │
│                    ┌─────────────┐                          │
│                    │ Integration │  ~ 20%                   │
│                    └─────────────┘                          │
│               ┌──────────────────────┐                      │
│               │     Unit Tests       │  ~ 75%               │
│               └──────────────────────┘                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 9.2 Unit Testing Strategy

```typescript
// tests/services/googleAuth.test.ts - Service layer testing

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GoogleAuthService } from '@/services/auth/googleAuth'
import { TokenManager } from '@/services/auth/tokenManager'
import { PKCEGenerator } from '@/services/auth/pkceGenerator'

describe('GoogleAuthService', () => {
  let authService: GoogleAuthService
  let mockTokenManager: TokenManager
  let mockPKCEGenerator: PKCEGenerator

  beforeEach(() => {
    // Mock dependencies
    mockTokenManager = {
      storeTokens: vi.fn(),
      getAccessToken: vi.fn(),
      clearTokens: vi.fn()
    } as unknown as TokenManager

    mockPKCEGenerator = {
      generateChallenge: vi.fn().mockResolvedValue({
        codeVerifier: 'mock-verifier',
        codeChallenge: 'mock-challenge',
        method: 'S256'
      })
    } as unknown as PKCEGenerator

    authService = new GoogleAuthService(
      mockTokenManager,
      mockPKCEGenerator
    )
  })

  describe('login()', () => {
    it('should generate PKCE challenge', async () => {
      await authService.login()

      expect(mockPKCEGenerator.generateChallenge).toHaveBeenCalled()
    })

    it('should build correct authorization URL', async () => {
      const authUrl = await authService.buildAuthUrl()

      expect(authUrl).toContain('accounts.google.com')
      expect(authUrl).toContain('code_challenge=')
      expect(authUrl).toContain('code_challenge_method=S256')
      expect(authUrl).toContain('state=')
    })

    it('should store state parameter for CSRF validation', async () => {
      const state = await authService.initiateLogin()

      expect(sessionStorage.getItem('oauth_state')).toBe(state)
    })
  })

  describe('handleCallback()', () => {
    it('should validate state parameter', async () => {
      const params = new URLSearchParams('code=auth-code&state=invalid')

      await expect(
        authService.handleCallback(params)
      ).rejects.toThrow(CSRFDetectedError)
    })

    it('should exchange authorization code for tokens', async () => {
      // Mock successful exchange
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 3600,
          token_type: 'Bearer'
        })
      })

      const result = await authService.handleCallback(
        new URLSearchParams('code=valid-code&state=valid-state')
      )

      expect(result.tokens.access_token).toBe('mock-access-token')
      expect(mockTokenManager.storeTokens).toHaveBeenCalled()
    })

    it('should handle network errors gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      await expect(
        authService.handleCallback(
          new URLSearchParams('code=valid-code&state=valid-state')
        )
      ).rejects.toThrow(NetworkError)
    })
  })

  describe('logout()', () => {
    it('should clear stored tokens', async () => {
      await authService.logout()

      expect(mockTokenManager.clearTokens).toHaveBeenCalled()
    })

    it('should clear auth state', async () => {
      await authService.logout()

      expect(authService.isAuthenticated()).toBe(false)
    })
  })
})

// tests/services/pkceGenerator.test.ts - PKCE security testing

describe('PKCEGenerator', () => {
  let pkceGenerator: PKCEGenerator

  beforeEach(() => {
    pkceGenerator = new PKCEGenerator()
  })

  it('should generate 128-character code verifier', async () => {
    const challenge = await pkceGenerator.generateChallenge()

    expect(challenge.codeVerifier).toHaveLength(128)
  })

  it('should use only URL-safe characters', async () => {
    const challenge = await pkceGenerator.generateChallenge()
    const urlSafeRegex = /^[A-Za-z0-9\-._~]+$/

    expect(challenge.codeVerifier).toMatch(urlSafeRegex)
  })

  it('should generate SHA256 hash of verifier', async () => {
    const challenge = await pkceGenerator.generateChallenge()

    // Verify hash is base64-URL encoded
    const base64UrlRegex = /^[A-Za-z0-9\-_]+$/
    expect(challenge.codeChallenge).toMatch(base64UrlRegex)
  })

  it('should use S256 challenge method', async () => {
    const challenge = await pkceGenerator.generateChallenge()

    expect(challenge.method).toBe('S256')
  })

  it('should generate different challenges each time', async () => {
    const challenge1 = await pkceGenerator.generateChallenge()
    const challenge2 = await pkceGenerator.generateChallenge()

    expect(challenge1.codeVerifier).not.toBe(challenge2.codeVerifier)
    expect(challenge1.codeChallenge).not.toBe(challenge2.codeChallenge)
  })
})

// tests/services/tokenManager.test.ts - Token storage testing

describe('TokenManager', () => {
  let tokenManager: TokenManager

  beforeEach(() => {
    tokenManager = new TokenManager()
    sessionStorage.clear()
  })

  it('should encrypt tokens before storage', async () => {
    const tokens = {
      access_token: 'plaintext-token',
      expires_in: 3600,
      token_type: 'Bearer' as const
    }

    await tokenManager.storeTokens(tokens)

    const stored = sessionStorage.getItem('ritemark_auth_tokens')
    expect(stored).not.toContain('plaintext-token')
  })

  it('should retrieve and decrypt tokens', async () => {
    const tokens = {
      access_token: 'test-token',
      expires_in: 3600,
      token_type: 'Bearer' as const
    }

    await tokenManager.storeTokens(tokens)
    const retrieved = await tokenManager.getAccessToken()

    expect(retrieved).toBe('test-token')
  })

  it('should return null for expired tokens', async () => {
    const tokens = {
      access_token: 'expired-token',
      expires_in: -1,  // Already expired
      token_type: 'Bearer' as const
    }

    await tokenManager.storeTokens(tokens)
    const retrieved = await tokenManager.getAccessToken()

    expect(retrieved).toBeNull()
  })

  it('should clear all tokens on logout', async () => {
    await tokenManager.storeTokens({
      access_token: 'token',
      expires_in: 3600,
      token_type: 'Bearer'
    })

    await tokenManager.clearTokens()

    expect(sessionStorage.getItem('ritemark_auth_tokens')).toBeNull()
  })
})
```

### 9.3 Integration Testing

```typescript
// tests/integration/oauthFlow.test.tsx - Full flow testing

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from '@/contexts/AuthContext'
import { SettingsButton } from '@/components/SettingsButton'

describe('OAuth Integration Flow', () => {
  it('should complete full login flow', async () => {
    const user = userEvent.setup()

    render(
      <AuthProvider config={{ useMockOAuth: true }}>
        <SettingsButton />
      </AuthProvider>
    )

    // Click settings button
    const settingsBtn = screen.getByRole('button', { name: /settings/i })
    await user.click(settingsBtn)

    // Auth modal should open
    expect(screen.getByText(/sign in with google/i)).toBeInTheDocument()

    // Click sign in button
    const signInBtn = screen.getByRole('button', { name: /sign in/i })
    await user.click(signInBtn)

    // Wait for authentication
    await waitFor(() => {
      expect(screen.getByText(/signed in/i)).toBeInTheDocument()
    })

    // User info should be displayed
    expect(screen.getByText(/test@example.com/i)).toBeInTheDocument()
  })

  it('should handle user cancellation', async () => {
    const user = userEvent.setup()

    render(
      <AuthProvider config={{ useMockOAuth: true }}>
        <SettingsButton />
      </AuthProvider>
    )

    await user.click(screen.getByRole('button', { name: /settings/i }))

    // Close modal (simulating cancellation)
    const closeBtn = screen.getByRole('button', { name: /close/i })
    await user.click(closeBtn)

    // Should return to anonymous state
    expect(screen.queryByText(/signed in/i)).not.toBeInTheDocument()
  })

  it('should handle logout flow', async () => {
    const user = userEvent.setup()

    // Start authenticated
    render(
      <AuthProvider config={{ useMockOAuth: true }}>
        <TestComponent />
      </AuthProvider>
    )

    // Login first
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => {
      expect(screen.getByText(/signed in/i)).toBeInTheDocument()
    })

    // Logout
    await user.click(screen.getByRole('button', { name: /sign out/i }))

    await waitFor(() => {
      expect(screen.queryByText(/signed in/i)).not.toBeInTheDocument()
    })
  })
})
```

### 9.4 Security Testing

```typescript
// tests/security/oauth.security.test.ts - Security validation

describe('OAuth Security', () => {
  describe('PKCE Implementation', () => {
    it('should reject plain code challenge method', async () => {
      const authService = new GoogleAuthService(/* ... */)

      // Attempt to use insecure 'plain' method
      await expect(
        authService.buildAuthUrl({ challengeMethod: 'plain' })
      ).rejects.toThrow('Only S256 challenge method is allowed')
    })

    it('should validate code verifier length', async () => {
      const pkceGenerator = new PKCEGenerator()

      await expect(
        pkceGenerator.generateChallenge({ length: 42 })  // Too short
      ).rejects.toThrow('Code verifier must be at least 43 characters')
    })
  })

  describe('CSRF Protection', () => {
    it('should reject callback with mismatched state', async () => {
      const authService = new GoogleAuthService(/* ... */)

      // Store expected state
      sessionStorage.setItem('oauth_state', 'expected-state')

      // Callback with different state
      const params = new URLSearchParams('code=code&state=malicious-state')

      await expect(
        authService.handleCallback(params)
      ).rejects.toThrow(CSRFDetectedError)
    })

    it('should reject expired state parameter', async () => {
      const authService = new GoogleAuthService(/* ... */)

      // Store expired state (11 minutes old, max is 10 minutes)
      const expiredState = {
        state: 'valid-uuid',
        timestamp: Date.now() - (11 * 60 * 1000)
      }
      sessionStorage.setItem('oauth_state', JSON.stringify(expiredState))

      await expect(
        authService.handleCallback(
          new URLSearchParams('code=code&state=valid-uuid')
        )
      ).rejects.toThrow('State parameter expired')
    })
  })

  describe('Token Storage Security', () => {
    it('should not store tokens in plain text', async () => {
      const tokenManager = new TokenManager()

      await tokenManager.storeTokens({
        access_token: 'secret-token',
        expires_in: 3600,
        token_type: 'Bearer'
      })

      const stored = sessionStorage.getItem('ritemark_auth_tokens')
      expect(stored).not.toContain('secret-token')
    })

    it('should use cryptographically secure encryption', async () => {
      const tokenManager = new TokenManager()

      // Store same token twice
      const tokens = {
        access_token: 'test-token',
        expires_in: 3600,
        token_type: 'Bearer' as const
      }

      await tokenManager.storeTokens(tokens)
      const encrypted1 = sessionStorage.getItem('ritemark_auth_tokens')

      sessionStorage.clear()

      await tokenManager.storeTokens(tokens)
      const encrypted2 = sessionStorage.getItem('ritemark_auth_tokens')

      // Encrypted values should be different due to random IV
      expect(encrypted1).not.toBe(encrypted2)
    })
  })
})
```

### 9.5 Mobile Compatibility Testing

```typescript
// tests/mobile/oauth.mobile.test.ts - Mobile-specific testing

describe('Mobile OAuth Compatibility', () => {
  describe('WebView Detection', () => {
    it('should detect iOS WebView', () => {
      const mobileSecurity = new MobileSecurity()

      // Mock iOS WebView user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
        configurable: true
      })

      expect(mobileSecurity.detectWebView()).toBe(true)
    })

    it('should detect Android WebView', () => {
      const mobileSecurity = new MobileSecurity()

      // Mock Android WebView user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 11; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/91.0.4472.120 Mobile Safari/537.36',
        configurable: true
      })

      expect(mobileSecurity.detectWebView()).toBe(true)
    })

    it('should not detect regular mobile browsers', () => {
      const mobileSecurity = new MobileSecurity()

      // Mock iOS Safari user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
        configurable: true
      })

      expect(mobileSecurity.detectWebView()).toBe(false)
    })
  })

  describe('Touch Interface', () => {
    it('should have adequate touch target sizes', () => {
      render(<GoogleLoginButton />)

      const button = screen.getByRole('button')
      const { height, width } = button.getBoundingClientRect()

      // Minimum 44x44px for touch targets (Apple HIG)
      expect(height).toBeGreaterThanOrEqual(44)
      expect(width).toBeGreaterThanOrEqual(44)
    })
  })
})
```

---

## 10. Deployment Architecture

### 10.1 Environment Configuration

```typescript
// Environment-specific configurations

/**
 * Development Environment
 */
export const devConfig: OAuthConfig = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  redirectUri: 'http://localhost:5173',
  scopes: [
    'openid',
    'email',
    'profile',
    'https://www.googleapis.com/auth/drive.file'
  ],
  useMockOAuth: import.meta.env.VITE_USE_MOCK_OAUTH === 'true',
  enableDevTools: true
}

/**
 * Production Environment (Future)
 */
export const prodConfig: OAuthConfig = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  redirectUri: 'https://ritemark.app',
  scopes: [
    'openid',
    'email',
    'profile',
    'https://www.googleapis.com/auth/drive.file'
  ],
  useMockOAuth: false,
  enableDevTools: false
}

/**
 * Get configuration based on environment
 */
export function getOAuthConfig(): OAuthConfig {
  const env = import.meta.env.MODE

  switch (env) {
    case 'production':
      return prodConfig
    case 'development':
    default:
      return devConfig
  }
}
```

### 10.2 Build Configuration

```typescript
// vite.config.ts - OAuth-specific build configuration

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),

    // Security headers plugin
    {
      name: 'oauth-security-headers',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Content Security Policy
          res.setHeader('Content-Security-Policy', cspHeader)

          // HSTS
          res.setHeader(
            'Strict-Transport-Security',
            'max-age=31536000; includeSubDomains'
          )

          // Frame options
          res.setHeader('X-Frame-Options', 'DENY')

          // Content type sniffing
          res.setHeader('X-Content-Type-Options', 'nosniff')

          // Referrer policy
          res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')

          next()
        })
      }
    }
  ],

  // Environment variable validation
  define: {
    'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(
      process.env.VITE_GOOGLE_CLIENT_ID || ''
    )
  },

  // Build optimization
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'auth': [
            './src/services/auth/googleAuth',
            './src/services/auth/tokenManager',
            './src/services/auth/pkceGenerator'
          ]
        }
      }
    }
  }
})
```

### 10.3 Deployment Checklist

```markdown
## Pre-Deployment Checklist

### Google Cloud Console Setup
- [ ] OAuth 2.0 client created (Web application type)
- [ ] Authorized JavaScript origins configured
  - Development: http://localhost:5173
  - Production: https://ritemark.app
- [ ] Authorized redirect URIs configured
  - Development: http://localhost:5173
  - Production: https://ritemark.app
- [ ] OAuth consent screen configured
  - App name: RiteMark
  - Support email: support@ritemark.app
  - Privacy policy URL: https://ritemark.app/privacy
- [ ] Google Drive API enabled

### Environment Variables
- [ ] VITE_GOOGLE_CLIENT_ID set for environment
- [ ] VITE_OAUTH_REDIRECT_URI matches deployment URL
- [ ] VITE_USE_MOCK_OAUTH disabled for production

### Security Configuration
- [ ] HTTPS enforced (production only)
- [ ] CSP headers configured correctly
- [ ] HSTS headers enabled
- [ ] X-Frame-Options set to DENY
- [ ] Referrer-Policy configured

### Code Quality
- [ ] All TypeScript errors resolved
- [ ] Lint checks passing (npm run lint)
- [ ] Type checks passing (npm run type-check)
- [ ] Build succeeds (npm run build)

### Testing
- [ ] Unit tests passing (> 90% coverage)
- [ ] Integration tests passing
- [ ] Security tests passing
- [ ] Mobile compatibility validated

### Documentation
- [ ] OAuth setup guide created
- [ ] Environment variable documentation
- [ ] Troubleshooting guide
- [ ] User-facing privacy documentation
```

---

## 11. Architecture Decision Records

### ADR-001: Browser-Only OAuth Implementation

**Status:** Accepted
**Date:** 2025-10-04
**Decision Maker:** System Architecture Designer

**Context:**
RiteMark requires Google OAuth authentication for cloud collaboration. We must decide between client-side (browser-only) OAuth or server-side OAuth implementation.

**Decision:**
Implement browser-only OAuth 2.0 flow with PKCE security.

**Rationale:**
1. **No Backend Complexity** - Aligns with RiteMark's serverless architecture
2. **PKCE Security** - Industry-standard security for public clients
3. **User Privacy** - No server storing user credentials
4. **Development Velocity** - Faster iteration without backend deployment
5. **Cost Efficiency** - No server infrastructure costs

**Consequences:**
- **Positive:**
  - Simplified architecture
  - Faster development and deployment
  - No server maintenance overhead
  - Better privacy (no credential storage)

- **Negative:**
  - Client secret cannot be used (PKCE mitigates this)
  - Token storage limited to browser (sessionStorage/cookies)
  - Future backend migration if needed

**Mitigation:**
- PKCE with S256 provides equivalent security to client secret
- Encrypted token storage in sessionStorage
- Future migration path to httpOnly cookies if backend added

---

### ADR-002: React Context for Auth State Management

**Status:** Accepted
**Date:** 2025-10-04
**Decision Maker:** System Architecture Designer

**Context:**
Multiple components need access to authentication state. We must choose between React Context, Redux, Zustand, or prop drilling.

**Decision:**
Use React Context API for global authentication state management.

**Rationale:**
1. **Native React Solution** - No additional dependencies
2. **Sufficient Complexity** - Auth state is simple enough for Context
3. **TypeScript Support** - Excellent type safety with Context
4. **Performance** - Minimal re-renders with proper memoization
5. **Project Simplicity** - Avoids over-engineering

**Consequences:**
- **Positive:**
  - Zero additional bundle size
  - Simple mental model
  - Easy testing with provider wrapper
  - Future migration path to state management library if needed

- **Negative:**
  - More verbose than some state management libraries
  - Requires careful memoization to avoid re-renders

**Mitigation:**
- Use useMemo and useCallback for performance
- Single AuthProvider at app root
- Clear documentation of context usage patterns

---

### ADR-003: PKCE with S256 Challenge Method

**Status:** Accepted
**Date:** 2025-10-04
**Decision Maker:** System Architecture Designer

**Context:**
OAuth 2.0 requires secure authorization flow for public clients (browsers). We must choose between authorization code flow with PKCE or implicit flow.

**Decision:**
Implement authorization code flow with PKCE using S256 challenge method.

**Rationale:**
1. **Industry Best Practice** - PKCE is recommended by OAuth 2.0 for public clients
2. **Security Standard** - S256 provides cryptographic proof of possession
3. **Authorization Code Protection** - Prevents code interception attacks
4. **Future Compliance** - OAuth 2.1 will make PKCE mandatory
5. **Google Support** - Fully supported by Google OAuth

**Consequences:**
- **Positive:**
  - Strong security without client secret
  - Protection against authorization code interception
  - Future-proof for OAuth 2.1
  - Industry-standard implementation

- **Negative:**
  - Additional complexity vs. implicit flow
  - Requires SHA256 hashing (mitigated by Web Crypto API)

**Mitigation:**
- Browser Web Crypto API provides native SHA256 support
- Well-documented implementation in service layer
- Comprehensive unit tests for PKCE generation

---

### ADR-004: SessionStorage for Token Storage

**Status:** Accepted (with migration path)
**Date:** 2025-10-04
**Decision Maker:** System Architecture Designer

**Context:**
OAuth tokens must be stored securely in the browser. Options include sessionStorage, localStorage, httpOnly cookies, or memory-only storage.

**Decision:**
Use encrypted sessionStorage for Sprint 7, with migration path to httpOnly cookies when backend is added.

**Rationale:**
1. **Development Velocity** - sessionStorage works immediately without backend
2. **Session Scope** - Tokens cleared on tab close (security benefit)
3. **Encryption** - Mitigates XSS token theft risk
4. **Migration Path** - Can migrate to httpOnly cookies later
5. **Testing** - Easier to test than httpOnly cookies

**Consequences:**
- **Positive:**
  - No backend required for Sprint 7
  - Automatic token cleanup on tab close
  - Sufficient security with encryption
  - Clear migration path

- **Negative:**
  - Vulnerable to XSS attacks (mitigated by CSP and encryption)
  - Tokens lost on tab close (UX trade-off for security)
  - Not suitable for long-term sessions

**Mitigation:**
- Content Security Policy to prevent XSS
- AES-256-GCM encryption for tokens
- Future migration to httpOnly cookies documented
- Refresh token strategy for session persistence

**Future Migration:**
When backend is added (Sprint 10+), migrate to httpOnly cookies for enhanced security.

---

### ADR-005: Mock OAuth Service for Development

**Status:** Accepted
**Date:** 2025-10-04
**Decision Maker:** System Architecture Designer

**Context:**
Development workflow requires Google Cloud Console setup, which creates friction for new developers and testing.

**Decision:**
Implement MockOAuthService that simulates Google OAuth for development environment.

**Rationale:**
1. **Developer Experience** - No Google Cloud dependency for local development
2. **Testing Velocity** - Instant authentication for integration tests
3. **CI/CD Compatibility** - Tests run without OAuth credentials
4. **Onboarding** - New developers start immediately
5. **Consistent Test Data** - Predictable user profiles for testing

**Consequences:**
- **Positive:**
  - Faster development iteration
  - No Google Cloud setup required for basic development
  - Reliable integration testing
  - Lower barrier to contribution

- **Negative:**
  - Additional code to maintain
  - Must ensure mock matches real OAuth behavior
  - Environment flag management needed

**Mitigation:**
- MockOAuthService implements same interface as GoogleAuthService
- Clear environment variable documentation
- Integration tests validate both mock and real OAuth
- Mock service only available in development builds

---

## Appendices

### A. File Structure

```
ritemark-app/
├── src/
│   ├── services/
│   │   └── auth/
│   │       ├── googleAuth.ts          # OAuth 2.0 service
│   │       ├── tokenManager.ts        # Token storage
│   │       ├── pkceGenerator.ts       # PKCE implementation
│   │       ├── mockOAuth.ts           # Development mock
│   │       └── authTypes.ts           # Type definitions
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx            # Auth state management
│   │
│   ├── hooks/
│   │   └── useAuth.ts                 # Auth hook
│   │
│   ├── components/
│   │   ├── auth/
│   │   │   ├── AuthModal.tsx          # Auth modal UI
│   │   │   ├── AuthStatus.tsx         # User status display
│   │   │   └── GoogleLoginButton.tsx  # OAuth button
│   │   │
│   │   ├── SettingsButton.tsx         # Enhanced with auth
│   │   ├── Editor.tsx                 # Unchanged
│   │   └── TableOfContents.tsx        # Unchanged
│   │
│   ├── types/
│   │   └── auth.ts                    # Auth type definitions
│   │
│   ├── errors/
│   │   └── authErrors.ts              # Error classes
│   │
│   ├── utils/
│   │   └── typeGuards.ts              # Runtime validation
│   │
│   └── App.tsx                        # Enhanced with AuthProvider
│
├── tests/
│   ├── services/
│   │   ├── googleAuth.test.ts
│   │   ├── tokenManager.test.ts
│   │   └── pkceGenerator.test.ts
│   │
│   ├── components/
│   │   ├── AuthModal.test.tsx
│   │   └── SettingsButton.test.tsx
│   │
│   ├── integration/
│   │   └── oauthFlow.test.tsx
│   │
│   ├── security/
│   │   └── oauth.security.test.ts
│   │
│   └── mobile/
│       └── oauth.mobile.test.ts
│
├── docs/
│   └── research/
│       └── oauth-service-architecture.md  # This document
│
├── .env.local                         # Development config
├── .env.production                    # Production config
└── vite.config.ts                     # Build configuration
```

### B. OAuth Scopes Reference

```typescript
/**
 * Google OAuth Scopes for RiteMark
 */
export const OAUTH_SCOPES = {
  // OpenID Connect
  openid: {
    scope: 'openid',
    description: 'User identification',
    required: true,
    sensitive: false
  },

  // User Profile
  email: {
    scope: 'email',
    description: 'User email address',
    required: true,
    sensitive: true
  },

  profile: {
    scope: 'profile',
    description: 'Basic profile information (name, picture)',
    required: true,
    sensitive: false
  },

  // Google Drive
  driveFile: {
    scope: 'https://www.googleapis.com/auth/drive.file',
    description: 'Per-file access to Drive (only files created by RiteMark)',
    required: true,
    sensitive: true
  }

  // Future scopes (Sprint 8+)
  // driveAppdata: 'https://www.googleapis.com/auth/drive.appdata'
  // driveMetadata: 'https://www.googleapis.com/auth/drive.metadata.readonly'
}

/**
 * Scope justification for OAuth consent screen
 */
export const SCOPE_JUSTIFICATIONS = {
  openid: 'Required for secure user identification',
  email: 'Used to sync your documents and identify your account',
  profile: 'Display your name and picture in the interface',
  driveFile: 'Access only to files you create or open with RiteMark'
}
```

### C. Security Checklist Reference

```markdown
## OAuth Security Implementation Checklist

### PKCE Implementation
- [x] Code verifier: 128 characters, cryptographically random
- [x] Code challenge: SHA256 hash of verifier
- [x] Challenge method: S256 (not plain)
- [x] Verifier stored securely (sessionStorage, ephemeral)
- [x] Challenge sent in authorization request
- [x] Verifier sent in token exchange

### CSRF Protection
- [x] State parameter: Cryptographically random UUID
- [x] State validation: Server response matches client
- [x] State expiry: 10 minutes maximum
- [x] Session binding: State tied to browser session
- [x] No state reuse: New state for each flow

### Token Security
- [x] Encryption at rest: AES-256-GCM
- [x] Storage: sessionStorage (dev), httpOnly cookie (prod future)
- [x] Automatic expiry: TTL enforcement
- [x] Refresh strategy: Proactive refresh before expiry
- [x] Secure transmission: HTTPS only (production)
- [x] No token logging: Never log tokens

### Content Security Policy
- [x] script-src: 'self' + Google OAuth allowed
- [x] connect-src: 'self' + Google API endpoints
- [x] frame-ancestors: 'none' (prevent clickjacking)
- [x] upgrade-insecure-requests: Enabled
- [x] CSP violation monitoring: Implemented

### Input Validation
- [x] URL parameter sanitization
- [x] OAuth response validation
- [x] Token format validation (JWT structure)
- [x] Scope verification (requested vs granted)
- [x] TypeScript strict mode enabled

### Mobile Security
- [x] WebView detection
- [x] External browser redirect for WebViews
- [x] Touch target sizes (minimum 44x44px)
- [x] Screen reader support (ARIA labels)

### Error Handling
- [x] Structured error responses
- [x] User-friendly error messages
- [x] Retry mechanisms for network errors
- [x] Security error alerting
- [x] No sensitive data in error messages

### Monitoring
- [x] OAuth flow success rate tracking
- [x] Error categorization and reporting
- [x] Security incident detection
- [x] Performance monitoring
```

---

## Summary

This OAuth 2.0 service architecture provides RiteMark with a secure, maintainable, and user-friendly authentication system. The design follows industry best practices, implements 2025 security standards, and maintains RiteMark's "invisible interface" philosophy.

**Key Architectural Highlights:**
1. **Security-First Design** - PKCE, CSRF protection, encrypted token storage
2. **Browser-Only Implementation** - No backend complexity, serverless architecture
3. **React Context State Management** - Simple, performant, type-safe
4. **Progressive Enhancement** - OAuth adds cloud capabilities without disrupting editor
5. **Mobile-First Security** - WebView detection, touch optimization, accessibility
6. **Developer Experience** - Mock OAuth service, comprehensive testing, TypeScript strict mode
7. **Future-Ready** - Clear migration paths for httpOnly cookies and backend integration

**Sprint 7 Success Criteria:**
- User can authenticate with Google account via browser-only OAuth
- PKCE and CSRF security implemented to 2025 standards
- Mobile browsers (iOS Safari, Chrome) work seamlessly
- Existing editor functionality completely unaffected
- Development workflow supports mock OAuth for testing
- Comprehensive test coverage (unit, integration, security, mobile)

This architecture document serves as the single source of truth for OAuth implementation in Sprint 7 and provides clear guidance for future enhancements in Sprint 8+ (Google Drive API integration, real-time collaboration).

---

**Document Status:** APPROVED FOR IMPLEMENTATION
**Next Steps:** Begin Sprint 7 Phase 1 - Google Cloud Console setup and PKCE implementation
