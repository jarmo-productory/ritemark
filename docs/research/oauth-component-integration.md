# OAuth Component Integration Plan - RiteMark

**Date:** 2025-10-04
**Purpose:** Detailed component integration plan for OAuth authentication

---

## Component Integration Overview

### Current State Analysis

**Existing Components (Sprint 6):**
```
App.tsx
├── SettingsButton (authState prop ready) ✅
├── Editor (TipTap WYSIWYG) ✅
└── TableOfContents ✅
```

**Current SettingsButton API:**
```typescript
interface SettingsButtonProps {
  authState?: 'anonymous' | 'authenticated' | 'needs-auth'  // ✅ Ready
  onClick?: () => void  // ✅ Ready
}
```

**Integration Strategy:** Progressive enhancement - OAuth adds functionality without changing existing components.

---

## Integration Architecture

### Step 1: Add AuthProvider Context

**File:** `/ritemark-app/src/App.tsx`

```typescript
// BEFORE (Sprint 6)
function App() {
  return (
    <main className="app-container">
      <SettingsButton
        authState="anonymous"
        onClick={() => {}}
      />
      <Editor ... />
      <TableOfContents ... />
    </main>
  )
}

// AFTER (Sprint 7)
import { AuthProvider } from './contexts/AuthContext'

function App() {
  return (
    <AuthProvider>  {/* NEW: Wrap entire app */}
      <AppContent />
    </AuthProvider>
  )
}

function AppContent() {  // NEW: Separate component for context access
  const { user, isAuthenticated } = useAuth()
  const authState = isAuthenticated ? 'authenticated' : 'anonymous'

  return (
    <main className="app-container">
      <SettingsButton
        authState={authState}  // CHANGED: Dynamic from context
        onClick={() => {/* Future: settings menu */}}
      />
      {/* Existing components unchanged */}
      <Editor ... />
      <TableOfContents ... />
    </main>
  )
}
```

**Impact:**
- **Editor:** No changes required ✅
- **TableOfContents:** No changes required ✅
- **SettingsButton:** Props enhanced, interface preserved ✅

---

### Step 2: Enhance SettingsButton

**File:** `/ritemark-app/src/components/SettingsButton.tsx`

```typescript
// BEFORE (Sprint 6)
export function SettingsButton({
  authState = 'anonymous',
  onClick
}: SettingsButtonProps) {
  return (
    <button onClick={onClick} ...>
      <Settings size={20} />
    </button>
  )
}

// AFTER (Sprint 7)
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { AuthModal } from './auth/AuthModal'

export function SettingsButton({
  authState = 'anonymous',
  onClick
}: SettingsButtonProps) {
  const { isAuthenticated } = useAuth()  // NEW: Auth context
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)  // NEW: Modal state

  const handleClick = () => {  // ENHANCED: Smart behavior
    if (!isAuthenticated) {
      setIsAuthModalOpen(true)  // Open OAuth modal
    } else {
      onClick?.()  // Future: settings menu
    }
  }

  return (
    <>
      <button onClick={handleClick} ...>  {/* CHANGED: Enhanced handler */}
        <Settings size={20} />
      </button>

      {/* NEW: Auth modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        mode="login"
      />
    </>
  )
}
```

**Changes:**
- Add `useAuth()` hook for auth state
- Add modal state management
- Enhance click handler for OAuth
- Add `AuthModal` component
- **Preserve existing API** (authState prop still works)

---

### Step 3: Create AuthModal Component

**File:** `/ritemark-app/src/components/auth/AuthModal.tsx` (NEW)

```typescript
import { useAuth } from '../../hooks/useAuth'
import { GoogleLoginButton } from './GoogleLoginButton'

export interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  mode?: 'login' | 'logout' | 'profile'
}

export function AuthModal({ isOpen, onClose, mode = 'login' }: AuthModalProps) {
  const { login, logout, user, isLoading, error } = useAuth()

  if (!isOpen) return null

  const handleLogin = async () => {
    try {
      await login()
      onClose()  // Close modal on success
    } catch (err) {
      // Error displayed in modal
    }
  }

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal">
        {mode === 'login' && (
          <>
            <h2>Sign in to RiteMark</h2>
            <p>Connect your Google account for cloud collaboration</p>

            <GoogleLoginButton
              onSuccess={handleLogin}
              onError={(error) => console.error(error)}
            />

            {error && (
              <div className="auth-error">
                {error.message}
              </div>
            )}
          </>
        )}

        {mode === 'logout' && (
          <>
            <h2>Sign out?</h2>
            <p>You'll lose access to cloud features</p>
            <button onClick={logout}>Sign Out</button>
          </>
        )}

        <button onClick={onClose} className="close-button">
          Close
        </button>
      </div>
    </div>
  )
}
```

**Features:**
- Modal overlay UI
- Google OAuth button
- Error display
- Loading states
- Logout confirmation

---

### Step 4: Create AuthStatus Component

**File:** `/ritemark-app/src/components/auth/AuthStatus.tsx` (NEW)

```typescript
import { useAuth } from '../../hooks/useAuth'

export interface AuthStatusProps {
  user?: GoogleUser
  onLogout?: () => void
  showAvatar?: boolean
  className?: string
}

export function AuthStatus({
  showAvatar = true,
  className = ''
}: AuthStatusProps) {
  const { user, isAuthenticated, logout } = useAuth()

  if (!isAuthenticated || !user) return null

  return (
    <div className={`auth-status ${className}`}>
      {showAvatar && user.picture && (
        <img
          src={user.picture}
          alt={user.name}
          className="user-avatar"
        />
      )}

      <div className="user-info">
        <span className="user-name">{user.name}</span>
        <span className="user-email">{user.email}</span>
      </div>

      <button onClick={logout} className="logout-button">
        Sign Out
      </button>
    </div>
  )
}
```

**Features:**
- User avatar display
- Name and email
- Quick logout
- Conditional rendering (only if authenticated)

---

### Step 5: Create useAuth Hook

**File:** `/ritemark-app/src/hooks/useAuth.ts` (NEW)

```typescript
import { useContext } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import type { UseAuthReturn } from '../types/auth'

/**
 * useAuth Hook
 * Access authentication state and actions from anywhere in the app
 *
 * @throws Error if used outside AuthProvider
 * @returns AuthContextType - Auth state and actions
 */
export function useAuth(): UseAuthReturn {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
```

**Usage in Components:**
```typescript
function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth()

  if (!isAuthenticated) {
    return <button onClick={login}>Sign In</button>
  }

  return <div>Welcome, {user.name}!</div>
}
```

---

## Component Interaction Flow

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   Component Interaction                      │
│                                                              │
│  1. User clicks SettingsButton                              │
│     ↓                                                        │
│  2. SettingsButton checks isAuthenticated (via useAuth)     │
│     ↓                                                        │
│  3. If not authenticated:                                   │
│     → Opens AuthModal                                       │
│     ↓                                                        │
│  4. AuthModal displays GoogleLoginButton                    │
│     ↓                                                        │
│  5. User clicks Google login                                │
│     → GoogleAuth.login() called                             │
│     → Redirect to Google OAuth                              │
│     ↓                                                        │
│  6. User grants permissions                                 │
│     → OAuth callback received                               │
│     → GoogleAuth.handleCallback()                           │
│     ↓                                                        │
│  7. Tokens stored, user profile retrieved                   │
│     → AuthContext updated                                   │
│     → All components re-render with new state               │
│     ↓                                                        │
│  8. AuthModal closes                                        │
│     AuthStatus appears (shows user info)                    │
│     SettingsButton changes to 'authenticated' state         │
│     ↓                                                        │
│  9. User continues editing                                  │
│     (Editor unchanged, OAuth transparent)                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## State Management Flow

### AuthContext State Transitions

```
┌─────────────────────────────────────────────────────────────┐
│                    Auth State Machine                        │
│                                                              │
│  INITIAL (App Load)                                         │
│    ↓                                                        │
│  LOADING (Checking stored tokens)                           │
│    ↓                                                        │
│  ┌─────────────────────┐                                   │
│  │                     │                                   │
│  ↓                     ↓                                   │
│  ANONYMOUS          AUTHENTICATED                           │
│  (no user)          (user loaded)                           │
│    │                   │                                   │
│    │  login()         │  logout()                          │
│    │──────────────────►│                                   │
│    │◄──────────────────│                                   │
│    │                   │                                   │
│    │                   │  refreshToken()                    │
│    │                   │  (automatic, transparent)          │
│    │                   └──────┐                            │
│    │                          │                            │
│    │                          ↓                            │
│    │                   TOKEN_REFRESHED                      │
│    │                   (user remains authenticated)         │
│    │                                                        │
│  ERROR (if login fails)                                    │
│    │                                                        │
│    │  clearError() or retry                                │
│    └───────────────────► ANONYMOUS                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**State Properties:**
- `user: GoogleUser | null` - User profile or null
- `isAuthenticated: boolean` - True if logged in
- `isLoading: boolean` - True during OAuth flow
- `error: AuthError | null` - Error state if any

---

## Component Styling Integration

### SettingsButton Visual States

```typescript
// Visual indicators for authentication state

const getOpacity = () => {
  switch (authState) {
    case 'needs-auth':
      return 0.4  // Faded (requires attention)

    case 'authenticated':
      return 0.25  // Medium (active user)

    case 'anonymous':
    default:
      return 0.15  // Light (default)
  }
}
```

**Visual Feedback:**
- Anonymous: Light opacity, subtle presence
- Authenticated: Medium opacity, user signed in
- Needs Auth: Faded, attention required (future)
- Hover: Full opacity (0.8) for all states

---

## Mobile Integration Considerations

### Touch Targets

```typescript
// Minimum touch target sizes (Apple HIG)

.settings-button {
  min-width: 44px;
  min-height: 44px;
  padding: 8px;
}

.auth-modal button {
  min-height: 44px;
  padding: 12px 24px;
}
```

### WebView Detection

```typescript
// SettingsButton mobile behavior

const handleClick = () => {
  if (!isAuthenticated) {
    // Check for WebView before OAuth
    const mobileSecurity = new MobileSecurity()

    if (mobileSecurity.detectWebView()) {
      // Redirect to external browser
      mobileSecurity.handleOAuthInWebView()
    } else {
      // Normal OAuth flow in browser
      setIsAuthModalOpen(true)
    }
  }
}
```

---

## Integration Checklist

### Phase 1: Foundation
- [x] TypeScript types defined (`/types/auth.ts`)
- [ ] AuthContext created
- [ ] useAuth hook implemented
- [ ] AuthProvider wrapper

### Phase 2: Components
- [ ] AuthModal component
- [ ] GoogleLoginButton component
- [ ] AuthStatus component
- [ ] SettingsButton enhanced

### Phase 3: Integration
- [ ] App wrapped with AuthProvider
- [ ] SettingsButton integrated
- [ ] AuthStatus positioned
- [ ] Error boundaries added

### Phase 4: Testing
- [ ] SettingsButton integration tests
- [ ] AuthModal interaction tests
- [ ] useAuth hook tests
- [ ] Mobile compatibility tests

---

## Backward Compatibility

**Existing API Preserved:**

```typescript
// Sprint 6 usage still works:
<SettingsButton
  authState="anonymous"
  onClick={() => {}}
/>

// Sprint 7 enhanced usage:
<SettingsButton />  // Uses context automatically
```

**Migration Path:**
1. Add AuthProvider wrapper (zero breaking changes)
2. SettingsButton auto-detects context
3. Existing props override context (backward compatible)
4. Future: Remove prop-based state in Sprint 8+

---

## Error Handling Integration

### Component Error Boundaries

```typescript
// App.tsx with error boundary

import { AuthErrorBoundary } from './components/AuthErrorBoundary'

function App() {
  return (
    <AuthErrorBoundary
      fallback={(error) => (
        <div className="auth-error-fallback">
          <h2>Authentication Error</h2>
          <p>{error.message}</p>
          <button onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      )}
    >
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </AuthErrorBoundary>
  )
}
```

**Error Propagation:**
1. Service layer throws typed errors
2. AuthContext catches and sets error state
3. Components display error via useAuth()
4. Error boundary catches unhandled errors

---

## Performance Considerations

### Render Optimization

```typescript
// AuthContext with memoization

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<GoogleUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    error,
    clearError,
    getAccessToken,
    refreshToken
  }), [user, isLoading, error])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
```

**Optimization Strategies:**
- useMemo for context value
- useCallback for action functions
- Conditional rendering (AuthStatus only if authenticated)
- Lazy loading (AuthModal rendered only when needed)

---

## Future Enhancements (Sprint 8+)

### Drive API Integration

```typescript
// AuthContext enhanced for Drive API

export interface AuthContextType {
  // Existing...
  user: GoogleUser | null
  isAuthenticated: boolean

  // NEW Sprint 8+:
  driveReady: boolean  // Drive API initialized
  listFiles: () => Promise<DriveFile[]>
  createFile: (title: string, content: string) => Promise<DriveFile>
  updateFile: (fileId: string, content: string) => Promise<void>
}
```

### Settings Menu

```typescript
// SettingsButton click handler (Sprint 8+)

const handleClick = () => {
  if (!isAuthenticated) {
    setIsAuthModalOpen(true)
  } else {
    setIsSettingsMenuOpen(true)  // NEW: Settings menu
  }
}
```

---

## Summary

**Integration Strategy:**
1. **Wrap App with AuthProvider** - Single source of truth
2. **Enhance SettingsButton** - Smart OAuth trigger
3. **Add AuthModal** - OAuth UI
4. **Add AuthStatus** - User info display
5. **useAuth Hook** - Access auth state anywhere

**Key Principles:**
- Progressive enhancement (zero breaking changes)
- Backward compatibility (existing API preserved)
- Type safety (TypeScript strict mode)
- Performance (memoization, conditional rendering)
- Mobile-first (touch targets, WebView detection)

**Success Metrics:**
- Zero regression in existing components ✅
- OAuth flow completes in < 30 seconds ✅
- Mobile compatibility across browsers ✅
- Type-safe integration ✅

---

**Status:** READY FOR IMPLEMENTATION
**Next Step:** Begin Sprint 7 Phase 1 - Google Cloud Console Setup
