# Sprint 28: Auto-Open Loading State

**Goal**: Show loading spinner instead of "New/Open" buttons when "Pick up where you left off" auto-restores the last file.

**Status**: 📋 Ready for Approval

---

## 🎯 Quick Start

**Read in this order:**
1. This README (you are here)
2. No other docs needed - simple sprint!

---

## 📚 Document Organization

| File | Purpose | Status | Size |
|------|---------|--------|------|
| README.md | Sprint overview and plan | ✅ Complete | ~2KB |

---

## 🏗️ What We're Building

### Current Problem
When user has "Pick up where you left off" enabled:
1. User sees "New Document" and "Open from Drive" buttons
2. **WHILE buttons are visible**, system is loading their last file (500-2000ms)
3. User might click "New Document" by mistake
4. No feedback that auto-restore is happening

### Solution
Show loading spinner with message "Opening your last file..." instead of buttons during auto-restore.

---

## 📝 Implementation Plan

### File 1: App.tsx (lines 244-292, 416-423)

**Add state:**
```typescript
const [isAutoOpening, setIsAutoOpening] = useState(false)
```

**Update auto-open effect:**
```typescript
if (shouldAutoOpen) {
  setIsAutoOpening(true)  // ← NEW

  const autoLoadFile = async () => {
    try {
      // ... existing code ...
    } finally {
      setIsAutoOpening(false)  // ← NEW
    }
  }

  autoLoadFile()
  hasAutoOpened.current = true
}
```

**Update WelcomeScreen render:**
```typescript
<WelcomeScreen
  onNewDocument={handleNewDocument}
  onOpenFromDrive={handleOpenFromDrive}
  isLoading={settingsLoading || isAutoOpening}  // ← NEW
  loadingMessage={
    settingsLoading
      ? "Loading settings..."
      : "Opening your last file..."
  }  // ← NEW
/>
```

### File 2: WelcomeScreen.tsx (lines 9-13, 190-268)

**Update props:**
```typescript
interface WelcomeScreenProps {
  onNewDocument: () => void
  onOpenFromDrive: () => void
  onCancel?: () => void
  isLoading?: boolean        // ← NEW
  loadingMessage?: string    // ← NEW
}
```

**Add loading UI (replace action buttons section):**
```typescript
{isLoading ? (
  // Loading state
  <div className="space-y-4 mb-6">
    <div className="flex justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
    <p className="text-sm text-muted-foreground">
      {loadingMessage}
    </p>
  </div>
) : (
  // Existing action buttons
  <div className="space-y-3 mb-6">
    {isAuthenticated ? (
      <>{/* existing buttons */}</>
    ) : (
      <>{/* sign in button */}</>
    )}
  </div>
)}
```

**Hide cancel button during loading:**
```typescript
{onCancel && !isLoading && (
  <div className="mt-8">
    <button onClick={onCancel} className="cancel-link">
      Cancel
    </button>
  </div>
)}
```

---

## ✅ Testing Checklist

- [ ] Enable feature → Open file → Refresh → See loading state → File opens
- [ ] Disable feature → Refresh → See buttons immediately (no loading)
- [ ] No lastOpenedFileId → Refresh → See buttons immediately
- [ ] Deleted file → Refresh → Loading → Error → Buttons appear
- [ ] Signed out → Refresh → No auto-open, "Sign in" button

---

## 📊 Validation

**Before claiming done:**
```bash
npm run type-check  # Must pass
npm run dev         # Test in browser
```

**Browser test:**
1. Open DevTools console (check for errors)
2. Enable "Pick up where you left off" in settings
3. Open a document
4. Hard refresh (Cmd+Shift+R)
5. Verify: Spinner appears → File loads → Editor shows

---

## 🎯 Success Criteria

- ✅ Loading state shows INSTEAD of buttons when auto-restore triggers
- ✅ Message clearly says "Opening your last file..."
- ✅ If auto-restore fails, buttons appear (fallback)
- ✅ If feature disabled, buttons appear immediately (no loading)
- ✅ No TypeScript errors
- ✅ No browser console errors

---

## 📈 Estimated Effort

**Time**: 30-45 minutes
**Complexity**: Low
**Risk**: Low (isolated changes, clear fallback)

---

**Related Research**: `/docs/research/pick-up-where-left-off-loading-state.md`
