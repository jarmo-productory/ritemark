# Sprint 9: UX Consolidation & Invisible Interface

**Sprint Duration:** 7-10 days
**Sprint Goal:** Consolidate all UI to shadcn left sidebar, apply Johnny Ive invisible interface philosophy
**Sprint Output:** 1 PR replacing 4 components with unified sidebar
**Success Criteria:** Zero UI clutter - single sidebar location for all controls, pure content editing area

---

## 🎯 Sprint Vision & User Impact

### The Problem: UI Scattered Across 3 Locations

**Current State (Violates Invisible Interface):**
1. **Upper right corner**: FileMenu (Open file) + Sign in button
2. **Upper left corner**: SaveStatus alerts ("Saved to Drive", "Saving...")
3. **Bottom left corner**: User badge/avatar
4. **Right side/overlay**: Table of Contents

**User Impact:**
- Eyes jump between 4 different screen locations
- Visual clutter breaks writing flow
- Inconsistent with "invisible interface" philosophy
- No clear "home" for controls

### The Solution: Shadcn Left Sidebar

**New State (Invisible Interface):**
- ✅ **Single location**: Collapsible left sidebar (shadcn component)
- ✅ **Collapsed by default**: Thin icon bar, maximum content space
- ✅ **Pure editing area**: Zero UI in content zone
- ✅ **Contextual visibility**: UI appears only when needed

**User Benefits:**
- Predictable single location for all controls
- Maximum space for writing (sidebar collapsed)
- Professional, clean interface (like Notion, Linear, Vercel)
- Consistent with Johnny Ive design philosophy

---

## 📋 Requirements Specification

### 1. Shadcn Sidebar Component

**Installation:**
```bash
pnpm dlx shadcn@latest add sidebar
```

**Configuration:**
- **Side**: `left`
- **Collapsible**: `icon` mode (thin vertical bar with icons)
- **Keyboard shortcut**: `Cmd+B` / `Ctrl+B` to toggle
- **Persistent state**: Remember collapsed/expanded via cookies
- **Mobile**: Use shadcn defaults (hamburger menu, overlay mode)

**Component Structure:**
```jsx
<SidebarProvider>
  <Sidebar collapsible="icon" side="left">
    <SidebarHeader>
      {/* File status + name */}
    </SidebarHeader>

    <SidebarContent>
      <SidebarGroup>
        {/* Table of Contents */}
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter>
      {/* User account */}
    </SidebarFooter>
  </Sidebar>

  <main>
    {/* Pure content editing area */}
  </main>
</SidebarProvider>
```

---

### 2. Sidebar Header: File Status & Name

**Layout:**
```
[Status Icon] Filename...
```

**Status Icon States:**
1. **📄 Document icon** (default)
   - Meaning: All changes saved to Drive
   - No pending changes, no sync in progress

2. **📄🟡 Document icon + yellow dot** (badge)
   - Meaning: Unsaved changes detected
   - Triggers immediately when user types
   - Before 3s auto-save debounce

3. **🔄 Sync icon** (animated)
   - Meaning: Currently saving to Google Drive
   - Shows during save operation
   - Replaces doc icon temporarily

4. **🔴 Red alert icon**
   - Meaning: Save error/conflict occurred
   - Stays until error is resolved
   - User must take action

**Filename Behavior:**
- **Truncation**: Use ellipses `...` if filename doesn't fit width
- **No editing**: Sprint 9 keeps filename read-only (rename in Sprint 11)
- **Narrow width**: Sidebar is narrow, prioritize status icon visibility

**When Collapsed (Icon Mode):**
- Show only status icon in thin vertical bar
- No filename visible (space constraint)
- User expands sidebar to see full filename

---

### 3. No File State: Center Dialog

**When user has NO file open:**

**Current UI:**
- ❌ Empty editor with FileMenu button in upper right

**New UI:**
- ✅ Center dialog in middle of screen
- ✅ Two clear options:

```
┌─────────────────────────────────┐
│                                 │
│       Welcome to RiteMark       │
│                                 │
│   ┌───────────┐  ┌───────────┐ │
│   │   Open    │  │Create New │ │
│   └───────────┘  └───────────┘ │
│                                 │
└─────────────────────────────────┘
```

**"Open" Button:**
- Opens Google Drive file picker (reuse existing `DriveFilePicker` component)
- Desktop: Google Picker API
- Mobile: Custom file browser

**"Create New" Button:**
- Immediately shows "Save As" dialog
- User chooses:
  1. Filename (not "Untitled" - user decides)
  2. Drive folder location (not automatic - user picks)
- Creates empty markdown file in Drive
- Opens in editor

**Rationale:**
- Explicit user choice (no assumptions)
- Full control over filename and location
- Aligns with invisible interface (no hidden auto-save magic)

---

### 4. Table of Contents (Sidebar Middle Section)

**Migration:**
- ❌ Remove current `TableOfContents.tsx` component (right side/overlay)
- ✅ Move TOC into sidebar `SidebarContent` → `SidebarGroup`

**Behavior:**

**When headings exist:**
- ✅ Show TOC in sidebar middle section
- ✅ Same functionality as current TOC (click to scroll)
- ✅ Active heading detection (topmost visible + look north)

**When NO headings:**
- ✅ Hide TOC section entirely (invisible interface!)
- ✅ No "No headings" message (just empty space)

**When collapsed (icon mode):**
- ✅ Show small 📑 TOC icon in thin vertical bar
- ✅ Click icon → Expands sidebar to show full TOC
- ✅ Icon appears only if headings exist

**Styling:**
- Reuse existing TOC styles (list formatting, indentation)
- Adapt to sidebar width (narrower than current right-side TOC)
- Ensure scrollable if many headings

---

### 5. User Account (Sidebar Footer)

**Migration:**
- ❌ Remove current user badge component (bottom left)
- ✅ Move to sidebar footer (anchored to bottom)

**When Expanded:**
- ✅ Show full account info:
  - User avatar (circular)
  - User name (from Google profile)
  - User email (from Google profile)
- ✅ Click anywhere on user info → Opens logout dialog
- ✅ Reuse existing `AuthModal` component for logout

**When Collapsed (Icon Mode):**
- ✅ Show only avatar icon (small, circular)
- ✅ Click avatar → Expands sidebar (same as any collapsed item)
- ✅ Then user can click account info to logout

**Logout Dialog:**
- ✅ Same as current implementation
- ✅ Confirm logout action
- ✅ Redirect to signed-out state

---

### 6. Alert/Toast Behavior

**Current State:**
- Upper left corner shows:
  - "Saved to Drive" (success toast)
  - "Saving..." (in-progress toast)
  - "Failed to save" (error toast)

**New State:**
- ❌ **Remove all success/progress toasts**
  - Status icon in sidebar header provides feedback
  - No need for redundant "Saved to Drive" message

- ✅ **Keep error toasts ONLY**
  - Show in **bottom right corner** (new location)
  - Critical errors need attention beyond icon
  - Examples:
    - "Failed to save: Network error"
    - "Drive quota exceeded"
    - "File conflict detected"

**Rationale:**
- Reduce visual noise (invisible interface)
- Icon status is sufficient for normal operations
- Errors require explicit user attention

---

### 7. Mobile Behavior

**Use Shadcn Sidebar Defaults:**

**Collapsed State (Mobile):**
- ✅ Sidebar hidden by default
- ✅ Hamburger button in top-left corner
- ✅ Tap hamburger → Overlay sidebar slides in from left

**Expanded State (Mobile):**
- ✅ Full-width overlay (dims content behind)
- ✅ Tap outside sidebar → Closes sidebar
- ✅ Same content as desktop (header, TOC, footer)

**Swipe Gestures:**
- ✅ Use shadcn default behavior (if implemented)
- ✅ No custom swipe logic needed

**Responsive Breakpoints:**
- ✅ Use shadcn defaults (tablet, mobile handling)
- ✅ Ensure TOC readable on small screens

---

## 🗑️ Components to Remove (Big Bang Replacement)

### Files to Delete:
1. **`src/components/FileMenu.tsx`**
   - Upper right corner file operations
   - Replaced by sidebar header + center dialog

2. **`src/components/drive/SaveStatus.tsx`**
   - Upper left save alerts
   - Replaced by sidebar header status icon

3. **User badge component** (confirm filename)
   - Bottom left user avatar
   - Replaced by sidebar footer

4. **`src/components/TableOfContents.tsx`**
   - Right side/overlay TOC
   - Replaced by sidebar middle section

### References to Update:
- **`src/App.tsx`**: Remove all 4 component references
- **CSS/Layout**: Clean up positioning styles for removed components
- **State management**: Consolidate into sidebar-based state

---

## 🎨 Design Specifications

### Sidebar Dimensions

**Expanded Width:**
- **Target**: 240-280px (narrow, as specified)
- **Minimum**: Enough for filename + icon comfortably
- **Maximum**: Don't consume too much content area

**Collapsed Width:**
- **Use shadcn default** (typically 48-64px)
- **Icon size**: 20-24px (Lucide icons)
- **Padding**: Consistent vertical spacing

### Color & Styling

**Follow shadcn/ui Theme:**
- Use shadcn CSS variables (--sidebar-background, --sidebar-foreground, etc.)
- No custom colors (maintain consistency)
- Support light/dark mode automatically

**Status Icon Colors:**
- 📄 Document: Use default foreground color
- 🟡 Yellow dot: `hsl(var(--warning))` or custom yellow
- 🔄 Sync: Animated, use primary color
- 🔴 Alert: `hsl(var(--destructive))` or red

### Typography

**Filename:**
- Font: Same as shadcn sidebar menu items
- Weight: Medium (500)
- Size: 14-16px
- Truncation: CSS `text-overflow: ellipsis`

**TOC Items:**
- Font: Same as current TOC
- Indentation: Nested levels (h1, h2, h3)
- Active state: Highlight current heading

**User Info:**
- Name: Medium weight, 14px
- Email: Regular weight, 12px, muted color

---

## 🏗️ Implementation Architecture

### Component Hierarchy

```
App.tsx
└── SidebarProvider
    ├── Sidebar (collapsible="icon", side="left")
    │   ├── SidebarHeader
    │   │   └── FileStatusIndicator
    │   │       ├── StatusIcon (doc/sync/alert)
    │   │       └── Filename (truncated)
    │   │
    │   ├── SidebarContent
    │   │   └── SidebarGroup
    │   │       └── TableOfContentsNav
    │   │           └── TOCItems (conditional: if headings exist)
    │   │
    │   └── SidebarFooter
    │       └── UserAccountInfo
    │           ├── Avatar
    │           ├── UserName
    │           └── UserEmail (click → logout dialog)
    │
    └── main (content area)
        ├── NoFileDialog (conditional: if !currentFile)
        │   ├── OpenButton → DriveFilePicker
        │   └── CreateNewButton → SaveAsDialog
        │
        └── Editor (conditional: if currentFile)
            └── TipTap WYSIWYG editor (pure content, no UI)
```

### New Components to Create

1. **`src/components/sidebar/AppSidebar.tsx`**
   - Main sidebar wrapper with shadcn structure
   - Integrates header, content, footer

2. **`src/components/sidebar/FileStatusIndicator.tsx`**
   - Status icon logic (doc/sync/alert/yellow dot)
   - Filename display with ellipsis truncation
   - Listens to save state changes

3. **`src/components/sidebar/TableOfContentsNav.tsx`**
   - Migrated TOC functionality from `TableOfContents.tsx`
   - Adapted for narrow sidebar width
   - Conditional rendering (hide if no headings)

4. **`src/components/sidebar/UserAccountInfo.tsx`**
   - User avatar + name + email
   - Click handler for logout dialog
   - Expanded/collapsed states

5. **`src/components/dialogs/NoFileDialog.tsx`**
   - Center dialog with "Open" / "Create New" buttons
   - Triggers file picker or save-as dialog
   - Shows only when no file is open

6. **`src/components/dialogs/SaveAsDialog.tsx`**
   - Let user choose filename
   - Let user pick Drive folder location
   - Creates new markdown file in Drive

### Hooks & State Management

**Existing Hooks to Reuse:**
- `useDriveFiles` - File operations
- `useDriveSync` - Auto-save, sync state
- `useAuth` - User authentication state
- Editor state from TipTap

**New State Needed:**
- Sidebar collapsed/expanded state (managed by shadcn `SidebarProvider`)
- Current save status (already tracked, just wire to icon)

---

## 📊 Success Metrics

### Before (Current State)
- ❌ UI scattered across 4 locations
- ❌ Constant visual noise (save alerts)
- ❌ Inconsistent layout (TOC sometimes on right, sometimes overlay)
- ❌ Bottom-left badge feels disconnected

### After (Sprint 9 Complete)
- ✅ Single UI location (left sidebar)
- ✅ Zero toasts during normal operation
- ✅ Collapsed by default (maximum content space)
- ✅ Professional, clean interface
- ✅ Keyboard shortcut (Cmd+B) for quick access

### User Experience Goals
1. **Invisible Interface**: UI disappears, focus on writing
2. **Predictable Location**: Always know where to find controls
3. **Subtle Feedback**: Status icon sufficient (no intrusive alerts)
4. **Professional Polish**: Matches modern SaaS apps (Notion, Linear)

---

## 🧪 Testing & Validation

### Manual Testing Checklist

**Sidebar Functionality:**
- [ ] Sidebar collapses/expands via Cmd+B shortcut
- [ ] Sidebar state persists across page reloads (cookies)
- [ ] Collapsed mode shows only icons (doc status, TOC, avatar)
- [ ] Expanded mode shows full content (filename, TOC items, user info)
- [ ] Narrow width fits filename with ellipsis truncation

**File Status Indicator:**
- [ ] Doc icon shows when all saved
- [ ] Yellow dot appears immediately when typing
- [ ] Sync icon shows during save operation
- [ ] Alert icon shows on save error
- [ ] Status updates in real-time

**No File State:**
- [ ] Center dialog appears when no file open
- [ ] "Open" button triggers Drive file picker
- [ ] "Create New" button shows save-as dialog
- [ ] Save-as dialog lets user choose name + location
- [ ] New file creates successfully in Drive

**Table of Contents:**
- [ ] TOC shows in sidebar when headings exist
- [ ] TOC hidden when no headings (invisible interface)
- [ ] TOC icon (collapsed mode) appears only if headings exist
- [ ] Click TOC item scrolls to heading (existing functionality)
- [ ] Active heading detection works (topmost visible + look north)

**User Account:**
- [ ] Avatar shows in footer (collapsed: icon only, expanded: full info)
- [ ] Click user info opens logout dialog
- [ ] Logout dialog reuses existing AuthModal
- [ ] Logout flow works correctly

**Alerts:**
- [ ] No success toasts ("Saved to Drive" removed)
- [ ] Error toasts appear in bottom right corner
- [ ] Error toasts show critical save failures only

**Mobile Behavior:**
- [ ] Sidebar hidden by default on mobile
- [ ] Hamburger button appears in top-left
- [ ] Tap hamburger opens sidebar overlay
- [ ] Tap outside sidebar closes it
- [ ] All sidebar content visible on mobile

### Automated Testing

**Component Tests:**
- `AppSidebar.test.tsx` - Sidebar structure, collapse/expand
- `FileStatusIndicator.test.tsx` - Icon states (doc, sync, alert, yellow dot)
- `TableOfContentsNav.test.tsx` - TOC rendering, conditional visibility
- `UserAccountInfo.test.tsx` - User info display, logout trigger
- `NoFileDialog.test.tsx` - Dialog appearance, button actions

**Integration Tests:**
- Sidebar + Editor layout (no overlap)
- File picker → Editor load flow
- Create new → Save-as → Editor flow
- Logout → Re-auth flow

---

## 🚧 Migration Strategy (Big Bang Replacement)

### Phase 1: Preparation (Day 1-2)
1. Install shadcn sidebar component: `pnpm dlx shadcn@latest add sidebar`
2. Review shadcn documentation and examples
3. Set up component structure (folders, files)
4. Create skeleton components (no logic yet)

### Phase 2: Build New Components (Day 3-5)
1. **AppSidebar.tsx** - Shadcn structure with header/content/footer
2. **FileStatusIndicator.tsx** - Status icon logic + filename
3. **TableOfContentsNav.tsx** - Migrate existing TOC functionality
4. **UserAccountInfo.tsx** - User display + logout click handler
5. **NoFileDialog.tsx** - Center dialog with Open/Create buttons
6. **SaveAsDialog.tsx** - Drive folder picker + filename input

### Phase 3: Wire Up State (Day 6-7)
1. Connect save status to `useDriveSync` hook
2. Connect TOC to editor heading state
3. Connect user info to `useAuth` hook
4. Connect file operations to `useDriveFiles` hook

### Phase 4: Remove Old Components (Day 7)
1. Delete `FileMenu.tsx`
2. Delete `SaveStatus.tsx`
3. Delete user badge component
4. Delete `TableOfContents.tsx`
5. Update `App.tsx` to use new sidebar
6. Remove unused CSS/layout styles

### Phase 5: Testing & Polish (Day 8-9)
1. Manual testing (all checklist items)
2. Fix bugs and edge cases
3. Mobile responsiveness testing
4. Dark mode testing
5. Performance check (sidebar animations smooth)

### Phase 6: Documentation & PR (Day 10)
1. Update component documentation
2. Screenshot before/after comparison
3. Create PR with detailed description
4. Code review and merge

---

## 📦 Dependencies

### New Dependencies
- **shadcn/ui sidebar component** (via CLI installation)
  - Includes: SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarGroup
  - No new npm packages (shadcn uses existing deps)

### Existing Dependencies (Reuse)
- **Lucide React** (for icons: doc, sync, alert, TOC, user)
- **TipTap** (editor, no changes)
- **Google Drive API** (file operations, no changes)
- **React** (hooks, state management)

### Removed Dependencies
- None (we're removing components, not packages)

---

## 🎯 Definition of Done

Sprint 9 is complete when:

1. ✅ **Sidebar Implemented**
   - Shadcn sidebar component installed and configured
   - Collapsed by default, icon mode working
   - Cmd+B keyboard shortcut toggles sidebar
   - Persistent state via cookies

2. ✅ **UI Consolidated**
   - All 4 old components removed (FileMenu, SaveStatus, user badge, TOC)
   - Single sidebar location for all controls
   - Pure content editing area (zero UI)

3. ✅ **File Status Working**
   - Icon shows correct state (doc, sync, alert, yellow dot)
   - Real-time updates during typing/saving
   - Filename displays with ellipsis truncation

4. ✅ **No File State**
   - Center dialog appears when no file open
   - "Open" and "Create New" buttons functional
   - Save-as dialog lets user choose name + location

5. ✅ **TOC Migrated**
   - TOC in sidebar middle section
   - Conditional rendering (hide if no headings)
   - Click to scroll functionality preserved

6. ✅ **User Account**
   - Avatar/info in sidebar footer
   - Click to logout dialog working
   - Expanded/collapsed states correct

7. ✅ **Alerts Minimal**
   - No success toasts
   - Error toasts bottom right only

8. ✅ **Mobile Works**
   - Hamburger menu functional
   - Sidebar overlay on mobile
   - All features accessible

9. ✅ **Quality Checks**
   - TypeScript: Zero compilation errors
   - Build: Production build succeeds
   - Tests: All component tests passing
   - No console errors in browser

10. ✅ **Documentation**
    - Component documentation updated
    - Sprint 9 marked complete
    - Before/after screenshots in PR

---

## 🔮 Out of Scope (Future Sprints)

**Not in Sprint 9:**
- ❌ Inline filename editing (Sprint 11: Enhanced Document Operations)
- ❌ File rename/duplicate/delete (Sprint 11)
- ❌ Keyboard shortcuts cheat sheet (Sprint 12)
- ❌ Recent files list (Sprint 11)
- ❌ Folder navigation in sidebar (Sprint 11)
- ❌ In-context formatting menu (Sprint 10)

**Sprint 9 Focus:**
- ✅ UI consolidation ONLY
- ✅ Replace existing components with sidebar
- ✅ No new features beyond migration

---

## 📝 Notes & Decisions

### Design Decisions

1. **Shadcn sidebar chosen because:**
   - Industry-standard component (used by Vercel, Linear, etc.)
   - Built-in responsive behavior (mobile/desktop)
   - Persistent state via cookies (UX win)
   - Icon mode perfect for invisible interface
   - Well-documented, maintained

2. **Status icon (not text) because:**
   - More compact (fits collapsed sidebar)
   - Universal visual language
   - Consistent with modern apps (VS Code, Figma)
   - Less intrusive than toast notifications

3. **Center dialog for no file because:**
   - Clearer than empty sidebar with buttons
   - Explicit user choice (open vs create)
   - Follows common pattern (Figma, Notion)
   - No ambiguity about what to do

4. **Big bang replacement because:**
   - Cleaner git history (no half-migrated state)
   - No feature flag complexity
   - Forces complete thinking about new UX
   - One PR, one review, one deploy

### Technical Decisions

1. **Reuse existing hooks:**
   - `useDriveSync` already tracks save state
   - `useDriveFiles` already handles file operations
   - No new backend logic needed

2. **Migrate TOC (not rebuild):**
   - Existing TOC logic works well
   - Just needs layout adaptation for sidebar
   - Keep active heading detection algorithm

3. **Mobile: Use shadcn defaults:**
   - Don't reinvent mobile UX
   - Shadcn team has tested extensively
   - Maintains consistency with other shadcn apps

---

## 📚 Research Findings: Shadcn Sidebar Component

### Installation & Setup

```bash
pnpm dlx shadcn@latest add sidebar
```

No additional npm packages required - uses existing dependencies.

### Component Architecture

Shadcn/ui sidebar is an industry-standard component used by Vercel, Linear, and other modern SaaS apps. It provides:
- ✅ Built-in collapsible modes (`icon`, `offcanvas`, `none`)
- ✅ Persistent state via cookies (remembers user preference)
- ✅ Keyboard shortcut (`Cmd+B` / `Ctrl+B`)
- ✅ Mobile-responsive (sheet overlay on mobile, full sidebar on desktop)
- ✅ Accessible (screen reader support, focus management)
- ✅ Themeable (follows shadcn CSS variables)

### useSidebar Hook API

```typescript
import { useSidebar } from "@/components/ui/sidebar"

const {
  state,          // "collapsed" | "expanded"
  open,           // boolean: is sidebar open?
  setOpen,        // (open: boolean) => void
  openMobile,     // boolean: mobile sidebar state
  setOpenMobile,  // (open: boolean) => void
  isMobile,       // boolean: is viewport mobile?
  toggleSidebar,  // () => void: toggle open/closed
} = useSidebar()
```

### Persistent State (Cookies)

- Sidebar state saved to cookie (`SIDEBAR_COOKIE_NAME`)
- Cookie max age: `SIDEBAR_COOKIE_MAX_AGE` (configurable)
- Automatically restores state on page reload
- User preference persists across sessions

### Mobile vs Desktop Behavior

**Desktop (≥768px):**
- Collapsed (icon mode) or expanded (based on cookie)
- `Cmd+B` toggles state
- Persistent across page reloads
- Sidebar + main content side-by-side

**Mobile (<768px):**
- Sidebar hidden completely
- Hamburger button in top-left corner
- Tap hamburger → Overlay sidebar slides in from left
- Full-width overlay (dims content behind)
- Tap outside sidebar → Closes sidebar

### Styling for Collapsed/Expanded States

**Data Attributes:**
```typescript
<div data-collapsible="icon">
  {/* Sidebar content */}
</div>
```

**CSS Classes for Conditional Display:**
```css
/* Hide when collapsed (icon mode) */
.group-data-[collapsible=icon]:hidden

/* Show ONLY in icon mode */
.group-data-[collapsible=icon]:block hidden
```

### Autosave Status Indicator Best Practices

**Research: Google Docs Pattern**
- Icon next to document name (top toolbar)
- States:
  - ☁️✓ "All changes saved to Drive" (green checkmark)
  - 🔄 "Saving..." (sync icon, animated)
  - ⚠️ "Unable to save changes" (warning icon, red)

**UX Best Practices:**
1. **Keep visual feedback subtle** - Don't use intrusive toasts for every save
2. **Provide undo capability** - RiteMark already has TipTap undo/redo ✅
3. **Don't mix autosave with manual save** - RiteMark: Pure autosave, no "Save" button ✅
4. **Status indicator placement** - Near document name (not floating), always visible (sticky header)

### Real-World Examples

**Official Shadcn Examples:**
- Sidebar-07 (Icon Mode): https://ui.shadcn.com/view/sidebar-07
- Sidebar-02 (Collapsible Sections): https://ui.shadcn.com/view/sidebar-02

**Production Apps Using Shadcn Sidebar:**
- **Vercel Dashboard**: Left sidebar with icon mode
- **Linear**: Collapsible sidebar with keyboard shortcut
- **Resend**: Minimal sidebar with user account in footer

**Common patterns:**
- Icon mode as default (collapsed)
- User account anchored to footer
- Main navigation in content area
- Keyboard shortcut for power users

### Code Example: Basic Structure

```typescript
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <StatusIcon />
              <span>Filename.md</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {headings.map((heading) => (
              <SidebarMenuItem key={heading.id}>
                <SidebarMenuButton onClick={() => scrollTo(heading)}>
                  {heading.text}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={openLogoutDialog}>
              <Avatar src={user.avatar} />
              <div>
                <div>{user.name}</div>
                <div>{user.email}</div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
```

### References & Resources

**Official Documentation:**
- Shadcn Sidebar Docs: https://ui.shadcn.com/docs/components/sidebar
- Icon Mode Example: https://ui.shadcn.com/view/sidebar-07

**UX Research:**
- Google Docs Save Status: Google Workspace Updates Blog
- Autosave UI Patterns: https://ui-patterns.com/patterns/autosave

**Design Inspiration:**
- Vercel Dashboard: Icon mode sidebar with dark theme
- Linear: Collapsible sidebar with keyboard shortcuts
- Notion: Minimal sidebar with user account in footer

---

**Last Updated:** October 5, 2025 (Sprint 9 planning + research complete)
**Status:** Ready for implementation
**Owner:** RiteMark Development Team
