# Sprint 9: UX Consolidation & Invisible Interface

**Status:** ✅ COMPLETED (Sprint 9.1)
**Start Date:** October 5, 2025
**Completion Date:** October 11, 2025
**Duration:** 6 days
**Branch:** `feat/shadcn-sidebar-poc`

---

## 🎯 Quick Start (for AI agents)

**If you're studying this sprint, read in this order:**

### 1. Required Reading (Start Here)
1. **[sprint-09-ux-consolidation.md](../sprint-09-ux-consolidation.md)** - Sprint goals, UI requirements, component specs
2. **[sprint-09.1-sidebar-migration-plan.md](../sprint-09.1-sidebar-migration-plan.md)** - Actual implementation plan (8 phases)
3. **[sprint-09-postmortem.md](../sprint-09-postmortem.md)** - Mid-sprint analysis and learnings

### 2. Reading Order Rationale
- **Start with sprint-09-ux-consolidation.md** - Understand the vision: "Invisible Interface" philosophy and why UI was scattered
- **Then read sprint-09.1-sidebar-migration-plan.md** - See how vision was executed with quarantine strategy
- **Finally sprint-09-postmortem.md** - Learn what went wrong mid-sprint and how it was recovered

---

## 📚 Document Organization

### Core Planning Documents
| Document | Purpose | Status | Lines |
|----------|---------|--------|-------|
| **sprint-09-ux-consolidation.md** | Sprint vision, requirements, design specs | ✅ Complete | 887 |
| **sprint-09.1-sidebar-migration-plan.md** | 8-phase implementation plan | ✅ Complete | 355 |
| **sprint-09-postmortem.md** | Mid-sprint analysis, failure points, recovery | ✅ Complete | 952 |

### Document Details

#### sprint-09-ux-consolidation.md (887 lines)
**Purpose:** Blueprint for consolidating scattered UI into single sidebar location

**Key Sections:**
- Sprint Vision & User Impact (lines 10-40): Problem statement and solution
- Requirements Specification (lines 43-246): Detailed component specs
  - Shadcn sidebar configuration (lines 44-81)
  - File status indicator states (lines 85-122)
  - No file state dialog (lines 125-165)
  - Table of Contents migration (lines 167-194)
  - User account footer (lines 197-220)
  - Alert/toast behavior changes (lines 223-247)
- Implementation Architecture (lines 348-421): Component hierarchy and hooks
- Success Metrics (lines 426-445): Before/after comparison
- Testing & Validation (lines 449-512): Manual and automated test plans
- Migration Strategy (lines 514-557): Big Bang replacement phases
- Definition of Done (lines 578-631): 10 completion criteria

**Read When:** Starting Sprint 9 or understanding "Invisible Interface" design philosophy

---

#### sprint-09.1-sidebar-migration-plan.md (355 lines)
**Purpose:** Actual execution plan with quarantine strategy for CSS migration

**Key Sections:**
- Goal & Strategy (lines 1-55): Quarantine legacy CSS, incremental migration
- Phases & Tasks (lines 58-198): 8 detailed phases (0-7) with completion checkmarks
- Validation Gates (lines 200-209): TypeScript, dev server, browser checks
- React Usage Examples (lines 211-327): Shadcn sidebar code patterns
- Risks & Mitigations (lines 329-335): CSS bleed-through, scroll locking, z-index

**Critical Phases:**
- **Phase 0:** Branch & Baseline (✅ Complete)
- **Phase 1:** CSS Quarantine Setup (✅ Complete)
- **Phase 2:** Clean-Room Scaffold (✅ Complete) - **Tailwind v4 → v3 downgrade!**
- **Phase 3:** Move File Actions (✅ Complete)
- **Phase 4:** Move Document Status/Title (✅ Complete) - **OAuth flow integrated**
- **Phase 5:** Move Table of Contents (✅ Complete)
- **Phase 6:** Move Account/User (✅ Complete)
- **Phase 7:** De-Quarantine (✅ Complete)
- **Phase 8:** Cleanup & PR (✅ Complete)

**Read When:** Implementing sidebar migration or troubleshooting CSS conflicts

---

#### sprint-09-postmortem.md (952 lines)
**Purpose:** Analysis of mid-sprint failure and recovery path

**Key Sections:**
- Executive Summary (lines 12-41): Why work appeared incomplete
- What Was Attempted (lines 45-141): Changes made, components created
- What Went Wrong (lines 143-339): Technical issues analysis
- Root Cause Analysis (lines 242-363): Sprint interrupted at 50-60% completion
- Lessons Learned (lines 365-483): 4 critical lessons for future sprints
- Recommendations (lines 485-597): 3 options (Continue/Abandon/Hybrid)
- Specific Technical Issues (lines 599-748): OAuth duplication, feature flags, 3 layouts

**Critical Findings:**
- **Issue 1:** Old components not removed (FileMenu.tsx, TableOfContents.tsx)
- **Issue 2:** Feature flags in production code (USE_SIDEBAR_SCAFFOLD, USE_SIMPLE_LAYOUT)
- **Issue 3:** No browser validation performed (violated CLAUDE.md Step 4.5)
- **Issue 4:** Cleanup phase not executed (violates CLAUDE.md mandatory cleanup)

**Lessons Applied in Sprint 9.1:**
1. ✅ Complete sprint phases sequentially (don't skip cleanup)
2. ✅ Install Chrome DevTools MCP for browser validation
3. ✅ Follow "Big Bang Replacement" strategy (remove old components immediately)
4. ✅ Avoid feature flags (removed in Phase 7)

**Read When:** Understanding why Sprint 9 paused mid-execution or learning from mistakes

---

## 🔗 Related Sprints

### Prerequisites
- **Sprint 8:** [Google Drive Integration](../sprint-08-drive-api-integration.md) ✅ COMPLETE
  - OAuth2 authentication flow
  - Drive file picker implementation
  - Auto-save and sync infrastructure
  - File status tracking

### Related Sprints
- **Sprint 10:** [Formatting Bubble Menu](../sprint-10-in-context-formatting-menu.md) ✅ COMPLETE
  - Uses sidebar layout established in Sprint 9
  - Follows invisible interface philosophy
  - Mobile-first responsive design
  - Keyboard shortcut patterns

- **Sprint 7:** [Google OAuth Setup](../sprint-07-google-oauth-setup.md) ✅ COMPLETE
  - Google Identity Services (GIS) implementation
  - Token management patterns
  - OAuth popup vs. redirect flow

### Future Dependencies
- **Sprint 11:** [Advanced Table Support](../sprint-11-tables-plan.md) 📋 PLANNED
  - Will use sidebar layout for table controls
  - Follows invisible interface principles
  - Mobile-responsive design patterns

---

## 📊 Sprint Status

### Progress Tracking
- **Started:** October 5, 2025 (Initial attempt)
- **Paused:** October 8, 2025 (50-60% complete)
- **Resumed:** October 8, 2025 (Sprint 9.1)
- **Completed:** October 11, 2025 (Sprint 9.1)
- **Total Duration:** 6 days

### Phase Status (Sprint 9.1)
| Phase | Name | Est. Time | Status |
|-------|------|-----------|--------|
| **Phase 0** | Branch & Baseline | 0.5h | ✅ Complete |
| **Phase 1** | CSS Quarantine Setup | 1.0h | ✅ Complete |
| **Phase 2** | Clean-Room Scaffold | 1.5h | ✅ Complete |
| **Phase 3** | Move File Actions | 1.0h | ✅ Complete |
| **Phase 4** | Move Document Status/Title | 1.0h | ✅ Complete |
| **Phase 5** | Move Table of Contents | 1.5h | ✅ Complete |
| **Phase 6** | Move Account/User | 0.5h | ✅ Complete |
| **Phase 7** | De-Quarantine | 2.0h | ✅ Complete |
| **Phase 8** | Cleanup & PR | 1.0h | ✅ Complete |

### Key Milestones
- ✅ Shadcn sidebar installed and configured
- ✅ All 4 old components removed (FileMenu, TableOfContents, SaveStatus, user badge)
- ✅ File status indicator working (doc/sync/alert/yellow dot states)
- ✅ OAuth authentication flow integrated
- ✅ Table of Contents migrated to sidebar
- ✅ Mobile hamburger menu functional
- ✅ Tailwind v3.4.18 compatibility resolved

---

## 🏗️ Architecture Highlights

### System Overview
```
Invisible Interface Philosophy
├─ Collapsed by default (48px icon rail)
├─ Single UI location (left sidebar)
└─ Pure content editing area (zero floating UI)

Shadcn Sidebar Structure
├─ SidebarProvider (context wrapper)
├─ AppSidebar (collapsible="icon", side="left")
│  ├─ SidebarHeader (File actions: New, Open)
│  ├─ SidebarContent (Table of Contents)
│  └─ SidebarFooter (Document Status + User Account)
└─ SidebarInset (Editor content area)
```

### Before Sprint 9 (Scattered UI)
```
┌─────────────────────────────────────┐
│ Upper Left: SaveStatus alerts       │ ❌
│ Upper Right: FileMenu + Sign In     │ ❌
│                                     │
│         Editor Content              │
│                                     │
│ Bottom Left: User badge/avatar      │ ❌
│ Right Side: Table of Contents       │ ❌
└─────────────────────────────────────┘
```

### After Sprint 9 (Single Sidebar)
```
┌──┬────────────────────────────────┐
│  │  ← Collapsed sidebar (48px)   │ ✅
│🏠│                                │
│📄│    Pure Content Editing        │
│📑│      (No UI clutter)           │
│👤│                                │
└──┴────────────────────────────────┘
```

### Key Technical Decisions

**1. Shadcn Sidebar Component (NOT Custom CSS)**
- **Why:** Industry-standard, used by Vercel, Linear, Notion
- **Impact:** Built-in responsive behavior, persistent state, accessibility
- **Trade-off:** Less customization control vs. proven UX patterns
- **Installation:** `npx shadcn@latest add sidebar`

**2. "Big Bang Replacement" Strategy**
- **Why:** Cleaner git history, no half-migrated state
- **Impact:** All 4 old components removed simultaneously
- **Trade-off:** More planning upfront, but simpler maintenance
- **Risk Mitigation:** Quarantine legacy CSS during migration (Phase 1)

**3. Tailwind v3.4.18 (Downgrade from v4)**
- **Why:** Tailwind v4 (canary) broke `w-[var(--sidebar-width)]` syntax
- **Impact:** Stable Tailwind v3 compatibility with shadcn components
- **Trade-off:** Miss v4 features, but gain stability
- **Locked in CLAUDE.md:** Official version for RiteMark

**4. File Status Icon (NOT Toast Notifications)**
- **Why:** Reduce visual noise, align with "Invisible Interface"
- **Impact:** Subtle feedback, no intrusive toasts during normal operation
- **States:** 📄 (saved), 📄🟡 (unsaved), 🔄 (syncing), 🔴 (error)
- **Trade-off:** Users must look at sidebar for status vs. automatic toasts

**5. OAuth Popup Flow (NOT Full-Page Redirect)**
- **Why:** Better UX, preserves editor state, faster login
- **Impact:** Users stay in app context, no reload needed
- **Implementation:** `window.google.accounts.oauth2.initTokenClient()`
- **Pattern:** Reused from Sprint 8 AuthModal.tsx

### Component Hierarchy
```
App.tsx
└── SidebarProvider
    ├── AppSidebar (collapsible="icon", side="left")
    │   ├── SidebarHeader
    │   │   └── File Actions (New Document, Open from Drive)
    │   │
    │   ├── SidebarContent
    │   │   └── Table of Contents (conditional: if headings exist)
    │   │
    │   └── SidebarFooter
    │       ├── DocumentStatus (title + sync status)
    │       └── UserAccountInfo (avatar + name + email)
    │
    └── SidebarInset
        ├── Header (breadcrumb + SidebarTrigger)
        └── Main (Editor content area)
```

### New Components Created
```
src/components/
├── layout/
│   ├── AppShell.tsx              (SidebarProvider wrapper)
│   ├── AppHeader.tsx             (header with breadcrumb)
│   └── DocumentEditor.tsx        (editor wrapper)
│
├── sidebar/
│   ├── AppSidebar.tsx            (main sidebar component)
│   ├── DocumentStatus.tsx        (title + sync status)
│   ├── FileStatusIndicator.tsx   (status icon logic)
│   ├── TableOfContentsNav.tsx    (migrated TOC)
│   └── UserAccountInfo.tsx       (user display + logout)
│
├── dialogs/
│   ├── NoFileDialog.tsx          (welcome screen: Open/Create)
│   ├── SaveAsDialog.tsx          (new file creation)
│   └── LoginDialog.tsx           (authentication)
│
└── ui/
    ├── sidebar.tsx               (shadcn primitives)
    ├── button.tsx                (shadcn button)
    ├── dialog.tsx                (shadcn dialog)
    ├── separator.tsx             (shadcn separator)
    ├── sheet.tsx                 (shadcn sheet for mobile)
    └── tooltip.tsx               (shadcn tooltip)
```

### Components Deleted (Cleanup Phase)
```
src/components/
├── FileMenu.tsx                  ❌ DELETED (replaced by AppSidebar header)
├── TableOfContents.tsx           ❌ DELETED (replaced by TableOfContentsNav)
├── SaveStatus.tsx                ❌ DELETED (replaced by DocumentStatus)
└── AuthStatus.tsx                ❌ DELETED (replaced by UserAccountInfo)
```

---

## 📦 Dependencies

### New Dependencies (Sprint 9)
| Package | Version | Purpose | Bundle Impact |
|---------|---------|---------|---------------|
| `@radix-ui/react-dialog` | ^1.1.15 | Dialog primitives for NoFileDialog | +3.2 KB gzipped |
| `@radix-ui/react-separator` | ^1.1.7 | Visual separators in sidebar | +0.8 KB gzipped |
| `@radix-ui/react-slot` | ^1.2.3 | Component composition utility | +1.1 KB gzipped |
| `@radix-ui/react-tooltip` | ^1.2.8 | Tooltips for collapsed sidebar | +4.5 KB gzipped |
| `class-variance-authority` | ^0.7.1 | Component variant styling | +2.3 KB gzipped |
| `clsx` | ^2.1.1 | Conditional class names | +0.4 KB gzipped |
| `tailwind-merge` | ^3.3.1 | Tailwind class merging | +1.7 KB gzipped |

**Total Bundle Impact:** +14.0 KB gzipped (+4.6% from Sprint 8 baseline)

### Downgraded Dependencies
| Package | From | To | Reason |
|---------|------|-----|--------|
| `tailwindcss` | v4.1.14 (canary) | v3.4.18 (stable) | Sidebar CSS variable compatibility |
| `@tailwindcss/vite` | v4.x | REMOVED | Not needed in v3 |
| `@tailwindcss/postcss` | v4.x | REMOVED | Not needed in v3 |

### New Dev Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `autoprefixer` | ^10.4.20 | PostCSS autoprefixer for Tailwind v3 |
| `postcss` | ^8.4.47 | PostCSS for Tailwind v3 |

### Compatibility Matrix
| Component | Current | Required | Compatible? |
|-----------|---------|----------|-------------|
| React | 19.1.1 | ^18.0.0 | ✅ Yes |
| TypeScript | 5.x | 5.x | ✅ Yes |
| Tailwind CSS | 3.4.18 | ^3.4.0 | ✅ Yes |
| Vite | 6.x | ^5.0.0 | ✅ Yes |

---

## 🚀 Implementation Roadmap

### Phase 0: Branch & Baseline (0.5h) ✅ COMPLETE
**Goal:** Establish clean starting point from Sprint 8

**Deliverables:**
- Created `feat/shadcn-sidebar-poc` branch from `cd4518c`
- Verified TypeScript compilation (`npm run type-check`)
- Verified dev server runs (`npm run dev`)
- Validated browser loads at `localhost:5173`

**Success Criteria:**
- ✅ Branch created successfully
- ✅ Zero TypeScript errors
- ✅ Dev server runs without errors
- ✅ Browser console clean

---

### Phase 1: CSS Quarantine Setup (1.0h) ✅ COMPLETE
**Goal:** Isolate legacy CSS to prevent conflicts with shadcn components

**Deliverables:**
- Wrapped app render in `.legacy-root` container
- Configured `postcss-prefix-selector` for legacy styles
- Moved layout-affecting CSS rules behind `.legacy-root`
- Kept global base rules on `html, body` only

**Success Criteria:**
- ✅ Legacy CSS scoped to `.legacy-root`
- ✅ Global CSS minimal (font, color-scheme only)
- ✅ No visual regressions in existing UI

**Key Learning:**
> "Quarantine legacy CSS FIRST before introducing new components" - prevents CSS bleed-through and z-index conflicts

---

### Phase 2: Clean-Room Scaffold (1.5h) ✅ COMPLETE
**Goal:** Build barebone shadcn sidebar structure with zero custom CSS

**Deliverables:**
- Installed shadcn/ui primitives: `npx shadcn@latest add sidebar button separator tooltip sheet skeleton breadcrumb`
- Created `SidebarProvider → AppSidebar → SidebarInset` structure
- Configured `collapsible="icon"` and `side="left"`
- Fixed Tailwind v4 incompatibility (downgraded to v3.4.18)

**Success Criteria:**
- ✅ Sidebar collapses correctly (304px → 48px)
- ✅ No Tailwind CSS errors
- ✅ Mobile sheet working
- ✅ TypeScript compiles clean

**Critical Issue Resolved:**
**Root Cause:** Tailwind v4 (canary) doesn't handle `w-[var(--sidebar-width)]` syntax

**Solution:**
1. Uninstalled `tailwindcss@4.1.14`, `@tailwindcss/vite`, `@tailwindcss/postcss`
2. Installed `tailwindcss@^3.4.18`, `postcss`, `autoprefixer`
3. Created `tailwind.config.ts` (v3 format with sidebar colors)
4. Updated `postcss.config.js` (standard Tailwind v3 plugins)
5. Updated `src/index.css` (@tailwind directives instead of @import)
6. Fixed `src/components/ui/sidebar.tsx` (CSS variable syntax)

**Locked in CLAUDE.md:** Tailwind v3.4.18 is now the official version for RiteMark

---

### Phase 3: Move File Actions (1.0h) ✅ COMPLETE
**Goal:** Migrate FileMenu functionality to sidebar header

**Deliverables:**
- Migrated FileMenu to AppSidebar component
- Added `onNewDocument`, `onOpenFromDrive` props
- Wired handlers through AppShell → App.tsx
- Deleted obsolete `FileMenu.tsx` component

**Success Criteria:**
- ✅ "New Document" button works
- ✅ "Open from Drive" button triggers file picker
- ✅ Console logs confirm handler execution
- ✅ Old FileMenu.tsx deleted

---

### Phase 4: Move Document Status/Title (1.0h) ✅ COMPLETE
**Goal:** Migrate save status and document title to sidebar footer

**Deliverables:**
- Created `DocumentStatus.tsx` component
- Wired `useDriveSync` hook in App.tsx
- Integrated status into sidebar footer
- Implemented OAuth popup flow (replaced full-page redirect)
- Added token expiry validation

**Success Criteria:**
- ✅ Document title displays in sidebar
- ✅ Sync status shows correct state (Saving.../Saved/Error/Offline)
- ✅ Status icon adapts to collapsed mode
- ✅ OAuth popup opens (not full-page redirect)
- ✅ Token expiry validated on mount

**Critical OAuth Implementation:**
```typescript
// app-sidebar.tsx:26-89
const tokenClient = window.google.accounts.oauth2.initTokenClient({
  client_id: clientId,
  scope: 'openid email profile https://www.googleapis.com/auth/drive.file',
  callback: async (tokenResponse) => {
    // Fetch user info, store tokens, reload page
  }
})
tokenClient.requestAccessToken() // Opens OAuth popup
```

**Pattern Reference:** Sprint 8 `AuthModal.tsx:18-116`

---

### Phase 5: Move Table of Contents (1.5h) ✅ COMPLETE
**Goal:** Migrate TOC from right-side overlay to sidebar content area

**Deliverables:**
- Migrated `TableOfContents.tsx` to `TableOfContentsNav.tsx`
- Implemented smooth scroll within content area
- Added responsive behavior for mobile sheet
- Deleted legacy TOC component

**Success Criteria:**
- ✅ TOC shows in sidebar content area
- ✅ Click to scroll working
- ✅ Active heading detection correct
- ✅ Mobile sheet interaction smooth

---

### Phase 6: Move Account/User (0.5h) ✅ COMPLETE
**Goal:** Migrate user account controls to sidebar footer

**Deliverables:**
- Created `UserAccountInfo.tsx` component
- Integrated with auth flows and user data
- Removed legacy placement and styles
- Added avatar, name, email display

**Success Criteria:**
- ✅ User avatar shows in footer
- ✅ Collapsed mode shows icon only
- ✅ Expanded mode shows full info
- ✅ Click to logout working

---

### Phase 7: De-Quarantine (2.0h) ✅ COMPLETE
**Goal:** Remove legacy CSS quarantine and cleanup production code

**Deliverables:**
- Removed `.legacy-root` wrapper
- Cleaned up prefixed CSS rules
- Fixed Fast Refresh compatibility (separated useSidebar hook)
- Strategic console log cleanup (kept errors, removed debug noise)

**Success Criteria:**
- ✅ No legacy CSS conflicts
- ✅ Fast Refresh working
- ✅ Production-ready logging
- ✅ No unused CSS rules

**Key Learning:**
> "Keep error logs, remove debug noise" - production code should have strategic logging, not console spam

---

### Phase 8: Cleanup & PR (1.0h) ✅ COMPLETE
**Goal:** Final cleanup and prepare for merge

**Deliverables:**
- Deleted dead components (FileMenu.tsx, TableOfContents.tsx, SaveStatus.tsx, AuthStatus.tsx)
- Cleaned unused imports and dependencies
- Updated documentation with completion status
- Fixed TypeScript and linting issues

**Success Criteria:**
- ✅ All old components deleted
- ✅ TypeScript compiles clean
- ✅ Linting passes
- ✅ Documentation updated

---

## 🎯 Success Criteria (Definition of Done)

Sprint 9 was **COMPLETE** when ALL of the following were true:

### Functional Requirements
- ✅ User sees single sidebar location for all controls
- ✅ Sidebar collapses to icon rail (48px) by default
- ✅ File actions work ("New Document", "Open from Drive")
- ✅ Document status displays correctly (Saving/Saved/Error)
- ✅ Table of Contents navigates smoothly
- ✅ User account displays in footer
- ✅ Mobile hamburger menu functional
- ✅ OAuth popup flow working

### Technical Requirements
- ✅ `npm run type-check` passes (zero TypeScript errors)
- ✅ `npm run lint` passes (zero errors)
- ✅ Dev server runs on `localhost:5173` without errors
- ✅ Browser validation successful (zero console errors)
- ✅ No regressions in existing features
- ✅ Fast Refresh working correctly

### Quality Requirements
- ✅ All 4 old components deleted
- ✅ No legacy CSS conflicts
- ✅ Production-ready logging (no debug noise)
- ✅ Mobile responsive (all features work on touch devices)
- ✅ Accessibility working (keyboard navigation, screen readers)
- ✅ Bundle size increase < 20 KB gzipped

### Documentation Requirements
- ✅ Sprint documentation complete (sprint-09-ux-consolidation.md)
- ✅ Implementation plan complete (sprint-09.1-sidebar-migration-plan.md)
- ✅ Post-mortem analysis complete (sprint-09-postmortem.md)
- ✅ README.md created (this file)

---

## 📝 Quick Reference

### File Locations
```
ritemark-app/
├─ src/
│  ├─ components/
│  │  ├─ layout/
│  │  │  ├─ AppShell.tsx              (NEW)
│  │  │  ├─ AppHeader.tsx             (NEW)
│  │  │  └─ DocumentEditor.tsx        (NEW)
│  │  │
│  │  ├─ sidebar/
│  │  │  ├─ AppSidebar.tsx            (NEW)
│  │  │  ├─ DocumentStatus.tsx        (NEW)
│  │  │  ├─ TableOfContentsNav.tsx    (NEW)
│  │  │  └─ UserAccountInfo.tsx       (NEW)
│  │  │
│  │  ├─ dialogs/
│  │  │  ├─ NoFileDialog.tsx          (NEW)
│  │  │  ├─ SaveAsDialog.tsx          (NEW)
│  │  │  └─ LoginDialog.tsx           (NEW)
│  │  │
│  │  └─ ui/
│  │     ├─ sidebar.tsx               (NEW - shadcn)
│  │     ├─ button.tsx                (NEW - shadcn)
│  │     ├─ dialog.tsx                (NEW - shadcn)
│  │     └─ sheet.tsx                 (NEW - shadcn)
│  │
│  ├─ hooks/
│  │  └─ use-mobile.ts                (NEW)
│  │
│  └─ lib/
│     └─ utils.ts                     (NEW - cn utility)
│
├─ tailwind.config.ts                 (MODIFIED - v3 format)
├─ postcss.config.js                  (MODIFIED - v3 plugins)
└─ src/index.css                      (MODIFIED - @tailwind directives)
```

### Deleted Files (Cleanup)
```
src/components/
├─ FileMenu.tsx                       ❌ DELETED
├─ TableOfContents.tsx                ❌ DELETED
├─ SaveStatus.tsx                     ❌ DELETED
└─ AuthStatus.tsx                     ❌ DELETED
```

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Cmd+B` (Mac) / `Ctrl+B` (Windows) | Toggle sidebar collapse/expand |

### Commands Reference
```bash
# Installation (Shadcn Components)
npx shadcn@latest add sidebar
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add separator
npx shadcn@latest add sheet
npx shadcn@latest add tooltip

# Tailwind v3 Installation (Downgrade from v4)
npm uninstall tailwindcss @tailwindcss/vite @tailwindcss/postcss
npm install tailwindcss@^3.4.18 postcss autoprefixer

# Validation
npm run type-check
npm run lint
npm run dev
curl localhost:5173
```

---

## 🚨 Known Limitations

### Sidebar Behavior
1. **Persistent state** requires cookies (some users disable cookies)
2. **Collapsed mode** hides filename (must expand to see full name)
3. **Mobile sheet** doesn't support swipe gestures (shadcn limitation)

### File Status Indicator
1. **Yellow dot** appears immediately on typing (before 3s auto-save debounce)
2. **Status updates** require sidebar to be visible (no floating toasts)
3. **Error states** may be overlooked if sidebar collapsed

### OAuth Flow
1. **Popup blockers** can prevent OAuth popup (user must allow popups)
2. **Token expiry** requires re-login (no automatic refresh yet)
3. **Session storage** clears on browser restart (no persistent sessions)

### Browser Support
- **Modern browsers only** (Chrome 90+, Safari 14+, Firefox 88+)
- **IE 11 not supported** (Tailwind v3 requirement)

---

## 🔗 External Resources

### Official Documentation
- [Shadcn/ui Sidebar Docs](https://ui.shadcn.com/docs/components/sidebar)
- [Shadcn Sidebar Examples](https://ui.shadcn.com/view/sidebar-07) (Icon Mode)
- [Tailwind CSS v3 Docs](https://tailwindcss.com/docs)
- [Google Identity Services](https://developers.google.com/identity/gsi/web/guides/overview)

### Design Inspiration
- **Vercel Dashboard:** Icon mode sidebar with dark theme
- **Linear:** Collapsible sidebar with keyboard shortcuts
- **Notion:** Minimal sidebar with user account in footer

### Related Sprint Documentation
- [Sprint 8 Drive Integration](../sprint-08-drive-api-integration.md)
- [Sprint 10 Formatting Menu](../sprint-10-in-context-formatting-menu.md)
- [Sprint 11 Tables Plan](../sprint-11-tables-plan.md)

---

## 📞 Memory Storage

Store Sprint 9 completion summary for swarm coordination:

```bash
npx claude-flow@alpha hooks post-task \
  --task-id "sprint-09-complete" \
  --memory-key "swarm/researcher/sprint-09-readme"
```

**Memory Content:**
```json
{
  "sprint": "Sprint 9: UX Consolidation & Invisible Interface",
  "status": "COMPLETED",
  "completion_date": "2025-10-11",
  "key_achievements": [
    "Shadcn sidebar integration with Tailwind v3.4.18",
    "All 4 old components removed (FileMenu, TOC, SaveStatus, user badge)",
    "OAuth popup flow implemented (not full-page redirect)",
    "File status indicator with 4 states (doc/sync/alert/yellow dot)",
    "Mobile-responsive hamburger menu functional",
    "CSS quarantine strategy successful (no conflicts)"
  ],
  "critical_learnings": [
    "Tailwind v4 canary incompatible with shadcn sidebar (use v3.4.18)",
    "Browser validation MANDATORY before claiming done (CLAUDE.md Step 4.5)",
    "Big Bang Replacement requires completing ALL phases (don't skip cleanup)",
    "Feature flags are technical debt (remove before commit)",
    "OAuth popup > full-page redirect (better UX, preserves state)"
  ],
  "bundle_impact": "+14.0 KB gzipped (+4.6% from Sprint 8)",
  "files_created": 13,
  "files_deleted": 4,
  "documentation_lines": 2194
}
```

---

## 🔄 Version History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-10-05 | 1.0 | Initial sprint planning (sprint-09-ux-consolidation.md) | Planning Team |
| 2025-10-08 | 1.1 | Sprint paused at 50-60% completion | Development Team |
| 2025-10-08 | 2.0 | Sprint 9.1 execution plan created | Architecture Team |
| 2025-10-11 | 2.1 | Sprint 9.1 completed successfully | Development Team |
| 2025-10-18 | 3.0 | README.md created for navigation | Researcher Agent |

---

## 📌 Next Steps After Sprint 9

**Sprint 10: Formatting Bubble Menu** ✅ COMPLETED
- In-context formatting controls (bold, italic, headings, lists)
- Bubble menu appears on text selection
- Keyboard shortcuts (Cmd+B, Cmd+I, Cmd+K, etc.)
- Mobile-friendly touch interactions
- Follows invisible interface philosophy

**Sprint 11: Advanced Table Support** 📋 PLANNED
- Table insertion via slash command (`/table`)
- Row/column operations (add, delete, merge, split)
- Table controls in BubbleMenu
- GFM markdown serialization
- Mobile-responsive table editing

**Future Enhancements (Post-Sprint 11):**
- File rename/duplicate/delete in sidebar
- Recent files list
- Folder navigation in sidebar
- Keyboard shortcuts cheat sheet
- Sidebar state sync across devices (cloud storage)

---

**Sprint 9 Status:** ✅ COMPLETED
**Final Completion Date:** October 11, 2025 (Sprint 9.1)
**Branch Merged:** `feat/shadcn-sidebar-poc` → `main`
**Created by:** Research Agent (Sprint 9 Documentation Team)
**Last Updated:** October 18, 2025
