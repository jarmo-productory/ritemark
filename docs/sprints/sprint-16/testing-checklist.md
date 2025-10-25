# Sprint 16: Offline Indicator Testing Checklist

## 🚨 CRITICAL ISSUES FOUND

### Build Errors (BLOCKING)
1. **TypeScript Compilation Error** in `useNetworkStatus.ts:90`
   - Error: `setTimeout` expects 1 argument, but got 0
   - Line 90: `const checkingTimeout = useRef<NodeJS.Timeout>()`
   - Fix: Should be `useRef<NodeJS.Timeout | undefined>(undefined)`

2. **Unused Imports** in `AppShell.tsx`
   - Line 19: `useNetworkStatus` imported but never used (commented out on line 39)
   - Line 20: `Cloud`, `CloudOff` icons imported but never used
   - Line 40: Missing `React` import for `React.useState` and `React.useEffect`

### Lint Errors (47 total)
- **Sprint 16 specific issues:**
  - AppShell.tsx: 3 unused import errors
  - useNetworkStatus.ts: No errors (implementation is clean!)

### Missing Implementation
- **Offline status indicator NOT implemented in AppShell**
  - Line 119: Comment says "Placeholder for offline status (Sprint 16)"
  - Hook is imported but UI components are missing

---

## Network Detection Tests

### Test 1: Online → Offline Transition
⏸️ **BLOCKED** - Cannot test until build issues fixed

**Expected behavior:**
1. ✅ Open RiteMark with network connected
2. ✅ Header shows "Saved" with green cloud icon
3. ✅ Open Chrome DevTools → Network → Set to "Offline"
4. ✅ Toast appears: "Working offline"
5. ✅ Header shows "Offline" with red cloud icon

**Current status:** UI not implemented

---

### Test 2: Offline → Online Transition
⏸️ **BLOCKED** - Cannot test until build issues fixed

**Expected behavior:**
1. ✅ While offline, make edits
2. ✅ Changes queued locally (no errors)
3. ✅ Re-enable network (Online)
4. ✅ Toast appears: "Back online"
5. ✅ Header shows "Reconnecting..." briefly
6. ✅ Header shows "Saved" after sync completes

**Current status:** Toast notifications implemented (lines 42-54), but status indicator missing

---

### Test 3: Slow Connection (Lie-Fi)
⏸️ **BLOCKED** - Cannot test until build issues fixed

**Expected behavior:**
1. ✅ Set network to "Slow 3G"
2. ✅ Header shows "Reconnecting..." with spinner
3. ✅ Uses exponential backoff (check console logs)
4. ✅ Eventually connects or times out gracefully

**Current status:** Hook has 2-second checking state (line 81), but UI not implemented

---

### Test 4: Rapid Network Changes
⏸️ **BLOCKED** - Cannot test until build issues fixed

**Expected behavior:**
1. ✅ Toggle network on/off quickly 5 times
2. ✅ No duplicate toasts
3. ✅ Status indicator updates correctly
4. ✅ No JavaScript errors in console

**Current status:** Hook handles state correctly with refs and timeouts

---

## Accessibility Tests

### Test 5: Screen Reader Announcements
⏸️ **BLOCKED** - No UI to test

**Expected behavior:**
1. ✅ Enable VoiceOver (Mac) or NVDA (Windows)
2. ✅ Navigate to status indicator
3. ✅ Announces "Saved" or "Offline" status
4. ✅ Toast notifications announced on change

**Current status:** Toast notifications have descriptions (accessible), but status indicator not implemented

---

### Test 6: Keyboard Navigation
⏸️ **BLOCKED** - No UI to test

**Expected behavior:**
1. ✅ Tab through header elements
2. ✅ Status indicator visible in focus order
3. ✅ No keyboard traps

**Current status:** Cannot test without UI

---

## Integration Tests

### Test 7: Auto-save Integration
⏸️ **BLOCKED** - Cannot test until build issues fixed

**Expected behavior:**
1. ✅ Make edits while online → Auto-save works
2. ✅ Go offline → Make edits → Changes queued
3. ✅ Go online → Changes sync automatically
4. ✅ No data loss

**Current status:** Hook provides `isOnline` state, needs integration with Drive sync

---

### Test 8: Visual Consistency
⏸️ **BLOCKED** - No UI to test

**Expected behavior:**
1. ✅ Status indicator aligned with Share button
2. ✅ Icons sized correctly (h-4 w-4)
3. ✅ Colors match design system
4. ✅ Responsive on mobile (text hidden if needed)

**Current status:** No UI implemented

---

## 📋 REQUIRED FIXES

### 1. Fix TypeScript Error in useNetworkStatus.ts
```typescript
// Line 90 - Fix ref initialization
const checkingTimeout = useRef<NodeJS.Timeout | undefined>(undefined)
```

### 2. Fix AppShell.tsx Imports
```typescript
// Add React import at top
import React from 'react'

// Remove unused imports (Cloud, CloudOff) OR implement the UI
```

### 3. Implement Offline Status Indicator UI
The hook is working, but the UI is missing. Need to add:

```typescript
{/* Sprint 16: Offline Status Indicator */}
<div className="flex items-center gap-2 text-sm">
  {isChecking ? (
    <>
      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      <span className="hidden sm:inline text-muted-foreground">Reconnecting...</span>
    </>
  ) : isOnline ? (
    <>
      <Cloud className="h-4 w-4 text-green-600" />
      <span className="hidden sm:inline text-muted-foreground">Saved</span>
    </>
  ) : (
    <>
      <CloudOff className="h-4 w-4 text-red-600" />
      <span className="hidden sm:inline text-red-600">Offline</span>
    </>
  )}
</div>
```

---

## 🔧 VALIDATION COMMANDS

### TypeScript Check
```bash
cd /Users/jarmotuisk/Projects/ritemark/ritemark-app
npm run type-check
```
**Expected:** Zero errors
**Current:** ❌ 4 errors

### Lint Check
```bash
npm run lint
```
**Expected:** Zero errors
**Current:** ❌ 47 errors (3 related to Sprint 16)

### Build Check
```bash
npm run build
```
**Expected:** Successful build
**Current:** ❌ Failed (TypeScript errors)

---

## 📊 SUMMARY

**Status:** ⛔ **FAILED - IMPLEMENTATION INCOMPLETE**

**Issues Found:**
1. ❌ TypeScript compilation error in useNetworkStatus.ts
2. ❌ React import missing in AppShell.tsx
3. ❌ Unused imports (Cloud, CloudOff icons)
4. ❌ Offline status UI not implemented (placeholder comment only)
5. ✅ Hook logic is correct
6. ✅ Toast notifications implemented

**Next Steps:**
1. Fix TypeScript ref initialization error
2. Add React import to AppShell.tsx
3. Implement offline status indicator UI in header
4. Remove unused imports OR use them in implementation
5. Re-run validation tests
6. Manual browser testing after fixes

**Estimated Time to Fix:** 15-20 minutes
