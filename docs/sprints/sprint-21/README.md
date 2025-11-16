# Sprint 21/22: OAuth Security Hardening + Settings Dialog ✅ COMPLETED

**Sprint Duration**: 2 days
**Completed**: November 3, 2025
**Status**: ✅ COMPLETED
**Merged**: PR #12 - feat(sprint-22): OAuth security hardening and settings dialog improvements
**Depends On**: Sprint 19 (OAuth Security) + Sprint 20 (Settings Sync)
**Key Addition**: Settings & Account Dialog UI + 15 OAuth security improvements

---

## 🎯 Quick Start for AI Agents

**Reading Order**:
1. This README (navigation and goals + UX/UI design)
2. `implementation-plan.md` (step-by-step tasks)
3. `/docs/research/user-persistence/rate-limiting-browser-only-2025.md` (research foundation)
4. `/docs/research/user-persistence/IMPLEMENTATION-PLAN.md` (Phase 4 & 5 details)

**Implementation Time**: 12-16 hours total (4-6h UI + 6-8h backend + GDPR)

---

## ♻️ Enhance, Don’t Duplicate (Reuse-First Checklist)

Before creating any new component, hook, type, or service, verify whether an equivalent already exists and prefer enhancing it. This prevents duplicate code and keeps behavior consistent.

1) Search for existing building blocks first
- UI primitives: use `@/components/ui/dialog` and `@/components/ui/alert-dialog` wrappers, not direct Radix imports.
- Sidebar account entry: reuse and enhance `src/components/sidebar/UserAccountInfo.tsx` (open Settings dialog from there instead of adding a new account button).
- App shell/header: reuse `src/components/layout/AppShell.tsx` patterns for layout; don’t create parallel shells.
- Settings state: reuse `src/contexts/SettingsContext.tsx` and `src/hooks/useSettings.ts` rather than introducing a new provider/hook.

2) Schema alignment (do not fork settings shape)
- Use existing types in `src/types/settings.ts`.
  - Theme: store `'system' | 'light' | 'dark'` in `preferences.theme` (UI label can say “Auto (system)”).
  - BYOK: store Anthropic key under `apiKeys.anthropic` (don’t add a new root-level `anthropicApiKey`).
  - “Pick up where you left off”: add a boolean under `preferences` (e.g., `preferences.autoOpenLastFile`), not at the root.
- Persist via `SettingsContext.saveSettings` which uses `SettingsSyncService`.

3) Dialogs and confirmation flows
- Settings & Account should be a `Dialog` (see `src/components/ui/dialog.tsx` and existing patterns in `src/components/version-history/VersionHistoryModal.tsx`).
- Destructive confirmations (e.g., Delete Account) must use the shared `AlertDialog` primitives from `src/components/ui/alert-dialog.tsx`.

4) Services and fetch logic
- Place client-side fetch helpers under `src/services` following existing structure (e.g., `auth`, `drive`, `settings`). If you add rate-limit status fetch, prefer `src/services/usage/rateLimit.ts` (or similar) and reuse it from components—don’t inline `fetch` in multiple places.
- Server logic belongs in Netlify functions only (no duplicate server logic inside React components).

5) Concrete reuse for this sprint
- Modify, don’t replace: update `src/components/sidebar/UserAccountInfo.tsx` to open the new Settings dialog instead of only a sign-out alert.
- Build Settings dialog with existing UI primitives: import from `@/components/ui/dialog` and compose sections; do not add another dialog wrapper.
- Integrate with current context: read and write settings via `useSettings()`; avoid creating `useUserSettings` or a second context/provider.

6) Quick commands to find what to reuse
```bash
rg -n "UserAccountInfo|SettingsContext|useSettings|Dialog|AlertDialog" ritemark-app/src
rg -n "preferences|apiKeys|theme" ritemark-app/src/types
```

7) When a new component is justified
- Only if responsibility is clearly new (no existing component of same role), or enhancing the existing one would introduce tangled responsibilities.
- If you must create new, add a brief decision note in the PR description: “New X because Y; checked A/B/C and none fit.”

Acceptance check (PR reviewer/agent):
- No duplicate dialog primitives or sidebar account UI introduced.
- Settings schema changes extend `UserSettings` instead of creating parallel types.
- Reused `useSettings` and `SettingsProvider`; no new providers/hooks with overlapping purpose.

## 📊 Sprint Overview

### Problem Statement
**After Sprint 19 & 20, users have identity and sync but no rate protection, no settings UI, and no GDPR compliance**:
- ❌ No rate limiting (users can spam AI API unlimited)
- ❌ Same user on 5 devices gets 5x quota (unintended)
- ❌ No user settings UI (nowhere to configure preferences)
- ❌ No GDPR data export/deletion (legal requirement)
- ❌ No privacy policy for data collection
- ❌ Cannot identify abuse patterns

**This blocks**:
- BYOK implementation (users could abuse proxy)
- Production deployment (legal compliance required)
- Fair usage policies (need per-user limits)
- Trust & safety (cannot detect/block abuse)
- User preferences (no UI to change settings)

### Current State (After Sprint 19 & 20)
- ✅ User authenticated with Google OAuth
- ✅ User ID extracted (`user.sub`)
- ✅ Settings sync across devices
- ❌ No rate limiting (unlimited requests)
- ❌ No GDPR compliance (no export/deletion)

### Solution
**Implement per-user rate limiting + GDPR compliance + Settings UI**:
1. ✅ **Settings & Account Dialog** - Unified UI for all user preferences (repurposed from sign-out dialog)
2. ✅ **Upstash Redis** - Per-user rate limiting (100 req/hour)
3. ✅ **Multi-device quota sharing** - Same user, all devices share quota
4. ✅ **Abuse prevention** - Token validation, secondary limits
5. ✅ **GDPR data export** - User can download all their data
6. ✅ **GDPR account deletion** - User can delete all their data

---

## 🎨 UX/UI Design: Settings & Account Dialog

### Design Philosophy
**Repurpose the simple sign-out dialog into a comprehensive Settings & Account hub** that follows Johnny Ive's "invisible interface" principles:
- Settings appear naturally where users expect them (user profile menu)
- No separate settings page (reduces navigation complexity)
- All account management in one place (profile, preferences, GDPR, sign-out)
- Progressive disclosure (group related settings, hide complexity)

---

### Component Hierarchy

```
┌────────────────────────────────────────────────────────────────────────┐
│ Sidebar (Left Side)                                                   │
│                                                                        │
│  ... (TOC, document controls)                                         │
│                                                                        │
│  ────────────────────────────────────────────────────────────────────│
│  SidebarFooter (BOTTOM LEFT)                                          │
│    [User Avatar + Name] ← Click triggers Settings & Account dialog   │
│    UserAccountInfo.tsx                                                │
└────────────────────────────────────────────────────────────────────────┘

                                ↓ (onClick)

┌────────────────────────────────────────────────────────────────────────┐
│ Settings & Account Dialog (owned by UserAccountInfo.tsx)              │
│ ────────────────────────────────────────────────────────────────────── │
│                                                                        │
│  [User Profile Section]                                               │
│    Avatar + Name + Email                                              │
│                                                                        │
│  ────────────────────────────────────────────────────────────────────│
│                                                                        │
│  [General Settings]                                                   │
│    🔄 Pick up where you left off         [Toggle ON]                 │
│    🎨 Theme                               [Auto / Light / Dark]       │
│    ⌨️  Keyboard shortcuts                 [View shortcuts]            │
│                                                                        │
│  ────────────────────────────────────────────────────────────────────│
│                                                                        │
│  [API & Rate Limits]                                                  │
│    📊 Usage this hour: 42/100 requests   [Reset in 18 min]           │
│    🔑 Anthropic API Key                  [Add your own key]           │
│        (Optional: Unlock unlimited requests)                          │
│                                                                        │
│  ────────────────────────────────────────────────────────────────────│
│                                                                        │
│  [Privacy & Data (GDPR)]                                              │
│    📥 Download my data                   [Export as JSON]             │
│    🗑️ Delete my account                  [Delete everything]          │
│    📄 Privacy Policy                     [View policy]                │
│                                                                        │
│  ────────────────────────────────────────────────────────────────────│
│                                                                        │
│                     [Cancel]          [Sign Out]                      │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

### Repurpose Existing Logout Dialog (Implementation Note)

- Source: `ritemark-app/src/components/sidebar/UserAccountInfo.tsx` currently opens an `AlertDialog` for sign out.
- Requirement: Replace that alert with a full Settings & Account dialog opened from the same avatar button. The Logout action moves into the dialog footer.
- Do not create a second, parallel dialog or another account button. Keep a single entrypoint in `UserAccountInfo.tsx`.

Migration sketch (replace AlertDialog with Dialog):
```tsx
// Before
import { AlertDialog, AlertDialogContent, ... } from '@/components/ui/alert-dialog'

// After
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

// In component
const [open, setOpen] = useState(false)

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="max-h-[80vh] overflow-auto">
    <DialogHeader>
      <DialogTitle>Settings & Account</DialogTitle>
    </DialogHeader>
    {/* Sections: Profile, General, API & Rate Limits, Privacy & Data */}
    {/* ... */}
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
      <Button onClick={handleLogout}>Sign Out</Button>
    </DialogFooter>
  </DialogContent>
  {/* Keep AlertDialog only for destructive confirmations like Delete Account */}
</Dialog>
```

---

### Visual Design Specifications

#### Dialog Dimensions
- **Width**: 560px (desktop), 100% - 32px (mobile)
- **Max Height**: 80vh (scrollable content)
- **Padding**: 24px
- **Border Radius**: 12px (matches shadcn Dialog)
- **Overlay**: Black/80 (consistent with other modals)

#### Typography
- **Dialog Title**: "Settings & Account" (24px, font-semibold)
- **Section Headers**: 14px, font-medium, text-muted-foreground
- **Setting Labels**: 14px, font-normal, text-foreground
- **Helper Text**: 12px, font-normal, text-muted-foreground

#### Color Palette (Following shadcn/ui)
- **Background**: bg-background (white in light mode, dark in dark mode)
- **Text**: text-foreground
- **Muted Text**: text-muted-foreground
- **Borders**: border (separator lines between sections)
- **Destructive**: text-destructive (for "Delete account")
- **Primary**: bg-primary (for "Sign Out" button)

#### Spacing
- **Section Spacing**: 24px vertical gap between sections
- **Setting Rows**: 16px vertical gap between individual settings
- **Toggle/Button Spacing**: 8px gap between label and control

---

### Section Breakdown

#### 1. User Profile Section (Top)

**Components**:
- Avatar (48px circle, Google profile picture)
- Name (font-medium, 16px)
- Email (text-muted-foreground, 14px)

**Layout**:
```tsx
<div className="flex items-center gap-4 pb-6 border-b">
  <Avatar className="h-12 w-12">
    <AvatarImage src={user.picture} />
    <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
  </Avatar>
  <div>
    <p className="font-medium">{user.name}</p>
    <p className="text-sm text-muted-foreground">{user.email}</p>
  </div>
</div>
```

---

#### 2. General Settings Section

**Settings Included**:

**a) Pick Up Where You Left Off**
- **Type**: Toggle (shadcn Switch component)
- **Default**: ON
- **Label**: "Pick up where you left off"
- **Helper Text**: "Automatically open your last edited file on app start"
- **Data**: `settings.preferences.autoOpenLastFile: boolean`

**b) Theme Preference**
- **Type**: Select dropdown (shadcn Select component)
- **Options**: Auto (system) / Light / Dark
- **Default**: Auto
- **Label**: "Theme"
- **Data**: `settings.preferences.theme: 'system' | 'light' | 'dark'`

**c) Keyboard Shortcuts**
- **Type**: Button (opens shortcuts reference modal)
- **Label**: "Keyboard shortcuts"
- **Action**: Opens `KeyboardShortcutsModal` (see shortcuts list below)

**Layout**:
```tsx
<div className="space-y-4 pt-6 pb-6 border-b">
  <h3 className="text-sm font-medium text-muted-foreground">General</h3>

  {/* Auto-open last file */}
  <div className="flex items-center justify-between">
    <div className="space-y-0.5">
      <Label>Pick up where you left off</Label>
      <p className="text-sm text-muted-foreground">
        Automatically open your last edited file
      </p>
    </div>
    <Switch
      checked={settings.preferences?.autoOpenLastFile}
      onCheckedChange={(checked) => updateSetting('preferences.autoOpenLastFile', checked)}
    />
  </div>

  {/* Theme */}
  <div className="flex items-center justify-between">
    <Label>Theme</Label>
    <Select value={settings.preferences?.theme} onValueChange={(value) => updateSetting('preferences.theme', value)}>
      <SelectTrigger className="w-[180px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="system">Auto (system)</SelectItem>
        <SelectItem value="light">Light</SelectItem>
        <SelectItem value="dark">Dark</SelectItem>
      </SelectContent>
    </Select>
  </div>

  {/* Keyboard shortcuts */}
  <div className="flex items-center justify-between">
    <Label>Keyboard shortcuts</Label>
    <Button variant="outline" size="sm" onClick={() => setShowShortcuts(true)}>
      View shortcuts
    </Button>
  </div>
</div>
```

---

#### 3. API & Rate Limits Section

**Settings Included**:

**a) Usage Statistics**
- **Display**: Progress bar + text
- **Label**: "Usage this hour"
- **Data**: "42/100 requests • Resets in 18 minutes"
- **Visual**: Linear progress indicator (shadcn Progress component)
- **Source**: Fetched from Upstash Redis rate limiter

**b) BYOK (Bring Your Own Key)**
- **Type**: Text input (password field, shadcn Input component)
- **Label**: "Anthropic API Key (Optional)"
- **Helper Text**: "Add your own API key to unlock unlimited requests"
- **Placeholder**: "sk-ant-..."
- **Data**: `settings.apiKeys.anthropic: string` (encrypted)
- **Icon**: 🔑 (lock icon when key is set)

**Layout**:
```tsx
<div className="space-y-4 pt-6 pb-6 border-b">
  <h3 className="text-sm font-medium text-muted-foreground">API & Rate Limits</h3>

  {/* Usage statistics */}
  <div className="space-y-2">
    <div className="flex items-center justify-between text-sm">
      <span>Usage this hour</span>
      <span className="text-muted-foreground">{usage.current}/{usage.limit} requests</span>
    </div>
    <Progress value={(usage.current / usage.limit) * 100} />
    <p className="text-xs text-muted-foreground">
      Resets in {formatResetTime(usage.resetAt)}
    </p>
  </div>

  {/* BYOK */}
  <div className="space-y-2">
    <Label htmlFor="api-key">Anthropic API Key (Optional)</Label>
    <Input
      id="api-key"
      type="password"
      placeholder="sk-ant-..."
      value={settings.apiKeys?.anthropic || ''}
      onChange={(e) => updateSetting('apiKeys.anthropic', e.target.value)}
    />
    <p className="text-xs text-muted-foreground">
      Add your own key to unlock unlimited requests
    </p>
  </div>
</div>
```

---

#### 4. Privacy & Data Section (GDPR Compliance)

**Actions Included**:

**a) Download My Data**
- **Type**: Button (shadcn Button, variant="outline")
- **Label**: "Download my data"
- **Icon**: 📥 (download icon)
- **Action**: Calls `/.netlify/functions/export-data`
- **Downloads**: JSON file with user data
- **Helper Text**: "Export all your data as JSON (GDPR compliant)"

**b) Delete My Account**
- **Type**: Button (shadcn Button, variant="destructive")
- **Label**: "Delete my account"
- **Icon**: 🗑️ (trash icon)
- **Action**: Opens confirmation dialog → Calls `/.netlify/functions/delete-account`
- **Helper Text**: "⚠️ Permanently delete all your data (irreversible)"

**c) Privacy Policy**
- **Type**: Link (shadcn Button, variant="link")
- **Label**: "Privacy Policy"
- **Icon**: 📄 (document icon)
- **Action**: Opens `/privacy` page in new tab

**Layout**:
```tsx
<div className="space-y-4 pt-6 pb-6 border-b">
  <h3 className="text-sm font-medium text-muted-foreground">Privacy & Data</h3>

  {/* Download data */}
  <div className="flex items-center justify-between">
    <div className="space-y-0.5">
      <Label>Download my data</Label>
      <p className="text-sm text-muted-foreground">
        Export all your data as JSON
      </p>
    </div>
    <Button variant="outline" size="sm" onClick={handleExportData}>
      <Download className="mr-2 h-4 w-4" />
      Export
    </Button>
  </div>

  {/* Delete account */}
  <div className="flex items-center justify-between">
    <div className="space-y-0.5">
      <Label>Delete my account</Label>
      <p className="text-sm text-destructive">
        ⚠️ Permanently delete all your data
      </p>
    </div>
    <Button variant="destructive" size="sm" onClick={handleDeleteAccount}>
      <Trash2 className="mr-2 h-4 w-4" />
      Delete
    </Button>
  </div>

  {/* Privacy policy */}
  <div className="flex items-center justify-between">
    <Label>Privacy Policy</Label>
    <Button variant="link" size="sm" asChild>
      <a href="/privacy" target="_blank" rel="noopener noreferrer">
        View policy <ExternalLink className="ml-1 h-3 w-3" />
      </a>
    </Button>
  </div>
</div>
```

---

#### 5. Footer Actions (Bottom)

**Buttons**:
- **Cancel**: Secondary button (shadcn Button, variant="outline")
  - Closes dialog without signing out
  - Saves any changed settings
- **Sign Out**: Primary button (shadcn Button, variant="default")
  - Signs user out
  - Redirects to WelcomeScreen

**Layout**:
```tsx
<DialogFooter className="pt-6">
  <Button variant="outline" onClick={onClose}>
    Cancel
  </Button>
  <Button onClick={handleSignOut}>
    Sign Out
  </Button>
</DialogFooter>
```

---

### Keyboard Shortcuts Reference

**Modal**: `KeyboardShortcutsModal` (opens from Settings → "View shortcuts")

**Shortcuts Included**:
```
Editor Shortcuts:
  ⌘/Ctrl + B        Bold
  ⌘/Ctrl + I        Italic
  ⌘/Ctrl + K        Insert link
  ⌘/Ctrl + Z        Undo
  ⌘/Ctrl + Shift + Z  Redo

Document Shortcuts:
  ⌘/Ctrl + S        Save to Drive
  ⌘/Ctrl + Shift + S  Save as new file
  ⌘/Ctrl + O        Open from Drive
  ⌘/Ctrl + Shift + H  Version history

Navigation:
  ⌘/Ctrl + /        Toggle TOC
  Esc               Close dialog/modal
```

---

### Delete Account Confirmation Dialog

**When user clicks "Delete my account"**, show a confirmation dialog:

```tsx
<AlertDialog>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete your account?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone. This will permanently delete your account and remove your data from our servers.

        <div className="mt-4 space-y-2 text-sm">
          <p className="font-medium">What will be deleted:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>All your settings and preferences</li>
            <li>API usage history and rate limit data</li>
            <li>Your Google Drive AppData settings file</li>
            <li>Your authentication session</li>
          </ul>
        </div>

        <div className="mt-4 space-y-2 text-sm">
          <p className="font-medium">What will NOT be deleted:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Your Google account (remains intact)</li>
            <li>Documents saved to Google Drive (you still own them)</li>
          </ul>
        </div>
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
        Delete my account
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

### Implementation Files

**New/Extracted Components**:
1. `src/components/settings/UserProfileSection.tsx` - User profile display
2. `src/components/settings/GeneralSettingsSection.tsx` - Theme, auto-open, shortcuts
3. `src/components/settings/ApiRateLimitSection.tsx` - Usage stats + BYOK
4. `src/components/settings/PrivacyDataSection.tsx` - GDPR export/deletion
5. `src/components/settings/KeyboardShortcutsModal.tsx` - Shortcuts reference
6. `src/components/settings/DeleteAccountDialog.tsx` - Confirmation dialog

**Modified Components**:
1. `src/components/sidebar/UserAccountInfo.tsx` - Repurpose existing logout AlertDialog into Settings & Account dialog (single entrypoint, Sign Out in footer)
2. `src/contexts/SettingsContext.tsx` - Reuse schema: `preferences.theme`, `preferences.autoOpenLastFile`, `apiKeys.anthropic`

**Netlify Functions** (from Phase 4-5):
1. `netlify/functions/export-data.ts` - GDPR data export
2. `netlify/functions/delete-account.ts` - GDPR account deletion

---

### Accessibility Requirements

1. **Keyboard Navigation**
   - All controls focusable via Tab key
   - Logical tab order (top to bottom)
   - Esc key closes dialog
   - Enter key submits forms

2. **Screen Reader Support**
   - `role="dialog"` on main container
   - `aria-labelledby` pointing to dialog title
   - `aria-describedby` for helper text
   - Toggle states announced ("on" / "off")

3. **Focus Management**
   - Focus trapped within dialog when open
   - Focus returns to trigger button on close
   - First focusable element focused on open

4. **Color Contrast**
   - WCAG 2.1 AA compliant (4.5:1 ratio)
   - Destructive actions use high-contrast red
   - Disabled states have 3:1 contrast

---

### Mobile Responsive Design

**Breakpoints**:
- **Desktop** (≥768px): 560px wide dialog, side-by-side labels/controls
- **Mobile** (<768px): Full-width dialog, stacked labels/controls

**Mobile Adjustments**:
```css
@media (max-width: 767px) {
  .settings-dialog {
    max-width: calc(100vw - 32px); /* 16px padding each side */
    margin: 16px;
  }

  .setting-row {
    flex-direction: column; /* Stack label above control */
    align-items: flex-start;
    gap: 8px;
  }

  .dialog-footer {
    flex-direction: column; /* Stack buttons vertically */
    gap: 8px;
  }

  .dialog-footer button {
    width: 100%; /* Full-width buttons */
  }
}
```

---

### User Flow Example

**Scenario**: User wants to enable auto-open and export their data

1. **Open Settings**
   - User clicks their avatar/name in sidebar footer (bottom left)
   - SettingsDialog slides in from center (shadcn Dialog animation)

2. **Change Setting**
   - User sees "Pick up where you left off" toggle is OFF
   - User clicks toggle → turns ON
   - Toast notification: "✅ Setting saved"
   - Setting syncs to Google Drive AppData (background)

3. **Export Data**
   - User scrolls to "Privacy & Data" section
   - User clicks "Export" button
   - Browser downloads `ritemark-data-[userId].json`
   - Toast notification: "✅ Data exported successfully"

4. **Close Dialog**
   - User clicks "Cancel" button
   - Dialog closes
   - User returns to editor with last file auto-opened next time ✅

---

## 🎯 Success Criteria

### Must Have

- [ ] **Settings & Account Dialog UI**
  - [ ] Dialog opens from user avatar in sidebar footer (bottom left)
  - [ ] User profile section (avatar, name, email)
  - [ ] "Pick up where you left off" toggle (default ON)
  - [ ] Theme selector (Auto / Light / Dark)
  - [ ] Keyboard shortcuts reference modal
  - [ ] All shadcn components (Dialog, Switch, Select, Button, Progress)
  - [ ] Mobile responsive (stacked layout <768px)
  - [ ] WCAG 2.1 AA accessible (keyboard nav, screen reader)

- [ ] **Per-user rate limiting**
  - [ ] 100 requests/hour per user (not per device)
  - [ ] Upstash Redis setup (free tier)
  - [ ] Rate limiter function in Netlify Functions
  - [ ] 429 error with retry-after header
  - [ ] Usage display in Settings dialog (progress bar)

- [ ] **Multi-device quota sharing**
  - [ ] Use Google `user.sub` as rate limit key
  - [ ] Laptop + phone share same quota (100 total)
  - [ ] Rate limit counter persists across devices
  - [ ] Test: 50 req on laptop + 51 on phone = 429 error

- [ ] **Abuse prevention**
  - [ ] Validate Google token (prevent user ID spoofing)
  - [ ] Secondary limit: API key hash (150 req/hour)
  - [ ] Anomaly detection: Flag >10 devices per user
  - [ ] IP-based fallback for anonymous users

- [ ] **GDPR data export**
  - [ ] Export function: `exportUserData(userId)`
  - [ ] Returns JSON with all user data
  - [ ] UI: Settings → "Download my data"
  - [ ] Includes: settings, API key hash, usage stats

- [ ] **GDPR account deletion**
  - [ ] Delete function: `deleteUserData(userId)`
  - [ ] Removes: IndexedDB, Drive AppData, Redis rate limit
  - [ ] UI: Settings → "Delete my account"
  - [ ] Confirmation dialog (irreversible action)

### Testing Checklist
- [ ] Rate limiter blocks 101st request with 429
- [ ] Same user on 2 devices shares quota
- [ ] Different users have separate quotas
- [ ] Spoofed user ID rejected
- [ ] Data export includes all user data
- [ ] Account deletion removes all data (verified in Drive + Redis)
- [ ] Privacy policy updated with data disclosures

---

## 🏗️ Architecture Changes

### Before (Sprint 20)
```
User A (Laptop)
  ↓
Netlify Function (no rate limit)
  ↓
Anthropic API (unlimited calls)

User A (Phone)
  ↓
Netlify Function (no rate limit)
  ↓
Anthropic API (unlimited calls)

Result: User A can spam unlimited requests!
```

### After (Sprint 21)
```
User A (Laptop) - Request 1-50
  ↓
Netlify Function
  ↓
Rate Limiter (Upstash Redis)
  Key: user.sub="abc123"
  Count: 50/100
  ↓
Anthropic API (allowed)

User A (Phone) - Request 51-100
  ↓
Netlify Function
  ↓
Rate Limiter (Upstash Redis)
  Key: user.sub="abc123"
  Count: 100/100
  ↓
Anthropic API (allowed)

User A (Phone) - Request 101
  ↓
Rate Limiter (Upstash Redis)
  Key: user.sub="abc123"
  Count: 101/100 ❌
  ↓
429 Error: "Rate limit exceeded (100 req/hour)"

Result: User A shares quota across ALL devices!
```

---

## 📋 Implementation Plan

### Execution Strategy

**Recommended Order**: Sequential execution (Phase 0 → Phase 6) for clean integration

**Parallel Option** (if multiple developers):
- **Track A** (Frontend): Phase 0 (UI) can run independently
- **Track B** (Backend): Phase 1-3 (rate limiting) → Phase 4-5 (GDPR) sequential
- **Track C** (Documentation): Phase 6 (privacy policy) can run anytime
- **Integration Point**: Merge Track A + B before final testing

**Dependencies**:
- Phase 4-5 (GDPR) **require** Phase 1 (Redis setup) to be complete
- Phase 0 (UI) **references** Phase 1-2 (rate limit display) but can mock data initially
- Phase 6 (Privacy Policy) **requires** Phase 4-5 (GDPR endpoints) for accurate documentation

**Time Budget**: 12-16 hours total across 2 days
- Day 1: Phase 0-3 (UI + Backend setup) = 8-12 hours
- Day 2: Phase 4-6 (GDPR + Polish) = 4-5 hours

---

### Phase 0: Settings & Account Dialog UI (4-6 hours) 🆕

**Goal**: Repurpose the existing logout dialog in `UserAccountInfo.tsx` into a comprehensive Settings & Account dialog (with Logout action inside the footer).

**Tasks**:

1. **Refactor existing logout dialog (in-place)** (`src/components/sidebar/UserAccountInfo.tsx`) - 2 hours
   - Replace `AlertDialog` with `Dialog` from `@/components/ui/dialog`.
   - Dialog title: "Settings & Account"; keep user avatar/name/email in header.
   - Scrollable content area (max-height: 80vh) with sections below.
   - Footer contains: Cancel + Sign Out (calls existing `logout`).
   - Keep `AlertDialog` only for destructive confirmations (e.g., Delete Account).

2. **User Profile Section** (`src/components/settings/UserProfileSection.tsx`) - 30 minutes
   - Display Google avatar, name, email
   - Fetch from AuthContext
   - 48px circular avatar with fallback

3. **General Settings Section** (`src/components/settings/GeneralSettingsSection.tsx`) - 1.5 hours
   - "Pick up where you left off" toggle (shadcn Switch)
     - Default: ON
     - Persist under `settings.preferences.autoOpenLastFile` via `saveSettings()`
     - Syncs to Google Drive AppData
   - Theme selector (shadcn Select)
     - Options: Auto (system) / Light / Dark
     - Persist `'system' | 'light' | 'dark'` at `settings.preferences.theme`
   - Keyboard shortcuts button
     - Opens KeyboardShortcutsModal

4. **API & Rate Limits Section** (`src/components/settings/ApiRateLimitSection.tsx`) - 1 hour
   - Usage statistics display
     - Fetch from `/.netlify/functions/rate-limit-status`
     - Progress bar (shadcn Progress)
     - "42/100 requests • Resets in 18 min"
   - BYOK input (shadcn Input, type="password")
     - Placeholder: "sk-ant-..."
     - Encrypts before saving
     - Persist at `settings.apiKeys.anthropic` (do not add new root key)

5. **Privacy & Data Section** (`src/components/settings/PrivacyDataSection.tsx`) - 1 hour
   - Download my data button
     - Calls `/.netlify/functions/export-data`
     - Downloads JSON file
   - Delete my account button
     - Opens DeleteAccountDialog confirmation
     - Calls `/.netlify/functions/delete-account`
   - Privacy policy link
     - Opens `/privacy` in new tab

6. **Supporting Components** - 1 hour
   - `KeyboardShortcutsModal.tsx` - Shortcuts reference (shadcn Dialog)
   - `DeleteAccountDialog.tsx` - Confirmation with checklist (shadcn AlertDialog)

7. **UserAccountInfo ownership** - 30 minutes
   - The avatar button in the sidebar continues to be the single entrypoint.
   - onClick → open the refactored Settings & Account dialog.
   - Keep user avatar + name display; no additional account button elsewhere.

8. **Settings Schema Usage** (`src/contexts/SettingsContext.tsx`) - 30 minutes
   - Reuse existing `UserSettings` type in `src/types/settings.ts`.
   - Store theme in `preferences.theme: 'system' | 'light' | 'dark'` (UI label “Auto (system)”).
   - Store Anthropic key in `apiKeys.anthropic` (encrypted before upload).
   - Add `preferences.autoOpenLastFile?: boolean` if missing.
   - Persist via `saveSettings()` which syncs through `SettingsSyncService`.

**Files to create (optional extraction)**:
- If `UserAccountInfo.tsx` grows large, extract presentational sections only:
  - `src/components/settings/UserProfileSection.tsx`
  - `src/components/settings/GeneralSettingsSection.tsx`
  - `src/components/settings/ApiRateLimitSection.tsx`
  - `src/components/settings/PrivacyDataSection.tsx`
  - `src/components/settings/KeyboardShortcutsModal.tsx`
  - `src/components/settings/DeleteAccountDialog.tsx`
  - Avoid introducing a second dialog container; `UserAccountInfo.tsx` remains the owner.

**Files to modify**:
- `src/components/sidebar/UserAccountInfo.tsx` (repurpose logout alert into Settings & Account dialog)
- `src/contexts/SettingsContext.tsx` (use/extend existing schema as noted above)

**Validation**:
- [ ] Dialog opens from user avatar in sidebar footer (bottom left)
- [ ] All sections render correctly
- [ ] Toggle/select/input controls work
- [ ] Mobile responsive (stacked layout <768px)
- [ ] Keyboard navigation works (Tab, Esc)
- [ ] Screen reader announces states
- [ ] WCAG 2.1 AA contrast ratios
- [ ] Sign out works (redirects to WelcomeScreen)
- [ ] Settings sync to Google Drive AppData
- [ ] No separate standalone Sign Out alert dialog remains; Sign Out is inside Settings dialog footer

---

### Phase 1: Upstash Redis Setup (1 hour)

**Goal**: Set up serverless Redis for rate limiting

**Tasks**:
1. **Create Upstash account**
   - Sign up: https://upstash.com
   - Free tier: 10,000 requests/month (~400 users)
   - Create Redis database (global region for low latency)

2. **Get credentials**
   - REST URL: `https://xxx.upstash.io`
   - REST Token: `AXXXxxxxxxx`
   - Add to `.env.local`: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

3. **Install dependencies**
   ```bash
   npm install @upstash/ratelimit @upstash/redis
   ```

4. **Test connection**
   - Create test script
   - Verify Redis responds
   - Test rate limiter locally

**Files to create**:
- `.env.local` (add Upstash credentials)

**Environment Variables**:
```bash
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXXxxxxxxx
```

---

### Phase 2: Rate Limiter Implementation (2 hours)

**Goal**: Implement per-user rate limiting

**Tasks**:
1. **Create rate limiter utility** (`netlify/functions/utils/rateLimiter.ts`)
   - Initialize Upstash Redis client
   - Create sliding window rate limiter (100 req/hour)
   - Export `checkRateLimit(userId)` function

2. **Integrate with AI endpoint**
   - Extract `x-user-id` from request headers
   - Check rate limit before AI call
   - Return 429 with retry-after header
   - Include remaining quota in response headers

3. **Error handling**
   - Redis connection failures → Allow request (fail open)
   - Invalid user ID → Return 400 Bad Request
   - Rate limit exceeded → Return 429 with clear message

**Files to create**:
- `netlify/functions/utils/rateLimiter.ts`
- `netlify/functions/ai-chat.ts` (integrate rate limiter)

**Example Code**:
```typescript
// rateLimiter.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
})

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1h'), // 100 requests per hour
  analytics: true
})

export async function checkRateLimit(userId: string) {
  try {
    const { success, limit, reset, remaining } = await ratelimit.limit(userId)

    return {
      allowed: success,
      limit,
      remaining,
      resetAt: reset
    }
  } catch (error) {
    // Fail open on Redis errors
    console.error('Rate limiter error:', error)
    return { allowed: true, limit: 100, remaining: 100, resetAt: Date.now() + 3600000 }
  }
}

// ai-chat.ts (Netlify Function)
export const handler = async (event) => {
  // Extract user ID from header
  const userId = event.headers['x-user-id']

  if (!userId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing user ID' })
    }
  }

  // Check rate limit
  const rateLimitResult = await checkRateLimit(userId)

  if (!rateLimitResult.allowed) {
    return {
      statusCode: 429,
      headers: {
        'Retry-After': Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString(),
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': rateLimitResult.resetAt.toString()
      },
      body: JSON.stringify({
        error: 'Rate limit exceeded',
        message: 'You have exceeded the rate limit of 100 requests per hour',
        resetAt: rateLimitResult.resetAt
      })
    }
  }

  // Add rate limit headers to response
  const headers = {
    'X-RateLimit-Limit': rateLimitResult.limit.toString(),
    'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
    'X-RateLimit-Reset': rateLimitResult.resetAt.toString()
  }

  // Process AI request...
  const response = await callAnthropicAPI(event.body)

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(response)
  }
}
```

---

### Phase 3: Abuse Prevention (2 hours)

**Goal**: Prevent rate limit bypassing and abuse

**Tasks**:
1. **Token validation**
   - Verify Google token signature
   - Extract `user.sub` from validated token
   - Reject spoofed user IDs (return 403 Forbidden)

2. **Secondary rate limit**
   - API key hash as fallback identifier (150 req/hour)
   - Prevents single user creating multiple accounts
   - Separate Redis key: `ratelimit:apikey:${hash}`

3. **Anomaly detection**
   - Track unique device IPs per user
   - Flag users with >10 devices (potential abuse)
   - Log to monitoring system for review

4. **IP-based fallback**
   - For anonymous users (no Google auth)
   - IP-based rate limit: 50 req/hour
   - Use Cloudflare CF-Connecting-IP header

**Files to modify**:
- `netlify/functions/utils/rateLimiter.ts` (add secondary limits)
- `netlify/functions/utils/tokenValidator.ts` (NEW - validate Google tokens)

**Example Code**:
```typescript
// tokenValidator.ts
import { OAuth2Client } from 'google-auth-library'

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

export async function validateGoogleToken(token: string): Promise<string | null> {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    })

    const payload = ticket.getPayload()
    return payload?.sub || null // Return Google user.sub
  } catch (error) {
    console.error('Token validation failed:', error)
    return null
  }
}

// rateLimiter.ts (updated with secondary limits)
export async function checkRateLimitWithFallback(
  userId: string | null,
  apiKeyHash: string | null,
  ipAddress: string | null
): Promise<RateLimitResult> {
  // Primary: User ID (100 req/hour)
  if (userId) {
    const result = await ratelimit.limit(`user:${userId}`)
    if (!result.success) return { allowed: false, reason: 'user-quota' }
  }

  // Secondary: API key hash (150 req/hour)
  if (apiKeyHash) {
    const result = await ratelimitApiKey.limit(`apikey:${apiKeyHash}`)
    if (!result.success) return { allowed: false, reason: 'apikey-quota' }
  }

  // Fallback: IP address (50 req/hour)
  if (ipAddress) {
    const result = await ratelimitIP.limit(`ip:${ipAddress}`)
    if (!result.success) return { allowed: false, reason: 'ip-quota' }
  }

  return { allowed: true }
}
```

---

### Phase 4: GDPR Data Export (1 hour)

**Goal**: Allow users to export their data (GDPR Article 20)

**Tasks**:
1. **Create export function** (`netlify/functions/export-data.ts`)
   - Fetch user settings from Drive AppData
   - Fetch rate limit data from Redis
   - Fetch usage statistics (if available)
   - Return JSON with all user data

2. **UI integration**
   - Add "Download my data" button in Settings
   - Trigger Netlify Function call
   - Download JSON file to user's device

3. **Data included**
   - User ID (`user.sub`)
   - Email address
   - Settings (API key hash, preferences)
   - Usage statistics (requests made, rate limit hits)
   - Account creation date
   - Last sync timestamp

**Files to create**:
- `netlify/functions/export-data.ts`
- `src/components/settings/DataExport.tsx`

**Example Code**:
```typescript
// export-data.ts
export const handler = async (event) => {
  const userId = event.headers['x-user-id']

  if (!userId) {
    return { statusCode: 401, body: 'Unauthorized' }
  }

  // Fetch user data from various sources
  const settings = await fetchUserSettings(userId)
  const rateLimitStats = await fetchRateLimitData(userId)
  const usageStats = await fetchUsageStats(userId)

  const exportData = {
    userId,
    email: settings.email,
    createdAt: settings.createdAt,
    settings: {
      theme: settings.theme,
      shortcuts: settings.shortcuts,
      apiKeyHash: settings.apiKeyHash // Hash only, never plaintext key
    },
    usage: {
      totalRequests: usageStats.totalRequests,
      rateLimitHits: rateLimitStats.hits,
      lastRequestAt: usageStats.lastRequestAt
    },
    exportedAt: new Date().toISOString()
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="ritemark-data-${userId}.json"`
    },
    body: JSON.stringify(exportData, null, 2)
  }
}
```

---

### Phase 5: GDPR Account Deletion (1 hour)

**Goal**: Allow users to delete their account (GDPR Article 17 - Right to Erasure)

**Tasks**:
1. **Create deletion function** (`netlify/functions/delete-account.ts`)
   - Delete settings from Drive AppData
   - Delete rate limit data from Redis
   - Clear IndexedDB (client-side)
   - Revoke OAuth tokens

2. **UI integration**
   - Add "Delete my account" button in Settings
   - Confirmation dialog (irreversible action)
   - Trigger Netlify Function call
   - Logout user after deletion

3. **Data deletion checklist**
   - [ ] Drive AppData settings file
   - [ ] Redis rate limit counters
   - [ ] IndexedDB local cache
   - [ ] OAuth refresh token (revoked)
   - [ ] Any logs containing user ID

**Files to create**:
- `netlify/functions/delete-account.ts`
- `src/components/settings/AccountDeletion.tsx`

**Example Code**:
```typescript
// delete-account.ts
export const handler = async (event) => {
  const userId = event.headers['x-user-id']

  if (!userId) {
    return { statusCode: 401, body: 'Unauthorized' }
  }

  try {
    // 1. Delete Drive AppData settings
    await deleteDriveAppData(userId)

    // 2. Delete Redis rate limit data
    await deleteRedisData(userId)

    // 3. Revoke OAuth tokens
    await revokeGoogleTokens(userId)

    // 4. Log deletion for compliance
    console.log(`Account deleted for user: ${userId}`)

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Account deleted successfully',
        deletedAt: new Date().toISOString()
      })
    }
  } catch (error) {
    console.error('Account deletion failed:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Deletion failed, please contact support' })
    }
  }
}

// AccountDeletion.tsx (React component)
export const AccountDeletion = () => {
  const [showConfirmation, setShowConfirmation] = useState(false)

  const handleDelete = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action is irreversible and will delete all your data.'
    )

    if (!confirmed) return

    try {
      const response = await fetch('/.netlify/functions/delete-account', {
        method: 'POST',
        headers: {
          'x-user-id': userId
        }
      })

      if (response.ok) {
        // Clear local IndexedDB
        await clearIndexedDB()

        // Logout user
        await logout()

        // Redirect to homepage
        window.location.href = '/'
      }
    } catch (error) {
      console.error('Account deletion failed:', error)
      alert('Failed to delete account. Please try again or contact support.')
    }
  }

  return (
    <div className="account-deletion">
      <h3>Delete Account</h3>
      <p>⚠️ This action is irreversible. All your data will be permanently deleted.</p>
      <button onClick={handleDelete} className="btn-danger">
        Delete My Account
      </button>
    </div>
  )
}
```

---

### Phase 6: Privacy Policy Update (1 hour)

**Goal**: Update privacy policy with data collection disclosures (GDPR Article 13)

**Tasks**:
1. **Disclose data collection**
   - Google `user.sub` used for rate limiting
   - Settings synced via Drive AppData
   - API keys stored encrypted locally (never server-side)

2. **Explain data usage**
   - Rate limiting: Prevent abuse
   - Settings sync: Multi-device experience
   - API keys: User's own Anthropic account (BYOK)

3. **User rights**
   - Right to access (data export)
   - Right to erasure (account deletion)
   - Right to data portability (JSON export)

4. **Update privacy policy page**
   - Add GDPR compliance section
   - Link to data export/deletion functions
   - Explain data retention (rate limits: 1 hour, settings: until deleted)

**Files to modify**:
- `src/pages/PrivacyPolicy.tsx` (or create if doesn't exist)
- `src/components/layout/Footer.tsx` (link to privacy policy)

**Privacy Policy Template**:
```markdown
# Privacy Policy

## Data Collection

We collect minimal data to provide our services:

1. **User Identity**: We use your Google account's unique identifier (`user.sub`) for rate limiting purposes only. This is a pseudonymous identifier that does not directly reveal your identity.

2. **Settings Sync**: Your editor preferences and API keys are stored encrypted in your Google Drive AppData folder. Only you and our application can access this data.

3. **Usage Statistics**: We track request counts for rate limiting (100 requests per hour). This data is stored temporarily (1 hour) in our Redis database.

## Data Usage

- **Rate Limiting**: Prevent abuse and ensure fair usage across all users
- **Settings Sync**: Enable seamless experience across your devices
- **API Keys**: Your Anthropic API keys are encrypted and stored locally on your device (never on our servers)

## Your Rights (GDPR)

- **Right to Access**: Download all your data as JSON (`Settings → Download my data`)
- **Right to Erasure**: Delete your account and all associated data (`Settings → Delete my account`)
- **Right to Data Portability**: Export your data in JSON format

## Data Retention

- Rate limit counters: 1 hour (automatically deleted after expiry)
- Settings: Until you delete your account
- API keys: Stored locally on your device only (encrypted)

## Contact

For privacy concerns, email: privacy@ritemark.app
```

---

## 🚨 Breaking Changes

### User Impact
⚠️ **ALL USERS WILL EXPERIENCE RATE LIMITING**

**Why**: Prevents abuse and ensures fair usage

**User Experience**:
- Free tier: 100 requests/hour (shared across all devices)
- Rate limit hit: Clear error message with reset time
- Upgrade path: BYOK (bring your own Anthropic API key) = no limits

**Migration Strategy**:
1. Deploy rate limiter with high limit (500 req/hour) initially
2. Monitor usage patterns for 1 week
3. Adjust to final limit (100 req/hour)
4. Notify users via banner: "Rate limiting active (100 req/hour)"

---

## 📊 Testing Strategy

### Unit Tests
- [ ] Rate limiter function (check limits, reset times)
- [ ] Token validator (valid/invalid tokens)
- [ ] Data export function (all data included)
- [ ] Account deletion function (all data removed)

### Integration Tests
- [ ] Full rate limit flow (101 requests → 429 error)
- [ ] Multi-device quota sharing (laptop + phone)
- [ ] Data export → re-import (data integrity)
- [ ] Account deletion → verify data removed

### Manual Tests
- [ ] Rate limit on 2 devices (50 req each → 429 on 101st)
- [ ] Export data → verify JSON format
- [ ] Delete account → verify all data removed
- [ ] Privacy policy accessible and clear

---

## 📁 Files to Create/Modify

### New Files (UI Components)
- Optional extracted presentational sections (container stays in `UserAccountInfo.tsx`):
  - `src/components/settings/UserProfileSection.tsx` - User profile display
  - `src/components/settings/GeneralSettingsSection.tsx` - Theme, auto-open, shortcuts
  - `src/components/settings/ApiRateLimitSection.tsx` - Usage stats + BYOK
  - `src/components/settings/PrivacyDataSection.tsx` - GDPR export/deletion UI
  - `src/components/settings/KeyboardShortcutsModal.tsx` - Shortcuts reference
  - `src/components/settings/DeleteAccountDialog.tsx` - Account deletion confirmation

### New Files (Backend & Functions)
- `netlify/functions/utils/rateLimiter.ts` - Rate limiter utility
- `netlify/functions/utils/tokenValidator.ts` - Google token validation
- `netlify/functions/ai-chat.ts` - AI endpoint with rate limiting
- `netlify/functions/export-data.ts` - GDPR data export endpoint
- `netlify/functions/delete-account.ts` - GDPR account deletion endpoint
- `netlify/functions/rate-limit-status.ts` - Get user's current usage stats
- `src/pages/PrivacyPolicy.tsx` - Privacy policy page
- `.env.local` - Upstash credentials

### Modified Files
- `src/components/sidebar/UserAccountInfo.tsx` - Repurpose existing logout dialog into the Settings & Account dialog (single entrypoint; Sign Out in footer)
- `src/contexts/SettingsContext.tsx` - Use `preferences.theme: 'system'|'light'|'dark'`, `preferences.autoOpenLastFile`, and `apiKeys.anthropic` (no parallel root fields)
- `src/components/layout/Footer.tsx` - Link to privacy policy
- `src/services/auth/GoogleAuthService.ts` - Send user ID in API calls
- `src/contexts/AuthContext.tsx` - Expose user ID for API calls

---

## 🔗 Dependencies

### Requires
- ✅ Sprint 19: OAuth Security Upgrade (user ID extraction)
- ✅ Sprint 20: Cross-Device Settings Sync (settings storage)

### Enables
- **BYOK Implementation**: Safe to allow user API keys (rate limited)
- **Production Deployment**: GDPR compliant (legal requirement)
- **Trust & Safety**: Abuse prevention in place

---

## 📚 Research Documents

**Primary References**:
- `/docs/research/user-persistence/rate-limiting-browser-only-2025.md` (31KB)
- `/docs/research/user-persistence/IMPLEMENTATION-PLAN.md` (Phase 4 & 5 details)

**Code Examples**:
- All research docs include production-ready TypeScript code
- Upstash Redis setup guide
- GDPR compliance checklist

---

## 💰 Cost Analysis

### Free Tier (First 400 Users)
- **Upstash Redis**: Free (10,000 req/month)
- **Netlify Functions**: Free (125,000 invocations/month)
- **Total**: $0/month ✅

### Paid Tier (400-4,000 Users)
- **Upstash Redis**: $10/month (100,000 req/month)
- **Netlify Functions**: $19/month (125k-2M invocations)
- **Total**: $29/month for 4,000 users = **$0.007 per user** 🎯

---

## ✅ Definition of Done

- [ ] Upstash Redis setup complete
- [ ] Rate limiter deployed (100 req/hour per user)
- [ ] Multi-device quota sharing works (tested on 2 devices)
- [ ] 429 error with clear message and retry-after header
- [ ] Token validation prevents user ID spoofing
- [ ] Data export function works (JSON download)
- [ ] Account deletion function works (all data removed)
- [ ] Privacy policy updated with GDPR disclosures
- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors
- [ ] All tests passing
- [ ] Manual testing on 2 devices (desktop + mobile)
- [ ] PR approved and merged

---

## 🚀 Next Steps After Sprint 21

1. **BYOK Implementation** - Users provide Anthropic API keys (RiteMark pays $0)
2. **AI Agent Integration** - TipTap tool-calling features with user-provided keys
3. **Production Deployment** - All legal and security requirements met

---

**Ready to implement! All research complete, code examples provided in research docs.**
