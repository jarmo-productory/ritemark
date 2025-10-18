# Sprint 9: Sidebar Consolidation - Implementation Guide

**Quick Reference for Development Team**

---

## 📋 TL;DR (Executive Summary)

**What we're building:** Consolidate all UI (FileMenu, SaveStatus, AuthStatus, TableOfContents) into a single shadcn left sidebar.

**Why:** Current UI scattered across 4 screen locations violates "invisible interface" principle. Users' eyes jump between corners. No clear "home" for controls.

**Timeline:** 10 days
**Components:** 6 new, 4 deleted
**Risk Level:** Medium (big bang replacement)
**Expected Outcome:** Clean, professional interface matching Notion/Linear/Vercel patterns

---

## 🎯 What Changes?

### Before (Current State - 4 Locations)

```
┌─────────────────────────────────────────┐
│ 💾 Saved 5s ago         FileMenu ⋮      │  ← Upper left + upper right
│                                         │
│                                         │
│          Editor Content                 │
│                                         │
│                                    TOC  │  ← Right side overlay
│                                    ─────│
│                                    - H1 │
│ 👤 User Badge                      - H2 │  ← Bottom left
└─────────────────────────────────────────┘
```

**Problems:**
- Eyes jump between 4 different locations
- Visual clutter breaks writing flow
- Inconsistent with "invisible interface"

---

### After (Sprint 9 - Single Sidebar)

```
┌─┬─────────────────────────────────────┐
│📄│                                     │  ← Collapsed by default
│ │         Pure Content Area           │     (icon mode)
│📑│                                     │
│ │    (Editor with ZERO UI chrome)     │
│👤│                                     │
└─┴─────────────────────────────────────┘
  ^
  Thin vertical bar (48-64px)
  Cmd+B to toggle

Expanded (240-280px):
┌──────────────┬──────────────────────┐
│ 📄 My Doc.md │                      │
│              │  Pure Content Area   │
│ Contents     │                      │
│  - Heading 1 │                      │
│  - Heading 2 │                      │
│              │                      │
│ 👤 John Doe  │                      │
│   john@e.com │                      │
└──────────────┴──────────────────────┘
```

**Benefits:**
- ✅ Predictable single location for all controls
- ✅ Maximum space for writing (collapsed by default)
- ✅ Professional, clean interface
- ✅ Keyboard shortcut: `Cmd+B` / `Ctrl+B`

---

## 🏗️ Components to Build (6 New)

### 1. AppSidebar.tsx
**Location:** `src/components/sidebar/AppSidebar.tsx`
**Purpose:** Main sidebar wrapper with shadcn structure
**Props:**
```typescript
interface AppSidebarProps {
  editor?: TipTapEditor | null
  fileId: string | null
  fileName?: string
}
```
**Key Features:**
- Collapsible icon mode (default)
- Keyboard shortcut `Cmd+B`
- Mobile hamburger menu

---

### 2. FileStatusIndicator.tsx
**Location:** `src/components/sidebar/FileStatusIndicator.tsx`
**Purpose:** File save status with icon + filename
**Props:**
```typescript
interface FileStatusIndicatorProps {
  fileId: string | null
  fileName?: string
}
```
**Status Icons:**
| Status | Icon | Meaning |
|--------|------|---------|
| synced | 📄 FileText | All saved |
| saving | 🔄 Loader2 (animated) | Currently saving |
| error | 🔴 AlertCircle | Save failed |
| offline | ☁️❌ CloudOff | No network |
| unsaved | 🟡 Yellow dot badge | Unsaved changes |

---

### 3. TableOfContentsNav.tsx
**Location:** `src/components/sidebar/TableOfContentsNav.tsx`
**Purpose:** Migrated TOC functionality (from `TableOfContents.tsx`)
**Props:**
```typescript
interface TableOfContentsNavProps {
  editor?: TipTapEditor | null
}
```
**Keep from old TOC:**
- ✅ Heading extraction from ProseMirror doc
- ✅ Active heading detection (topmost visible + look north)
- ✅ Click to scroll navigation

**New behavior:**
- ❌ Hide TOC if no headings (`if headings.length === 0 return null`)
- ✅ Show TOC icon in collapsed mode (only if headings exist)

---

### 4. UserAccountInfo.tsx
**Location:** `src/components/sidebar/UserAccountInfo.tsx`
**Purpose:** User display + logout action
**Props:**
```typescript
interface UserAccountInfoProps {
  className?: string
}
```
**Display:**
- Expanded: Avatar + Name + Email
- Collapsed: Avatar only
- Click → Opens `AuthModal` for logout

---

### 5. NoFileDialog.tsx
**Location:** `src/components/dialogs/NoFileDialog.tsx`
**Purpose:** Center dialog when no file open (Open vs Create New)
**Props:**
```typescript
interface NoFileDialogProps {
  onOpenFile: () => void
  onCreateNew: () => void
}
```
**Layout:**
```
┌─────────────────────────────────┐
│       Welcome to RiteMark       │
│                                 │
│   ┌─────────┐  ┌─────────────┐ │
│   │  Open   │  │ Create New  │ │
│   └─────────┘  └─────────────┘ │
└─────────────────────────────────┘
```

---

### 6. SaveAsDialog.tsx
**Location:** `src/components/dialogs/SaveAsDialog.tsx`
**Purpose:** Filename + folder picker for new files
**Props:**
```typescript
interface SaveAsDialogProps {
  onSave: (fileName: string, folderId?: string) => Promise<void>
  onCancel: () => void
  isOpen: boolean
}
```
**Form Fields:**
1. Filename input (auto-append `.md`)
2. Folder picker (Google Drive Picker API)

---

## 🗑️ Components to Delete (4 Old)

**Delete these files completely:**
```bash
rm src/components/FileMenu.tsx
rm src/components/drive/SaveStatus.tsx
rm src/components/auth/AuthStatus.tsx
rm src/components/TableOfContents.tsx
```

**Remove references from App.tsx:**
- Delete imports
- Delete JSX usage
- Clean up CSS (`.file-menu-container`, `.save-status`, `.auth-status-container`, `.toc-sidebar`)

---

## 📅 Implementation Timeline (10 Days)

### Day 1-2: Preparation
- [ ] Install shadcn sidebar: `pnpm dlx shadcn@latest add sidebar`
- [ ] Create file structure (`mkdir -p src/components/sidebar src/components/dialogs`)
- [ ] Review shadcn docs: https://ui.shadcn.com/docs/components/sidebar
- [ ] Create skeleton components (no logic)

---

### Day 3: Core Sidebar
- [ ] Build `AppSidebar.tsx` (2-3 hours)
  - Import shadcn primitives
  - Set up header/content/footer structure
  - Configure `collapsible="icon"`, `side="left"`
  - Test collapse/expand with `Cmd+B`

- [ ] Build `FileStatusIndicator.tsx` (2-3 hours)
  - Import `useDriveSync` hook
  - Implement status icon logic
  - Add yellow dot badge
  - Add filename truncation
  - Test all status states

**Validation:**
- ✅ Sidebar collapses/expands
- ✅ Status icon changes based on `syncStatus`
- ✅ Yellow dot appears when typing

---

### Day 4: Navigation & User
- [ ] Build `TableOfContentsNav.tsx` (3-4 hours)
  - Copy logic from `TableOfContents.tsx`
  - Replace styles with shadcn `SidebarMenu`
  - Add conditional rendering (`if headings.length === 0 return null`)
  - Test heading extraction + scroll navigation

- [ ] Build `UserAccountInfo.tsx` (2-3 hours)
  - Import `useAuth` hook
  - Display avatar + name + email (expanded)
  - Display avatar only (collapsed)
  - Wire up click → `AuthModal`
  - Test logout flow

**Validation:**
- ✅ TOC shows headings from editor
- ✅ Click heading scrolls to position
- ✅ TOC hidden when no headings
- ✅ User info shows correctly
- ✅ Logout flow works

---

### Day 5: Dialogs
- [ ] Build `NoFileDialog.tsx` (2 hours)
  - Create center-screen layout
  - Add "Open File" and "Create New" buttons
  - Wire up callbacks

- [ ] Build `SaveAsDialog.tsx` (3-4 hours)
  - Create dialog with filename input
  - Add folder picker (Google Drive Picker API)
  - Implement validation
  - Test file creation

**Validation:**
- ✅ NoFileDialog appears when `fileId === null`
- ✅ "Open File" triggers file picker
- ✅ "Create New" shows SaveAsDialog
- ✅ SaveAsDialog creates file

---

### Day 6: Wire Up State
- [ ] Update `App.tsx` to use new sidebar (4-6 hours)
  ```tsx
  <SidebarProvider>
    <AppSidebar editor={editor} fileId={fileId} fileName={title} />
    <main>
      {!fileId && <NoFileDialog onOpenFile={...} onCreateNew={...} />}
      {fileId && <Editor ... />}
    </main>
  </SidebarProvider>
  ```
- [ ] Pass `syncStatus` to `FileStatusIndicator`
- [ ] Pass `editor` to `TableOfContentsNav`
- [ ] Pass `user` to `UserAccountInfo`

**Validation:**
- ✅ All props flow correctly
- ✅ Sidebar updates in real-time

---

### Day 7: Remove Old Components
- [ ] Delete old component files (2 hours)
  ```bash
  rm src/components/FileMenu.tsx
  rm src/components/drive/SaveStatus.tsx
  rm src/components/auth/AuthStatus.tsx
  rm src/components/TableOfContents.tsx
  ```
- [ ] Remove imports from `App.tsx`
- [ ] Clean up CSS
- [ ] Run `npm run type-check` (zero errors)
- [ ] Integration testing (all workflows)

**Validation:**
- ✅ TypeScript compiles with zero errors
- ✅ App runs without console errors
- ✅ All workflows complete

---

### Day 8: Manual Testing
- [ ] Execute full checklist (Sprint 9 plan):
  - [ ] Sidebar collapse/expand
  - [ ] File status indicator states
  - [ ] Table of Contents navigation
  - [ ] User account display and logout
  - [ ] No file dialog
  - [ ] Create new file workflow
  - [ ] Mobile responsiveness
  - [ ] Dark mode

**Validation:**
- ✅ All checklist items pass
- ✅ No UI glitches

---

### Day 9: Bug Fixes & Edge Cases
- [ ] Test edge cases:
  - [ ] Very long filenames (truncation)
  - [ ] Very long TOC (scrollable)
  - [ ] Network offline (offline status)
  - [ ] Save errors (error icon)
  - [ ] No headings (TOC hidden)
  - [ ] Large documents (1000+ lines)

- [ ] Fix discovered bugs
- [ ] Performance testing

**Validation:**
- ✅ All edge cases handled
- ✅ No performance issues

---

### Day 10: Documentation & PR
- [ ] Update component documentation (JSDoc)
- [ ] Create before/after screenshots
- [ ] Write PR description
- [ ] Code review
- [ ] Merge to main

**Validation:**
- ✅ All docs updated
- ✅ Screenshots in PR
- ✅ PR approved

---

## 🔄 Data Flow (Quick Reference)

### Auto-save Flow
```
User types → setText() → useDriveSync watches → 3s debounce
  → setSyncStatus('saving') → FileStatusIndicator shows 🔄
  → Drive API PATCH → setSyncStatus('synced') → Shows 📄
```

### File Open Flow
```
Click "Open" → DriveFilePicker → Select file → loadFile(fileId)
  → Drive API GET → setFileId/setTitle/setText
  → Editor renders content
```

### Create New Flow
```
Click "Create New" → SaveAsDialog → Enter filename + Choose folder
  → createDriveFile() → Drive API POST
  → setFileId(newId) → Editor opens empty file
```

---

## 🎣 Hook Dependencies

| Component | Hooks Used | Data Consumed | Actions Called |
|-----------|-----------|---------------|----------------|
| AppSidebar | `useSidebar` | state, open | toggleSidebar() |
| FileStatusIndicator | `useDriveSync` | syncStatus | - |
| TableOfContentsNav | (editor prop) | editor.state.doc | setTextSelection() |
| UserAccountInfo | `useAuth` | user, isAuth | logout() |

---

## ✅ Validation Checklist (Before PR)

**Code Quality:**
- [ ] `npm run type-check` → Zero errors
- [ ] `npm run lint` → Zero errors
- [ ] `npm run test` → All pass
- [ ] `npm run build` → Succeeds

**Functionality:**
- [ ] Sidebar collapses/expands with `Cmd+B`
- [ ] File status icon correct (doc, sync, alert, yellow dot)
- [ ] TOC updates when headings added/removed
- [ ] TOC hidden when no headings
- [ ] User info shows avatar + name + email
- [ ] Logout flow works
- [ ] No file dialog appears when `fileId === null`
- [ ] "Open File" triggers file picker
- [ ] "Create New" shows SaveAsDialog

**Performance:**
- [ ] Sidebar animations < 200ms
- [ ] Large docs scroll smoothly
- [ ] TOC updates < 100ms

**Mobile:**
- [ ] Hamburger menu works
- [ ] Sidebar overlay on tap
- [ ] All features accessible

**Accessibility:**
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Screen reader labels present

---

## 🚨 Common Pitfalls & Solutions

### Pitfall 1: Forgetting to install shadcn sidebar
**Symptom:** `Cannot find module '@/components/ui/sidebar'`
**Solution:**
```bash
cd ritemark-app
pnpm dlx shadcn@latest add sidebar
```

---

### Pitfall 2: TypeScript errors after deleting old components
**Symptom:** `Cannot find module './components/FileMenu'`
**Solution:** Remove all imports and JSX usage from `App.tsx` before deleting files.

---

### Pitfall 3: Status icon not updating
**Symptom:** Icon stays as 📄 even when saving
**Solution:** Ensure `useDriveSync` hook is watching `text` prop:
```typescript
const { syncStatus } = useDriveSync(fileId, title, text)
// Must pass 'text' so hook detects changes
```

---

### Pitfall 4: TOC not hiding when no headings
**Symptom:** TOC always shows, even for empty docs
**Solution:** Add conditional rendering:
```typescript
if (headings.length === 0) {
  return null // Invisible interface!
}
```

---

### Pitfall 5: Sidebar state not persisting
**Symptom:** Sidebar resets to collapsed on page reload
**Solution:** shadcn handles this automatically via cookies. If broken, check `SidebarProvider` wraps entire app.

---

## 📊 Success Metrics (Post-Deployment)

**Measure after 1 week in production:**

| Metric | Target | Measurement |
|--------|--------|-------------|
| Zero UI regressions | 100% | User feedback |
| Sidebar usage | > 50% users expand | Analytics |
| Time to save | < 3.5s average | Telemetry |
| Error rate | < 1% of saves | Error logs |
| Mobile usage | > 20% users | Device detection |
| Lighthouse score | > 90 | Lighthouse audit |

---

## 🆘 Need Help?

**Architecture Documents:**
- Full architecture: `/docs/architecture/sprint-09-sidebar-architecture.md`
- Component diagrams: `/docs/architecture/sprint-09-component-diagram.txt`
- Sprint plan: `/docs/sprints/sprint-09-ux-consolidation.md`

**shadcn Documentation:**
- Main docs: https://ui.shadcn.com/docs/components/sidebar
- Icon mode example: https://ui.shadcn.com/view/sidebar-07

**Existing Code to Reference:**
- Current TOC logic: `src/components/TableOfContents.tsx`
- Current save status: `src/components/drive/SaveStatus.tsx`
- Current file operations: `src/hooks/useDriveSync.ts`

---

**Good luck with implementation! 🚀**

Remember: **Collapsed by default, maximum content space, single UI location.**
