# Sprint 17: Version History Link

**Theme**: Google Drive Version History Integration
**Timeline**: 1 day
**PR Name**: `feat/sprint-17-version-history`
**Status**: 📋 Planning Complete → Pending Sprint 15 & 16

---

## 🎯 Quick Start

**Reading Order for AI Agents:**
1. This README (navigation and overview)
2. `/docs/research/drive-features/drive-api-capabilities.md` (Revisions API)
3. `/docs/research/drive-features/competitor-analysis.md` (UX patterns)
4. Implementation plan below

---

## 📊 Sprint Overview

### Feature Delivered

| Feature | Effort | Files Touched | User Value |
|---------|--------|---------------|------------|
| **Version History Link** | 1 day | 2 files | Medium - Data safety |

**Scope**: Single feature only - Menu item to open Google Drive version history UI

**Total**: 2 files, ~80 lines of code

---

## 📚 Document Organization

### Research Documents (Completed)

| Document | Size | Purpose | Status |
|----------|------|---------|--------|
| `drive-features/drive-api-capabilities.md` | 28 KB | Revisions API documentation | ✅ Complete |
| `drive-features/competitor-analysis.md` | 21 KB | UX best practices | ✅ Complete |
| `drive-features/implementation-examples.md` | 25 KB | Code samples | ✅ Complete |

### Implementation Documents (This Sprint)

| Document | Purpose | Status |
|----------|---------|--------|
| `README.md` (this file) | Sprint navigation | ✅ Complete |

---

## 🎯 Success Criteria

### Must Have ✅

1. **Kebab Menu in Header**
   - Three-dot menu icon in top-right of header
   - Opens dropdown menu with document actions
   - Positioned after Share button
   - Uses shadcn DropdownMenu component

2. **Version History Menu Item**
   - Lives inside kebab menu (not File menu)
   - Shows "View Version History" text
   - History icon from Lucide React
   - Disabled when no file is open
   - Keyboard shortcut: Cmd/Ctrl+Shift+H

2. **Drive UI Integration**
   - Opens Drive version history in new tab
   - URL format: `https://drive.google.com/file/{fileId}/revisions`
   - Shows all revisions with timestamps
   - Allows restore to previous versions
   - Works on desktop + mobile

3. **Error Handling**
   - Toast notification if file has no revisions
   - Graceful handling if file ID missing
   - Fallback to Drive file view if revisions unavailable

### Quality Gates ✅

- ✅ Zero TypeScript errors
- ✅ All existing tests pass
- ✅ No breaking changes
- ✅ Manual testing checklist complete
- ✅ Accessibility validated (keyboard + screen reader)

---

## 🏗️ Architecture Decisions

### Key Findings from Research

1. **Don't Build Custom UI**: Link to Drive's version history (saves development time)
2. **Revisions API**: Available via `drive.file` scope (already have access)
3. **URL Pattern**: Simple `https://drive.google.com/file/{fileId}/revisions`
4. **Menu Placement**: File menu, before Settings (familiar from Google Docs)

### File Structure

```
ritemark-app/src/
├── services/drive/
│   └── versionHistory.ts        [NEW] Version history utilities
└── components/
    └── layout/
        ├── AppShell.tsx         [EDIT] Add kebab menu to header
        └── DocumentMenu.tsx     [NEW] Kebab menu component
```

**Note**: Version History goes in NEW kebab menu, NOT File menu

---

## 📋 Implementation Plan

### Phase 1: Kebab Menu Component (2 hours)

**File**: `src/components/layout/DocumentMenu.tsx`

**Tasks**:
1. Create DocumentMenu component (kebab menu)
2. Use shadcn DropdownMenu with MoreVertical icon
3. Position in header (after Share button)
4. Initially empty - ready for menu items
5. Add keyboard accessibility

**Code Structure**:
```tsx
export function DocumentMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* Version History item below */}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

**Complexity**: Low (standard shadcn component)

---

### Phase 2: Version History Service (2 hours)

**File**: `src/services/drive/versionHistory.ts`

**Tasks**:
1. Create `openVersionHistory()` function
2. Construct Drive revisions URL
3. Add error handling (no file, no revisions)
4. Add TypeScript interfaces
5. Add window.open() wrapper for new tab

**Code Structure**:
```typescript
export interface VersionHistoryOptions {
  fileId: string
  onError?: (error: Error) => void
}

export function openVersionHistory(options: VersionHistoryOptions): void
```

**Implementation**:
```typescript
export function openVersionHistory({ fileId, onError }: VersionHistoryOptions) {
  if (!fileId) {
    const error = new Error('No file ID provided')
    onError?.(error)
    return
  }

  const url = `https://drive.google.com/file/${fileId}/revisions`
  window.open(url, '_blank', 'noopener,noreferrer')
}
```

**Complexity**: Low (simple URL construction)

---

### Phase 3: Version History Integration (2 hours)

**Files**:
- `src/components/layout/DocumentMenu.tsx` (edit)
- `src/components/layout/AppShell.tsx` (edit)

**Tasks**:
1. Import `openVersionHistory()` in DocumentMenu
2. Add "View Version History" menu item to DocumentMenu
3. Add History icon from Lucide
4. Wire up click handler
5. Add keyboard shortcut (Cmd/Ctrl+Shift+H)
6. Disable when no file open
7. Add DocumentMenu to AppShell header

**Kebab Menu Content**:
```tsx
<DropdownMenuContent align="end">
  <DropdownMenuItem
    onClick={handleVersionHistory}
    disabled={!currentFile}
    shortcut="⌘⇧H"
  >
    <History className="mr-2 h-4 w-4" />
    View Version History
  </DropdownMenuItem>

  {/* Future: Document Info, Move to folder, etc. */}
</DropdownMenuContent>
```

**Header Integration**:
```tsx
<header className="flex items-center justify-between">
  <div>{/* Logo, file name */}</div>
  <div className="flex items-center gap-2">
    {/* Offline status (Sprint 16) */}
    <div className="text-sm">💾 Saved</div>

    {/* Share button (Sprint 15) */}
    <Button onClick={handleShare}>
      <Share2 className="h-4 w-4" />
      Share
    </Button>

    {/* NEW: Kebab menu */}
    <DocumentMenu />
  </div>
</header>
```

**Note**: User avatar is in sidebar (left bottom), NOT in header

**Handler Implementation**:
```typescript
const handleVersionHistory = () => {
  if (!currentFile?.id) {
    toast.error('No file open')
    return
  }

  try {
    openVersionHistory({
      fileId: currentFile.id,
      onError: (error) => {
        toast.error('Could not open version history', {
          description: error.message
        })
      }
    })
  } catch (error) {
    toast.error('Failed to open version history')
  }
}
```

**Complexity**: Low (straightforward menu integration)

---

### Phase 4: Testing & Polish (4 hours)

**Testing Checklist**:
- [ ] Menu item visible in File menu
- [ ] Disabled when no file open
- [ ] Enabled when file is open
- [ ] Click opens Drive version history in new tab
- [ ] Keyboard shortcut works (Cmd/Ctrl+Shift+H)
- [ ] Mobile: Opens Drive mobile UI
- [ ] Error toast shows if file ID missing
- [ ] Screen reader announces menu item

**Browser Testing**:
- Chrome (desktop + Android)
- Firefox (desktop)
- Safari (desktop + iOS)
- Edge (desktop)

**Edge Cases**:
- File with no revisions (newly created)
- File with many revisions (50+)
- Offline mode (should fail gracefully)

**Complexity**: Low (simple feature, few edge cases)

---

## 🧪 Testing Strategy

### Manual Testing (Required)

**Kebab Menu**:
1. Open document in RiteMark
2. ✅ Kebab menu (⋮) visible in header (top-right)
3. Click kebab menu
4. ✅ Dropdown opens with "View Version History"

**Version History - Desktop**:
1. Kebab menu → "View Version History"
2. ✅ Opens Drive revisions page in new tab
4. ✅ Shows list of revisions with timestamps
5. ✅ Can click revision to view content
6. ✅ Can restore previous version

**Version History - Mobile**:
1. Open document on iOS Safari
2. Tap kebab menu (⋮) → "View Version History"
3. ✅ Opens Drive mobile revisions view
4. ✅ Can view and restore revisions
5. Repeat on Chrome Android

**Keyboard Accessibility**:
1. Press Cmd/Ctrl+Shift+H
2. ✅ Opens version history in new tab
3. File menu → Tab to "View Version History"
4. Press Enter
5. ✅ Opens version history

**Error Cases**:
1. No file open
2. Kebab menu → "View Version History"
3. ✅ Menu item disabled (grayed out)
4. ✅ Tooltip shows "No file open"

**Screen Reader**:
1. Enable VoiceOver/NVDA
2. Tab to kebab menu button
3. ✅ "Document actions" announced
4. Open menu → "View Version History" announced
5. ✅ Disabled state announced when no file

---

## 🔗 Related Documentation

### Research Folder
All research lives in `/docs/research/drive-features/` (shared across Sprints 15, 16, 17)

### Prerequisites
- ✅ Sprint 8: Google Drive integration
- ✅ Sprint 15: Share Button (recommended to complete first)
- ✅ Sprint 16: Offline Indicator (recommended to complete first)

### Follow-up Sprints
- ⏳ Future: Real-time collaboration
- ⏳ Future: Export templates (separate feature set)

---

## 📊 Sprint Metrics

### Estimated Effort

- Research: ✅ Completed (shared research folder)
- Implementation: ⏳ 1 day (8 hours)
  - Phase 1: Version history service (2 hours)
  - Phase 2: File menu integration (2 hours)
  - Phase 3: Testing & polish (4 hours)
- **Total**: 1 day

### Code Changes

- New files: 2 (`versionHistory.ts`, `DocumentMenu.tsx`)
- Edited files: 1 (`AppShell.tsx`)
- Total lines: ~120
- Net change: +105 lines

---

## 🚀 Ready to Start

**Next Steps**:
1. ✅ Research complete (shared folder)
2. ⏳ Wait for Sprint 15 & 16 to complete (recommended)
3. ⏳ Begin Phase 1 (Version history service)
4. ⏳ Begin Phase 2 (File menu integration)
5. ⏳ Begin Phase 3 (Testing & polish)

**Approval Required**: User sign-off to proceed with implementation

---

**Date Created**: October 22, 2025
**Research Folder**: `/docs/research/drive-features/` (shared)
**Implementation Start**: After Sprint 15 & 16 completion
