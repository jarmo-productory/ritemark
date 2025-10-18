# Sprint 9: Sidebar Consolidation - Component Architecture Design

**Version:** 1.0.0
**Date:** October 6, 2025
**Status:** Ready for Implementation
**Designer:** System Architecture Designer Agent

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Component Hierarchy Diagram](#component-hierarchy-diagram)
3. [State Flow Diagram](#state-flow-diagram)
4. [File Structure](#file-structure)
5. [Component Specifications](#component-specifications)
6. [Hook Dependencies](#hook-dependencies)
7. [Migration Strategy](#migration-strategy)
8. [Data Flow Architecture](#data-flow-architecture)
9. [Quality Attributes & Non-Functional Requirements](#quality-attributes--non-functional-requirements)
10. [Architecture Decision Records (ADRs)](#architecture-decision-records-adrs)
11. [Technology Evaluation](#technology-evaluation)
12. [Risk Analysis & Mitigation](#risk-analysis--mitigation)

---

## Executive Summary

### Current State Analysis

**Problem:** UI scattered across 4 locations violating "invisible interface" principle:
- Upper right corner: `FileMenu.tsx` (file operations)
- Upper left corner: `SaveStatus.tsx` (save alerts)
- Bottom right corner: `AuthStatus.tsx` (user badge)
- Right side/overlay: `TableOfContents.tsx` (navigation)

**User Impact:**
- Eyes jump between 4 different screen locations
- Visual clutter breaks writing flow
- Inconsistent with "invisible interface" philosophy
- No clear "home" for controls

### Proposed Solution

**Single shadcn left sidebar** consolidating all UI:
- Collapsed by default (icon mode) - maximum content space
- Header: File status indicator with filename
- Content: Table of Contents (when headings exist)
- Footer: User account information
- Keyboard shortcut: `Cmd+B` / `Ctrl+B` to toggle
- Mobile: Hamburger menu with overlay

**Benefits:**
- ✅ Predictable single location for all controls
- ✅ Maximum space for writing (sidebar collapsed)
- ✅ Professional, clean interface (Notion, Linear, Vercel pattern)
- ✅ Consistent with Johnny Ive design philosophy

---

## Component Hierarchy Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           App.tsx (Root)                                │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                      AuthProvider                                 │ │
│  │  ┌─────────────────────────────────────────────────────────────┐ │ │
│  │  │                  SidebarProvider                            │ │ │
│  │  │  ┌───────────────────────────┐  ┌─────────────────────────┐ │ │ │
│  │  │  │   Sidebar (collapsible)   │  │   main (content area)   │ │ │ │
│  │  │  │   side="left"             │  │                         │ │ │ │
│  │  │  │   collapsible="icon"      │  │  ┌──────────────────┐   │ │ │ │
│  │  │  │                           │  │  │ NoFileDialog     │   │ │ │ │
│  │  │  │  ┌─────────────────────┐  │  │  │ (conditional)    │   │ │ │ │
│  │  │  │  │  SidebarHeader      │  │  │  │                  │   │ │ │ │
│  │  │  │  │  ┌───────────────┐  │  │  │  │ ┌──────────────┐ │   │ │ │ │
│  │  │  │  │  │ FileStatus    │  │  │  │  │ │ OpenButton   │ │   │ │ │ │
│  │  │  │  │  │ Indicator     │  │  │  │  │ │   ↓          │ │   │ │ │ │
│  │  │  │  │  │               │  │  │  │  │ │ DriveFile    │ │   │ │ │ │
│  │  │  │  │  │ - StatusIcon  │  │  │  │  │ │ Picker       │ │   │ │ │ │
│  │  │  │  │  │   (doc/sync/  │  │  │  │  │ │              │ │   │ │ │ │
│  │  │  │  │  │    alert)     │  │  │  │  │ │ CreateNew    │ │   │ │ │ │
│  │  │  │  │  │ - Filename    │  │  │  │  │ │ Button       │ │   │ │ │ │
│  │  │  │  │  │   (truncated) │  │  │  │  │ │   ↓          │ │   │ │ │ │
│  │  │  │  │  └───────────────┘  │  │  │  │ │ SaveAsDialog │ │   │ │ │ │
│  │  │  │  └─────────────────────┘  │  │  └──────────────────┘   │ │ │ │
│  │  │  │                           │  │                         │ │ │ │
│  │  │  │  ┌─────────────────────┐  │  │  ┌──────────────────┐   │ │ │ │
│  │  │  │  │  SidebarContent     │  │  │  │ Editor           │   │ │ │ │
│  │  │  │  │  ┌───────────────┐  │  │  │  │ (conditional)    │   │ │ │ │
│  │  │  │  │  │ SidebarGroup  │  │  │  │  │                  │   │ │ │ │
│  │  │  │  │  │ ┌───────────┐ │  │  │  │  │ - TipTap WYSIWYG │   │ │ │ │
│  │  │  │  │  │ │ TableOf   │ │  │  │  │  │ - Pure content   │   │ │ │ │
│  │  │  │  │  │ │ Contents  │ │  │  │  │  │ - No UI chrome   │   │ │ │ │
│  │  │  │  │  │ │ Nav       │ │  │  │  │  │                  │   │ │ │ │
│  │  │  │  │  │ │           │ │  │  │  │  └──────────────────┘   │ │ │ │
│  │  │  │  │  │ │ TOCItems  │ │  │  │  └─────────────────────────┘ │ │ │
│  │  │  │  │  │ │ (if hdgs) │ │  │  └─────────────────────────────┘ │ │
│  │  │  │  │  │ └───────────┘ │  │                                  │ │
│  │  │  │  │  └───────────────┘  │                                  │ │
│  │  │  │  └─────────────────────┘                                  │ │
│  │  │  │                                                            │ │
│  │  │  │  ┌─────────────────────┐                                  │ │
│  │  │  │  │  SidebarFooter      │                                  │ │
│  │  │  │  │  ┌───────────────┐  │                                  │ │
│  │  │  │  │  │ UserAccount   │  │                                  │ │
│  │  │  │  │  │ Info          │  │                                  │ │
│  │  │  │  │  │               │  │                                  │ │
│  │  │  │  │  │ - Avatar      │  │                                  │ │
│  │  │  │  │  │ - UserName    │  │                                  │ │
│  │  │  │  │  │ - UserEmail   │  │                                  │ │
│  │  │  │  │  │ - Click →     │  │                                  │ │
│  │  │  │  │  │   AuthModal   │  │                                  │ │
│  │  │  │  │  └───────────────┘  │                                  │ │
│  │  │  │  └─────────────────────┘                                  │ │
│  │  │  └───────────────────────────┘                                │ │
│  │  └─────────────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### Collapsed State (Icon Mode)

```
┌─┬─────────────────────────────────────┐
│ │                                     │
│📄│          Pure Content Area          │
│ │                                     │
│📑│     (Editor with no UI chrome)     │
│ │                                     │
│👤│                                     │
└─┴─────────────────────────────────────┘
  ^
  48-64px thin vertical bar

Icons shown (top to bottom):
- 📄 File status (doc/sync/alert/yellow dot)
- 📑 TOC (only if headings exist)
- 👤 User avatar
```

### Expanded State

```
┌──────────────┬──────────────────────────┐
│              │                          │
│ 📄 File.md   │   Pure Content Area      │
│              │                          │
│ Contents     │ (Editor with no UI)      │
│  - Heading 1 │                          │
│  - Heading 2 │                          │
│              │                          │
│ 👤 User Name │                          │
│   user@email │                          │
└──────────────┴──────────────────────────┘
    ^
    240-280px sidebar width
```

---

## State Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         State Management Layer                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Global Contexts                          │   │
│  │                                                             │   │
│  │  ┌──────────────────┐      ┌──────────────────┐            │   │
│  │  │   AuthContext    │      │ SidebarProvider  │            │   │
│  │  │                  │      │                  │            │   │
│  │  │  - user          │      │  - state         │            │   │
│  │  │  - isAuth        │      │    (collapsed/   │            │   │
│  │  │  - login()       │      │     expanded)    │            │   │
│  │  │  - logout()      │      │  - open          │            │   │
│  │  └──────────────────┘      │  - setOpen       │            │   │
│  │         ↓                  │  - toggleSidebar │            │   │
│  │         ↓                  └──────────────────┘            │   │
│  │         ↓                           ↓                      │   │
│  └─────────│───────────────────────────│──────────────────────┘   │
│            │                           │                          │
│            ↓                           ↓                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      Custom Hooks                           │   │
│  │                                                             │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │   │
│  │  │ useDriveSync │  │useDriveFiles │  │    useAuth       │  │   │
│  │  │              │  │              │  │                  │  │   │
│  │  │ - syncStatus │  │ - files[]    │  │ - user           │  │   │
│  │  │ - loadFile() │  │ - isLoading  │  │ - isAuth         │  │   │
│  │  │ - forceSave()│  │ - error      │  │ - login()        │  │   │
│  │  └──────────────┘  │ - refresh()  │  │ - logout()       │  │   │
│  │         ↓          └──────────────┘  └──────────────────┘  │   │
│  │         ↓                  ↓                  ↓            │   │
│  └─────────│──────────────────│──────────────────│────────────┘   │
│            │                  │                  │                │
└────────────│──────────────────│──────────────────│────────────────┘
             │                  │                  │
             ↓                  ↓                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         Component Layer                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    AppSidebar                               │   │
│  │  ┌─────────────────────────────────────────────────────┐    │   │
│  │  │         FileStatusIndicator                         │    │   │
│  │  │                                                     │    │   │
│  │  │  Input: syncStatus (from useDriveSync)             │    │   │
│  │  │  State: statusIcon, filename                       │    │   │
│  │  │                                                     │    │   │
│  │  │  Logic:                                            │    │   │
│  │  │  ┌──────────────────────────────────────────────┐  │    │   │
│  │  │  │ if syncStatus === 'saving'                   │  │    │   │
│  │  │  │   → Show 🔄 Sync icon (animated)             │  │    │   │
│  │  │  │                                              │  │    │   │
│  │  │  │ if syncStatus === 'synced'                   │  │    │   │
│  │  │  │   → Show 📄 Document icon                    │  │    │   │
│  │  │  │                                              │  │    │   │
│  │  │  │ if syncStatus === 'error'                    │  │    │   │
│  │  │  │   → Show 🔴 Alert icon                       │  │    │   │
│  │  │  │                                              │  │    │   │
│  │  │  │ if hasUnsavedChanges                         │  │    │   │
│  │  │  │   → Add 🟡 yellow dot badge                  │  │    │   │
│  │  │  └──────────────────────────────────────────────┘  │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  │                                                          │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │         TableOfContentsNav                      │    │   │
│  │  │                                                 │    │   │
│  │  │  Input: editor (TipTap instance)               │    │   │
│  │  │  State: headings[], activeId                   │    │   │
│  │  │                                                 │    │   │
│  │  │  Logic:                                        │    │   │
│  │  │  ┌──────────────────────────────────────────┐  │    │   │
│  │  │  │ Extract headings from ProseMirror doc   │  │    │   │
│  │  │  │   → editor.state.doc.descendants()      │  │    │   │
│  │  │  │                                          │  │    │   │
│  │  │  │ Track active heading on scroll          │  │    │   │
│  │  │  │   → window.scrollY + coordsAtPos()      │  │    │   │
│  │  │  │                                          │  │    │   │
│  │  │  │ Click heading → scrollToHeading()       │  │    │   │
│  │  │  │   → editor.chain().setTextSelection()   │  │    │   │
│  │  │  │                                          │  │    │   │
│  │  │  │ if headings.length === 0                │  │    │   │
│  │  │  │   → Return null (invisible interface)   │  │    │   │
│  │  │  └──────────────────────────────────────────┘  │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  │                                                          │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │         UserAccountInfo                         │    │   │
│  │  │                                                 │    │   │
│  │  │  Input: user (from useAuth)                    │    │   │
│  │  │  State: showLogoutDialog                       │    │   │
│  │  │                                                 │    │   │
│  │  │  Logic:                                        │    │   │
│  │  │  ┌──────────────────────────────────────────┐  │    │   │
│  │  │  │ Display user.picture / Avatar            │  │    │   │
│  │  │  │ Display user.name                        │  │    │   │
│  │  │  │ Display user.email                       │  │    │   │
│  │  │  │                                          │  │    │   │
│  │  │  │ onClick → Open AuthModal (logout)        │  │    │   │
│  │  │  │                                          │  │    │   │
│  │  │  │ if !isAuthenticated                      │  │    │   │
│  │  │  │   → Return null                          │  │    │   │
│  │  │  └──────────────────────────────────────────┘  │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                Main Content Area                        │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │         NoFileDialog                            │    │   │
│  │  │                                                 │    │   │
│  │  │  Input: currentFileId (from App state)         │    │   │
│  │  │  Render: if !currentFileId                     │    │   │
│  │  │                                                 │    │   │
│  │  │  Actions:                                      │    │   │
│  │  │  ┌──────────────────────────────────────────┐  │    │   │
│  │  │  │ OpenButton                               │  │    │   │
│  │  │  │   → setShowFilePicker(true)              │  │    │   │
│  │  │  │   → DriveFilePicker modal appears        │  │    │   │
│  │  │  │                                          │  │    │   │
│  │  │  │ CreateNewButton                          │  │    │   │
│  │  │  │   → setShowSaveAsDialog(true)            │  │    │   │
│  │  │  │   → User chooses filename + location     │  │    │   │
│  │  │  │   → Create empty markdown in Drive       │  │    │   │
│  │  │  │   → setCurrentFileId(newFileId)          │  │    │   │
│  │  │  └──────────────────────────────────────────┘  │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  │                                                          │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │         Editor (TipTap)                         │    │   │
│  │  │                                                 │    │   │
│  │  │  Input: text, onChange                         │    │   │
│  │  │  Render: if currentFileId                      │    │   │
│  │  │                                                 │    │   │
│  │  │  onChange triggers:                            │    │   │
│  │  │  ┌──────────────────────────────────────────┐  │    │   │
│  │  │  │ setText(newContent)                      │  │    │   │
│  │  │  │   ↓                                      │  │    │   │
│  │  │  │ useDriveSync watches 'text' prop         │  │    │   │
│  │  │  │   ↓                                      │  │    │   │
│  │  │  │ autoSaveManager.scheduleSave()           │  │    │   │
│  │  │  │   ↓                                      │  │    │   │
│  │  │  │ 3s debounce                              │  │    │   │
│  │  │  │   ↓                                      │  │    │   │
│  │  │  │ updateDriveFile() or createDriveFile()  │  │    │   │
│  │  │  │   ↓                                      │  │    │   │
│  │  │  │ setSyncStatus('synced')                  │  │    │   │
│  │  │  └──────────────────────────────────────────┘  │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### State Update Flow (Auto-save)

```
User types → setText() → useDriveSync effect → scheduleSave()
                                                      ↓
                                               3s debounce timer
                                                      ↓
                                            setSyncStatus('saving')
                                                      ↓
                                         FileStatusIndicator shows 🔄
                                                      ↓
                                            Drive API call (PATCH)
                                                      ↓
                                            setSyncStatus('synced')
                                                      ↓
                                         FileStatusIndicator shows 📄
```

### State Update Flow (File Open)

```
User clicks "Open" → DriveFilePicker → Select file → handleFileSelect()
                                                              ↓
                                                      loadFile(fileId)
                                                              ↓
                                                  setSyncStatus('saving')
                                                              ↓
                                                      Drive API GET
                                                              ↓
                                                  setFileId(file.id)
                                                  setTitle(file.name)
                                                  setText(content)
                                                              ↓
                                                  setSyncStatus('synced')
                                                              ↓
                                                      Editor renders content
```

---

## File Structure

### New Components to Create

```
ritemark-app/
└── src/
    └── components/
        ├── sidebar/
        │   ├── AppSidebar.tsx                 # Main sidebar wrapper
        │   ├── FileStatusIndicator.tsx        # Status icon + filename
        │   ├── TableOfContentsNav.tsx         # Migrated TOC functionality
        │   └── UserAccountInfo.tsx            # User display + logout
        │
        └── dialogs/
            ├── NoFileDialog.tsx               # Center dialog (Open/Create New)
            └── SaveAsDialog.tsx               # Filename + folder picker
```

### Components to Remove (Delete)

```
ritemark-app/
└── src/
    └── components/
        ├── FileMenu.tsx                       # ❌ DELETE (replaced by NoFileDialog + sidebar)
        ├── auth/
        │   └── AuthStatus.tsx                 # ❌ DELETE (replaced by UserAccountInfo)
        ├── drive/
        │   └── SaveStatus.tsx                 # ❌ DELETE (replaced by FileStatusIndicator)
        └── TableOfContents.tsx                # ❌ DELETE (replaced by TableOfContentsNav)
```

### Files to Update

```
ritemark-app/
└── src/
    ├── App.tsx                                # ✏️ UPDATE (integrate SidebarProvider + AppSidebar)
    ├── App.css                                # ✏️ UPDATE (remove old component styles)
    └── index.css                              # ✏️ UPDATE (add shadcn sidebar CSS variables)
```

### shadcn/ui Installation Required

```bash
# Install shadcn sidebar component (run this first)
cd ritemark-app
pnpm dlx shadcn@latest add sidebar
```

This will create:
```
ritemark-app/
└── src/
    └── components/
        └── ui/
            └── sidebar.tsx                    # Shadcn sidebar primitives
```

---

## Component Specifications

### 1. AppSidebar.tsx

**Purpose:** Main sidebar wrapper integrating shadcn primitives with app-specific components.

**Interface:**
```typescript
interface AppSidebarProps {
  editor?: TipTapEditor | null  // TipTap editor instance for TOC
  fileId: string | null          // Current file ID
  fileName?: string              // Current file name for display
}

export function AppSidebar({ editor, fileId, fileName }: AppSidebarProps) {
  // Implementation
}
```

**Dependencies:**
- `@/components/ui/sidebar` (shadcn primitives)
- `FileStatusIndicator` (header)
- `TableOfContentsNav` (content)
- `UserAccountInfo` (footer)
- `useSidebar` hook (from shadcn)

**Structure:**
```tsx
<Sidebar collapsible="icon" side="left">
  <SidebarHeader>
    <FileStatusIndicator fileId={fileId} fileName={fileName} />
  </SidebarHeader>

  <SidebarContent>
    <SidebarGroup>
      <TableOfContentsNav editor={editor} />
    </SidebarGroup>
  </SidebarContent>

  <SidebarFooter>
    <UserAccountInfo />
  </SidebarFooter>
</Sidebar>
```

**Key Features:**
- Collapsible icon mode by default
- Persistent state via cookies (shadcn built-in)
- Keyboard shortcut `Cmd+B` / `Ctrl+B` (shadcn built-in)
- Mobile responsive (hamburger menu on <768px)

---

### 2. FileStatusIndicator.tsx

**Purpose:** Display file save status with icon and filename.

**Interface:**
```typescript
interface FileStatusIndicatorProps {
  fileId: string | null
  fileName?: string
  className?: string
}

export function FileStatusIndicator({
  fileId,
  fileName = 'Untitled Document',
  className,
}: FileStatusIndicatorProps) {
  // Implementation
}
```

**Dependencies:**
- `useDriveSync` hook (for syncStatus)
- `useSidebar` hook (for collapsed state)
- Lucide icons: `FileText`, `Loader2`, `AlertCircle`, `CloudOff`

**Status Icon States:**

| Status | Icon | Color | Meaning |
|--------|------|-------|---------|
| `synced` | 📄 `FileText` | Default foreground | All changes saved |
| `saving` | 🔄 `Loader2` (animated) | Blue (`#3b82f6`) | Currently saving to Drive |
| `error` | 🔴 `AlertCircle` | Red (`#dc2626`) | Save failed |
| `offline` | ☁️❌ `CloudOff` | Gray (`#6b7280`) | No network connection |

**Yellow Dot Badge:**
- Shows when `hasUnsavedChanges === true`
- Appears immediately when user types (before 3s debounce)
- Positioned as badge on top-right of status icon
- Color: `#fbbf24` (yellow-400)

**Filename Display:**
- Truncated with CSS `text-overflow: ellipsis`
- Hidden when sidebar collapsed (icon mode)
- Read-only in Sprint 9 (no inline editing)
- Max width: sidebar width minus icon and padding

**Implementation Notes:**
```tsx
const { syncStatus } = useDriveSync(fileId, fileName, text)
const { state } = useSidebar() // 'collapsed' | 'expanded'

// Determine icon based on syncStatus.status
const statusIcon = useMemo(() => {
  switch (syncStatus.status) {
    case 'saving': return <Loader2 className="animate-spin" />
    case 'error': return <AlertCircle />
    case 'offline': return <CloudOff />
    default: return <FileText />
  }
}, [syncStatus.status])

// Show yellow dot if unsaved changes detected
const hasUnsavedChanges = syncStatus.status !== 'synced'
```

---

### 3. TableOfContentsNav.tsx

**Purpose:** Navigate document headings (migrated from TableOfContents.tsx).

**Interface:**
```typescript
interface TableOfContentsNavProps {
  editor?: TipTapEditor | null
}

export function TableOfContentsNav({ editor }: TableOfContentsNavProps) {
  // Implementation
}
```

**Dependencies:**
- `@tiptap/react` (TipTapEditor type)
- `useSidebar` hook (for collapsed state)
- Lucide icon: `List` (for collapsed mode)

**Migration from TableOfContents.tsx:**

**Keep:**
- ✅ Heading extraction from ProseMirror doc (`editor.state.doc.descendants()`)
- ✅ Active heading detection (topmost visible + look north algorithm)
- ✅ ProseMirror-based scroll navigation (`coordsAtPos()`)
- ✅ Unique ID generation with slugify
- ✅ Click to scroll with `setTextSelection()`

**Change:**
- ❌ Remove right-side/overlay positioning → Use sidebar width
- ❌ Remove custom TOC container styles → Use shadcn `SidebarMenu`
- ✅ Add conditional rendering: `if (headings.length === 0) return null`
- ✅ Add collapsed mode icon (📑 `List` icon in thin vertical bar)

**Collapsed Mode Behavior:**
- Show small `List` icon in thin vertical bar (only if headings exist)
- Click icon → Expands sidebar to show full TOC
- If no headings → No icon shown (invisible interface)

**Structure:**
```tsx
if (headings.length === 0) {
  return null // Invisible interface
}

return (
  <SidebarMenu>
    {headings.map((heading) => (
      <SidebarMenuItem key={heading.id}>
        <SidebarMenuButton
          onClick={() => scrollToHeading(heading)}
          isActive={activeId === heading.id}
          className={`toc-level-${heading.level}`}
        >
          {heading.textContent}
        </SidebarMenuButton>
      </SidebarMenuItem>
    ))}
  </SidebarMenu>
)
```

---

### 4. UserAccountInfo.tsx

**Purpose:** Display user account with avatar, name, email, and logout action.

**Interface:**
```typescript
interface UserAccountInfoProps {
  className?: string
}

export function UserAccountInfo({ className }: UserAccountInfoProps) {
  // Implementation
}
```

**Dependencies:**
- `useAuth` hook (for user, isAuthenticated, logout)
- `useSidebar` hook (for collapsed state)
- `AuthModal` component (for logout confirmation)
- Lucide icons: `User`, `CheckCircle`

**Display Logic:**
```typescript
const { user, isAuthenticated, logout } = useAuth()
const { state } = useSidebar()

if (!isAuthenticated || !user) {
  return null
}

// Expanded state: Show full info
if (state === 'expanded') {
  return (
    <div onClick={() => setShowLogoutDialog(true)}>
      <img src={user.picture} alt={user.name} />
      <div>
        <div>{user.name} <CheckCircle /></div>
        <div>{user.email}</div>
      </div>
    </div>
  )
}

// Collapsed state: Show only avatar
return (
  <img src={user.picture} alt={user.name} onClick={() => setShowLogoutDialog(true)} />
)
```

**Logout Flow:**
- Click anywhere on user info → Open `AuthModal` with logout confirmation
- Reuse existing `AuthModal` component (no new modal needed)
- After logout → Redirect to signed-out state

---

### 5. NoFileDialog.tsx

**Purpose:** Center dialog when no file is open (Open vs Create New).

**Interface:**
```typescript
interface NoFileDialogProps {
  onOpenFile: () => void      // Opens DriveFilePicker
  onCreateNew: () => void     // Opens SaveAsDialog
}

export function NoFileDialog({ onOpenFile, onCreateNew }: NoFileDialogProps) {
  // Implementation
}
```

**Dependencies:**
- shadcn `Dialog` component (if available) or custom centered div
- Lucide icons: `FolderOpen`, `FileText`

**Layout:**
```
┌─────────────────────────────────┐
│                                 │
│       Welcome to RiteMark       │
│                                 │
│   ┌───────────┐  ┌───────────┐ │
│   │ 📂 Open   │  │📄Create   │ │
│   │   File    │  │  New      │ │
│   └───────────┘  └───────────┘ │
│                                 │
└─────────────────────────────────┘
```

**Positioning:**
- Centered vertically and horizontally
- Appears only when `currentFileId === null`
- Replaces current "empty editor with FileMenu button" UX

**Button Actions:**
- "Open File" → Calls `onOpenFile()` → Parent shows `DriveFilePicker`
- "Create New" → Calls `onCreateNew()` → Parent shows `SaveAsDialog`

---

### 6. SaveAsDialog.tsx

**Purpose:** Let user choose filename and Drive folder location for new file.

**Interface:**
```typescript
interface SaveAsDialogProps {
  onSave: (fileName: string, folderId?: string) => Promise<void>
  onCancel: () => void
  isOpen: boolean
}

export function SaveAsDialog({ onSave, onCancel, isOpen }: SaveAsDialogProps) {
  // Implementation
}
```

**Dependencies:**
- shadcn `Dialog`, `Input`, `Button` components
- Google Drive Picker API (for folder selection)
- `useDriveFiles` hook (for folder listing, if custom picker)

**Form Fields:**
1. **Filename Input**
   - Placeholder: "Enter filename"
   - Validation: Non-empty, max 255 chars
   - Auto-appends `.md` extension

2. **Folder Picker**
   - Default: "My Drive" (root folder)
   - Button: "Choose folder..." → Opens Google Drive Picker
   - Shows selected folder name after selection

**Flow:**
```
User clicks "Create New" → SaveAsDialog opens
  ↓
User enters filename: "My Document"
  ↓
User clicks "Choose folder..." → Google Drive Picker opens
  ↓
User selects folder → Folder name displayed
  ↓
User clicks "Create" → onSave("My Document.md", selectedFolderId)
  ↓
Parent creates empty markdown file in Drive
  ↓
Parent calls setFileId(newFileId) → Editor opens
```

---

## Hook Dependencies

### Component → Hook Mapping

| Component | Hooks Used | Data Consumed | Actions Called |
|-----------|-----------|---------------|----------------|
| **AppSidebar** | `useSidebar` | `state`, `open`, `isMobile` | `toggleSidebar()`, `setOpen()` |
| **FileStatusIndicator** | `useDriveSync` | `syncStatus` | - |
| **TableOfContentsNav** | (none - receives editor prop) | `editor.state.doc` (ProseMirror) | `editor.chain().setTextSelection()` |
| **UserAccountInfo** | `useAuth` | `user`, `isAuthenticated` | `logout()` (via AuthModal) |
| **NoFileDialog** | (none - pure UI) | - | Calls parent callbacks |
| **SaveAsDialog** | `useDriveFiles` (optional) | `files` (for folder picker) | `createDriveFile()` (via parent) |

### Hook Data Flow

```
┌────────────────────────────────────────────────────────────────┐
│                         App.tsx                                │
│                                                                │
│  const { syncStatus, loadFile, forceSave } =                  │
│    useDriveSync(fileId, title, text)                          │
│                                                                │
│  const { user, isAuthenticated, logout } = useAuth()          │
│                                                                │
│  const { files, fetchFiles, searchFiles } = useDriveFiles()   │
│  (optional - only if custom file picker)                      │
│                                                                │
│  Pass down as props:                                          │
│    - syncStatus → FileStatusIndicator                         │
│    - user → UserAccountInfo                                   │
│    - editor → TableOfContentsNav                              │
│    - fileId → AppSidebar, FileStatusIndicator                 │
└────────────────────────────────────────────────────────────────┘
```

### Hook Responsibilities

**useDriveSync:**
- ✅ Auto-save debounce (3s)
- ✅ Track sync status (saving, synced, error, offline)
- ✅ Load file from Drive
- ✅ Force save on visibility change

**useDriveFiles:**
- ✅ List files from Drive
- ✅ Search files by name
- ✅ Pagination (loadMore)
- ✅ Refresh file list

**useAuth:**
- ✅ User authentication state
- ✅ Login/logout actions
- ✅ Token management (via tokenManager)

**useSidebar (shadcn):**
- ✅ Sidebar collapsed/expanded state
- ✅ Mobile sidebar state
- ✅ Toggle functions
- ✅ Persistent state via cookies

---

## Migration Strategy

### Phase-by-Phase Execution Plan

#### Phase 1: Preparation (Day 1-2)

**Tasks:**
1. Install shadcn sidebar component
   ```bash
   cd ritemark-app
   pnpm dlx shadcn@latest add sidebar
   ```

2. Create file structure
   ```bash
   mkdir -p src/components/sidebar
   mkdir -p src/components/dialogs
   touch src/components/sidebar/{AppSidebar,FileStatusIndicator,TableOfContentsNav,UserAccountInfo}.tsx
   touch src/components/dialogs/{NoFileDialog,SaveAsDialog}.tsx
   ```

3. Review shadcn documentation
   - https://ui.shadcn.com/docs/components/sidebar
   - https://ui.shadcn.com/view/sidebar-07 (icon mode example)

4. Create skeleton components (no logic, just structure)

**Validation:**
- ✅ shadcn sidebar primitives installed
- ✅ All 6 new component files created
- ✅ Team reviewed shadcn sidebar docs

---

#### Phase 2: Build New Components (Day 3-5)

**Day 3: Core Sidebar Structure**

1. **AppSidebar.tsx** (2-3 hours)
   - Import shadcn primitives
   - Set up basic structure (header, content, footer)
   - Configure `collapsible="icon"`, `side="left"`
   - Test collapse/expand behavior

2. **FileStatusIndicator.tsx** (2-3 hours)
   - Import `useDriveSync` hook
   - Implement status icon logic (doc/sync/alert/offline)
   - Add yellow dot badge for unsaved changes
   - Add filename display with ellipsis truncation
   - Test with different sync states

**Validation:**
- ✅ Sidebar collapses/expands with `Cmd+B`
- ✅ Status icon changes based on `syncStatus.status`
- ✅ Yellow dot appears when typing (before save)
- ✅ Filename truncates correctly in narrow sidebar

---

**Day 4: Navigation & User Info**

1. **TableOfContentsNav.tsx** (3-4 hours)
   - Copy logic from `TableOfContents.tsx`
   - Replace custom TOC styles with shadcn `SidebarMenu`
   - Add conditional rendering (`if headings.length === 0 return null`)
   - Test heading extraction and scroll navigation
   - Test collapsed mode (icon only)

2. **UserAccountInfo.tsx** (2-3 hours)
   - Import `useAuth` hook
   - Display avatar, name, email in expanded mode
   - Display only avatar in collapsed mode
   - Wire up click → `AuthModal` for logout
   - Test logout flow

**Validation:**
- ✅ TOC shows headings from editor
- ✅ Click heading scrolls to position
- ✅ Active heading highlights correctly
- ✅ TOC hidden when no headings
- ✅ User info shows avatar + name + email
- ✅ Click user info opens logout dialog

---

**Day 5: Dialogs & No-File State**

1. **NoFileDialog.tsx** (2 hours)
   - Create center-screen dialog layout
   - Add "Open File" and "Create New" buttons
   - Wire up callbacks to parent component
   - Test centered positioning

2. **SaveAsDialog.tsx** (3-4 hours)
   - Create dialog with filename input
   - Add folder picker button (Google Drive Picker API or custom)
   - Implement validation (non-empty filename)
   - Wire up `onSave` callback
   - Test file creation flow

**Validation:**
- ✅ NoFileDialog appears when `fileId === null`
- ✅ "Open File" button triggers file picker
- ✅ "Create New" button shows SaveAsDialog
- ✅ SaveAsDialog validates filename
- ✅ SaveAsDialog creates file in chosen folder

---

#### Phase 3: Wire Up State (Day 6-7)

**Day 6: Connect Hooks to Components**

1. Update `App.tsx` to use new sidebar
   ```tsx
   <SidebarProvider>
     <AppSidebar
       editor={editor}
       fileId={fileId}
       fileName={title}
     />
     <main>
       {!fileId && (
         <NoFileDialog
           onOpenFile={() => setShowFilePicker(true)}
           onCreateNew={() => setShowSaveAsDialog(true)}
         />
       )}
       {fileId && <Editor ... />}
     </main>
   </SidebarProvider>
   ```

2. Pass `syncStatus` to `FileStatusIndicator`
3. Pass `editor` to `TableOfContentsNav`
4. Pass `user` to `UserAccountInfo`

**Validation:**
- ✅ All props flow correctly from `App.tsx` to components
- ✅ Sidebar updates in real-time when sync status changes
- ✅ TOC updates when editor content changes
- ✅ User info updates after login

---

**Day 7: Integration Testing**

1. Test full file open flow
   - Click "Open File" → Select file → Editor loads content
   - Verify save status updates correctly

2. Test create new file flow
   - Click "Create New" → Enter filename → Choose folder → File created
   - Verify editor opens with empty content

3. Test auto-save flow
   - Type in editor → Yellow dot appears → Wait 3s → Status shows "Saved"

4. Test TOC navigation
   - Add headings → TOC appears → Click heading → Scroll to position

5. Test logout flow
   - Click user info → Logout dialog → Confirm logout → Redirect to signed-out state

**Validation:**
- ✅ All workflows complete without errors
- ✅ State updates propagate to all components
- ✅ No console errors

---

#### Phase 4: Remove Old Components (Day 7)

**Critical: Big Bang Replacement**

1. **Delete old component files:**
   ```bash
   rm src/components/FileMenu.tsx
   rm src/components/drive/SaveStatus.tsx
   rm src/components/auth/AuthStatus.tsx
   rm src/components/TableOfContents.tsx
   ```

2. **Remove references in App.tsx:**
   - Delete `import { FileMenu } from './components/FileMenu'`
   - Delete `import { SaveStatus } from './components/drive/SaveStatus'`
   - Delete `import { AuthStatus } from './components/auth/AuthStatus'`
   - Delete `import { TableOfContents } from './components/TableOfContents'`
   - Delete all JSX usage: `<FileMenu />`, `<SaveStatus />`, `<AuthStatus />`, `<TableOfContents />`

3. **Clean up CSS:**
   - Remove `.file-menu-container` styles from `App.css`
   - Remove `.save-status` styles
   - Remove `.auth-status-container` styles
   - Remove `.toc-sidebar` and `.toc-visible` styles

4. **Run TypeScript check:**
   ```bash
   npm run type-check
   ```

5. **Fix any broken imports/references**

**Validation:**
- ✅ All 4 old component files deleted
- ✅ No import errors in `App.tsx`
- ✅ TypeScript compiles with zero errors
- ✅ App runs without console errors

---

#### Phase 5: Testing & Polish (Day 8-9)

**Day 8: Manual Testing**

Execute full manual testing checklist from Sprint 9 plan:
- [ ] Sidebar collapse/expand functionality
- [ ] File status indicator states (doc, sync, alert, yellow dot)
- [ ] Table of Contents navigation
- [ ] User account display and logout
- [ ] No file dialog appearance
- [ ] Create new file workflow
- [ ] Mobile responsiveness
- [ ] Dark mode support

**Validation:**
- ✅ All checklist items pass
- ✅ No UI glitches or broken layouts
- ✅ Sidebar animations smooth

---

**Day 9: Bug Fixes & Edge Cases**

1. Test edge cases:
   - Very long filenames (truncation)
   - Very long TOC (scrollable)
   - Network offline (offline status)
   - Save errors (error icon)
   - No headings (TOC hidden)
   - No user (user info hidden)

2. Fix any bugs discovered

3. Performance testing:
   - Large documents (1000+ lines)
   - Many headings (100+ headings)
   - Rapid typing (debounce works)

**Validation:**
- ✅ All edge cases handled gracefully
- ✅ No performance degradation
- ✅ No memory leaks

---

#### Phase 6: Documentation & PR (Day 10)

1. Update component documentation
   - JSDoc comments for all new components
   - PropTypes/TypeScript interfaces documented

2. Create before/after screenshots
   - Screenshot: Old UI (4 locations)
   - Screenshot: New UI (single sidebar)
   - Screenshot: Collapsed mode
   - Screenshot: Mobile mode

3. Write PR description
   - Link to Sprint 9 plan
   - List components removed
   - List components added
   - Breaking changes (none expected)
   - Testing checklist

4. Code review
   - Request review from team
   - Address feedback
   - Merge to main

**Validation:**
- ✅ All documentation updated
- ✅ Screenshots included in PR
- ✅ PR approved and merged

---

### Rollback Plan (If Migration Fails)

**Critical: Git Safety**

Before Phase 4 (removal), create a safety checkpoint:
```bash
git checkout -b feature/sprint-09-checkpoint
git commit -am "Checkpoint before removing old components"
git push origin feature/sprint-09-checkpoint
```

**If things go wrong:**
```bash
git checkout feature/sprint-09-checkpoint
git checkout -b feature/sprint-09-rollback
# Fix issues
git commit -am "Fix: [issue description]"
```

---

## Data Flow Architecture

### File Save Flow (Auto-save with Status Updates)

```
┌─────────────────────────────────────────────────────────────────┐
│                       User Interaction                          │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ↓
              User types in Editor
                      │
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Editor Component                             │
│  onChange={(newText) => setText(newText)}                       │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│                    App.tsx State                                │
│  const [text, setText] = useState('')                           │
│  const { syncStatus } = useDriveSync(fileId, title, text)       │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│                  useDriveSync Hook                              │
│                                                                 │
│  useEffect(() => {                                              │
│    if (content && autoSaveManager.current) {                   │
│      autoSaveManager.scheduleSave(content)  ← Trigger          │
│    }                                                            │
│  }, [content])  ← Watches 'text' prop                          │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│               AutoSaveManager (3s debounce)                     │
│                                                                 │
│  scheduleSave(content) {                                        │
│    clearTimeout(this.debounceTimer)                            │
│    this.debounceTimer = setTimeout(() => {                     │
│      this.saveFunction(content)  ← Call after 3s              │
│    }, 3000)                                                     │
│  }                                                              │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ↓ (after 3s debounce)
┌─────────────────────────────────────────────────────────────────┐
│                   Save Function                                 │
│                                                                 │
│  setSyncStatus({ status: 'saving' })  ← Update status         │
│      ↓                                                          │
│  if (currentFileId) {                                           │
│    updateDriveFile(fileId, content, token)  ← PATCH API        │
│  } else {                                                       │
│    newFileId = createDriveFile(title, content, token) ← POST   │
│    onFileCreated(newFileId)                                     │
│  }                                                              │
│      ↓                                                          │
│  setSyncStatus({ status: 'synced', lastSaved: now })           │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│              FileStatusIndicator Component                      │
│                                                                 │
│  const { syncStatus } = useDriveSync(...)                       │
│                                                                 │
│  useEffect(() => {                                              │
│    switch (syncStatus.status) {                                │
│      case 'saving': setIcon(<Loader2 />)  ← Show spinner      │
│      case 'synced': setIcon(<FileText />) ← Show doc icon     │
│      case 'error': setIcon(<AlertCircle />) ← Show alert      │
│    }                                                            │
│  }, [syncStatus])                                               │
└─────────────────────────────────────────────────────────────────┘
```

### File Open Flow (Load from Drive)

```
┌─────────────────────────────────────────────────────────────────┐
│                   User Clicks "Open File"                       │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│                  NoFileDialog Component                         │
│  <button onClick={onOpenFile}>Open</button>                     │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│                    App.tsx Handler                              │
│  const handleOpenFile = () => {                                 │
│    setShowFilePicker(true)  ← Show file picker modal           │
│  }                                                              │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│             DriveFilePicker Component                           │
│  (Existing component - no changes)                              │
│                                                                 │
│  User selects file → onFileSelect(file)                         │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│              App.tsx handleFileSelect                           │
│                                                                 │
│  const handleFileSelect = async (file) => {                     │
│    const { metadata, content } = await loadFile(file.id)       │
│    setFileId(file.id)                                           │
│    setTitle(metadata.name.replace('.md', ''))                   │
│    setText(content)                                             │
│    setShowFilePicker(false)                                     │
│  }                                                              │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│                  useDriveSync.loadFile()                        │
│                                                                 │
│  setSyncStatus({ status: 'saving' })  ← Loading state         │
│      ↓                                                          │
│  GET /drive/v3/files/{fileId}?fields=...  ← Fetch metadata     │
│  GET /drive/v3/files/{fileId}?alt=media  ← Fetch content       │
│      ↓                                                          │
│  setSyncStatus({ status: 'synced', lastSaved: modifiedTime })  │
│  return { metadata, content }                                   │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│                 Editor Re-renders                               │
│  <Editor value={text} onChange={setText} />                     │
│                                                                 │
│  Displays loaded content                                        │
└─────────────────────────────────────────────────────────────────┘
```

### Create New File Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                User Clicks "Create New"                         │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│                NoFileDialog Component                           │
│  <button onClick={onCreateNew}>Create New</button>              │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│                  App.tsx Handler                                │
│  const handleCreateNew = () => {                                │
│    setShowSaveAsDialog(true)  ← Show SaveAs dialog             │
│  }                                                              │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│              SaveAsDialog Component                             │
│                                                                 │
│  User enters filename: "My Document"                            │
│  User clicks "Choose folder..." → Google Drive Picker           │
│  User selects folder → Shows folder name                        │
│  User clicks "Create" → onSave("My Document.md", folderId)     │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│              App.tsx handleSaveAs                               │
│                                                                 │
│  const handleSaveAs = async (fileName, folderId) => {           │
│    const newFileId = await createDriveFile(                     │
│      fileName,                                                  │
│      '', // Empty content for new file                          │
│      accessToken,                                               │
│      folderId                                                   │
│    )                                                            │
│    setFileId(newFileId)                                         │
│    setTitle(fileName.replace('.md', ''))                        │
│    setText('')                                                  │
│    setShowSaveAsDialog(false)                                   │
│  }                                                              │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│                Google Drive API (POST)                          │
│                                                                 │
│  POST /upload/drive/v3/files?uploadType=multipart               │
│  Body: {                                                        │
│    metadata: { name: "My Document.md", parents: [folderId] },  │
│    content: ""                                                  │
│  }                                                              │
│  Response: { id: "newFileId123" }                               │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│               Editor Opens with Empty File                      │
│  fileId = "newFileId123"                                        │
│  title = "My Document"                                          │
│  text = ""                                                      │
│                                                                 │
│  User starts typing → Auto-save kicks in (3s debounce)          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quality Attributes & Non-Functional Requirements

### Performance

**Target Metrics:**
- Sidebar collapse/expand animation: **< 200ms**
- File status icon update: **< 50ms** (instant visual feedback)
- TOC update on editor change: **< 100ms**
- Auto-save debounce: **3s** (configurable)
- Large document (1000+ lines) scroll navigation: **< 100ms**

**Optimization Strategies:**
- Use `useMemo` for expensive computations (status icon, TOC headings)
- Use `useCallback` for event handlers to prevent re-renders
- Lazy load shadcn sidebar CSS (already optimized by shadcn)
- Debounce scroll events for active heading detection (existing in TableOfContents.tsx)

---

### Scalability

**Document Size:**
- Support up to **10,000 lines** of markdown without performance degradation
- TOC with up to **500 headings** remains scrollable and responsive

**Sidebar State:**
- Persistent collapsed/expanded state via cookies (shadcn built-in)
- Cookie max age: **30 days** (shadcn default)

**Mobile:**
- Support viewport widths down to **320px** (iPhone SE)
- Hamburger menu overlay works on all mobile devices

---

### Accessibility (WCAG 2.1 AA)

**Keyboard Navigation:**
- `Cmd+B` / `Ctrl+B` toggles sidebar (shadcn built-in)
- `Tab` navigation through TOC items
- `Enter` to click TOC item (scroll to heading)
- `Escape` to close logout dialog

**Screen Reader Support:**
- `aria-label` on sidebar toggle button
- `aria-expanded` on collapsible sections
- `aria-current="location"` on active TOC item
- Semantic HTML (`<nav>`, `<button>`, `<ul>`, `<li>`)

**Focus Management:**
- Visible focus indicators (outline on buttons)
- Focus trap in dialogs (NoFileDialog, SaveAsDialog)
- Return focus after dialog close

**Color Contrast:**
- Status icons meet WCAG AA contrast ratios
- Text on colored backgrounds (alerts) meets 4.5:1 minimum

---

### Security

**OAuth Token Handling:**
- Tokens managed by `tokenManager` (existing service)
- Tokens never logged or exposed in console
- Auto-refresh on expiration (existing logic)

**XSS Prevention:**
- React auto-escapes all user input
- Filename sanitization (no script injection)
- Markdown content sanitized by TipTap

**CSP Compliance:**
- No inline styles (use CSS modules or styled-components if needed)
- shadcn components already CSP-compliant

---

### Maintainability

**Code Organization:**
- One component per file
- Clear separation of concerns (UI vs logic)
- PropTypes/TypeScript interfaces for all components
- JSDoc comments for complex logic

**Testing:**
- Unit tests for each component (React Testing Library)
- Integration tests for full workflows
- E2E tests for critical paths (Playwright)

**Documentation:**
- Component README for each complex component
- Inline comments for non-obvious logic
- Architecture diagrams (this document)

---

### Reliability

**Error Handling:**
- Graceful degradation for network failures
- Retry logic for transient errors (existing in useDriveSync)
- User-friendly error messages (no stack traces)

**Offline Support:**
- Show "Offline" status icon when no network
- Queue auto-saves for when connection restored (future enhancement)

**Data Integrity:**
- No data loss on browser crash (auto-save every 3s)
- Force save on visibility change (existing in useDriveSync)

---

## Architecture Decision Records (ADRs)

### ADR-001: Use shadcn/ui Sidebar Instead of Custom Sidebar

**Date:** October 6, 2025
**Status:** Accepted
**Context:** Need to consolidate scattered UI into single left sidebar.

**Decision:** Use shadcn/ui sidebar component instead of building custom sidebar.

**Rationale:**
- Industry-standard component (used by Vercel, Linear, Resend)
- Built-in features: collapsible icon mode, keyboard shortcuts, persistent state
- Mobile responsive out-of-the-box (hamburger menu, overlay)
- Well-documented, actively maintained
- Saves development time (estimated 3-5 days vs 7-10 days for custom)

**Consequences:**
- ✅ Faster development
- ✅ Consistent UX with modern SaaS apps
- ✅ Less maintenance burden (shadcn updates)
- ❌ Dependency on shadcn (low risk - open source, widely adopted)

**Alternatives Considered:**
- Custom sidebar with `react-spring` animations
- Headless UI sidebar primitives
- Material-UI drawer component

**Why Rejected:**
- Custom: Too much development time, reinventing the wheel
- Headless UI: Less comprehensive than shadcn (no persistent state)
- Material-UI: Heavier bundle size, different design system

---

### ADR-002: Status Icon Instead of Text Alerts

**Date:** October 6, 2025
**Status:** Accepted
**Context:** Current SaveStatus shows text alerts ("Saving...", "Saved 5s ago").

**Decision:** Replace text alerts with icon-only status indicator + yellow dot badge.

**Rationale:**
- More compact (fits collapsed sidebar)
- Universal visual language (icons > text)
- Consistent with modern apps (VS Code, Figma, Notion)
- Less intrusive than toast notifications
- Follows "invisible interface" philosophy

**Consequences:**
- ✅ Cleaner UI
- ✅ Less visual noise
- ✅ Fits narrow sidebar width
- ❌ Slightly less explicit (user must learn icon meanings)

**Mitigation for Disadvantage:**
- Tooltip on hover shows text explanation (future enhancement)
- Error toasts still appear for critical failures (bottom right)

**Alternatives Considered:**
- Keep text alerts ("Saving...", "Saved X ago")
- Badge with number of unsaved changes

**Why Rejected:**
- Text alerts: Too wide for narrow sidebar, too noisy
- Badge with count: Overkill for simple saved/unsaved binary state

---

### ADR-003: Big Bang Replacement Instead of Gradual Migration

**Date:** October 6, 2025
**Status:** Accepted
**Context:** Need to migrate from 4 old components to new sidebar.

**Decision:** Delete all 4 old components in single PR (big bang replacement).

**Rationale:**
- Cleaner git history (no half-migrated state)
- No feature flag complexity
- Forces complete thinking about new UX
- Easier code review (one PR, one mental model)
- Avoids confusion during transition period

**Consequences:**
- ✅ Clean migration
- ✅ Single PR, single review, single deploy
- ✅ No lingering old code
- ❌ Riskier (if bugs found, harder to rollback partially)

**Mitigation for Risk:**
- Create git checkpoint before deletion
- Comprehensive testing before PR
- Staged rollout plan (deploy to staging first)

**Alternatives Considered:**
- Gradual migration (keep old components during transition)
- Feature flag (toggle between old/new UI)

**Why Rejected:**
- Gradual migration: Confusing UI during transition, double maintenance
- Feature flag: Adds complexity, unnecessary for internal app

---

### ADR-004: Conditional TOC Rendering (Invisible Interface)

**Date:** October 6, 2025
**Status:** Accepted
**Context:** Current TOC always visible, even with no headings.

**Decision:** Hide TOC entirely when no headings exist (`if headings.length === 0 return null`).

**Rationale:**
- Follows "invisible interface" philosophy (UI disappears when not needed)
- No clutter when editing documents without headings
- Consistent with modern editors (Google Docs doesn't show empty outline)

**Consequences:**
- ✅ Cleaner UI for simple documents
- ✅ Maximum content space when no TOC
- ❌ User might not know TOC feature exists

**Mitigation for Disadvantage:**
- Show TOC icon in collapsed sidebar only when headings exist
- User documentation mentions TOC feature

**Alternatives Considered:**
- Show "No headings yet" placeholder message
- Always show TOC section with empty state

**Why Rejected:**
- Placeholder message: Visual clutter, violates invisible interface
- Always show: Wastes sidebar space for documents without headings

---

### ADR-005: No Inline Filename Editing (Sprint 9 Scope)

**Date:** October 6, 2025
**Status:** Accepted
**Context:** User might expect to click filename to rename.

**Decision:** Filename read-only in Sprint 9 (defer to Sprint 11: Enhanced Document Operations).

**Rationale:**
- Keeps Sprint 9 focused on UI consolidation only
- Inline editing requires additional complexity (validation, Drive API rename)
- Sprint 11 already planned for file operations (rename, duplicate, delete)
- Avoids scope creep

**Consequences:**
- ✅ Sprint 9 ships faster
- ✅ Clear separation of concerns
- ❌ User cannot rename file from sidebar (must use Drive)

**Future Enhancement (Sprint 11):**
- Click filename → Editable input
- Enter to save, Escape to cancel
- Drive API PATCH to rename file

**Alternatives Considered:**
- Include inline editing in Sprint 9

**Why Rejected:**
- Scope creep risk
- Sprint 9 already complex (6 new components, 4 removals)
- Better to ship core sidebar first, iterate on features later

---

## Technology Evaluation

### Component Library: shadcn/ui Sidebar

**Evaluation Criteria:**

| Criterion | Weight | shadcn/ui | Custom | Headless UI | Material-UI |
|-----------|--------|-----------|--------|-------------|-------------|
| **Development Speed** | 30% | 9/10 | 4/10 | 6/10 | 7/10 |
| **Bundle Size** | 20% | 9/10 | 10/10 | 8/10 | 5/10 |
| **Customizability** | 20% | 8/10 | 10/10 | 7/10 | 6/10 |
| **Documentation** | 15% | 9/10 | 3/10 | 7/10 | 8/10 |
| **Mobile Support** | 10% | 9/10 | 5/10 | 7/10 | 8/10 |
| **Community** | 5% | 8/10 | N/A | 7/10 | 9/10 |
| **Weighted Score** | - | **8.4/10** | **6.2/10** | **6.9/10** | **6.8/10** |

**Winner: shadcn/ui** (8.4/10)

**Key Advantages:**
- Pre-built collapsible icon mode (saves 3-5 days development)
- Persistent state via cookies (built-in)
- Keyboard shortcuts (built-in)
- Mobile responsive (hamburger menu, overlay)
- Copy-paste code (not npm dependency - full control)

**Trade-offs:**
- Slightly larger bundle than custom (acceptable - ~5KB gzipped)
- Less customizable than fully custom (acceptable - 90% of use cases covered)

---

### State Management: React Hooks vs Context API vs Redux

**Evaluation Criteria:**

| Criterion | Weight | Hooks | Context API | Redux |
|-----------|--------|-------|-------------|-------|
| **Simplicity** | 30% | 9/10 | 7/10 | 4/10 |
| **Performance** | 25% | 8/10 | 7/10 | 9/10 |
| **Bundle Size** | 20% | 10/10 | 10/10 | 6/10 |
| **Scalability** | 15% | 7/10 | 8/10 | 10/10 |
| **Learning Curve** | 10% | 9/10 | 8/10 | 5/10 |
| **Weighted Score** | - | **8.4/10** | **7.7/10** | **6.7/10** |

**Winner: React Hooks** (8.4/10)

**Decision:** Use existing hooks (`useDriveSync`, `useDriveFiles`, `useAuth`) + shadcn `useSidebar`.

**Rationale:**
- App state is already managed with hooks (no migration needed)
- Sidebar state is local (doesn't need global store)
- Auth state already in Context API (existing `AuthContext`)
- No complex state sharing between distant components

**When to Reconsider:**
- If app grows to 20+ components with shared state
- If state updates cause performance issues (unlikely)

---

### Auto-save Debounce: 3s vs 1s vs 5s

**Evaluation:**

| Debounce Time | Pros | Cons | User Experience |
|---------------|------|------|-----------------|
| **1s** | Faster saves, less data loss | More API calls, higher Drive quota usage | Feels responsive |
| **3s** ✅ | Balanced, standard for editors | Slight delay | Industry standard (Google Docs) |
| **5s** | Fewer API calls | More data loss risk on crash | Feels sluggish |

**Winner: 3s** (current implementation)

**Rationale:**
- Industry standard (Google Docs uses 3-5s)
- Balances API quota usage with data safety
- Already implemented and tested

**Configurable:**
```typescript
const { syncStatus } = useDriveSync(fileId, title, text, {
  debounceMs: 3000 // Configurable (default 3s)
})
```

---

## Risk Analysis & Mitigation

### Risk Matrix

| Risk ID | Risk | Probability | Impact | Severity | Mitigation |
|---------|------|-------------|--------|----------|------------|
| R1 | Breaking existing functionality during migration | Medium | High | **High** | See R1 mitigation below |
| R2 | Poor mobile UX (sidebar doesn't work on small screens) | Low | Medium | **Low** | Use shadcn defaults (tested) |
| R3 | Performance degradation with large documents | Low | Medium | **Low** | See R3 mitigation below |
| R4 | Users confused by icon-only status (no text) | Medium | Low | **Medium** | Add tooltips (future) |
| R5 | shadcn sidebar bugs or breaking changes | Low | Medium | **Low** | Pin shadcn version, fork if needed |
| R6 | OAuth token expires during file creation | Low | High | **Medium** | Auto-refresh tokens (existing) |
| R7 | Drive API quota exceeded (too many saves) | Low | Medium | **Low** | 3s debounce, rate limiting |

---

### R1: Breaking Existing Functionality

**Risk:** Removing 4 old components breaks app in unexpected ways.

**Mitigation Strategy:**

1. **Comprehensive Testing Before Removal:**
   - Run full manual test checklist (20+ scenarios)
   - Run automated test suite (`npm run test`)
   - Test on multiple browsers (Chrome, Safari, Firefox)
   - Test on mobile devices (iOS, Android)

2. **Git Safety Checkpoint:**
   ```bash
   git checkout -b feature/sprint-09-checkpoint
   git commit -am "Checkpoint before removing old components"
   git push origin feature/sprint-09-checkpoint
   ```

3. **Staged Rollout:**
   - Deploy to staging environment first
   - Test with internal team (2-3 days)
   - Deploy to production only after staging approval

4. **Rollback Plan:**
   - If critical bug found in production:
     ```bash
     git revert <commit-hash>
     git push origin main
     ```
   - Deploy rollback within 1 hour

**Probability Reduction:**
- Thorough testing: Medium → **Low**

---

### R3: Performance Degradation with Large Documents

**Risk:** Sidebar updates slow down with 1000+ line documents.

**Mitigation Strategy:**

1. **Performance Testing:**
   - Test with 1000, 5000, 10,000 line documents
   - Measure time to update TOC on content change
   - Measure time to update status icon on save
   - Target: < 100ms for all operations

2. **Optimization Techniques:**
   - Use `useMemo` for TOC heading extraction
   - Use `useCallback` for scroll event handlers
   - Debounce scroll events (already implemented)
   - Virtual scrolling for TOC if > 500 headings (future)

3. **Monitoring:**
   - Add performance marks (`performance.mark('toc-update-start')`)
   - Log slow operations (> 100ms) to console in dev mode

**Example Optimization:**
```tsx
const headings = useMemo(() => {
  if (!editor) return []
  return collectHeadings() // Expensive operation
}, [editor.state.doc]) // Only recompute when doc changes
```

**Probability Reduction:**
- Performance testing + optimization: Low → **Very Low**

---

### R4: Users Confused by Icon-Only Status

**Risk:** Users don't understand what status icons mean.

**Mitigation Strategy:**

1. **Tooltips (Future Enhancement):**
   ```tsx
   <Tooltip content="All changes saved to Drive">
     <FileText className="status-icon" />
   </Tooltip>
   ```

2. **User Documentation:**
   - Add "Help" section explaining icons
   - Screenshot with icon legend

3. **Error Toasts Still Appear:**
   - Critical errors show toast in bottom right
   - Provides explicit text explanation

**Impact Reduction:**
- Tooltips + docs: Low → **Very Low**

---

### R6: OAuth Token Expires During File Creation

**Risk:** User creates new file, token expires mid-operation, file lost.

**Mitigation Strategy:**

1. **Auto-Refresh Tokens (Existing):**
   - `tokenManager.getAccessToken()` auto-refreshes if expired
   - Retry once if refresh fails

2. **Graceful Error Handling:**
   ```typescript
   try {
     const newFileId = await createDriveFile(...)
   } catch (error) {
     if (error.message.includes('401')) {
       // Retry after re-auth
       await tokenManager.refreshToken()
       return createDriveFile(...) // Retry
     }
     throw error
   }
   ```

3. **User Notification:**
   - Show error toast: "Session expired. Please try again."
   - Don't lose user's content (keep in editor state)

**Probability Reduction:**
- Auto-refresh + retry: Low → **Very Low**

---

## Deployment Architecture

### Build Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                     Developer Workflow                          │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ↓
         Create feature/sprint-09-sidebar branch
                      │
                      ↓
         Implement components (Day 1-7)
                      │
                      ↓
         Run local tests: npm run test
                      │
                      ↓
         Run type check: npm run type-check
                      │
                      ↓
         Manual testing (Day 8-9)
                      │
                      ↓
         Create PR to main branch
                      │
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│                      CI/CD Pipeline                             │
│  (GitHub Actions - runs on PR creation)                         │
│                                                                 │
│  1. npm install                                                 │
│  2. npm run lint (ESLint + TypeScript)                          │
│  3. npm run type-check (TSC strict mode)                        │
│  4. npm run test (Jest + React Testing Library)                 │
│  5. npm run build (Vite production build)                       │
│  6. Deploy to Netlify staging                                   │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ↓
         Code review + approval
                      │
                      ↓
         Merge to main branch
                      │
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│                   Production Deployment                         │
│  (Netlify auto-deploy on main push)                             │
│                                                                 │
│  1. Build React app (Vite)                                      │
│  2. Deploy to Netlify CDN                                       │
│  3. Smoke test: curl https://ritemark.app                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Validation Checklist (Pre-PR)

**Before creating PR, ensure:**

### Code Quality
- [ ] TypeScript compiles with zero errors (`npm run type-check`)
- [ ] ESLint passes with zero errors (`npm run lint`)
- [ ] All tests pass (`npm run test`)
- [ ] Production build succeeds (`npm run build`)

### Component Implementation
- [ ] All 6 new components created (AppSidebar, FileStatusIndicator, TableOfContentsNav, UserAccountInfo, NoFileDialog, SaveAsDialog)
- [ ] All 4 old components deleted (FileMenu, SaveStatus, AuthStatus, TableOfContents)
- [ ] App.tsx updated to use new sidebar
- [ ] No broken imports or references

### Functionality
- [ ] Sidebar collapses/expands with `Cmd+B`
- [ ] File status icon shows correct states (doc, sync, alert, yellow dot)
- [ ] TOC updates when headings added/removed
- [ ] TOC hidden when no headings
- [ ] User info shows avatar + name + email
- [ ] Logout flow works (click user → AuthModal → logout)
- [ ] No file dialog appears when `fileId === null`
- [ ] "Open File" button triggers file picker
- [ ] "Create New" button shows SaveAsDialog
- [ ] SaveAsDialog creates file successfully

### Performance
- [ ] Sidebar animations smooth (< 200ms)
- [ ] Large documents (1000+ lines) scroll smoothly
- [ ] TOC updates in < 100ms on content change

### Mobile
- [ ] Hamburger menu appears on mobile (<768px)
- [ ] Sidebar overlay works on tap
- [ ] All features accessible on mobile

### Accessibility
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Focus indicators visible
- [ ] Screen reader labels present (`aria-label`, `aria-expanded`, `aria-current`)

### Documentation
- [ ] Component JSDoc comments added
- [ ] Architecture document updated (this file)
- [ ] Sprint 9 plan marked complete

---

## Success Metrics (Post-Deployment)

**Measure after 1 week in production:**

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Zero UI regressions** | 100% | User feedback, QA testing |
| **Sidebar usage** | > 50% users expand sidebar | Analytics event tracking |
| **Time to save** | < 3.5s average | Auto-save telemetry |
| **Error rate** | < 1% of saves | Error logging |
| **Mobile usage** | > 20% users on mobile | Device detection |
| **Lighthouse score** | > 90 | Lighthouse audit |

**If metrics fail:**
- UI regressions → Hotfix within 24 hours
- Low sidebar usage → Add onboarding tooltip
- Slow saves → Reduce debounce to 2s
- High error rate → Investigate Drive API issues

---

## Future Enhancements (Post-Sprint 9)

**Sprint 10: In-Context Formatting Menu**
- Floating toolbar on text selection
- Bold, italic, link, heading shortcuts
- No changes to sidebar

**Sprint 11: Enhanced Document Operations**
- Inline filename editing (click to rename)
- File duplicate/delete actions
- Recent files list in sidebar
- Folder navigation

**Sprint 12: Keyboard Shortcuts**
- Cheat sheet modal (`Cmd+/`)
- Custom shortcuts for TOC navigation
- Quick file switcher (`Cmd+P`)

**Performance Optimizations:**
- Virtual scrolling for TOC (if > 500 headings)
- Lazy load editor on large documents
- Service worker for offline support

---

## Appendix: Technical References

### shadcn/ui Sidebar Documentation
- Main docs: https://ui.shadcn.com/docs/components/sidebar
- Icon mode example: https://ui.shadcn.com/view/sidebar-07
- API reference: https://ui.shadcn.com/docs/components/sidebar#api

### TipTap ProseMirror API
- Document structure: https://tiptap.dev/api/schema
- Coordinates: https://prosemirror.net/docs/ref/#view.EditorView.coordsAtPos
- Selection: https://tiptap.dev/api/commands/set-text-selection

### Google Drive API
- Files.create: https://developers.google.com/drive/api/v3/reference/files/create
- Files.update: https://developers.google.com/drive/api/v3/reference/files/update
- Files.get: https://developers.google.com/drive/api/v3/reference/files/get

### React Performance
- useMemo: https://react.dev/reference/react/useMemo
- useCallback: https://react.dev/reference/react/useCallback
- Performance profiling: https://react.dev/learn/react-developer-tools#profiler

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | Oct 6, 2025 | System Architecture Designer | Initial architecture design |

---

**End of Architecture Document**

This document serves as the comprehensive blueprint for implementing Sprint 9 sidebar consolidation. All implementation teams should refer to this document for component specifications, state flow, migration strategy, and quality requirements.
