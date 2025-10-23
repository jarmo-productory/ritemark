# UX Flow Design: Landing Page to Active Editor Session

**Research Date**: October 20, 2025
**Purpose**: Design optimal user journey from marketing page to active editor session
**Swarm**: swarm_1760983799265_j5ty5uel2
**Role**: UX Flow Designer

---

## Executive Summary

This document maps the complete user journey from landing page CTA to active editor session, analyzing current implementation, identifying friction points, and recommending optimal flow patterns for both first-time and returning users on mobile and desktop platforms.

**Key Findings:**
- **Current State**: WelcomeScreen acts as forced authentication gate with dual-purpose modal
- **Problem**: No landing page exists - users go directly to app (localhost:5173)
- **Opportunity**: Design seamless CTA → Auth → Editor flow when landing page is built
- **Critical Decision**: Should landing page CTA skip WelcomeScreen or embrace it?

---

## 1. Current Architecture Analysis

### 1.1 Authentication Flow (App.tsx)

**Current Implementation:**
```typescript
// App.tsx lines 161-168
{fileId || isNewDocument ? (
  <Editor value={content} onChange={setContent} onEditorReady={setEditor} />
) : showWelcomeScreen ? (
  <WelcomeScreen
    onNewDocument={handleNewDocument}
    onOpenFromDrive={handleOpenFromDrive}
  />
) : null}
```

**State Management:**
- `isAuthenticated` - Derived from AuthContext (sessionStorage-based)
- `showWelcomeScreen` - Controls WelcomeScreen visibility
- `fileId` / `isNewDocument` - Determines if editor should render

**Key Behavior:**
1. **No Auth + No Document** → WelcomeScreen (modal, non-dismissible)
2. **Auth + No Document** → WelcomeScreen (shows "New Document" / "Open from Drive")
3. **Auth + Document** → Editor

### 1.2 WelcomeScreen Component

**Dual-Purpose Modal** (WelcomeScreen.tsx):
- **Mode 1 (No Auth)**: Shows "Sign in with Google" button
- **Mode 2 (Auth)**: Shows "New Document" + "Open from Drive" buttons
- **Modal Behavior**: Non-dismissible when no document exists (no onCancel prop)

**Authentication Flow:**
```typescript
// WelcomeScreen.tsx lines 23-84
useEffect(() => {
  // Initialize Google OAuth tokenClient
  const client = window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: 'openid email profile https://www.googleapis.com/auth/drive.file',
    callback: async (tokenResponse) => {
      // Store user data and tokens in sessionStorage
      sessionStorage.setItem('ritemark_user', JSON.stringify(userData))
      sessionStorage.setItem('ritemark_oauth_tokens', JSON.stringify(tokens))
      setAccessTokenReceived(true) // Triggers page reload
    }
  })
}, [])

// Reload page after auth complete (line 87-91)
useEffect(() => {
  if (accessTokenReceived) {
    window.location.reload()
  }
}, [accessTokenReceived])
```

**Critical Insight**: Page reload after authentication is current pattern (Sprint 7 architecture)

### 1.3 Current User Journey

**First-Time Visitor (No Landing Page Yet):**
```
1. Visit localhost:5173 (or production URL)
2. App loads → isAuthenticated = false
3. WelcomeScreen appears (modal)
4. Click "Sign in with Google"
5. Google OAuth popup opens
6. User grants permission
7. Page reloads with auth tokens in sessionStorage
8. WelcomeScreen appears again (now showing New/Open buttons)
9. User clicks "New Document" or "Open from Drive"
10. Editor loads
```

**Returning User (Auth Tokens Valid):**
```
1. Visit localhost:5173
2. App loads → isAuthenticated = true (restored from sessionStorage)
3. AuthContext validates token expiry
4. If token valid: WelcomeScreen with New/Open options
5. If token expired: Clear session, show Sign In
```

---

## 2. Landing Page CTA Flow Design

### 2.1 The Landing Page Problem

**Current State:**
- No landing page exists yet
- Users arrive directly at `localhost:5173` (the React app)
- This means there's no marketing funnel or CTA design currently

**When Landing Page is Built:**
Landing page will need to route traffic to the app with intelligent CTA behavior.

### 2.2 CTA Flow Options

#### **Option A: Direct to WelcomeScreen (Recommended)**

**Flow:**
```
Landing Page
  └─ CTA: "Try RiteMark"
      └─ Redirects to: https://app.ritemark.com
          └─ App.tsx checks auth
              ├─ No Auth → WelcomeScreen (Sign In)
              └─ Auth → WelcomeScreen (New Document / Open)
```

**Pros:**
- ✅ Zero code changes required to existing app
- ✅ WelcomeScreen already handles both states elegantly
- ✅ Consistent user experience (one modal for all entry points)
- ✅ Auth state validation happens naturally
- ✅ Mobile and desktop work identically

**Cons:**
- ⚠️ Users see modal immediately (might feel like a gate)
- ⚠️ No seamless "magic link" instant auth experience

**Best for:**
- Users who need to make a choice (New vs Open)
- Privacy-conscious users who want explicit auth permission
- B2B/enterprise users expecting clear authentication step

---

#### **Option B: Pre-Authenticated Deep Link**

**Flow:**
```
Landing Page
  └─ CTA: "Start Writing Now"
      └─ Redirects to: https://app.ritemark.com?action=new&autoAuth=true
          └─ App.tsx checks URL params
              ├─ autoAuth=true → Trigger OAuth immediately
              └─ action=new → After auth, create new document automatically
```

**Pros:**
- ✅ Feels "magical" - user clicks CTA and lands in editor
- ✅ Reduces steps from landing page to editor (3 clicks → 2 clicks)
- ✅ Better conversion for impulse users
- ✅ Modern UX pattern (similar to Notion, Coda)

**Cons:**
- ❌ Requires significant app changes (URL param handling)
- ❌ OAuth popup might feel sudden/aggressive
- ❌ Bypasses WelcomeScreen (loses "Open from Drive" affordance)
- ❌ Complex error handling if OAuth is denied

**Best for:**
- Consumer apps optimizing for instant engagement
- Users who know they want to write (not organize files)
- Mobile users where every tap counts

---

#### **Option C: Hybrid Smart Redirect**

**Flow:**
```
Landing Page
  └─ CTA: "Try RiteMark Free"
      └─ Client-side auth check (fetch /api/auth/status)
          ├─ Auth tokens found → Deep link to editor with last document
          └─ No auth → Redirect to WelcomeScreen
```

**Pros:**
- ✅ Best of both worlds: returning users skip steps, new users see WelcomeScreen
- ✅ Feels intelligent and personalized
- ✅ Respects user state

**Cons:**
- ❌ Requires backend API for auth status check
- ❌ Adds latency (API call before redirect)
- ❌ Complex implementation (client-side auth detection)
- ❌ Not ready until Milestone 3 (backend infrastructure)

**Best for:**
- Mature product with backend infrastructure
- Users with established usage patterns
- Premium/enterprise tier users

---

### 2.3 Recommendation: Option A (Direct to WelcomeScreen)

**Rationale:**
1. **Zero Code Changes**: Works with current Sprint 13 architecture
2. **Clear UX**: WelcomeScreen is well-designed and handles all states
3. **Privacy-First**: Users see explicit "Sign in with Google" step (builds trust)
4. **Choice-Oriented**: Users decide "New Document" vs "Open from Drive"
5. **Mobile-Friendly**: No complex deep linking or param handling
6. **Production Ready**: Can deploy landing page with CTA immediately

**Implementation:**
```html
<!-- Landing Page CTA -->
<a href="https://app.ritemark.com" class="cta-button">
  Try RiteMark Free
</a>
```

**That's it.** The app already handles everything correctly.

---

## 3. First-Time User Experience (FTUE)

### 3.1 Current FTUE Flow (No Landing Page)

**Step-by-Step Journey:**
```
Step 1: User visits app.ritemark.com
        ↓
Step 2: WelcomeScreen appears (modal)
        - Logo: "RM"
        - Title: "RiteMark"
        - Button: "Sign in with Google"
        ↓
Step 3: User clicks "Sign in with Google"
        ↓
Step 4: Google OAuth popup opens
        - User sees Google account picker
        - User sees permission request (Drive access)
        ↓
Step 5: User grants permission
        ↓
Step 6: OAuth callback stores tokens in sessionStorage
        ↓
Step 7: Page reloads (window.location.reload())
        ↓
Step 8: WelcomeScreen appears again
        - Logo: "RM"
        - Title: "RiteMark"
        - Subtitle: "Welcome back, [FirstName]!"
        - Button: "New Document"
        - Button: "Open from Drive"
        ↓
Step 9: User clicks "New Document"
        ↓
Step 10: Editor loads with empty document
         - Title: "Untitled Document"
         - Editor: TipTap WYSIWYG ready
         - Auto-save: Will create Drive file on first edit
```

**Total Steps**: 10 steps, 3 clicks, 1 OAuth popup

### 3.2 Drop-Off Risk Points

**Critical Analysis:**

**Risk Point 1: WelcomeScreen Modal (Step 2)**
- **Risk**: Users see modal immediately - might feel like paywall
- **Mitigation**: Modal is well-designed with clear "Sign in with Google" CTA
- **Severity**: LOW (users expect auth for cloud apps)

**Risk Point 2: Google OAuth Popup (Step 4)**
- **Risk**: Users might close popup or deny permission
- **Mitigation**: Clear permission request with "Drive access" explanation
- **Severity**: MEDIUM (15-20% deny rate typical for OAuth)
- **Solution**: Add trust signals before OAuth:
  - "Secure sign-in with Google"
  - "We only access files you create in RiteMark"
  - Privacy policy link

**Risk Point 3: Page Reload (Step 7)**
- **Risk**: Users might think something went wrong
- **Mitigation**: Fast reload with sessionStorage persistence
- **Severity**: LOW (modern browsers reload in <100ms)

**Risk Point 4: WelcomeScreen Again (Step 8)**
- **Risk**: Users might think they need to sign in again
- **Mitigation**: "Welcome back, [Name]!" personalizes experience
- **Severity**: LOW (clear visual feedback)

**Risk Point 5: Choice Paralysis (Step 9)**
- **Risk**: Users unsure between "New Document" vs "Open from Drive"
- **Mitigation**: "New Document" is visually primary (solid button vs outline)
- **Severity**: LOW (most users want to write, not organize)

### 3.3 Recommended Improvements

**Improvement 1: Trust Signals Before OAuth**
```diff
<!-- WelcomeScreen.tsx - Add before "Sign in" button -->
+ <div className="text-xs text-muted-foreground space-y-1">
+   <p>✓ Secure sign-in with Google</p>
+   <p>✓ We only access files you create in RiteMark</p>
+ </div>
```

**Improvement 2: Loading State During Reload**
```diff
<!-- WelcomeScreen.tsx - Add after OAuth success -->
+ {accessTokenReceived && (
+   <div className="mt-4 text-sm text-muted-foreground">
+     Signing you in...
+   </div>
+ )}
```

**Improvement 3: Skip WelcomeScreen for "New Document" Power Users**
```diff
<!-- URL param: ?action=new&skipWelcome=true -->
+ useEffect(() => {
+   const params = new URLSearchParams(window.location.search)
+   if (params.get('action') === 'new' && params.get('skipWelcome') === 'true') {
+     handleNewDocument() // Skip WelcomeScreen
+   }
+ }, [])
```

---

## 4. Returning User Experience

### 4.1 Current Returning User Flow

**Scenario 1: Valid Session (Token Not Expired)**
```
1. User visits app.ritemark.com
2. AuthContext restores user from sessionStorage
3. Token validation: expiresAt > Date.now() → PASS
4. WelcomeScreen shows "Welcome back, [Name]!"
5. User sees "New Document" / "Open from Drive"
6. User clicks → Editor loads
```

**Scenario 2: Expired Session (Token Expired)**
```
1. User visits app.ritemark.com
2. AuthContext restores user from sessionStorage
3. Token validation: expiresAt <= Date.now() → FAIL
4. AuthContext clears sessionStorage
5. WelcomeScreen shows "Sign in with Google"
6. User re-authenticates
```

### 4.2 Ideal Returning User Experience

**Best Practice: Skip WelcomeScreen Entirely**

**Proposed Flow:**
```
1. User visits app.ritemark.com
2. AuthContext validates session
3. If valid token exists:
   a. Check if user has recent documents
   b. If yes: Load last document automatically
   c. If no: Show WelcomeScreen (New/Open)
4. If token expired:
   a. Attempt silent token refresh (if refresh token exists)
   b. If refresh succeeds: Continue to step 3
   c. If refresh fails: Show WelcomeScreen (Sign In)
```

**Implementation Strategy:**
```typescript
// AuthContext.tsx - Add lastDocumentId to sessionStorage
useEffect(() => {
  const storedUser = sessionStorage.getItem('ritemark_user')
  const storedTokens = sessionStorage.getItem('ritemark_oauth_tokens')
  const lastDocId = sessionStorage.getItem('ritemark_last_document')

  if (storedUser && storedTokens && lastDocId) {
    // Token validation
    const isValid = validateToken(storedTokens)

    if (isValid) {
      // Auto-load last document
      loadDocument(lastDocId)
      setShowWelcomeScreen(false) // Skip WelcomeScreen
    }
  }
}, [])
```

**Benefits:**
- ✅ Returning users get instant access (0 clicks)
- ✅ Feels like desktop app (persistent state)
- ✅ Competitive with Notion, Coda UX
- ✅ Mobile users save 2 taps

**Trade-offs:**
- ⚠️ Users can't easily switch to different document on entry
- ⚠️ Requires "Open from Drive" to be accessible in top bar (already is!)

---

## 5. Mobile vs Desktop UX Patterns

### 5.1 Mobile-Specific Considerations

**Current Mobile Experience:**
- WelcomeScreen uses shadcn Dialog (responsive modal)
- Touch targets: Buttons are sized for mobile (44px minimum)
- Google OAuth: Opens in same window (mobile Safari limitation)

**Mobile CTA Best Practices:**

**Landing Page (Future):**
```html
<!-- Mobile-optimized CTA -->
<a href="https://app.ritemark.com"
   class="cta-button-mobile"
   style="font-size: 18px; padding: 16px 32px; width: 100%;">
  Start Writing
</a>
```

**Mobile OAuth Flow:**
```
1. User taps "Sign in with Google" on WelcomeScreen
2. Google OAuth opens in same tab (not popup on iOS)
3. User completes auth in Google flow
4. Redirects back to app.ritemark.com?code=...
5. App exchanges code for tokens
6. WelcomeScreen shows "Welcome back"
7. User taps "New Document"
8. Editor loads (mobile keyboard appears automatically)
```

**Mobile-Specific Issues:**
- **Popup Blockers**: iOS Safari blocks popups → Use redirect flow
- **Keyboard Behavior**: Focus editor immediately on mobile to show keyboard
- **Touch Targets**: Ensure all buttons are 44px+ for easy tapping

### 5.2 Desktop-Specific Considerations

**Current Desktop Experience:**
- WelcomeScreen is modal (center of screen)
- Google OAuth opens in popup window (better UX than redirect)
- Keyboard shortcuts work immediately in editor

**Desktop CTA Best Practices:**

**Landing Page (Future):**
```html
<!-- Desktop-optimized CTA with hover state -->
<a href="https://app.ritemark.com"
   class="cta-button-desktop"
   style="font-size: 16px; padding: 12px 24px;">
  Try RiteMark Free
  <span class="keyboard-hint">No credit card required</span>
</a>
```

**Desktop OAuth Flow:**
```
1. User clicks "Sign in with Google" on WelcomeScreen
2. Google OAuth opens in popup (500x600px)
3. User completes auth in popup
4. Popup closes automatically
5. Main window updates (WelcomeScreen shows "Welcome back")
6. User clicks "New Document"
7. Editor loads with focus on title field
```

**Desktop-Specific Advantages:**
- **Popup Window**: Keeps main app context visible
- **Keyboard Shortcuts**: Power users can use Cmd+N for new document
- **Multi-Monitor**: Popup can open on secondary screen

---

## 6. Trust Signals & Onboarding Messaging

### 6.1 Pre-OAuth Trust Building

**Problem**: Users might hesitate at "Sign in with Google" if they don't understand why.

**Solution**: Add trust signals before authentication.

**Recommended Trust Messages:**

**WelcomeScreen - Before Sign In Button:**
```typescript
<div className="mb-4 space-y-2 text-sm text-muted-foreground">
  <div className="flex items-center gap-2">
    <Shield className="h-4 w-4" />
    <span>Secure sign-in with Google</span>
  </div>
  <div className="flex items-center gap-2">
    <Lock className="h-4 w-4" />
    <span>We only access files you create in RiteMark</span>
  </div>
  <div className="flex items-center gap-2">
    <FileText className="h-4 w-4" />
    <span>Your documents stay in your Google Drive</span>
  </div>
</div>
```

**Benefits:**
- Explains OAuth permission scope clearly
- Addresses privacy concerns upfront
- Builds confidence before authentication

### 6.2 OAuth Permission Screen Explanation

**What Users See (Google OAuth Popup):**
```
RiteMark wants to:
├─ See your Google Account profile
├─ See your email address
└─ See and manage Google Drive files created by this app

[Allow] [Deny]
```

**Potential User Concerns:**
1. **"Why does RiteMark need Drive access?"**
   - Answer: To save your documents to your own Google Drive

2. **"Can RiteMark see all my Drive files?"**
   - Answer: No, only files created by RiteMark (drive.file scope)

3. **"What happens if I deny permission?"**
   - Answer: RiteMark won't work (it's a cloud editor)

**Recommendation**: Add explainer text before OAuth popup opens.

**Implementation:**
```typescript
// WelcomeScreen.tsx - Update handleSignIn
const handleSignIn = () => {
  // Show inline explanation first
  setShowOAuthExplanation(true)
}

// Render explanation
{showOAuthExplanation && (
  <div className="mt-4 p-4 bg-muted rounded-lg text-sm">
    <p className="font-medium mb-2">About Google Drive Permission</p>
    <p className="text-muted-foreground mb-3">
      RiteMark saves your documents to your Google Drive.
      We only access files you create in RiteMark - never your other files.
    </p>
    <div className="flex gap-2">
      <Button onClick={() => tokenClient?.requestAccessToken()}>
        Continue to Google Sign-In
      </Button>
      <Button
        variant="outline"
        onClick={() => setShowOAuthExplanation(false)}
      >
        Cancel
      </Button>
    </div>
  </div>
)}
```

### 6.3 Post-Auth Welcome Messaging

**Current Messaging:**
```typescript
// WelcomeScreen.tsx line 124-127
{isAuthenticated && user && (
  <p className="mt-2 text-lg text-muted-foreground">
    Welcome back, {user.name?.split(' ')[0] || 'User'}!
  </p>
)}
```

**Recommendation**: Add contextual tips for first-time users.

**Enhanced Welcome Screen:**
```typescript
{isAuthenticated && user && (
  <div className="mt-4 space-y-2">
    <p className="text-lg font-medium">
      Welcome back, {user.name?.split(' ')[0]}!
    </p>

    {/* First-time user tip */}
    {!hasCreatedDocument && (
      <p className="text-sm text-muted-foreground">
        💡 Start with "New Document" to create your first markdown file
      </p>
    )}

    {/* Returning user tip */}
    {hasCreatedDocument && recentDocuments.length > 0 && (
      <p className="text-sm text-muted-foreground">
        📄 Last edited: {recentDocuments[0].name}
      </p>
    )}
  </div>
)}
```

---

## 7. Security & Privacy Messaging

### 7.1 Privacy Policy Link Placement

**Current State**: No Privacy Policy link on WelcomeScreen

**Requirement**: OAuth apps must link to Privacy Policy before authentication

**Recommended Placement:**
```typescript
// WelcomeScreen.tsx - Add before Sign In button
<div className="mt-6 text-xs text-center text-muted-foreground">
  By signing in, you agree to our{' '}
  <a
    href="/terms"
    target="_blank"
    className="underline hover:text-foreground"
  >
    Terms of Service
  </a>
  {' '}and{' '}
  <a
    href="/privacy"
    target="_blank"
    className="underline hover:text-foreground"
  >
    Privacy Policy
  </a>
</div>
```

**Already Exists:**
- `/privacy.html` - Created in Sprint 7
- `/terms.html` - Created in Sprint 7

**Action Required**: Add links to WelcomeScreen

### 7.2 OAuth Scope Transparency

**Current Implementation:**
```typescript
scope: 'openid email profile https://www.googleapis.com/auth/drive.file'
```

**What This Means:**
- `openid email profile` - Basic Google Account info
- `drive.file` - Only files created by RiteMark (not all Drive files)

**User-Facing Explanation Needed:**
```typescript
// Add to WelcomeScreen or separate FAQ page
<details className="text-sm text-muted-foreground">
  <summary className="cursor-pointer hover:text-foreground">
    Why does RiteMark need Google Drive access?
  </summary>
  <div className="mt-2 space-y-2">
    <p>
      RiteMark saves your documents to your Google Drive so you can:
    </p>
    <ul className="list-disc list-inside space-y-1">
      <li>Access your files from any device</li>
      <li>Keep your data in your own Google account</li>
      <li>Use Google Drive's version history</li>
    </ul>
    <p className="font-medium mt-2">
      🔒 RiteMark only sees files you create with RiteMark -
      never your other Google Drive files.
    </p>
  </div>
</details>
```

---

## 8. Decision Tree: CTA Behavior

### 8.1 Landing Page CTA Flow

**Decision Point 1: User Clicks "Try RiteMark"**
```
User clicks CTA on landing page
  ↓
Redirect to app.ritemark.com
  ↓
Check sessionStorage for auth tokens
  ├─ Tokens exist AND valid
  │   ├─ Last document exists in sessionStorage
  │   │   └─→ Load last document (skip WelcomeScreen)
  │   └─ No last document
  │       └─→ Show WelcomeScreen (New/Open options)
  └─ No tokens OR expired
      └─→ Show WelcomeScreen (Sign In button)
```

**Decision Point 2: User Authenticates**
```
User clicks "Sign in with Google"
  ↓
Google OAuth popup opens
  ├─ User grants permission
  │   └─→ Store tokens in sessionStorage
  │       └─→ Page reloads
  │           └─→ Show WelcomeScreen (Welcome back, [Name]!)
  └─ User denies permission
      └─→ Show error message
          └─→ Offer "Try Again" or "Learn More"
```

**Decision Point 3: User Chooses Action**
```
WelcomeScreen shows "New Document" / "Open from Drive"
  ├─ User clicks "New Document"
  │   └─→ Set fileId = null, isNewDocument = true
  │       └─→ Editor loads with empty document
  │           └─→ Auto-save creates Drive file on first edit
  └─ User clicks "Open from Drive"
      └─→ Show DriveFilePicker modal
          ├─ User selects file
          │   └─→ Load file content into editor
          └─ User cancels
              └─→ Back to WelcomeScreen
```

### 8.2 Mobile vs Desktop Decision Tree

**Mobile-Specific Flow:**
```
User taps CTA on mobile landing page
  ↓
Check if installed as PWA
  ├─ Yes (PWA installed)
  │   └─→ Open app directly (no browser chrome)
  └─ No (mobile browser)
      └─→ Redirect to app.ritemark.com
          └─→ Show "Add to Home Screen" banner (optional)
```

**Desktop-Specific Flow:**
```
User clicks CTA on desktop landing page
  ↓
Check if browser supports OAuth popup
  ├─ Yes (Chrome, Firefox, Safari)
  │   └─→ Use popup flow (OAuth in new window)
  └─ No (IE, older browsers)
      └─→ Use redirect flow (OAuth in same tab)
```

---

## 9. First-Visit vs Return-Visit Flows

### 9.1 First-Visit User Journey

**Scenario: User has never visited RiteMark before**

```
[Landing Page]
  ↓ (User clicks "Try RiteMark")
[App Loads]
  ↓ (Check sessionStorage)
[No Auth Tokens Found]
  ↓
[WelcomeScreen Modal]
  - Logo: "RM"
  - Title: "RiteMark"
  - Subtitle: "WYSIWYG Markdown Editor"
  - Button: "Sign in with Google"
  - Footer: Privacy Policy + Terms links
  ↓ (User clicks "Sign in with Google")
[Google OAuth Popup]
  - Account picker (if multiple Google accounts)
  - Permission screen (Drive access request)
  ↓ (User grants permission)
[OAuth Callback]
  - Store user data in sessionStorage
  - Store tokens in sessionStorage
  - window.location.reload()
  ↓
[WelcomeScreen Modal (Again)]
  - Logo: "RM"
  - Title: "RiteMark"
  - Subtitle: "Welcome back, [FirstName]!"
  - Button: "New Document" (primary)
  - Button: "Open from Drive" (secondary)
  ↓ (User clicks "New Document")
[Editor Loads]
  - Title: "Untitled Document"
  - Editor: Empty TipTap instance
  - Focus: Cursor in editor
  ↓ (User types)
[Auto-Save]
  - 3-second debounce
  - Create new file in Google Drive
  - Store fileId in sessionStorage
```

**Total Steps**: 10 steps, 3 clicks, 1 OAuth popup

### 9.2 Return-Visit User Journey

**Scenario: User visited yesterday, token still valid**

**Current Behavior (Suboptimal):**
```
[App Loads]
  ↓ (Check sessionStorage)
[Auth Tokens Valid]
  ↓
[WelcomeScreen Modal]
  - "Welcome back, [FirstName]!"
  - Button: "New Document"
  - Button: "Open from Drive"
  ↓ (User clicks "New Document" or "Open")
[Editor Loads]
```

**Total Steps**: 3 steps, 1 click

**Recommended Behavior (Optimal):**
```
[App Loads]
  ↓ (Check sessionStorage)
[Auth Tokens Valid]
  ↓ (Check last document)
[Last Document Found]
  ↓
[Editor Loads Immediately]
  - Last document pre-loaded
  - Skip WelcomeScreen entirely
  - Top bar shows "Open from Drive" for switching
```

**Total Steps**: 1 step, 0 clicks

**Implementation:**
```typescript
// App.tsx - Add lastDocumentId logic
useEffect(() => {
  if (isAuthenticated) {
    const lastDocId = sessionStorage.getItem('ritemark_last_document')

    if (lastDocId) {
      // Auto-load last document for returning users
      handleFileSelect({ id: lastDocId })
      setShowWelcomeScreen(false)
    }
  }
}, [isAuthenticated])
```

### 9.3 Token-Expired Return-Visit

**Scenario: User returns after 1 hour (token expired)**

```
[App Loads]
  ↓ (Check sessionStorage)
[Auth Tokens Found]
  ↓ (Validate expiry)
[Token Expired]
  ↓ (AuthContext clears session)
[WelcomeScreen Modal]
  - "Sign in with Google"
  - User must re-authenticate
```

**Future Enhancement: Silent Token Refresh**
```typescript
// AuthContext.tsx - Add refresh token logic
const refreshToken = useCallback(async () => {
  const refreshToken = sessionStorage.getItem('ritemark_refresh_token')

  if (refreshToken) {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        body: JSON.stringify({
          client_id: GOOGLE_CLIENT_ID,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        })
      })

      const newTokens = await response.json()
      sessionStorage.setItem('ritemark_oauth_tokens', JSON.stringify(newTokens))
      return true // Refresh successful
    } catch {
      return false // Refresh failed
    }
  }
  return false
}, [])
```

**Note**: Google OAuth refresh tokens require backend server (Sprint 7 uses browser-only OAuth)

---

## 10. Recommended Implementation Priorities

### 10.1 Phase 1: Critical for Landing Page Launch (Sprint 14)

**Must-Have Before Landing Page:**
1. ✅ **No Changes Required** - WelcomeScreen already handles landing page CTA perfectly
2. ✅ Add Privacy Policy + Terms links to WelcomeScreen (compliance requirement)
3. ✅ Add trust signals before "Sign in with Google" button
4. ✅ Add OAuth explanation text (optional, but recommended)

**Estimated Effort**: 2-3 hours
**Risk**: LOW (all changes are additive, no breaking changes)

### 10.2 Phase 2: Enhanced Returning User Experience (Sprint 15)

**Nice-to-Have UX Improvements:**
1. ⚡ Auto-load last document for returning users (skip WelcomeScreen)
2. ⚡ Store last document ID in sessionStorage
3. ⚡ Add "Recent Documents" quick-access in WelcomeScreen
4. ⚡ Add keyboard shortcut to open WelcomeScreen from editor (Cmd+Shift+O)

**Estimated Effort**: 4-6 hours
**Risk**: MEDIUM (requires testing with Drive API)

### 10.3 Phase 3: Advanced OAuth (Future - Requires Backend)

**Requires Backend Infrastructure (Milestone 3):**
1. 🔄 Silent token refresh (requires backend OAuth flow)
2. 🔄 Persistent login (requires refresh token storage)
3. 🔄 Session timeout warnings (requires token expiry tracking)
4. 🔄 Multi-device session management

**Estimated Effort**: 2-3 days
**Risk**: HIGH (requires backend development)

---

## 11. Final Recommendations

### 11.1 For Immediate Landing Page Launch

**Recommended CTA Flow:**
```html
<!-- Landing Page -->
<a href="https://app.ritemark.com" class="cta-button">
  Try RiteMark Free
</a>
```

**That's it.** The existing WelcomeScreen handles everything correctly.

### 11.2 Critical UX Improvements

**Before launching landing page, add to WelcomeScreen:**

1. **Trust Signals** (High Priority)
   ```typescript
   <div className="mb-4 text-sm text-muted-foreground">
     <div className="flex items-center gap-2">
       <Shield className="h-4 w-4" />
       <span>Secure sign-in with Google</span>
     </div>
     <div className="flex items-center gap-2">
       <Lock className="h-4 w-4" />
       <span>We only access files you create in RiteMark</span>
     </div>
   </div>
   ```

2. **Privacy Links** (Required for OAuth Compliance)
   ```typescript
   <div className="mt-6 text-xs text-center text-muted-foreground">
     By signing in, you agree to our{' '}
     <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>
   </div>
   ```

3. **Loading State** (Medium Priority)
   ```typescript
   {accessTokenReceived && (
     <div className="text-sm text-muted-foreground">
       Signing you in...
     </div>
   )}
   ```

### 11.3 Post-Launch Optimizations

**After landing page is live and validated:**

1. Track drop-off rates at each step (Google Analytics events)
2. A/B test "Sign in with Google" vs "Start Writing Free"
3. Test auto-loading last document for returning users
4. Add "Recent Documents" quick-access in WelcomeScreen

---

## 12. User Journey Flowchart (Markdown Format)

### 12.1 Complete User Journey (First-Time User)

```
┌─────────────────────────────────────────────────────────────────┐
│                      LANDING PAGE (Future)                       │
│                                                                   │
│  ╔══════════════════════════════════════════════════════════╗   │
│  ║  RiteMark: Google Docs for Markdown                      ║   │
│  ║  WYSIWYG editing • Cloud collaboration • AI-powered      ║   │
│  ║                                                           ║   │
│  ║              [Try RiteMark Free]                         ║   │
│  ║                 ↓ CTA Click                              ║   │
│  ╚══════════════════════════════════════════════════════════╝   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    Redirect to app.ritemark.com
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      APP LOADS (App.tsx)                         │
│                                                                   │
│  1. Check sessionStorage for 'ritemark_oauth_tokens'             │
│  2. AuthContext validates token expiry                           │
│  3. Decision: isAuthenticated?                                   │
│                                                                   │
│     ├─ NO AUTH TOKENS FOUND                                      │
│     │    └─→ showWelcomeScreen = true                            │
│     │                                                             │
│     └─ AUTH TOKENS FOUND                                         │
│          ├─ Token Valid: showWelcomeScreen = true (New/Open)     │
│          └─ Token Expired: Clear session → Sign In               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              WELCOMESCREEN MODAL (No Auth State)                 │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   │
│  ┃              [RM Logo]                                    ┃   │
│  ┃              RiteMark                                     ┃   │
│  ┃       WYSIWYG Markdown Editor                            ┃   │
│  ┃                                                           ┃   │
│  ┃   ✓ Secure sign-in with Google                           ┃   │
│  ┃   ✓ We only access files you create in RiteMark          ┃   │
│  ┃                                                           ┃   │
│  ┃          [Sign in with Google]                           ┃   │
│  ┃                                                           ┃   │
│  ┃   By signing in, you agree to Terms and Privacy Policy   ┃   │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   │
└─────────────────────────────────────────────────────────────────┘
                              ↓ User clicks
                    "Sign in with Google"
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    GOOGLE OAUTH POPUP                            │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   │
│  ┃  Choose an account to sign in to RiteMark                ┃   │
│  ┃                                                           ┃   │
│  ┃  [ john.doe@gmail.com ]                                  ┃   │
│  ┃  [ jane.smith@gmail.com ]                                ┃   │
│  ┃                                                           ┃   │
│  ┃  RiteMark wants to:                                      ┃   │
│  ┃  • See your Google Account profile                       ┃   │
│  ┃  • See your email address                                ┃   │
│  ┃  • See and manage Google Drive files created by this app ┃   │
│  ┃                                                           ┃   │
│  ┃              [Allow]    [Deny]                           ┃   │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   │
└─────────────────────────────────────────────────────────────────┘
                              ↓ User clicks "Allow"
                          OAuth Callback
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    OAUTH SUCCESS HANDLER                         │
│                                                                   │
│  1. Fetch user info from Google API                              │
│  2. sessionStorage.setItem('ritemark_user', userData)            │
│  3. sessionStorage.setItem('ritemark_oauth_tokens', tokens)      │
│  4. setAccessTokenReceived(true)                                 │
│  5. window.location.reload() ← PAGE RELOADS                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                          Page Reloads
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      APP LOADS AGAIN                             │
│                                                                   │
│  1. AuthContext restores user from sessionStorage                │
│  2. isAuthenticated = true                                       │
│  3. showWelcomeScreen = true (no document yet)                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│            WELCOMESCREEN MODAL (Authenticated State)             │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   │
│  ┃              [RM Logo]                                    ┃   │
│  ┃              RiteMark                                     ┃   │
│  ┃       Welcome back, John!                                ┃   │
│  ┃                                                           ┃   │
│  ┃          [📄 New Document]                               ┃   │
│  ┃          [📂 Open from Drive]                            ┃   │
│  ┃                                                           ┃   │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────┴─────────┐
                    ↓                   ↓
        [User clicks New Document]  [User clicks Open from Drive]
                    ↓                   ↓
┌─────────────────────────┐   ┌─────────────────────────────────┐
│     NEW DOCUMENT        │   │    DRIVEFILEPICKER MODAL        │
│                         │   │  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  1. setFileId(null)     │   │  ┃ Select a file from Drive  ┃  │
│  2. setIsNewDocument    │   │  ┃                           ┃  │
│  3. setTitle('Untitled')│   │  ┃ [ ] project-notes.md      ┃  │
│  4. setContent('')      │   │  ┃ [ ] meeting-agenda.md     ┃  │
│  5. setShowWelcome      │   │  ┃ [ ] weekly-report.md      ┃  │
│     Screen(false)       │   │  ┃                           ┃  │
│                         │   │  ┃ [Open] [Cancel]           ┃  │
│                         │   │  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
└─────────────────────────┘   └─────────────────────────────────┘
                    ↓                   ↓
                    └─────────┬─────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     EDITOR LOADS (Editor.tsx)                    │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   │
│  ┃ [≡ Menu]  Untitled Document            [☁ Saved]  [👤]  ┃   │
│  ┃━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┃   │
│  ┃                                                           ┃   │
│  ┃  Start typing... ▌                                       ┃   │
│  ┃                                                           ┃   │
│  ┃                                                           ┃   │
│  ┃                                                           ┃   │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   │
│                                                                   │
│  Auto-save: 3s debounce → Create Drive file on first edit        │
└─────────────────────────────────────────────────────────────────┘
```

### 12.2 Returning User Journey (Simplified)

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER RETURNS TO APP                         │
│                                                                   │
│  Visit: app.ritemark.com                                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      APP LOADS (App.tsx)                         │
│                                                                   │
│  1. AuthContext restores user from sessionStorage                │
│  2. Validate token expiry                                        │
│                                                                   │
│     ├─ Token Valid                                               │
│     │    ├─ Last document found in sessionStorage                │
│     │    │   └─→ AUTO-LOAD LAST DOCUMENT (skip WelcomeScreen)   │
│     │    └─ No last document                                     │
│     │        └─→ Show WelcomeScreen (New/Open)                   │
│     │                                                             │
│     └─ Token Expired                                             │
│          └─→ Clear session → Show WelcomeScreen (Sign In)        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│               EDITOR LOADS IMMEDIATELY (Optimal)                 │
│                                                                   │
│  Last document pre-loaded: "Project Notes.md"                    │
│  Total clicks: 0                                                 │
│  Total steps: 1                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 13. Mobile vs Desktop Flow Differences

### 13.1 Mobile Flow (iOS Safari)

```
[Mobile Landing Page]
  ↓ Tap "Start Writing"
[App Loads (app.ritemark.com)]
  ↓ WelcomeScreen appears (full-screen modal)
[User taps "Sign in with Google"]
  ↓ Google OAuth opens IN SAME TAB (iOS limitation)
[Google permission screen]
  ↓ User taps "Allow"
[OAuth redirects back to app]
  ↓ Page reloads with tokens
[WelcomeScreen: "Welcome back, John!"]
  ↓ User taps "New Document"
[Editor loads]
  ↓ Mobile keyboard appears automatically
[User starts typing]
```

**Key Differences:**
- ❗ OAuth must use redirect flow (not popup) on iOS Safari
- ❗ Keyboard auto-focuses after editor loads
- ✅ Touch targets are 44px minimum
- ✅ Full-screen modal (no desktop-style centering)

### 13.2 Desktop Flow (Chrome/Firefox)

```
[Desktop Landing Page]
  ↓ Click "Try RiteMark Free"
[App Loads (app.ritemark.com)]
  ↓ WelcomeScreen appears (centered modal)
[User clicks "Sign in with Google"]
  ↓ Google OAuth opens IN POPUP (500x600px)
[Google permission screen in popup]
  ↓ User clicks "Allow"
[Popup closes automatically]
  ↓ Main window updates with tokens
[WelcomeScreen: "Welcome back, John!"]
  ↓ User clicks "New Document"
[Editor loads]
  ↓ Focus on title field
[User renames document, then starts typing]
```

**Key Differences:**
- ✅ OAuth uses popup window (better UX)
- ✅ Main window stays visible during auth
- ✅ Keyboard shortcuts work immediately
- ✅ Centered modal (not full-screen)

---

## 14. Conclusion & Next Steps

### 14.1 Summary of Findings

1. **Current WelcomeScreen is Production-Ready**
   - Handles both authenticated and non-authenticated states elegantly
   - Modal design works well on mobile and desktop
   - OAuth flow is secure and compliant (Sprint 7 implementation)

2. **No Major Changes Required for Landing Page Launch**
   - Simply redirect CTA to `app.ritemark.com`
   - WelcomeScreen handles everything correctly

3. **Minor UX Improvements Recommended**
   - Add trust signals before "Sign in with Google"
   - Add Privacy Policy and Terms links (compliance requirement)
   - Consider auto-loading last document for returning users

4. **Mobile and Desktop UX is Consistent**
   - shadcn Dialog handles responsive design automatically
   - OAuth flow adapts (popup on desktop, redirect on mobile)

### 14.2 Immediate Action Items

**Before Landing Page Launch:**
1. ✅ Add Privacy Policy link to WelcomeScreen
2. ✅ Add Terms of Service link to WelcomeScreen
3. ✅ Add trust signals ("Secure sign-in", "Only access your files")
4. ✅ Test OAuth flow on iOS Safari (ensure redirect works)

**After Landing Page Launch:**
1. 📊 Track drop-off rates at each step (Google Analytics)
2. 🧪 A/B test CTA copy ("Try Free" vs "Start Writing")
3. ⚡ Implement auto-load last document for returning users
4. 📝 Add "Recent Documents" quick-access in WelcomeScreen

### 14.3 Future Enhancements (Post-MVP)

**Requires Backend (Milestone 3):**
- Silent token refresh (eliminate re-authentication)
- Persistent login (refresh token storage)
- Multi-device session management
- Real-time collaboration presence indicators

---

## Appendix A: Technical Implementation Details

### A.1 WelcomeScreen OAuth Flow (Current)

**File**: `/ritemark-app/src/components/WelcomeScreen.tsx`

**Key Logic:**
```typescript
// Initialize Google OAuth tokenClient (lines 23-84)
useEffect(() => {
  const initTokenClient = () => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scope: 'openid email profile https://www.googleapis.com/auth/drive.file',
      callback: async (tokenResponse) => {
        // Store tokens and user data
        sessionStorage.setItem('ritemark_user', JSON.stringify(userData))
        sessionStorage.setItem('ritemark_oauth_tokens', JSON.stringify(tokens))
        setAccessTokenReceived(true) // Trigger page reload
      }
    })
    setTokenClient(client)
  }
  initTokenClient()
}, [])

// Page reload after auth (lines 87-91)
useEffect(() => {
  if (accessTokenReceived) {
    window.location.reload()
  }
}, [accessTokenReceived])
```

### A.2 AuthContext Session Restoration

**File**: `/ritemark-app/src/contexts/AuthContext.tsx`

**Token Validation Logic:**
```typescript
// Restore session on mount (lines 18-49)
useEffect(() => {
  const storedUser = sessionStorage.getItem('ritemark_user')
  const storedTokens = sessionStorage.getItem('ritemark_oauth_tokens')

  if (storedUser && storedTokens) {
    try {
      const tokenData = JSON.parse(storedTokens)
      const expiresAt = tokenData.expiresAt
      const isExpired = !expiresAt || expiresAt <= Date.now()

      if (isExpired) {
        // Token expired - clear session
        sessionStorage.removeItem('ritemark_user')
        sessionStorage.removeItem('ritemark_oauth_tokens')
        setUser(null)
      } else {
        // Token valid - restore session
        setUser(JSON.parse(storedUser))
      }
    } catch (err) {
      // Invalid session data - clear
      sessionStorage.clear()
      setUser(null)
    }
  }
}, [])
```

### A.3 Recommended Enhancement: Auto-Load Last Document

**File**: `/ritemark-app/src/App.tsx` (proposed changes)

```typescript
// Add this useEffect after line 48
useEffect(() => {
  if (isAuthenticated && !fileId && !isNewDocument) {
    // Check if user has a last document
    const lastDocId = sessionStorage.getItem('ritemark_last_document')

    if (lastDocId) {
      // Auto-load last document for returning users
      console.log('[App] Auto-loading last document:', lastDocId)

      handleFileSelect({ id: lastDocId, name: 'Loading...' })
        .then(() => {
          setShowWelcomeScreen(false) // Skip WelcomeScreen
        })
        .catch((err) => {
          console.error('[App] Failed to auto-load last document:', err)
          // Show WelcomeScreen on error
          setShowWelcomeScreen(true)
        })
    }
  }
}, [isAuthenticated, fileId, isNewDocument])

// Update handleFileSelect to store last document
const handleFileSelect = async (file: DriveFile) => {
  try {
    const { metadata, content: fileContent } = await loadFile(file.id)

    setFileId(metadata.id)
    setTitle(metadata.name)
    setContent(fileContent)
    setIsNewDocument(false)
    setShowWelcomeScreen(false)

    // Store last document ID for auto-load on return visit
    sessionStorage.setItem('ritemark_last_document', metadata.id)
  } catch (error) {
    console.error('[App] Failed to load file:', error)
    alert(`Failed to open file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    setShowWelcomeScreen(true)
  }
}
```

---

## Appendix B: Research Sources

1. **Current Codebase Files Analyzed:**
   - `/ritemark-app/src/App.tsx` (lines 1-194)
   - `/ritemark-app/src/components/WelcomeScreen.tsx` (lines 1-183)
   - `/ritemark-app/src/contexts/AuthContext.tsx` (lines 1-122)
   - `/ritemark-app/index.html` (lines 1-20)
   - `/docs/roadmap.md` (Sprint 7-13 completion status)

2. **Referenced Documentation:**
   - `/docs/business/ai-native-user-research.md` (non-technical user pain points)
   - `/docs/research/ux/ux-analysis-non-technical-users.md` (WYSIWYG UX best practices)
   - Sprint 7 completion report (OAuth implementation details)
   - Sprint 13 modal consolidation (shadcn Dialog migration)

3. **External Research Patterns:**
   - Google OAuth 2.0 best practices (2025 standards)
   - iOS Safari OAuth limitations (redirect-only flow)
   - Modern SaaS onboarding patterns (Notion, Coda, Linear)
   - WCAG 2.1 accessibility guidelines

---

**Document Status**: ✅ Complete
**Ready for Review**: YES
**Next Step**: Coordinate with frontend coder agent for WelcomeScreen enhancements

---

**End of UX Flow Design Research Document**
