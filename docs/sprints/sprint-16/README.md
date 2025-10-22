# Sprint 16: Offline Indicator

**Theme**: Network Status Transparency
**Timeline**: 1 day
**PR Name**: `feat/sprint-16-offline-indicator`
**Status**: 📋 Planning Complete → Pending Sprint 15

---

## 🎯 Quick Start

**Reading Order for AI Agents:**
1. This README (navigation and overview)
2. `/docs/research/drive-features/offline-detection-patterns.md` (network detection)
3. `/docs/research/drive-features/codebase-audit.md` (current sync status)
4. `/docs/research/drive-features/visual-patterns-summary.md` (design specs)
5. Implementation plan below

---

## 📊 Sprint Overview

### Feature Delivered

| Feature | Effort | Files Touched | User Value |
|---------|--------|---------------|------------|
| **Offline Indicator** | 1 day | 2 files | Medium - Transparency |

**Scope**: Single feature only - Network status indicator in header with toast notifications

**Total**: 2 files, ~100 lines of code

---

## 📚 Document Organization

### Research Documents (Completed)

| Document | Size | Purpose | Status |
|----------|------|---------|--------|
| `drive-features/offline-detection-patterns.md` | 39 KB | Network detection best practices | ✅ Complete |
| `drive-features/codebase-audit.md` | 25 KB | Current sync status analysis | ✅ Complete |
| `drive-features/visual-patterns-summary.md` | 14 KB | Design specifications | ✅ Complete |

### Implementation Documents (This Sprint)

| Document | Purpose | Status |
|----------|---------|--------|
| `README.md` (this file) | Sprint navigation | ✅ Complete |

---

## 🎯 Success Criteria

### Must Have ✅

1. **Network Status Hook**
   - `useNetworkStatus()` hook monitors connection
   - Uses `fetch()` verification (not just `navigator.onLine`)
   - Exponential backoff for retries
   - Returns `{ isOnline, isChecking }`

2. **Header Status Indicator**
   - Shows sync status in header (near Share button)
   - States: "Saved", "Saving...", "Offline", "Reconnecting..."
   - Uses Lucide icons (Cloud, CloudOff, Loader2)
   - Color-coded: green (online), orange (checking), red (offline)

3. **Toast Notifications**
   - "Working offline" toast when connection lost
   - "Back online" toast when connection restored
   - Auto-dismiss after 3 seconds
   - Uses existing Sonner toast system

4. **Auto-save Integration**
   - Pauses auto-save when offline
   - Queues changes locally
   - Resumes sync when back online
   - Shows "Offline" status in header

### Quality Gates ✅

- ✅ Zero TypeScript errors
- ✅ All existing tests pass
- ✅ No breaking changes
- ✅ Manual testing checklist complete
- ✅ Accessibility validated (status announced to screen readers)

---

## 🏗️ Architecture Decisions

### Key Findings from Research

1. **Don't Trust `navigator.onLine`**: Only 85% accurate - use `fetch()` verification
2. **Verification Pattern**: HEAD request to Drive API endpoint every 30s when unsure
3. **User Feedback**: Toast on status change + persistent indicator in header
4. **Integration Point**: Connects to existing `useDriveSync` hook

### File Structure

```
ritemark-app/src/
├── hooks/
│   └── useNetworkStatus.ts      [NEW] Network detection hook
└── components/
    └── layout/AppShell.tsx       [EDIT] Add status indicator
```

---

## 📋 Implementation Plan

### Phase 1: Network Status Hook (4 hours)

**File**: `src/hooks/useNetworkStatus.ts`

**Tasks**:
1. Create `useNetworkStatus()` hook
2. Listen to `online`/`offline` events
3. Implement `fetch()` verification
4. Add exponential backoff (1s → 2s → 4s → 8s → 16s)
5. Return `{ isOnline, isChecking, lastChecked }`
6. Add TypeScript interfaces

**Code Structure**:
```typescript
export interface NetworkStatus {
  isOnline: boolean
  isChecking: boolean
  lastChecked: Date | null
}

export function useNetworkStatus(): NetworkStatus
```

**Verification Logic**:
- On `offline` event: Set `isOnline = false` immediately
- On `online` event: Set `isChecking = true`, verify with `fetch()`
- If `fetch()` succeeds: Set `isOnline = true`
- If `fetch()` fails: Retry with exponential backoff

**Complexity**: Medium (retry logic + debouncing)

---

### Phase 2: Status Indicator UI (4 hours)

**File**: `src/components/layout/AppShell.tsx`

**Tasks**:
1. Import `useNetworkStatus()` hook
2. Add status indicator to header (between file name and Share button)
3. Show appropriate icon + text based on status
4. Add toast notifications on status change
5. Integrate with existing `useDriveSync` hook
6. Update sync status display

**Status Indicator Location**:
```tsx
<header className="flex items-center justify-between">
  <div>{/* Logo, file name */}</div>
  <div className="flex items-center gap-2">
    {/* Offline Status Indicator */}
    <div className="flex items-center gap-1 text-sm">
      {isOnline ? (
        <>
          <Cloud className="h-4 w-4 text-green-600" />
          <span>Saved</span>
        </>
      ) : (
        <>
          <CloudOff className="h-4 w-4 text-red-600" />
          <span>Offline</span>
        </>
      )}
    </div>

    {/* Share Button (Sprint 15) */}
    <Button onClick={handleShare}>
      <Share2 className="h-4 w-4" />
      Share
    </Button>

    {/* Kebab Menu will go here (Sprint 17) */}
  </div>
</header>
```

**Note**: User avatar is in sidebar (left bottom), NOT in header

**Toast Notifications**:
```typescript
useEffect(() => {
  if (!isOnline) {
    toast.warning("Working offline", {
      description: "Changes will sync when you're back online"
    })
  } else if (wasOffline) {
    toast.success("Back online", {
      description: "Syncing changes..."
    })
  }
}, [isOnline])
```

**Complexity**: Low (straightforward UI integration)

---

## 🧪 Testing Strategy

### Manual Testing (Required)

**Network Detection**:
1. Open RiteMark with network connected
2. ✅ Header shows "Saved" with green cloud icon
3. Disable network (Chrome DevTools → Network → Offline)
4. ✅ Toast appears: "Working offline"
5. ✅ Header shows "Offline" with red cloud icon
6. Re-enable network
7. ✅ Toast appears: "Back online"
8. ✅ Header shows "Saved" with green cloud icon

**Auto-save Integration**:
1. Make edits while online
2. ✅ Auto-save works normally (header shows "Saving...")
3. Disable network
4. Make more edits
5. ✅ Changes queued locally
6. ✅ Header shows "Offline"
7. Re-enable network
8. ✅ Changes sync to Drive
9. ✅ Header shows "Saved"

**Verification Logic**:
1. Enable "Slow 3G" in Chrome DevTools
2. ✅ Header shows "Reconnecting..." with spinner
3. ✅ Uses exponential backoff for retries
4. Switch to "Online"
5. ✅ Connects successfully

**Accessibility**:
1. Enable screen reader (VoiceOver/NVDA)
2. Navigate to status indicator
3. ✅ Announces "Saved" or "Offline" status
4. Network change occurs
5. ✅ Toast notification announced

---

## 🔗 Related Documentation

### Research Folder
All research lives in `/docs/research/drive-features/` (shared across Sprints 15, 16, 17)

### Prerequisites
- ✅ Sprint 8: Google Drive integration
- ✅ Sprint 15: Share Button (should complete first)

### Follow-up Sprints
- ⏳ Sprint 17: Version History Link (1 day)
- ⏳ Future: Real-time collaboration

---

## 📊 Sprint Metrics

### Estimated Effort

- Research: ✅ Completed (shared research folder)
- Implementation: ⏳ 1 day (8 hours)
  - Phase 1: Network status hook (4 hours)
  - Phase 2: Status indicator UI (4 hours)
- **Total**: 1 day

### Code Changes

- New files: 1 (`useNetworkStatus.ts`)
- Edited files: 1 (`AppShell.tsx`)
- Total lines: ~100
- Net change: +85 lines

---

## 🚀 Ready to Start

**Next Steps**:
1. ✅ Research complete (shared folder)
2. ⏳ Wait for Sprint 15 (Share Button) to complete
3. ⏳ Begin Phase 1 (Network status hook)
4. ⏳ Begin Phase 2 (Status indicator UI)

**Approval Required**: User sign-off to proceed with implementation

---

**Date Created**: October 22, 2025
**Research Folder**: `/docs/research/drive-features/` (shared)
**Implementation Start**: After Sprint 15 completion
