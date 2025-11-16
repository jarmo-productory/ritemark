# Sprint 28 Debug Findings

**Date**: 2025-11-14
**Issue**: Auto-open loading state not working; file not auto-opening on refresh

---

## 🔍 Root Cause Found

**Problem**: `lastOpenedFileId` is `undefined` in settings

**Evidence** (from console logs):
```
[SettingsContext] ✅ Settings loaded: {
  autoOpenLastFile: true,           ← Feature is enabled ✅
  lastOpenedFileId: undefined,      ← NO FILE ID SAVED! ❌
  lastOpenedFileName: undefined
}

[App] 🎯 Should auto-open? undefined {
  featureEnabled: true,              ← Feature enabled ✅
  hasFileId: false,                  ← NO FILE ID! ❌
  isAuthenticated: true,             ← Authenticated ✅
  noFileOpen: true                   ← No file open ✅
}

[App] ❌ Auto-open conditions NOT met - showing WelcomeScreen
```

**Why auto-open fails:**
- Feature is enabled (`autoOpenLastFile: true`)
- User is authenticated
- BUT `lastOpenedFileId` is `undefined` → condition fails
- Result: Shows WelcomeScreen instead of loading file

---

## 🎯 Investigation Plan

**Need to determine why file ID isn't being tracked:**

### Scenario 1: File tracking code not running
- Effect dependencies might be wrong
- Settings might not be available when file opens
- **Debug added**: Full logging in tracking effect (App.tsx:171-220)

### Scenario 2: Settings not persisting to Drive
- Browser-only OAuth might not have Drive access
- Settings sync might be failing silently
- **Need to check**: Settings sync logs when file opens

### Scenario 3: Settings cleared on page reload
- Session restoration might clear settings
- IndexedDB cache might be invalid
- **Need to check**: Settings loaded from cache vs Drive

---

## 🧪 Next Steps

**User should:**
1. Open a file (New Document or Open from Drive)
2. Wait for "Saved" status
3. Check console for tracking logs:
   ```
   [App] 💾 Track last opened file effect triggered
   [App] 💾 Saving last opened file to settings: { fileId: "...", fileName: "..." }
   [App] ✅ Last opened file saved successfully
   ```
4. Refresh page
5. Check if file ID is now in settings:
   ```
   [SettingsContext] ✅ Settings loaded: {
     autoOpenLastFile: true,
     lastOpenedFileId: "abc123",     ← Should have value!
     lastOpenedFileName: "test.md"
   }
   ```

**If file ID still undefined after opening → Settings sync is broken**
**If file ID present but auto-open fails → Auto-open logic is broken**

---

## 📝 Debug Logging Added

### 1. App.tsx - Track Last Opened File (lines 171-220)
```typescript
console.log('[App] 💾 Track last opened file effect triggered', { ... })
console.log('[App] ⏭️  Not tracking - feature disabled or no file open', { ... })
console.log('[App] 💾 Saving last opened file to settings:', { ... })
console.log('[App] ✅ Last opened file saved successfully')
console.error('[App] ❌ Failed to save last opened file:', error)
```

### 2. App.tsx - Auto-Open Effect (lines 249-334)
```typescript
console.log('[App] 🔍 Auto-open effect triggered', { ... })
console.log('[App] ⏭️  Auto-open already happened this session - skipping')
console.log('[App] ⏳ Settings still loading - waiting...')
console.log('[App] 🎯 Should auto-open?', shouldAutoOpen, { ... })
console.log('[App] 🚀 Starting auto-open:', { ... })
console.log('[App] 📥 Loading file from Drive:', lastFileId)
console.log('[App] ✅ File loaded successfully:', { ... })
console.error('[App] ❌ Failed to auto-open file:', error)
console.log('[App] 🏁 Auto-open completed (success or failure)')
console.log('[App] ❌ Auto-open conditions NOT met - showing WelcomeScreen')
```

### 3. SettingsContext.tsx - Settings Loading (lines 90-112)
```typescript
console.log('[SettingsContext] 🔄 Loading settings...')
console.log('[SettingsContext] ✅ Settings loaded:', { ... })
console.error('[SettingsContext] ❌ Failed to load settings:', error)
console.log('[SettingsContext] 🏁 Settings loading complete')
```

---

## 🚨 Hypothesis: Browser-Only OAuth Issue

**Theory**: Browser-only OAuth (no backend) might not properly support settings sync

**Evidence**:
```
[BackendHealth] Using browser-only OAuth (backend unavailable)
```

**Possible issues**:
1. Settings require backend OAuth for Drive AppData access
2. Browser-only tokens don't have `drive.appdata` scope
3. IndexedDB cache works but Drive sync fails silently

**Solution**: Test with staging backend (already configured in `.env.local`)
- `VITE_OAUTH_REDIRECT_URI=https://ritemark.netlify.app/.netlify/functions/auth-callback`
- Should use staging Netlify Functions for OAuth
- Should have proper Drive AppData access
